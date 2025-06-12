// src/app/api/volunteer-assignments/route.ts
// Fixed version - no duplicate function definitions
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface AssignmentData {
  volunteer_id?: number;
  volunteer_email?: string;
  job_id: number;
  application_id?: number;
  assigned_by?: number;
  status?: string;
  notes?: string;
}

interface AssignmentUpdate {
  status?: string;
  completion_notes?: string;
  rating?: number;
  feedback?: string;
  hours_logged?: number;
  notes?: string;
}

interface Assignment {
  id: number;
  volunteer_id: number;
  job_id: number;
  application_id?: number;
  status: string;
  assigned_at: string;
  confirmed_at?: string;
  completion_notes?: string;
  rating?: number;
  feedback?: string;
  hours_logged?: number;
  assigned_by?: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  volunteer_username?: string;
  volunteer_first_name?: string;
  volunteer_last_name?: string;
  volunteer_email?: string;
  volunteer_phone?: string;
  job_title?: string;
  job_category?: string;
  job_city?: string;
  job_state?: string;
  job_start_date?: string;
  job_end_date?: string;
  assigned_by_username?: string;
}

// Helper function to check authentication (simplified for now)
async function checkAuth(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      return null;
    }

    const sessions = await sql`
      SELECT 
        u.id, u.username, u.email, u.role, u.full_name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > CURRENT_TIMESTAMP
    `;
    
    return sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error('Authentication check error:', error);
    return null;
  }
}

// Helper function to find volunteer by email
async function findVolunteerByEmail(email: string) {
  try {
    const volunteers = await sql`
      SELECT id, username, first_name, last_name, email, phone, status
      FROM volunteer_registrations 
      WHERE email = ${email} AND status = 'active'
    ` as any[];
    
    return volunteers.length > 0 ? volunteers[0] : null;
  } catch (error) {
    console.error('Error finding volunteer by email:', error);
    return null;
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    console.log('Volunteer Assignments API: Creating assignment...');
    
    const body = await request.json() as AssignmentData;
    
    // Validate required fields
    if (!body.job_id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!body.volunteer_id && !body.volunteer_email) {
      return NextResponse.json(
        { error: 'Either volunteer_id or volunteer_email is required' },
        { status: 400 }
      );
    }

    let volunteerId = body.volunteer_id;
    let volunteerInfo: any = null;

    // If email provided, find volunteer by email
    if (body.volunteer_email && !volunteerId) {
      console.log('Volunteer Assignments API: Looking up volunteer by email...');
      volunteerInfo = await findVolunteerByEmail(body.volunteer_email);
      
      if (!volunteerInfo) {
        return NextResponse.json(
          { error: 'Volunteer not found with provided email' },
          { status: 404 }
        );
      }

      volunteerId = volunteerInfo.id;
    } else if (volunteerId) {
      // Get volunteer info by ID
      const volunteers = await sql`
        SELECT id, username, first_name, last_name, email, phone, status
        FROM volunteer_registrations 
        WHERE id = ${volunteerId} AND status = 'active'
      ` as any[];

      if (volunteers.length === 0) {
        return NextResponse.json(
          { error: 'Volunteer not found' },
          { status: 404 }
        );
      }

      volunteerInfo = volunteers[0];
    }

    // Check if job exists and has available spots
    console.log('Volunteer Assignments API: Checking job availability...');
    const jobs = await sql`
      SELECT 
        j.*,
        (j.volunteers_needed - 
         COALESCE((SELECT COUNT(*) FROM volunteer_assignments 
                   WHERE job_id = j.id AND status IN ('assigned', 'confirmed', 'completed')), 0)
        ) as spots_remaining
      FROM jobs j 
      WHERE j.id = ${body.job_id} AND j.status = 'active'
    ` as any[];

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found or inactive' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    if (job.spots_remaining <= 0) {
      return NextResponse.json(
        { error: 'No available spots for this job' },
        { status: 400 }
      );
    }

    // Check if job has expired
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Job has expired' },
        { status: 400 }
      );
    }

    // Check for existing assignment
    console.log('Volunteer Assignments API: Checking for existing assignment...');
    const existingAssignments = await sql`
      SELECT id, status FROM volunteer_assignments 
      WHERE volunteer_id = ${volunteerId} AND job_id = ${body.job_id}
    ` as any[];

    if (existingAssignments.length > 0) {
      const existing = existingAssignments[0];
      return NextResponse.json(
        { 
          error: 'Volunteer is already assigned to this job',
          existing_assignment: {
            id: existing.id,
            status: existing.status
          }
        },
        { status: 409 }
      );
    }

    // Create assignment
    console.log('Volunteer Assignments API: Creating assignment...');
    const result = await sql`
      INSERT INTO volunteer_assignments (
        volunteer_id, job_id, application_id, assigned_by, status, notes
      ) VALUES (
        ${volunteerId}, ${body.job_id}, ${body.application_id || null}, 
        ${body.assigned_by || null}, ${body.status || 'assigned'}, ${body.notes || ''}
      )
      RETURNING id, volunteer_id, job_id, status, assigned_at, created_at
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    const assignment = result[0];
    console.log(`Volunteer Assignments API: Successfully created assignment ${assignment.id}`);

    // If this assignment is from an accepted application, update the application status
    if (body.application_id) {
      try {
        await sql`
          UPDATE job_applications 
          SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
          WHERE id = ${body.application_id}
        `;
      } catch (error) {
        console.warn('Failed to update application status:', error);
      }
    }

    // Log the assignment creation
    try {
      await sql`
        INSERT INTO activity_logs (
          user_type, user_id, action, details, timestamp
        ) VALUES (
          'volunteer', ${volunteerId}, 'job_assigned',
          ${JSON.stringify({
            job_id: body.job_id,
            job_title: job.title,
            assigned_by: body.assigned_by,
            assignment_id: assignment.id
          })}, CURRENT_TIMESTAMP
        )
      `;
    } catch (logError) {
      console.warn('Failed to log assignment creation:', logError);
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        volunteer: {
          id: volunteerInfo.id,
          username: volunteerInfo.username,
          name: `${volunteerInfo.first_name} ${volunteerInfo.last_name}`,
          email: volunteerInfo.email
        },
        job: {
          id: job.id,
          title: job.title,
          category: job.category
        },
        status: assignment.status,
        assigned_at: assignment.assigned_at
      },
      message: 'Volunteer successfully assigned to job!'
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

// GET - Fetch assignments with optional filters
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const volunteerId = url.searchParams.get('volunteer_id');
    const jobId = url.searchParams.get('job_id');
    const status = url.searchParams.get('status');
    const email = url.searchParams.get('email');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Volunteer Assignments API: Fetching assignments with filters:', { 
      volunteerId, jobId, status, email 
    });

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramCount = 0;

    if (volunteerId) {
      paramCount++;
      whereConditions.push(`va.volunteer_id = $${paramCount}`);
      params.push(parseInt(volunteerId));
    }

    if (jobId) {
      paramCount++;
      whereConditions.push(`va.job_id = $${paramCount}`);
      params.push(parseInt(jobId));
    }

    if (status) {
      paramCount++;
      whereConditions.push(`va.status = $${paramCount}`);
      params.push(status);
    }

    if (email) {
      paramCount++;
      whereConditions.push(`vr.email = $${paramCount}`);
      params.push(email);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT 
        va.*,
        vr.username as volunteer_username,
        vr.first_name as volunteer_first_name,
        vr.last_name as volunteer_last_name,
        vr.email as volunteer_email,
        vr.phone as volunteer_phone,
        j.title as job_title,
        j.category as job_category,
        j.city as job_city,
        j.state as job_state,
        j.start_date as job_start_date,
        j.end_date as job_end_date,
        ja.applied_at,
        u.username as assigned_by_username
      FROM volunteer_assignments va
      JOIN volunteer_registrations vr ON va.volunteer_id = vr.id
      JOIN jobs j ON va.job_id = j.id
      LEFT JOIN job_applications ja ON va.application_id = ja.id
      LEFT JOIN users u ON va.assigned_by = u.id
      ${whereClause}
      ORDER BY va.assigned_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const assignments = await sql(query, params) as Assignment[];

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM volunteer_assignments va
      JOIN volunteer_registrations vr ON va.volunteer_id = vr.id
      JOIN jobs j ON va.job_id = j.id
      ${whereClause}
    `;

    const countResult = await sql(countQuery, params) as any[];
    const total = parseInt(countResult[0]?.total || '0');

    console.log(`Volunteer Assignments API: Returning ${assignments.length} assignments out of ${total} total`);

    return NextResponse.json({
      assignments: assignments.map(assignment => ({
        id: assignment.id,
        volunteer: {
          id: assignment.volunteer_id,
          username: assignment.volunteer_username,
          name: `${assignment.volunteer_first_name} ${assignment.volunteer_last_name}`,
          email: assignment.volunteer_email,
          phone: assignment.volunteer_phone
        },
        job: {
          id: assignment.job_id,
          title: assignment.job_title,
          category: assignment.job_category,
          location: `${assignment.job_city}, ${assignment.job_state}`,
          start_date: assignment.job_start_date,
          end_date: assignment.job_end_date
        },
        status: assignment.status,
        assigned_at: assignment.assigned_at,
        confirmed_at: assignment.confirmed_at,
        completion_notes: assignment.completion_notes,
        rating: assignment.rating,
        feedback: assignment.feedback,
        hours_logged: assignment.hours_logged,
        notes: assignment.notes,
        applied_at: assignment.applied_at,
        assigned_by: assignment.assigned_by_username,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at
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

// PUT - Update assignment status/hours
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as AssignmentUpdate;
    
    console.log(`Volunteer Assignments API: Updating assignment ${assignmentId}`);

    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (body.status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      params.push(body.status);
      
      // If marking as confirmed, set confirmed_at
      if (body.status === 'confirmed') {
        paramCount++;
        updateFields.push(`confirmed_at = $${paramCount}`);
        params.push(new Date().toISOString());
      }
    }

    if (body.completion_notes) {
      paramCount++;
      updateFields.push(`completion_notes = $${paramCount}`);
      params.push(body.completion_notes);
    }

    if (body.rating) {
      paramCount++;
      updateFields.push(`rating = $${paramCount}`);
      params.push(body.rating);
    }

    if (body.feedback) {
      paramCount++;
      updateFields.push(`feedback = $${paramCount}`);
      params.push(body.feedback);
    }

    if (body.hours_logged !== undefined) {
      paramCount++;
      updateFields.push(`hours_logged = $${paramCount}`);
      params.push(body.hours_logged);
    }

    if (body.notes) {
      paramCount++;
      updateFields.push(`notes = $${paramCount}`);
      params.push(body.notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Add updated_at and assignment ID
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    params.push(new Date().toISOString());

    paramCount++;
    const updateQuery = `
      UPDATE volunteer_assignments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, volunteer_id, job_id, status, updated_at
    `;
    params.push(parseInt(assignmentId));

    const result = await sql(updateQuery, params) as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Log the status change
    if (body.status) {
      try {
        await sql`
          INSERT INTO activity_logs (
            user_type, user_id, action, details, timestamp
          ) VALUES (
            'volunteer', ${result[0].volunteer_id}, 'assignment_status_changed',
            ${JSON.stringify({
              assignment_id: result[0].id,
              job_id: result[0].job_id,
              new_status: body.status,
              hours_logged: body.hours_logged
            })}, CURRENT_TIMESTAMP
          )
        `;
      } catch (logError) {
        console.warn('Failed to log status change:', logError);
      }
    }

    console.log(`Volunteer Assignments API: Successfully updated assignment ${assignmentId}`);

    return NextResponse.json({
      success: true,
      assignment: result[0],
      message: 'Assignment updated successfully'
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
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get('id');
    
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    console.log(`Volunteer Assignments API: Deleting assignment ${assignmentId}`);

    const result = await sql`
      DELETE FROM volunteer_assignments 
      WHERE id = ${parseInt(assignmentId)}
      RETURNING id, volunteer_id, job_id
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Log the deletion
    try {
      await sql`
        INSERT INTO activity_logs (
          user_type, user_id, action, details, timestamp
        ) VALUES (
          'volunteer', ${result[0].volunteer_id}, 'assignment_deleted',
          ${JSON.stringify({
            assignment_id: result[0].id,
            job_id: result[0].job_id
          })}, CURRENT_TIMESTAMP
        )
      `;
    } catch (logError) {
      console.warn('Failed to log assignment deletion:', logError);
    }

    console.log(`Volunteer Assignments API: Successfully deleted assignment ${assignmentId}`);

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
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