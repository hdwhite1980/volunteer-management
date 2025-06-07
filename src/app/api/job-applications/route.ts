// src/app/api/job-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface ApplicationData {
  job_id: number;
  volunteer_name: string;
  email: string;
  phone?: string;
  cover_letter?: string;
  availability?: any;
  experience?: string;
  volunteer_id?: number;
}

interface JobApplication {
  id: number;
  job_id: number;
  volunteer_name: string;
  email: string;
  phone?: string;
  cover_letter?: string;
  status: string;
  applied_at: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Job Applications API: Processing application...');
    
    const body = await request.json() as ApplicationData;
    
    // Validate required fields
    const requiredFields = ['job_id', 'volunteer_name', 'email'];
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!body[field as keyof ApplicationData]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    console.log('Job Applications API: Checking job status...');
    const jobs = await sql`
      SELECT 
        id, title, status, volunteers_needed, expires_at,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jobs.id AND status = 'accepted') as filled_positions
      FROM jobs 
      WHERE id = ${body.job_id}
    ` as any[];

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];

    if (job.status !== 'active') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    if (new Date(job.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This job opportunity has expired' },
        { status: 400 }
      );
    }

    const positionsRemaining = job.volunteers_needed - job.filled_positions;
    if (positionsRemaining <= 0) {
      return NextResponse.json(
        { error: 'This job is already filled' },
        { status: 400 }
      );
    }

    // Check if user already applied
    console.log('Job Applications API: Checking for duplicate application...');
    const existingApplications = await sql`
      SELECT id FROM job_applications 
      WHERE job_id = ${body.job_id} AND email = ${body.email}
    ` as any[];

    if (existingApplications.length > 0) {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 409 }
      );
    }

    // Try to link with existing volunteer registration
    let volunteerId = body.volunteer_id;
    if (!volunteerId) {
      console.log('Job Applications API: Looking for existing volunteer registration...');
      const volunteers = await sql`
        SELECT id FROM volunteer_registrations WHERE email = ${body.email}
      ` as any[];
      
      if (volunteers.length > 0) {
        volunteerId = volunteers[0].id;
      }
    }

    // Create application
    console.log('Job Applications API: Creating application...');
    const result = await sql`
      INSERT INTO job_applications (
        job_id, volunteer_id, volunteer_name, email, phone, cover_letter,
        availability, experience, status
      ) VALUES (
        ${body.job_id}, ${volunteerId || null}, ${body.volunteer_name}, ${body.email},
        ${body.phone || null}, ${body.cover_letter || ''}, 
        ${JSON.stringify(body.availability || {})}, ${body.experience || ''},
        'pending'
      )
      RETURNING id, volunteer_name, email, applied_at
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    const application = result[0];
    console.log(`Job Applications API: Successfully created application ${application.id}`);

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        job_title: job.title,
        applicant_name: application.volunteer_name,
        applied_at: application.applied_at
      },
      message: 'Application submitted successfully! You will be contacted if selected.'
    }, { status: 201 });

  } catch (error) {
    console.error('Job Applications API: Error processing application:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve applications (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('job_id');
    const status = url.searchParams.get('status');
    const email = url.searchParams.get('email');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Job Applications API: Fetching applications with filters:', { jobId, status, email });

    let query = `
      SELECT 
        ja.*,
        j.title as job_title,
        j.category as job_category,
        j.city as job_city,
        j.state as job_state
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (jobId) {
      paramCount++;
      query += ` AND ja.job_id = $${paramCount}`;
      params.push(parseInt(jobId));
    }

    if (status) {
      paramCount++;
      query += ` AND ja.status = $${paramCount}`;
      params.push(status);
    }

    if (email) {
      paramCount++;
      query += ` AND ja.email = $${paramCount}`;
      params.push(email);
    }

    query += ` ORDER BY ja.applied_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const applications = await sql(query, params) as JobApplication[];

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE 1=1
    `;

    let countParams: any[] = [];
    let countParamCount = 0;

    if (jobId) {
      countParamCount++;
      countQuery += ` AND ja.job_id = $${countParamCount}`;
      countParams.push(parseInt(jobId));
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND ja.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (email) {
      countParamCount++;
      countQuery += ` AND ja.email = $${countParamCount}`;
      countParams.push(email);
    }

    const countResult = await sql(countQuery, countParams) as any[];
    const total = parseInt(countResult[0]?.total || '0');

    console.log(`Job Applications API: Returning ${applications.length} applications out of ${total} total`);

    return NextResponse.json({
      applications: applications.map(app => ({
        ...app,
        availability: typeof app.availability === 'string' 
          ? JSON.parse(app.availability) 
          : app.availability
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Job Applications API: Error fetching applications:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch applications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update application status (admin/job poster only)
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const applicationId = url.searchParams.get('id');
    
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status: newStatus, feedback } = body;

    if (!newStatus || !['pending', 'accepted', 'rejected', 'withdrawn'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, accepted, rejected, withdrawn)' },
        { status: 400 }
      );
    }

    console.log(`Job Applications API: Updating application ${applicationId} to status: ${newStatus}`);

    // Update application status
    const result = await sql`
      UPDATE job_applications 
      SET status = ${newStatus}, 
          feedback = ${feedback || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(applicationId)}
      RETURNING id, job_id, volunteer_name, status
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    console.log(`Job Applications API: Successfully updated application ${applicationId}`);

    return NextResponse.json({
      success: true,
      application: result[0],
      message: `Application status updated to ${newStatus}`
    });

  } catch (error) {
    console.error('Job Applications API: Error updating application:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}