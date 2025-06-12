// src/app/api/volunteer-assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface AssignmentData {
  volunteer_registration_id: number;
  job_id: number;
  notes?: string;
  assigned_by: number;
}

interface Assignment {
  id: number;
  volunteer_registration_id: number;
  job_id: number;
  assignment_date: string;
  status: string;
  hours_logged: number;
  notes?: string;
  assigned_by: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  volunteer_first_name?: string;
  volunteer_last_name?: string;
  volunteer_email?: string;
  volunteer_phone?: string;
  job_title?: string;
  job_category?: string;
  job_city?: string;
  job_state?: string;
  assigned_by_username?: string;
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

// GET - Fetch assignments with optional filters
export async function GET(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const volunteerId = url.searchParams.get('volunteer_id');
    const jobId = url.searchParams.get('job_id');
    const status = url.searchParams.get('status') || 'assigned';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Volunteer Assignments API: Fetching assignments with filters:', { volunteerId, jobId, status });

    let query = `
      SELECT 
        va.*,
        vr.first_name as volunteer_first_name, 
        vr.last_name as volunteer_last_name, 
        vr.email as volunteer_email, 
        vr.phone as volunteer_phone,
        vr.username as volunteer_username,
        j.title as job_title, 
        j.category as job_category, 
        j.city as job_city, 
        j.state as job_state,
        j.start_date as job_start_date,
        j.end_date as job_end_date,
        u.username as assigned_by_username
      FROM volunteer_assignments va
      JOIN volunteer_registrations vr ON va.volunteer_registration_id = vr.id
      JOIN jobs j ON va.job_id = j.id
      LEFT JOIN users u ON va.assigned_by = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    if (volunteerId) {
      paramCount++;
      query += ` AND va.volunteer_registration_id = $${paramCount}`;
      params.push(parseInt(volunteerId));
    }

    if (jobId) {
      paramCount++;
      query += ` AND va.job_id = $${paramCount}`;
      params.push(parseInt(jobId));
    }

    if (status) {
      paramCount++;
      query += ` AND va.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY va.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const assignments = await sql(query, params) as Assignment[];

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM volunteer_assignments va
      JOIN volunteer_registrations vr ON va.volunteer_registration_id = vr.id
      JOIN jobs j ON va.job_id = j.id
      WHERE 1=1
    `;

    let countParams: any[] = [];
    let countParamCount = 0;

    if (volunteerId) {
      countParamCount++;
      countQuery += ` AND va.volunteer_registration_id = $${countParamCount}`;
      countParams.push(parseInt(volunteerId));
    }

    if (jobId) {
      countParamCount++;
      countQuery += ` AND va.job_id = $${countParamCount}`;
      countParams.push(parseInt(jobId));
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND va.status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await sql(countQuery, countParams) as any[];
    const total = parseInt(countResult[0]?.total || '0');

    console.log(`Volunteer Assignments API: Returning ${assignments.length} assignments out of ${total} total`);

    return NextResponse.json({
      assignments,
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
    console.error('Volunteer Assignments API: Error fetching assignments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Volunteer Assignments API: User ${currentUser.username} creating new assignment`);

    const body = await request.json() as AssignmentData;
    
    // Validate required fields
    if (!body.volunteer_registration_id || !body.job_id) {
      return NextResponse.json(
        { error: 'volunteer_registration_id and job_id are required' },
        { status: 400 }
      );
    }

    // Check if volunteer exists and is active
    const volunteers = await sql`
      SELECT id, first_name, last_name, email, status 
      FROM volunteer_registrations 
      WHERE id = ${body.volunteer_registration_id}
    ` as any[];

    if (volunteers.length === 0) {
      return NextResponse.json(
        { error: 'Volunteer not found' },
        { status: 404 }
      );
    }

    const volunteer = volunteers[0];
    if (volunteer.status !== 'active') {
      return NextResponse.json(
        { error: 'Volunteer is not active' },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    const jobs = await sql`
      SELECT id, title, status, volunteers_needed, expires_at,
        (SELECT COUNT(*) FROM volunteer_assignments WHERE job_id = jobs.id AND status = 'assigned') as current_assignments
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
        { error: 'Job is not active' },
        { status: 400 }
      );
    }

    if (new Date(job.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Job has expired' },
        { status: 400 }
      );
    }

    // Check if job is already full
    if (job.current_assignments >= job.volunteers_needed) {
      return NextResponse.json(
        { error: 'Job is already fully assigned' },
        { status: 400 }
      );
    }

    // Check if volunteer is already assigned to this job
    const existingAssignments = await sql`
      SELECT id FROM volunteer_assignments 
      WHERE volunteer_registration_id = ${body.volunteer_registration_id} 
        AND job_id = ${body.job_id} 
        AND status = 'assigned'
    ` as any[];

    if (existingAssignments.length > 0) {
      return NextResponse.json(
        { error: 'Volunteer is already assigned to this job' },
        { status: 409 }
      );
    }

    // Create assignment
    console.log('Volunteer Assignments API: Creating assignment...');
    const result = await sql`
      INSERT INTO volunteer_assignments (
        volunteer_registration_id, job_id, notes, assigned_by, status
      ) VALUES (
        ${body.volunteer_registration_id}, ${body.job_id}, 
        ${body.notes || ''}, ${currentUser.id}, 'assigned'
      )
      RETURNING id, assignment_date, created_at
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    const assignment = result[0];
    console.log(`Volunteer Assignments API: Successfully created assignment ${assignment.id}`);

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
        job_title: job.title,
        assignment_date: assignment.assignment_date,
        created_at: assignment.created_at
      },
      message: `Successfully assigned ${volunteer.first_name} ${volunteer.last_name} to ${job.title}`
    }, { status: 201 });

  } catch (error) {
    console.error('Volunteer Assignments API: Error creating assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update assignment status/hours
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status: newStatus, hours_logged, notes } = body;

    // Validate status if provided
    if (newStatus && !['assigned', 'completed', 'cancelled', 'no_show'].includes(newStatus)) {
      return NextResponse.json(
        { error: 'Valid status is required (assigned, completed, cancelled, no_show)' },
        { status: 400 }
      );
    }

    // Validate hours if provided
    if (hours_logged !== undefined && (isNaN(hours_logged) || hours_logged < 0)) {
      return NextResponse.json(
        { error: 'Hours logged must be a non-negative number' },
        { status: 400 }
      );
    }

    console.log(`Volunteer Assignments API: Updating assignment ${assignmentId}`);

    // Update assignment
    const result = await sql`
      UPDATE volunteer_assignments 
      SET status = COALESCE(${newStatus}, status), 
          hours_logged = COALESCE(${hours_logged || null}, hours_logged),
          notes = COALESCE(${notes || null}, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(assignmentId)}
      RETURNING id, volunteer_registration_id, job_id, status, hours_logged
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    console.log(`Volunteer Assignments API: Successfully updated assignment ${assignmentId}`);

    return NextResponse.json({
      success: true,
      assignment: result[0],
      message: `Assignment updated successfully`
    });

  } catch (error) {
    console.error('Volunteer Assignments API: Error updating assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    console.log(`Volunteer Assignments API: Deleting assignment ${assignmentId}`);

    // Delete assignment (or mark as cancelled)
    const result = await sql`
      UPDATE volunteer_assignments 
      SET status = 'cancelled',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(assignmentId)}
      RETURNING id, volunteer_registration_id, job_id
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    console.log(`Volunteer Assignments API: Successfully cancelled assignment ${assignmentId}`);

    return NextResponse.json({
      success: true,
      message: 'Assignment cancelled successfully'
    });

  } catch (error) {
    console.error('Volunteer Assignments API: Error deleting assignment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}