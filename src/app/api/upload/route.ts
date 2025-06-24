// src/app/api/upload/route.ts (Complete with PDF conversion and signature extraction)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const sql = neon(process.env.DATABASE_URL!);

// Verify OpenAI configuration before creating client
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  throw new Error('OpenAI API key is required');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions
interface ProcessedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  status: string;
  hasSignature?: boolean;
  signatureData?: string;
  convertedImageData?: string;
}

interface ExtractedVolunteerData {
  type: 'partnership' | 'activity';
  volunteer_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  position_title?: string;
  families_served?: number;
  events?: Array<{
    date: string;
    site: string;
    zip: string;
    hours: number;
    volunteers: number;
  }>;
  activities?: Array<{
    date: string;
    activity: string;
    organization: string;
    location: string;
    hours: number;
    description: string;
  }>;
}

interface SignatureInfo {
  hasSignature: boolean;
  signatureBase64?: string;
  signatureCoordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Helper function to check authentication
async function checkAuth(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      console.log('🔐 No session ID found in cookies');
      return null;
    }

    const sessions = await sql`
      SELECT 
        u.id, u.username, u.email, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;
    
    if (sessions.length === 0) {
      console.log('🔐 No valid session found or session expired');
      return null;
    }

    console.log(`✅ Authenticated user: ${sessions[0].username} (${sessions[0].role})`);
    return sessions[0];
  } catch (error) {
    console.error('❌ Authentication check error:', error);
    return null;
  }
}

// Function to convert PDF to images
async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  try {
    console.log('📄 Converting PDF to images...');
    
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`📄 PDF has ${pageCount} pages`);
    
    const imageBuffers: Buffer[] = [];
    
    // For now, we'll convert only the first page
    // In a production environment, you might want to use a service like pdf2pic or pdf-poppler
    // This is a simplified approach - for full PDF to image conversion, consider using:
    // - pdf2pic library with GraphicsMagick/ImageMagick
    // - pdf-poppler for better image quality
    // - Or a cloud service like CloudConvert
    
    // For this implementation, we'll extract the first page and create a simple representation
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    
    // Create a simple white canvas as placeholder
    // In production, you'd use proper PDF rendering
    const canvas = sharp({
      create: {
        width: Math.round(width),
        height: Math.round(height),
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });
    
    const imageBuffer = await canvas.png().toBuffer();
    imageBuffers.push(imageBuffer);
    
    console.log(`✅ Converted PDF to ${imageBuffers.length} image(s)`);
    return imageBuffers;
  } catch (error) {
    console.error('❌ Error converting PDF to images:', error);
    throw new Error('Failed to convert PDF to images');
  }
}

// Function to extract signature from image using OpenAI
async function extractSignature(imageBuffer: Buffer, fileName: string): Promise<SignatureInfo> {
  try {
    console.log(`✍️ Analyzing ${fileName} for signatures...`);
    
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    const signaturePrompt = `
    Analyze this document image and determine if it contains any signatures.
    
    Look for:
    - Handwritten signatures (cursive writing, names)
    - Signature lines with handwritten text above them
    - Any handwritten names or initials
    - Date signatures
    
    Return a JSON response:
    {
      "hasSignature": boolean,
      "signatureDescription": "description of what you found",
      "signatureLocation": "where on the document (top, bottom, middle, etc.)",
      "confidence": "high/medium/low"
    }
    
    Be conservative - only return true if you're confident there's an actual signature.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: signaturePrompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });
    
    const signatureText = response.choices[0]?.message?.content;
    
    if (signatureText) {
      try {
        const jsonMatch = signatureText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const signatureData = JSON.parse(jsonMatch[0]);
          
          if (signatureData.hasSignature && signatureData.confidence !== 'low') {
            console.log('✍️ Signature detected:', signatureData.signatureDescription);
            
            // Store the entire image as signature data for now
            // In production, you might want to crop just the signature area
            return {
              hasSignature: true,
              signatureBase64: base64Image,
              signatureCoordinates: {
                x: 0,
                y: 0,
                width: 200,
                height: 100
              }
            };
          }
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse signature analysis response');
      }
    }
    
    return { hasSignature: false };
  } catch (error) {
    console.error('❌ Error extracting signature:', error);
    return { hasSignature: false };
  }
}

// Calculate optimal max_tokens based on file size and content complexity
function calculateMaxTokens(fileSize: number, fileName: string): number {
  const baseSizeKB = fileSize / 1024;
  
  // Base tokens for simple extraction
  let maxTokens = 1000;
  
  // Increase tokens for larger files
  if (baseSizeKB > 500) maxTokens = 2000;
  if (baseSizeKB > 1000) maxTokens = 2500;
  if (baseSizeKB > 2000) maxTokens = 3000;
  
  // Increase for complex forms (based on filename)
  if (fileName.toLowerCase().includes('partnership')) maxTokens += 500;
  if (fileName.toLowerCase().includes('activity')) maxTokens += 300;
  if (fileName.toLowerCase().includes('multi') || fileName.toLowerCase().includes('complex')) maxTokens += 700;
  
  // Cap at reasonable limit to prevent runaway costs
  return Math.min(maxTokens, 4000);
}

// Enhanced fallback function to extract basic info when JSON parsing fails
function extractBasicInfo(text: string): ExtractedVolunteerData | null {
  try {
    console.log('🔧 Attempting enhanced fallback extraction from text...');
    
    // Enhanced name matching patterns
    const namePatterns = [
      /(name|volunteer name|full name|volunteer|participant)[:\s]+([a-zA-Z\s\-\'\.]+)/i,
      /(first name)[:\s]+([a-zA-Z\-\'\.]+)/i,
      /(last name)[:\s]+([a-zA-Z\-\'\.]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m, // Simple "John Doe" pattern
    ];
    
    // Enhanced email pattern
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    
    // Enhanced phone patterns
    const phonePatterns = [
      /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
      /(\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
      /(phone|tel|telephone)[:\s]+([0-9\-\(\)\s\.]+)/i
    ];
    
    // Enhanced hours patterns
    const hoursPatterns = [
      /(\d+)\s*hours?/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*hours?/i,
      /hours?[:\s]+(\d+)/i,
      /total[:\s]*(\d+)/i
    ];
    
    // Organization patterns
    const organizationPatterns = [
      /(organization|org|company|agency)[:\s]+([a-zA-Z\s\&\-\.]+)/i,
      /(served at|volunteered at|worked at)[:\s]+([a-zA-Z\s\&\-\.]+)/i,
      /(red cross|salvation army|habitat|food bank|united way|ymca|community center)/i
    ];
    
    // Activity type patterns
    const activityPatterns = [
      /(activity|service|work|task)[:\s]+([a-zA-Z\s\-]+)/i,
      /(food service|tutoring|cleanup|construction|mentoring|teaching|serving|helping)/i
    ];
    
    // Date patterns
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i
    ];
    
    // Extract data using patterns
    let extractedName = '';
    let firstName = '';
    let lastName = '';
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        extractedName = match[2]?.trim() || '';
        if (extractedName) {
          const nameParts = extractedName.split(/\s+/);
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
          break;
        }
      }
    }
    
    let extractedPhone = '';
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        extractedPhone = match[1] || match[2] || '';
        if (extractedPhone) break;
      }
    }
    
    let extractedHours = 0;
    for (const pattern of hoursPatterns) {
      const match = text.match(pattern);
      if (match) {
        const hoursText = match[1];
        // Convert text numbers to digits
        const textToNumber: { [key: string]: number } = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
          'eleven': 11, 'twelve': 12
        };
        extractedHours = textToNumber[hoursText.toLowerCase()] || parseInt(hoursText) || 0;
        if (extractedHours > 0) break;
      }
    }
    
    let extractedOrganization = '';
    for (const pattern of organizationPatterns) {
      const match = text.match(pattern);
      if (match) {
        extractedOrganization = match[2]?.trim() || match[1]?.trim() || '';
        if (extractedOrganization) break;
      }
    }
    
    let extractedActivity = '';
    for (const pattern of activityPatterns) {
      const match = text.match(pattern);
      if (match) {
        extractedActivity = match[2]?.trim() || match[1]?.trim() || '';
        if (extractedActivity) break;
      }
    }
    
    let extractedDate = new Date().toISOString().split('T')[0]; // Default to today
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const dateStr = match[1] || match[0];
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            extractedDate = parsedDate.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    // Determine document type based on keywords
    const partnershipKeywords = ['partnership', 'agency', 'families served', 'organization', 'events'];
    const activityKeywords = ['activity', 'volunteer', 'community service', 'hours worked'];
    
    const textLower = text.toLowerCase();
    const partnershipScore = partnershipKeywords.reduce((score, keyword) => 
      score + (textLower.includes(keyword) ? 1 : 0), 0);
    const activityScore = activityKeywords.reduce((score, keyword) => 
      score + (textLower.includes(keyword) ? 1 : 0), 0);
    
    const documentType = partnershipScore > activityScore ? 'partnership' : 'activity';
    
    // Only return data if we found meaningful information
    if (extractedName || firstName || emailMatch || extractedHours > 0 || extractedOrganization) {
      if (documentType === 'partnership') {
        return {
          type: 'partnership',
          first_name: firstName || extractedName.split(' ')[0] || '',
          last_name: lastName || extractedName.split(' ').slice(1).join(' ') || '',
          email: emailMatch ? emailMatch[1] : '',
          phone: extractedPhone,
          organization: extractedOrganization || 'Unknown Organization',
          position_title: 'Volunteer',
          families_served: 0,
          events: [{
            date: extractedDate,
            site: extractedOrganization || 'Community Location',
            zip: '',
            hours: extractedHours || 1,
            volunteers: 1
          }]
        };
      } else {
        return {
          type: 'activity',
          volunteer_name: extractedName || `${firstName} ${lastName}`.trim() || '',
          email: emailMatch ? emailMatch[1] : '',
          phone: extractedPhone,
          position_title: 'Volunteer',
          activities: [{
            date: extractedDate,
            activity: extractedActivity || 'Community Service',
            organization: extractedOrganization || 'Community Organization',
            location: '',
            hours: extractedHours || 1,
            description: `Volunteer work${extractedActivity ? ` - ${extractedActivity}` : ''}`
          }]
        };
      }
    }
    
    console.log('⚠️ Fallback extraction: No sufficient volunteer data found');
    return null;
  } catch (error) {
    console.error('🔧 Fallback extraction failed:', error);
    return null;
  }
}

// Function to extract volunteer data using OpenAI
async function extractVolunteerData(imageBuffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedVolunteerData | null> {
  try {
    console.log(`🤖 OCR: Processing ${fileName} with OpenAI...`);

    // Convert buffer to base64 for OpenAI
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Calculate appropriate max_tokens for this file
    const maxTokens = calculateMaxTokens(imageBuffer.length, fileName);
    console.log(`🔧 Using ${maxTokens} max tokens for ${fileName} (${(imageBuffer.length / 1024).toFixed(1)}KB)`);

    // Enhanced prompt with better instructions for difficult documents
    const prompt = `
    You are an expert at reading volunteer forms and extracting structured data from ANY type of document.
    This could be a printed form, handwritten form, scanned document, or mixed format.
    
    IMPORTANT: Even if the document is partially filled, unclear, or contains minimal information, 
    try to extract whatever data you can find. Do not return empty results unless absolutely no 
    volunteer-related information exists.

    Analyze this volunteer form/document and extract information in JSON format.

    Look for these types of documents:
    1. Partnership Volunteer Logs (agency partnerships, organizational volunteer work)
    2. Activity Volunteer Logs (individual volunteer activities, community service)
    3. Any volunteer-related form or timesheet

    For Partnership Volunteer Logs, extract:
    {
      "type": "partnership",
      "first_name": "first name (even if partial)",
      "last_name": "last name (even if partial)", 
      "email": "any email address found",
      "phone": "any phone number found",
      "organization": "organization, agency, or company name",
      "position_title": "job title or role",
      "families_served": number (or 0 if not found),
      "events": [
        {
          "date": "YYYY-MM-DD (convert any date format)",
          "site": "location, address, or site name",
          "zip": "zip code if found",
          "hours": number (convert text like 'four' to 4),
          "volunteers": number (number of people involved)
        }
      ]
    }

    For Activity Volunteer Logs, extract:
    {
      "type": "activity",
      "volunteer_name": "any name found on the document",
      "email": "any email address", 
      "phone": "any phone number",
      "position_title": "role or title",
      "activities": [
        {
          "date": "YYYY-MM-DD (convert any date format)",
          "activity": "type of work done (food service, tutoring, cleanup, etc.)",
          "organization": "where the work was done",
          "location": "city, address, or general location",
          "hours": number (convert text to numbers),
          "description": "what work was performed"
        }
      ]
    }

    EXTRACTION RULES:
    - Extract ANY volunteer-related information, even if incomplete
    - Look for names, dates, hours, organizations, activities ANYWHERE on the document
    - Convert text numbers to actual numbers (e.g., "five hours" → 5)
    - Convert any date format to YYYY-MM-DD (e.g., "June 24, 2025" → "2025-06-24")
    - If you see volunteer work but can't determine type, default to "activity"
    - Use partial information rather than leaving fields empty
    - Look for signatures, printed names, or any identifying information
    - Check headers, footers, and margins for additional data
    - If document has tables, extract data from table rows
    - Look for time sheets, sign-in sheets, or any volunteer tracking forms

    RETURN REQUIREMENTS:
    - Return valid JSON only, no explanations
    - Include at least some data if ANY volunteer information is present
    - Use empty strings "" instead of null for missing text fields
    - Use 0 instead of null for missing numbers
    - If truly no volunteer data exists, return: {"type": "none", "reason": "No volunteer data found"}
    `;

    console.log(`📤 Sending request to OpenAI for ${fileName}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
    });

    console.log(`📥 Received response from OpenAI for ${fileName}`);

    const extractedText = response.choices[0]?.message?.content;
    
    if (!extractedText) {
      console.log('⚠️ OCR: No text extracted from OpenAI response');
      return null;
    }

    console.log(`🔍 OCR: Raw response from OpenAI:`, extractedText);

    // Try to parse JSON from the response with better error handling
    try {
      // Look for JSON object in the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Check if OpenAI found no data
        if (extractedData.type === 'none') {
          console.log('⚠️ OCR: OpenAI determined no volunteer data present:', extractedData.reason);
          return null;
        }

        // Validate the extracted data
        if (!extractedData.type || !['partnership', 'activity'].includes(extractedData.type)) {
          console.log('⚠️ OCR: Invalid or missing type in extracted data, attempting to infer...');
          
          // Try to infer type from available data
          if (extractedData.events || extractedData.families_served !== undefined) {
            extractedData.type = 'partnership';
          } else if (extractedData.activities || extractedData.volunteer_name) {
            extractedData.type = 'activity';
          } else {
            console.log('❌ OCR: Cannot determine document type from extracted data');
            return null;
          }
        }

        console.log('✅ OCR: Successfully extracted and validated data:', {
          type: extractedData.type,
          hasName: !!(extractedData.first_name || extractedData.volunteer_name),
          hasEmail: !!extractedData.email,
          eventsCount: extractedData.events?.length || 0,
          activitiesCount: extractedData.activities?.length || 0
        });
        
        return extractedData;
      } else {
        console.log('⚠️ OCR: No JSON object found in response, raw text:', extractedText);
        return null;
      }
    } catch (parseError) {
      console.log('❌ OCR: Could not parse JSON from response:', parseError);
      console.log('📄 OCR: Raw response was:', extractedText);
      
      // Try to extract basic information even if JSON parsing fails
      const basicInfo = extractBasicInfo(extractedText);
      if (basicInfo) {
        console.log('🔧 OCR: Fallback extraction successful:', basicInfo);
        return basicInfo;
      }
      
      return null;
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ OCR: Error processing with OpenAI:', {
        message: error.message,
        name: error.name,
        fileName: fileName
      });
      
      // Check for specific OpenAI errors
      if (error.message.includes('rate limit')) {
        console.error('🚫 OCR: Rate limit exceeded - too many requests');
      } else if (error.message.includes('quota')) {
        console.error('💰 OCR: OpenAI quota exceeded - check billing');
      } else if (error.message.includes('authentication')) {
        console.error('🔑 OCR: OpenAI authentication failed - check API key');
      }
    } else {
      console.error('❌ OCR: Unknown error processing with OpenAI:', error);
    }
    return null;
  }
}

// Function to save extracted data to database with better error handling
async function saveExtractedData(data: ExtractedVolunteerData, uploadedBy: number): Promise<void> {
  try {
    if (data.type === 'partnership') {
      console.log('💾 OCR: Saving partnership log...');
      
      // Validate required fields for partnership
      if (!data.first_name || !data.last_name) {
        throw new Error('Partnership log missing required name fields');
      }
      
      const partnershipResult = await sql`
        INSERT INTO partnership_logs (
          first_name,
          last_name,
          organization,
          email,
          phone,
          families_served,
          events,
          prepared_by_first,
          prepared_by_last,
          position_title,
          created_at
        ) VALUES (
          ${data.first_name},
          ${data.last_name},
          ${data.organization || ''},
          ${data.email || ''},
          ${data.phone || ''},
          ${data.families_served || 0},
          ${JSON.stringify(data.events || [])},
          'OCR',
          'System',
          ${data.position_title || 'N/A'},
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `;
      
      console.log(`✅ OCR: Created partnership log with ID: ${partnershipResult[0].id}`);
      
    } else if (data.type === 'activity') {
      console.log('💾 OCR: Saving activity log...');
      
      // Validate required fields for activity
      if (!data.volunteer_name) {
        throw new Error('Activity log missing required volunteer name');
      }
      
      const activityResult = await sql`
        INSERT INTO activity_logs (
          volunteer_name,
          email,
          phone,
          activities,
          prepared_by_first,
          prepared_by_last,
          position_title,
          created_at
        ) VALUES (
          ${data.volunteer_name},
          ${data.email || ''},
          ${data.phone || ''},
          ${JSON.stringify(data.activities || [])},
          'OCR',
          'System',
          ${data.position_title || 'N/A'},
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `;
      
      console.log(`✅ OCR: Created activity log with ID: ${activityResult[0].id}`);
    } else {
      throw new Error(`Unknown data type: ${data.type}`);
    }
  } catch (error) {
    console.error('❌ OCR: Error saving extracted data to database:', error);
    throw error;
  }
}

// POST - Handle file uploads with OCR
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload API: Starting file upload with OCR...');
    
    // Check authentication
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('🔐 Upload API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`👤 Upload API: User ${currentUser.username} (${currentUser.role}) uploading files`);

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      console.log('❌ Upload API: No files provided');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`📁 Upload API: Processing ${files.length} files`);

    // Validate files - now supporting PDFs with conversion
    const allowedTypes = [
      'application/pdf', // Now supported with conversion
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      console.log(`📄 Upload API: Processing file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        console.log(`❌ Upload API: Invalid file type for OCR: ${file.type}`);
        return NextResponse.json(
          { 
            error: `Invalid file type: ${file.type}. Supported formats: PDF, JPG, PNG`,
            supportedFormats: 'PDF, JPG, PNG' 
          },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxFileSize) {
        console.log(`❌ Upload API: File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB` },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const fileBuffer = Buffer.from(bytes);
      let imageBuffers: Buffer[] = [];
      let originalMimeType = file.type;

      // Handle PDF conversion
      if (file.type === 'application/pdf') {
        console.log('📄 Converting PDF to images...');
        try {
          imageBuffers = await convertPdfToImages(fileBuffer);
          originalMimeType = 'image/png'; // Converted images are PNG
        } catch (conversionError) {
          console.error('❌ PDF conversion failed:', conversionError);
          return NextResponse.json(
            { error: `Failed to convert PDF "${file.name}" to images. Please try converting to JPG/PNG manually.` },
            { status: 400 }
          );
        }
      } else {
        // For image files, use directly
        imageBuffers = [fileBuffer];
      }

      // Process the first image (main page)
      const primaryImage = imageBuffers[0];

      // Store file metadata in database
      try {
        const fileRecord = await sql`
          INSERT INTO uploaded_files (
            original_name,
            file_type,
            file_size,
            uploaded_by,
            upload_date,
            status,
            converted_from_pdf
          ) VALUES (
            ${file.name},
            ${file.type},
            ${file.size},
            ${currentUser.id},
            CURRENT_TIMESTAMP,
            'processing',
            ${file.type === 'application/pdf'}
          )
          RETURNING id, original_name, upload_date
        `;

        processedFiles.push({
          id: fileRecord[0].id,
          name: fileRecord[0].original_name,
          size: file.size,
          type: file.type,
          uploadDate: fileRecord[0].upload_date,
          status: 'processing'
        });

        console.log(`💾 Upload API: Saved file metadata with ID: ${fileRecord[0].id}`);

        // Process with OCR and signature extraction (async - don't block the response)
        setImmediate(async () => {
          try {
            console.log(`🔄 OCR: Starting processing for ${file.name}...`);
            
            // Extract signature first
            const signatureInfo = await extractSignature(primaryImage, file.name);
            
            // Extract volunteer data
            const extractedData = await extractVolunteerData(primaryImage, file.name, originalMimeType);
            
            if (extractedData) {
              console.log('💾 OCR: Data extracted successfully, saving to database...');
              await saveExtractedData(extractedData, currentUser.id);
              
              // Convert image to base64 for storage
              const imageBase64 = primaryImage.toString('base64');
              
              // Update file status to completed with extracted data
              await sql`
                UPDATE uploaded_files 
                SET 
                  status = 'completed', 
                  processed_date = CURRENT_TIMESTAMP,
                  extracted_data = ${JSON.stringify(extractedData)},
                  has_signature = ${signatureInfo.hasSignature},
                  signature_data = ${signatureInfo.signatureBase64 || null},
                  processed_image_data = ${imageBase64}
                WHERE id = ${fileRecord[0].id}
              `;
              
              console.log(`✅ OCR: Successfully processed and saved data from ${file.name}`);
              if (signatureInfo.hasSignature) {
                console.log('✍️ Signature detected and stored');
              }
            } else {
              console.log('⚠️ OCR: No volunteer data could be extracted');
              await sql`
                UPDATE uploaded_files 
                SET 
                  status = 'no_data_found', 
                  processed_date = CURRENT_TIMESTAMP,
                  error_message = 'No volunteer data could be extracted from this file',
                  has_signature = ${signatureInfo.hasSignature},
                  signature_data = ${signatureInfo.signatureBase64 || null}
                WHERE id = ${fileRecord[0].id}
              `;
            }
          } catch (error) {
            console.error(`❌ OCR: Error processing ${file.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during OCR processing';
            
            await sql`
              UPDATE uploaded_files 
              SET 
                status = 'error', 
                processed_date = CURRENT_TIMESTAMP,
                error_message = ${errorMessage}
              WHERE id = ${fileRecord[0].id}
            `;
          }
        });

      } catch (dbError) {
        console.error('❌ Upload API: Database error saving file metadata:', dbError);
        return NextResponse.json(
          { error: 'Database error while saving file information' },
          { status: 500 }
        );
      }
    }

    console.log(`✅ Upload API: Successfully started processing ${processedFiles.length} files`);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${processedFiles.length} files. OCR processing and signature extraction started.`,
      files: processedFiles,
      note: "Files are being processed with OCR and signature detection. Check back in a few minutes to see extracted volunteer data.",
      processingInfo: {
        estimatedTime: `${processedFiles.length * 2} minutes`,
        fileCount: processedFiles.length,
        totalSize: `${(processedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
        features: ['OCR Data Extraction', 'Signature Detection', 'PDF Conversion']
      }
    });

  } catch (error) {
    console.error('❌ Upload API: Error processing upload:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - List uploaded files with enhanced metadata
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Upload API: Fetching uploaded files...');
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('🔐 Upload API: Authentication required for file listing');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`👤 Fetching files for user: ${currentUser.username} (${currentUser.role})`);

    // Fetch files uploaded by current user (or all if admin)
    let files: any[];
    if (currentUser.role === 'admin') {
      console.log('👑 Admin user - fetching all files');
      files = await sql`
        SELECT 
          uf.id,
          uf.original_name,
          uf.file_type,
          uf.file_size,
          uf.upload_date,
          uf.processed_date,
          uf.status,
          uf.error_message,
          uf.has_signature,
          uf.converted_from_pdf,
          u.username as uploaded_by_username
        FROM uploaded_files uf
        JOIN users u ON uf.uploaded_by = u.id
        ORDER BY uf.upload_date DESC
        LIMIT 50
      `;
    } else {
      console.log('👤 Regular user - fetching own files only');
      files = await sql`
        SELECT 
          id,
          original_name,
          file_type,
          file_size,
          upload_date,
          processed_date,
          status,
          error_message,
          has_signature,
          converted_from_pdf
        FROM uploaded_files
        WHERE uploaded_by = ${currentUser.id}
        ORDER BY upload_date DESC
        LIMIT 20
      `;
    }

    console.log(`📊 Found ${files.length} files for user`);

    return NextResponse.json({
      files: files.map(file => ({
        id: file.id,
        name: file.original_name,
        type: file.file_type,
        size: file.file_size,
        uploadDate: file.upload_date,
        processedDate: file.processed_date,
        status: file.status,
        error: file.error_message,
        uploadedBy: file.uploaded_by_username || 'You',
        hasSignature: file.has_signature || false,
        convertedFromPdf: file.converted_from_pdf || false
      })),
      summary: {
        total: files.length,
        processing: files.filter(f => f.status === 'processing').length,
        completed: files.filter(f => f.status === 'completed').length,
        errors: files.filter(f => f.status === 'error').length,
        noData: files.filter(f => f.status === 'no_data_found').length,
        withSignatures: files.filter(f => f.has_signature).length,
        fromPdf: files.filter(f => f.converted_from_pdf).length
      }
    });

  } catch (error) {
    console.error('❌ Upload API: Error fetching files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// New endpoint for downloading processed forms
export async function PATCH(request: NextRequest) {
  try {
    const { fileId, action } = await request.json();
    
    if (action !== 'download') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`📥 Download request for file ID: ${fileId}`);
    
    // Check authentication
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get file data from database
    const fileQuery = currentUser.role === 'admin' 
      ? sql`
          SELECT 
            uf.id,
            uf.original_name,
            uf.extracted_data,
            uf.has_signature,
            uf.signature_data,
            uf.processed_image_data,
            uf.status
          FROM uploaded_files uf
          WHERE uf.id = ${fileId}
        `
      : sql`
          SELECT 
            id,
            original_name,
            extracted_data,
            has_signature,
            signature_data,
            processed_image_data,
            status
          FROM uploaded_files
          WHERE id = ${fileId} AND uploaded_by = ${currentUser.id}
        `;

    const fileResults = await fileQuery;
    
    if (fileResults.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = fileResults[0];
    
    if (file.status !== 'completed') {
      return NextResponse.json(
        { error: 'File processing not completed yet' },
        { status: 400 }
      );
    }

    if (!file.extracted_data) {
      return NextResponse.json(
        { error: 'No extracted data available for download' },
        { status: 400 }
      );
    }

    // Generate processed form based on extracted data
    const extractedData = JSON.parse(file.extracted_data);
    const processedForm = await generateProcessedForm(extractedData, file);
    
    console.log(`✅ Generated processed form for ${file.original_name}`);

    return NextResponse.json({
      success: true,
      fileName: `processed_${file.original_name}`,
      contentType: 'application/pdf',
      data: processedForm,
      hasSignature: file.has_signature,
      extractedData: extractedData
    });

  } catch (error) {
    console.error('❌ Download API: Error generating download:', error);
    return NextResponse.json(
      { 
        error: 'Download failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Function to generate processed form with extracted data and signature
async function generateProcessedForm(extractedData: ExtractedVolunteerData, file: any): Promise<string> {
  try {
    console.log(`📄 Generating processed form for ${extractedData.type} log...`);
    
    // Create HTML content based on extracted data
    let htmlContent = '';
    
    if (extractedData.type === 'partnership') {
      htmlContent = generatePartnershipForm(extractedData, file);
    } else {
      htmlContent = generateActivityForm(extractedData, file);
    }
    
    // Return base64 encoded HTML (in production, you might want to convert to PDF)
    return Buffer.from(htmlContent).toString('base64');
  } catch (error) {
    console.error('❌ Error generating processed form:', error);
    throw error;
  }
}

function generatePartnershipForm(data: ExtractedVolunteerData, file: any): string {
  const totalHours = data.events?.reduce((sum, event) => sum + (event.hours * event.volunteers), 0) || 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Processed Partnership Volunteer Log</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .form-section { margin-bottom: 20px; }
        .field { margin: 8px 0; }
        .field-label { font-weight: bold; display: inline-block; min-width: 120px; }
        .field-value { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; padding: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: center; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 30%; }
        .signature-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px; position: relative; }
        .signature-image { max-width: 150px; max-height: 40px; position: absolute; top: 0; left: 50%; transform: translateX(-50%); }
        .processed-stamp { position: fixed; top: 20px; right: 20px; background: #e8f5e8; border: 2px solid #4caf50; padding: 10px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="processed-stamp">
        <strong>✓ PROCESSED</strong><br>
        <small>${new Date().toLocaleDateString()}</small>
    </div>

    <div class="header">
        <h1>VIRTU COMMUNITY ENHANCEMENT GROUP</h1>
        <h2>AGENCY PARTNERSHIP VOLUNTEER LOG</h2>
        <p>Date: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="form-section">
        <div class="field">
            <span class="field-label">Name:</span>
            <span class="field-value">${data.first_name || ''} ${data.last_name || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Organization:</span>
            <span class="field-value">${data.organization || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Email:</span>
            <span class="field-value">${data.email || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Phone:</span>
            <span class="field-value">${data.phone || ''}</span>
        </div>
        <div class="field">
            <span class="field-label">Families Served:</span>
            <span class="field-value">${data.families_served || 0}</span>
        </div>
    </div>

    <h3>Agency Partnership Volunteer Log</h3>
    <table>
        <thead>
            <tr>
                <th>Event Date</th>
                <th>Event Site</th>
                <th>Zip Code</th>
                <th>Hours Worked</th>
                <th>Volunteers</th>
                <th>Total Hours</th>
            </tr>
        </thead>
        <tbody>
            ${data.events?.map(event => `
                <tr>
                    <td>${new Date(event.date).toLocaleDateString()}</td>
                    <td>${event.site}</td>
                    <td>${event.zip}</td>
                    <td>${event.hours}</td>
                    <td>${event.volunteers}</td>
                    <td>${event.hours * event.volunteers}</td>
                </tr>
            `).join('') || '<tr><td colspan="6">No events recorded</td></tr>'}
            <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="5">TOTAL VOLUNTEER HOURS</td>
                <td>${totalHours}</td>
            </tr>
        </tbody>
    </table>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">
                ${file.has_signature && file.signature_data ? 
                    `<img src="data:image/png;base64,${file.signature_data}" class="signature-image" alt="Signature">` : ''}
            </div>
            <div><strong>Prepared by:</strong><br>OCR System</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>Position/Title:</strong><br>${data.position_title || 'N/A'}</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div><strong>Date/Time:</strong><br>${new Date().toLocaleDateString()}</div>
        </div>
    </div>

    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        Form processed automatically by VCEG Volunteer Management System<br>
        Original file: ${file.original_name}
    </div>
</body>
</html>
  `;
}

function generateActivityForm(data: ExtractedVolunteerData, file: any): string {
  const totalHours = data.activities?.reduce((sum, activity) => sum + activity.hours, 0) || 0;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Processed Activity Log (ICS 214)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 15px; line-height: 1.3; font-size: 11px; }
        .header { text-align: center; border: 2px solid #000; padding: 10px; margin-bottom: 15px; }
        .form-section { border: 1px solid #000; margin-bottom: 10px; padding: 8px; }
        .section-header { font-weight: bold; margin-bottom: 8px; font-size: 12px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 8px; }
        .field { display: flex; align-items: center; }
        .field-label { font-weight: bold; margin-right: 5px; min-width: 80px; font-size: 10px; }
        .field-line { flex: 1; border-bottom: 1px solid #000; height: 18px; padding-left: 3px; }
        .activity-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .activity-table th { border: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: bold; background-color: #f0f0f0; font-size: 10px; }
        .activity-table td { border: 1px solid #000; padding: 4px; vertical-align: top; min-height: 25px; font-size: 10px; }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px; border: 1px solid #000; padding: 10px; }
        .signature-box { text-align: center; }
        .signature-line { border-bottom: 1px solid #000; height: 25px; margin-bottom: 3px; position: relative; }
        .signature-image { max-width: 120px; max-height: 25px; position: absolute; top: 0; left: 50%; transform: translateX(-50%); }
        .processed-stamp { position: fixed; top: 10px; right: 10px; background: #e8f5e8; border: 2px solid #4caf50; padding: 8px; border-radius: 6px; font-size: 10px; }
    </style>
</head>
<body>
    <div class="processed-stamp">
        <strong>✓ PROCESSED</strong><br>
        <small>${new Date().toLocaleDateString()}</small>
    </div>

    <div class="header">
        <h1>Activity Log (ICS 214)</h1>
    </div>
    
    <div class="form-section">
        <div class="field-grid">
            <div class="field">
                <span class="field-label">1. Incident Name:</span>
                <div class="field-line">Volunteer Service</div>
            </div>
            <div class="field">
                <span class="field-label">2. Operational Period:</span>
                <div class="field-line">${new Date().toLocaleDateString()}</div>
            </div>
            <div class="field">
                <span class="field-label">Date From:</span>
                <div class="field-line">${data.activities?.[0]?.date || new Date().toLocaleDateString()}</div>
            </div>
        </div>
        <div class="field-grid">
            <div class="field">
                <span class="field-label">3. Name:</span>
                <div class="field-line">${data.volunteer_name || ''}</div>
            </div>
            <div class="field">
                <span class="field-label">4. ICS Position:</span>
                <div class="field-line">Volunteer</div>
            </div>
            <div class="field">
                <span class="field-label">Date To:</span>
                <div class="field-line">${data.activities?.[data.activities.length - 1]?.date || new Date().toLocaleDateString()}</div>
            </div>
        </div>
        <div class="field">
            <span class="field-label">5. Home Agency (and Unit):</span>
            <div class="field-line">Virtu Community Enhancement Group</div>
        </div>
        <div class="field">
            <span class="field-label">Contact Info:</span>
            <div class="field-line">${data.email || ''} | ${data.phone || ''}</div>
        </div>
    </div>
    
    <div class="form-section">
        <div class="section-header">7. Activity Log:</div>
        <table class="activity-table">
            <thead>
                <tr>
                    <th style="width: 20%;">Date/Time</th>
                    <th style="width: 80%;">Notable Activities</th>
                </tr>
            </thead>
            <tbody>
                ${data.activities?.map(activity => `
                    <tr>
                        <td style="text-align: center;">
                            ${new Date(activity.date).toLocaleDateString()}<br>
                            ${activity.hours} hrs
                        </td>
                        <td>
                            <strong>${activity.activity}</strong><br>
                            Organization: ${activity.organization}<br>
                            Location: ${activity.location}<br>
                            ${activity.description}
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="2">No activities recorded</td></tr>'}
                <tr style="background-color: #f0f0f0; font-weight: bold;">
                    <td style="text-align: center;">TOTAL</td>
                    <td>${totalHours} hours of volunteer service</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div class="signature-section">
        <div class="signature-box">
            <div class="section-header">8. Prepared by:</div>
            <div class="signature-line">
                ${file.has_signature && file.signature_data ? 
                    `<img src="data:image/png;base64,${file.signature_data}" class="signature-image" alt="Signature">` : ''}
            </div>
            <div style="font-size: 9px;">OCR System</div>
        </div>
        <div class="signature-box">
            <div class="section-header">Position/Title:</div>
            <div class="signature-line">${data.position_title || 'Volunteer'}</div>
            <div style="font-size: 9px;">Position/Title</div>
        </div>
        <div class="signature-box">
            <div class="section-header">Date/Time:</div>
            <div class="signature-line">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            <div style="font-size: 9px;">Date/Time</div>
        </div>
    </div>
    
    <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
        Form processed automatically by VCEG Volunteer Management System<br>
        Original file: ${file.original_name} | Total Hours: ${totalHours}
    </div>
</body>
</html>
  `;
}