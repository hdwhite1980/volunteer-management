// src/app/api/job-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

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

// POST - Submit job application
export async function POST(request: NextRequest) {
  try {
    console.log('Job Applications API: Starting application submission...');
    
    const body = await request.json();
    const {
      job_id,
      volunteer_id,
      volunteer_email, // Alternative to volunteer_id
      message,
      preferred_start_date,
      availability_notes
    } = body;

    console.log('Job Applications API: Processing application for job:', job_id);

    // Validate required fields
    if (!job_id || (!volunteer_id && !volunteer_email)) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id and (volunteer_id or volunteer_email)' },
        { status: 400 }
      );
    }

    // Get volunteer ID if email was provided
    let resolvedVolunteerId = volunteer_id;
    
    if (!volunteer_id && volunteer_email) {
      const volunteers = await sql`
        SELECT id FROM volunteer_registrations 
        WHERE email = ${volunteer_email.toLowerCase()}
      `;
      
      if (volunteers.length === 0) {
        return NextResponse.json(
          { error: 'Volunteer not found. Please register first.' },
          { status: 404 }
        );
      }
      
      resolvedVolunteerId = volunteers[0].id;
    }

    // Verify job exists and is active
    const jobs = await sql`
      SELECT 
        id, title, organization, volunteers_needed, status,
        (
          SELECT COUNT(*) 
          FROM job_applications ja 
          WHERE ja.job_id = jobs.id AND ja.status = 'accepted'
        ) as filled_positions
      FROM jobs 
      WHERE id = ${job_id} AND status = 'active'
    `;

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found or no longer available' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    const positionsRemaining = job.volunteers_needed - (job.filled_positions || 0);

    if (positionsRemaining <= 0) {
      return NextResponse.json(
        { error: 'This position is now full. No more volunteers needed.' },
        { status: 400 }
      );
    }

    // Check if volunteer already applied
    const existingApplications = await sql`
      SELECT id, status FROM job_applications 
      WHERE job_id = ${job_id} AND volunteer_id = ${resolvedVolunteerId}
    `;

    if (existingApplications.length > 0) {
      const existing = existingApplications[0];
      return NextResponse.json(
        { 
          error: `You have already applied for this position. Application status: ${existing.status}`,
          existing_application_id: existing.id,
          status: existing.status
        },
        { status: 409 }
      );
    }

    // Verify volunteer exists
    const volunteers = await sql`
      SELECT id, first_name, last_name, email FROM volunteer_registrations 
      WHERE id = ${resolvedVolunteerId}
    `;

    if (volunteers.length === 0) {
      return NextResponse.json(
        { error: 'Volunteer registration not found' },
        { status: 404 }
      );
    }

    const volunteer = volunteers[0];

    // Create the application
    const result = await sql`
      INSERT INTO job_applications (
        job_id,
        volunteer_id,
        message,
        preferred_start_date,
        availability_notes
      ) VALUES (
        ${job_id},
        ${resolvedVolunteerId},
        ${message || null},
        ${preferred_start_date || null},
        ${availability_notes || null}
      )
      RETURNING id, applied_at
    `;

    console.log(`Job Applications API: Successfully created application with ID: ${result[0].id}`);

    // Get full application details for response
    const fullApplication = await sql`
      SELECT 
        ja.*,
        j.title as job_title,
        j.organization,
        j.contact_email,
        vr.first_name,
        vr.last_name,
        vr.email as volunteer_email
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN volunteer_registrations vr ON ja.volunteer_id = vr.id
      WHERE ja.id = ${result[0].id}
    `;

    const application = fullApplication[0];

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        job_id: application.job_id,
        job_title: application.job_title,
        organization: application.organization,
        volunteer_name: `${application.first_name} ${application.last_name}`,
        status: application.status,
        applied_at: application.applied_at,
        message: application.message
      },
      message: 'Application submitted successfully! The organization will review your application and contact you soon.',
      next_steps: [
        'You will receive an email confirmation shortly',
        'The organization will review your application',
        'You may be contacted for additional information or to schedule an interview',
        'Check your email regularly for updates'
      ]
    }, { status: 201 });

  } catch (error) {
    console.error('Job Applications API: Error creating application:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'You have already applied for this position' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          { error: 'Invalid job or volunteer reference' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to submit application',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - List applications (for admin or volunteer)
export async function GET(request: NextRequest) {
  try {
    console.log('Job Applications API: Fetching applications...');
    
    const url = new URL(request.url);
    const jobId = url.searchParams.get('job_id');
    const volunteerId = url.searchParams.get('volunteer_id');
    const volunteerEmail = url.searchParams.get('volunteer_email');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Check if this is an admin request
    const currentUser = await checkAuth(request);
    const isAdmin = currentUser?.role === 'admin';

    let baseQuery = `
      SELECT 
        ja.*,
        j.title as job_title,
        j.organization,
        j.category,
        j.contact_name,
        j.contact_email,
        j.start_date,
        j.end_date,
        vr.first_name,
        vr.last_name,
        vr.email as volunteer_email,
        vr.phone as volunteer_phone
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN volunteer_registrations vr ON ja.volunteer_id = vr.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCount = 0;

    // Add filters
    if (jobId) {
      paramCount++;
      baseQuery += ` AND ja.job_id = $${paramCount}`;
      queryParams.push(parseInt(jobId));
    }

    if (volunteerId) {
      paramCount++;
      baseQuery += ` AND ja.volunteer_id = $${paramCount}`;
      queryParams.push(parseInt(volunteerId));
    }

    if (volunteerEmail) {
      paramCount++;
      baseQuery += ` AND vr.email = $${paramCount}`;
      queryParams.push(volunteerEmail.toLowerCase());
    }

    if (status) {
      paramCount++;
      baseQuery += ` AND ja.status = $${paramCount}`;
      queryParams.push(status);
    }

    // If not admin and no specific filters, return empty result
    if (!isAdmin && !jobId && !volunteerId && !volunteerEmail) {
      return NextResponse.json({
        applications: [],
        pagination: { total: 0, limit, offset, hasMore: false },
        message: 'Please specify job_id, volunteer_id, or volunteer_email to view applications'
      });
    }

    // Add ordering and pagination
    baseQuery += ` ORDER BY ja.applied_at DESC`;
    
    paramCount += 2;
    baseQuery += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
    queryParams.push(limit, offset);

    console.log('Job Applications API: Executing query...');
    const applications = await sql(baseQuery, queryParams);

    // Get total count
    let countQuery = baseQuery.split('ORDER BY')[0].replace('SELECT ja.*,', 'SELECT COUNT(*) as total FROM (SELECT 1 FROM');
    countQuery = countQuery.split('LIMIT')[0] + ') as count_query';
    
    const totalResult = await sql(countQuery, queryParams.slice(0, -2)); // Remove LIMIT and OFFSET params
    const total = parseInt(totalResult[0]?.total || '0');

    console.log(`Job Applications API: Found ${applications.length} applications (${total} total)`);

    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: app.job_title,
        organization: app.organization,
        category: app.category,
        volunteer_id: app.volunteer_id,
        volunteer_name: `${app.first_name} ${app.last_name}`,
        volunteer_email: app.volunteer_email,
        volunteer_phone: isAdmin ? app.volunteer_phone : null, // Only show phone to admins
        status: app.status,
        message: app.message,
        preferred_start_date: app.preferred_start_date,
        availability_notes: app.availability_notes,
        applied_at: app.applied_at,
        responded_at: app.responded_at,
        admin_notes: isAdmin ? app.admin_notes : null // Only show admin notes to admins
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
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

// PUT - Update application status (admin only)
export async function PUT(request: NextRequest) {
  try {
    console.log('Job Applications API: Starting application update...');
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      application_id,
      status,
      admin_notes
    } = body;

    if (!application_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id, status' },
        { status: 400 }
      );
    }

    if (!['pending', 'accepted', 'rejected', 'withdrawn'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, accepted, rejected, or withdrawn' },
        { status: 400 }
      );
    }

    // Update the application
    const result = await sql`
      UPDATE job_applications 
      SET 
        status = ${status},
        admin_notes = ${admin_notes || null},
        responded_at = CURRENT_TIMESTAMP
      WHERE id = ${application_id}
      RETURNING id, status, responded_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    console.log(`Job Applications API: Updated application ${application_id} to status: ${status}`);

    return NextResponse.json({
      success: true,
      application: result[0],
      message: `Application status updated to: ${status}`
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