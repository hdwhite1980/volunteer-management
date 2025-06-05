// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Type definitions
interface ProcessedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  status: string;
}

interface UploadedFileRecord {
  id: number;
  original_name: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  processed_date?: string;
  status: string;
  uploaded_by_username?: string;
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

// POST - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Starting file upload...');
    
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      console.log(`Upload API: Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        console.log(`Upload API: Invalid file type: ${file.type}`);
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed types: PDF, Excel, Word, JPG, PNG` },
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

      // Convert file to buffer for processing/storage
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // For now, we'll just log the file info and simulate processing
      // In a real implementation, you might:
      // 1. Store files in cloud storage (AWS S3, Vercel Blob, etc.)
      // 2. Process with OCR if it's an image/PDF
      // 3. Extract data if it's a structured document
      
      console.log(`Upload API: File ${file.name} processed successfully`);
      
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
    }

    console.log(`Upload API: Successfully processed ${processedFiles.length} files`);

    // Simulate OCR processing (in reality, this would be async)
    setTimeout(async () => {
      try {
        for (const file of processedFiles) {
          await sql`
            UPDATE uploaded_files 
            SET status = 'completed', processed_date = CURRENT_TIMESTAMP
            WHERE id = ${file.id}
          `;
        }
        console.log('Upload API: File processing completed');
      } catch (error) {
        console.error('Upload API: Error updating file status:', error);
      }
    }, 2000);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${processedFiles.length} files`,
      files: processedFiles
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

// GET - List uploaded files (optional)
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
          status
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