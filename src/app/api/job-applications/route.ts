// src/app/api/job-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface ApplicationData {
  job_id: number;
  volunteer_id?: number;
  volunteer_name?: string;
  email?: string;
  phone?: string;
  cover_letter?: string;
  experience?: string;
}

interface JobApplication {
  id: number;
  job_id: number;
  volunteer_id: number;
  status: string;
  message: string;
  applied_at: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Job Applications API: Processing application...');
    
    const body = await request.json() as ApplicationData;
    
    let volunteer_id = body.volunteer_id;
    
    // If volunteer_id is not provided, we need email to lookup/create volunteer
    if (!volunteer_id) {
      if (!body.email) {
        return NextResponse.json(
          { error: 'Either volunteer_id or email is required' },
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

      // Lookup existing volunteer by email
      console.log('Job Applications API: Looking up volunteer by email...');
      const existingVolunteers = await sql`
        SELECT id FROM volunteer_registrations WHERE email = ${body.email}
      ` as any[];

      if (existingVolunteers.length > 0) {
        volunteer_id = existingVolunteers[0].id;
        console.log(`Job Applications API: Found existing volunteer ${volunteer_id}`);
      } else {
        // Create new volunteer registration with minimal data
        if (!body.volunteer_name) {
          return NextResponse.json(
            { error: 'volunteer_name is required for new volunteers' },
            { status: 400 }
          );
        }

        console.log('Job Applications API: Creating new volunteer registration...');
        
        // Split name into first/last (simple approach)
        const nameParts = body.volunteer_name.trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        const newVolunteerResult = await sql`
          INSERT INTO volunteer_registrations (
            first_name, 
            last_name, 
            email, 
            phone,
            address,
            city,
            state,
            zipcode,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship,
            status
          ) VALUES (
            ${first_name},
            ${last_name},
            ${body.email},
            ${body.phone || null},
            'TBD',
            'TBD',
            'TBD',
            '00000',
            'TBD',
            'TBD',
            'TBD',
            'incomplete'
          )
          RETURNING id
        ` as any[];

        if (newVolunteerResult.length === 0) {
          return NextResponse.json(
            { error: 'Failed to create volunteer registration' },
            { status: 500 }
          );
        }

        volunteer_id = newVolunteerResult[0].id;
        console.log(`Job Applications API: Created new volunteer ${volunteer_id}`);
      }
    }

    // Validate required fields
    if (!body.job_id || !volunteer_id) {
      return NextResponse.json(
        { error: 'job_id and volunteer_id are required' },
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

    // Check if volunteer already applied
    console.log('Job Applications API: Checking for duplicate application...');
    const existingApplications = await sql`
      SELECT id FROM job_applications 
      WHERE job_id = ${body.job_id} AND volunteer_id = ${volunteer_id}
    ` as any[];

    if (existingApplications.length > 0) {
      return NextResponse.json(
        { error: 'You have already applied for this position' },
        { status: 409 }
      );
    }

    // Create application with only the required fields
    console.log('Job Applications API: Creating application...');
    const result = await sql`
      INSERT INTO job_applications (
        job_id, 
        volunteer_id, 
        status, 
        message
      ) VALUES (
        ${body.job_id}, 
        ${volunteer_id}, 
        'pending',
        ${body.cover_letter || ''}
      )
      RETURNING id, applied_at
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
        job_id: body.job_id,
        volunteer_id: volunteer_id,
        job_title: job.title,
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
    const volunteerId = url.searchParams.get('volunteer_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Job Applications API: Fetching applications with filters:', { jobId, status, volunteerId });

    let query = `
      SELECT 
        ja.*,
        j.title as job_title,
        j.category as job_category,
        j.city as job_city,
        j.state as job_state,
        vr.first_name,
        vr.last_name,
        vr.email,
        vr.phone
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN volunteer_registrations vr ON ja.volunteer_id = vr.id
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

    if (volunteerId) {
      paramCount++;
      query += ` AND ja.volunteer_id = $${paramCount}`;
      params.push(parseInt(volunteerId));
    }

    query += ` ORDER BY ja.applied_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const applications = await sql(query, params) as JobApplication[];

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN volunteer_registrations vr ON ja.volunteer_id = vr.id
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

    if (volunteerId) {
      countParamCount++;
      countQuery += ` AND ja.volunteer_id = $${countParamCount}`;
      countParams.push(parseInt(volunteerId));
    }

    const countResult = await sql(countQuery, countParams) as any[];
    const total = parseInt(countResult[0]?.total || '0');

    console.log(`Job Applications API: Returning ${applications.length} applications out of ${total} total`);

    return NextResponse.json({
      applications: applications.map(app => ({
        ...app,
        volunteer_name: `${app.first_name} ${app.last_name}`
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
      RETURNING id, job_id, volunteer_id, status
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