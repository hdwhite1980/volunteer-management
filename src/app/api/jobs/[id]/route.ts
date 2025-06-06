// src/app/api/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Type for application data
interface JobApplication {
  id: number;
  status: string;
  applied_at: string;
  message?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
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

// GET - Get individual job details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    console.log(`Job Details API: Fetching job ${jobId}`);

    // Get job details with location and application info
    const jobs = await sql`
      SELECT 
        j.*,
        zc.city as zip_city,
        zc.state as zip_state,
        COALESCE(j.latitude, zc.latitude) as computed_latitude,
        COALESCE(j.longitude, zc.longitude) as computed_longitude,
        u.username as posted_by_username,
        (
          SELECT COUNT(*) 
          FROM job_applications ja 
          WHERE ja.job_id = j.id AND ja.status = 'accepted'
        ) as filled_positions,
        (
          SELECT COUNT(*) 
          FROM job_applications ja 
          WHERE ja.job_id = j.id AND ja.status = 'pending'
        ) as pending_applications,
        (j.volunteers_needed - COALESCE(
          (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted'), 
          0
        )) as positions_remaining
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      LEFT JOIN users u ON j.posted_by = u.id
      WHERE j.id = ${jobId}
    `;

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];

    // Check if user can view this job
    const currentUser = await checkAuth(request);
    const isOwner = currentUser && currentUser.id === job.posted_by;
    const isAdmin = currentUser && currentUser.role === 'admin';
    const canViewDetails = job.status === 'active' || isOwner || isAdmin;

    if (!canViewDetails) {
      return NextResponse.json(
        { error: 'Job not available' },
        { status: 403 }
      );
    }

    // Get recent applications if user is owner or admin - FIXED TYPING
    let applications: JobApplication[] = [];
    if (isOwner || isAdmin) {
      const result = await sql`
        SELECT 
          ja.id,
          ja.status,
          ja.applied_at,
          ja.message,
          vr.first_name,
          vr.last_name,
          vr.email,
          vr.phone
        FROM job_applications ja
        JOIN volunteer_registrations vr ON ja.volunteer_id = vr.id
        WHERE ja.job_id = ${jobId}
        ORDER BY ja.applied_at DESC
        LIMIT 10
      `;
      applications = result as JobApplication[];
    }

    console.log(`Job Details API: Returning job details with ${applications.length} applications`);

    return NextResponse.json({
      ...job,
      computed_latitude: job.computed_latitude ? parseFloat(job.computed_latitude) : null,
      computed_longitude: job.computed_longitude ? parseFloat(job.computed_longitude) : null,
      filled_positions: parseInt(job.filled_positions || '0'),
      pending_applications: parseInt(job.pending_applications || '0'),
      positions_remaining: parseInt(job.positions_remaining || job.volunteers_needed || '0'),
      applications: isOwner || isAdmin ? applications : undefined,
      can_edit: isOwner || isAdmin,
      posted_by_username: job.posted_by_username
    });

  } catch (error) {
    console.error('Job Details API: Error fetching job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch job details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Job Details API: User ${currentUser.username} updating job ${jobId}`);

    // Check if user can edit this job
    const jobs = await sql`
      SELECT posted_by, status FROM jobs WHERE id = ${jobId}
    `;

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    const isOwner = currentUser.id === job.posted_by;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only edit jobs you posted' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Build update query dynamically
    const allowedFields = [
      'title', 'description', 'contact_name', 'contact_email', 'contact_phone',
      'address', 'city', 'state', 'zipcode', 'category', 'skills_needed',
      'time_commitment', 'duration_hours', 'volunteers_needed', 'age_requirement',
      'background_check_required', 'training_provided', 'start_date', 'end_date',
      'flexible_schedule', 'preferred_times', 'status', 'urgency',
      'remote_possible', 'transportation_provided', 'meal_provided', 'stipend_amount',
      'expires_at'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add job ID as the last parameter
    updateValues.push(jobId);
    paramCount++;

    const updateQuery = `
      UPDATE jobs 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, updated_at
    `;

    console.log('Job Details API: Executing update...');
    const result = await sql(updateQuery, updateValues);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 500 }
      );
    }

    console.log(`Job Details API: Successfully updated job ${jobId}`);

    return NextResponse.json({
      success: true,
      id: result[0].id,
      updated_at: result[0].updated_at,
      message: 'Job updated successfully'
    });

  } catch (error) {
    console.error('Job Details API: Error updating job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Job Details API: User ${currentUser.username} deleting job ${jobId}`);

    // Check if user can delete this job
    const jobs = await sql`
      SELECT posted_by, title FROM jobs WHERE id = ${jobId}
    `;

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    const isOwner = currentUser.id === job.posted_by;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete jobs you posted' },
        { status: 403 }
      );
    }

    // Check if there are accepted applications
    const acceptedApps = await sql`
      SELECT COUNT(*) as count 
      FROM job_applications 
      WHERE job_id = ${jobId} AND status = 'accepted'
    `;

    if (parseInt(acceptedApps[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete job with accepted applications. Change status to "filled" instead.' },
        { status: 400 }
      );
    }

    // Delete the job (this will cascade delete applications)
    const result = await sql`
      DELETE FROM jobs 
      WHERE id = ${jobId}
      RETURNING id, title
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete job' },
        { status: 500 }
      );
    }

    console.log(`Job Details API: Successfully deleted job ${jobId}`);

    return NextResponse.json({
      success: true,
      message: `Job "${result[0].title}" deleted successfully`
    });

  } catch (error) {
    console.error('Job Details API: Error deleting job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}