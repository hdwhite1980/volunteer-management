// src/app/api/upload/route.ts (Enhanced with OpenAI OCR)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';

const sql = neon(process.env.DATABASE_URL!);
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
    
    return sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error('Authentication check error:', error);
    return null;
  }
}

// Function to extract volunteer data using OpenAI
async function extractVolunteerData(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedVolunteerData | null> {
  try {
    console.log(`OCR: Processing ${fileName} with OpenAI...`);

    // Convert buffer to base64 for OpenAI
    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `
    Analyze this volunteer form/document and extract the following information in JSON format:

    For Partnership Volunteer Logs, extract:
    {
      "type": "partnership",
      "first_name": "...",
      "last_name": "...",
      "email": "...",
      "phone": "...",
      "organization": "...",
      "position_title": "...",
      "families_served": number,
      "events": [
        {
          "date": "YYYY-MM-DD",
          "site": "location",
          "zip": "12345",
          "hours": number,
          "volunteers": number
        }
      ]
    }

    For Activity Volunteer Logs, extract:
    {
      "type": "activity",
      "volunteer_name": "...",
      "email": "...",
      "phone": "...",
      "position_title": "...",
      "activities": [
        {
          "date": "YYYY-MM-DD",
          "activity": "activity type",
          "organization": "...",
          "location": "...",
          "hours": number,
          "description": "..."
        }
      ]
    }

    Rules:
    - Only extract data that is clearly visible in the document
    - Use null for missing fields
    - Ensure dates are in YYYY-MM-DD format
    - Ensure hours and volunteers are numbers
    - Return only valid JSON
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
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
      max_tokens: 1000,
      temperature: 0.1
    });

    const extractedText = response.choices[0]?.message?.content;
    
    if (!extractedText) {
      console.log('OCR: No text extracted from OpenAI response');
      return null;
    }

    // Try to parse JSON from the response
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        console.log('OCR: Successfully extracted data:', extractedData);
        return extractedData;
      }
    } catch (parseError) {
      console.log('OCR: Could not parse JSON from response:', extractedText);
    }

    return null;
  } catch (error) {
    console.error('OCR: Error processing with OpenAI:', error);
    return null;
  }
}

// Function to save extracted data to database
async function saveExtractedData(data: ExtractedVolunteerData, uploadedBy: number): Promise<void> {
  try {
    if (data.type === 'partnership') {
      console.log('OCR: Saving partnership log...');
      
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
          ${data.organization},
          ${data.email},
          ${data.phone},
          ${data.families_served || 0},
          ${JSON.stringify(data.events || [])},
          'OCR',
          'System',
          ${data.position_title || 'N/A'},
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `;
      
      console.log(`OCR: Created partnership log with ID: ${partnershipResult[0].id}`);
      
    } else if (data.type === 'activity') {
      console.log('OCR: Saving activity log...');
      
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
          ${data.email},
          ${data.phone},
          ${JSON.stringify(data.activities || [])},
          'OCR',
          'System',
          ${data.position_title || 'N/A'},
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `;
      
      console.log(`OCR: Created activity log with ID: ${activityResult[0].id}`);
    }
  } catch (error) {
    console.error('OCR: Error saving extracted data to database:', error);
    throw error;
  }
}

// POST - Handle file uploads with OCR
export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Starting file upload with OCR...');
    
    // Check authentication
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Upload API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Upload API: User ${currentUser.username} uploading files`);

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`Upload API: Processing ${files.length} files`);

    // Validate files
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      console.log(`Upload API: Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

      // Validate file type (for OCR, we focus on images and PDFs)
      if (!allowedTypes.includes(file.type)) {
        console.log(`Upload API: Invalid file type for OCR: ${file.type}`);
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. OCR supports: PDF, JPG, PNG` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > maxFileSize) {
        console.log(`Upload API: File too large: ${file.size} bytes`);
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 10MB` },
          { status: 400 }
        );
      }

      // Convert file to buffer for OCR processing
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Store file metadata in database
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

      // Process with OCR (async - don't block the response)
      setTimeout(async () => {
        try {
          console.log(`OCR: Starting OCR processing for ${file.name}...`);
          
          const extractedData = await extractVolunteerData(buffer, file.name, file.type);
          
          if (extractedData) {
            console.log('OCR: Data extracted successfully, saving to database...');
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
            
            console.log(`OCR: Successfully processed and saved data from ${file.name}`);
          } else {
            console.log('OCR: No volunteer data could be extracted');
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
          console.error(`OCR: Error processing ${file.name}:`, error);
          await sql`
            UPDATE uploaded_files 
            SET 
              status = 'error', 
              processed_date = CURRENT_TIMESTAMP,
              error_message = ${error instanceof Error ? error.message : 'Unknown error'}
            WHERE id = ${fileRecord[0].id}
          `;
        }
      }, 1000); // Small delay to return response first
    }

    console.log(`Upload API: Successfully started processing ${processedFiles.length} files`);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${processedFiles.length} files. OCR processing started.`,
      files: processedFiles,
      note: "Files are being processed with OCR. Check back in a few minutes to see extracted volunteer data."
    });

  } catch (error) {
    console.error('Upload API: Error processing upload:', error);
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
    console.log('Upload API: Fetching uploaded files...');
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch files uploaded by current user (or all if admin)
    let files: any[];
    if (currentUser.role === 'admin') {
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
      }))
    });

  } catch (error) {
    console.error('Upload API: Error fetching files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}