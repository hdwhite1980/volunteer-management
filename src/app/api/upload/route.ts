// src/app/api/upload/route.ts (Enhanced with OpenAI OCR)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';

const sql = neon(process.env.DATABASE_URL!);

// Initialize OpenAI with better error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify OpenAI configuration on startup
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
}

// Type definitions
interface ProcessedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  status: string;
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

// Fallback function to extract basic info when JSON parsing fails
function extractBasicInfo(text: string): ExtractedVolunteerData | null {
  try {
    console.log('🔧 Attempting fallback extraction from text...');
    
    // Look for common patterns in the text
    const nameMatch = text.match(/name[:\s]+([a-zA-Z\s]+)/i);
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    const hoursMatch = text.match(/(\d+)\s*hours?/i);
    const organizationMatch = text.match(/organization[:\s]+([a-zA-Z\s]+)/i);
    
    if (nameMatch || emailMatch || hoursMatch) {
      return {
        type: 'activity',
        volunteer_name: nameMatch ? nameMatch[1].trim() : '',
        email: emailMatch ? emailMatch[1] : '',
        phone: phoneMatch ? phoneMatch[1] : '',
        activities: [{
          date: new Date().toISOString().split('T')[0], // Today's date as fallback
          activity: 'Volunteer Work',
          organization: organizationMatch ? organizationMatch[1].trim() : 'Unknown',
          location: '',
          hours: hoursMatch ? parseInt(hoursMatch[1]) : 1,
          description: 'Volunteer activity extracted from document'
        }]
      };
    }
    
    return null;
  } catch (error) {
    console.error('🔧 Fallback extraction failed:', error);
    return null;
  }
}

// Function to extract volunteer data using OpenAI
async function extractVolunteerData(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedVolunteerData | null> {
  try {
    console.log(`🤖 OCR: Processing ${fileName} with OpenAI...`);

    // Verify OpenAI is properly configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Convert buffer to base64 for OpenAI
    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

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
      model: "gpt-4o", // Updated to current model
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
      max_tokens: 2000, // Increased even more for complex extraction
      temperature: 0.2, // Slightly higher for more creative extraction
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

    // Validate files
    const allowedTypes = [
      // 'application/pdf', // Removed - PDFs not supported by gpt-4o
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      console.log(`📄 Upload API: Processing file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Validate file type - provide helpful error for PDFs
      if (!allowedTypes.includes(file.type)) {
        console.log(`❌ Upload API: Invalid file type for OCR: ${file.type}`);
        
        if (file.type === 'application/pdf') {
          return NextResponse.json(
            { 
              error: `PDF files are not currently supported. Please convert "${file.name}" to an image format (JPG or PNG) and try again. You can use online tools like PDF-to-Image converters.`,
              supportedFormats: 'JPG, PNG'
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { 
            error: `Invalid file type: ${file.type}. Supported formats: JPG, PNG`,
            supportedFormats: 'JPG, PNG' 
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

      // Convert file to buffer for OCR processing
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Store file metadata in database
      try {
        const fileRecord = await sql`
          INSERT INTO uploaded_files (
            original_name,
            file_type,
            file_size,
            uploaded_by,
            upload_date,
            status
          ) VALUES (
            ${file.name},
            ${file.type},
            ${file.size},
            ${currentUser.id},
            CURRENT_TIMESTAMP,
            'processing'
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

        // Process with OCR (async - don't block the response)
        setImmediate(async () => {
          try {
            console.log(`🔄 OCR: Starting OCR processing for ${file.name}...`);
            
            const extractedData = await extractVolunteerData(buffer, file.name, file.type);
            
            if (extractedData) {
              console.log('💾 OCR: Data extracted successfully, saving to database...');
              await saveExtractedData(extractedData, currentUser.id);
              
              // Update file status to completed with extracted data
              await sql`
                UPDATE uploaded_files 
                SET 
                  status = 'completed', 
                  processed_date = CURRENT_TIMESTAMP,
                  extracted_data = ${JSON.stringify(extractedData)}
                WHERE id = ${fileRecord[0].id}
              `;
              
              console.log(`✅ OCR: Successfully processed and saved data from ${file.name}`);
            } else {
              console.log('⚠️ OCR: No volunteer data could be extracted');
              await sql`
                UPDATE uploaded_files 
                SET 
                  status = 'no_data_found', 
                  processed_date = CURRENT_TIMESTAMP,
                  error_message = 'No volunteer data could be extracted from this file'
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
      message: `Successfully uploaded ${processedFiles.length} files. OCR processing started.`,
      files: processedFiles,
      note: "Files are being processed with OCR. Check back in a few minutes to see extracted volunteer data.",
      processingInfo: {
        estimatedTime: `${processedFiles.length * 1.5} minutes`,
        fileCount: processedFiles.length,
        totalSize: `${(processedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`
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

// GET - List uploaded files
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
          error_message
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
        uploadedBy: file.uploaded_by_username || 'You'
      })),
      summary: {
        total: files.length,
        processing: files.filter(f => f.status === 'processing').length,
        completed: files.filter(f => f.status === 'completed').length,
        errors: files.filter(f => f.status === 'error').length,
        noData: files.filter(f => f.status === 'no_data_found').length
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