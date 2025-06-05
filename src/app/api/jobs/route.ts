// src/app/api/jobs/route.ts
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

// Helper function to get coordinates for zipcode
async function getZipcodeCoordinates(zipcode: string) {
  try {
    const result = await sql`
      SELECT latitude, longitude, city, state 
      FROM zipcode_coordinates 
      WHERE zipcode = ${zipcode}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching zipcode coordinates:', error);
    return null;
  }
}

// GET - List jobs with filtering and distance search
export async function GET(request: NextRequest) {
  try {
    console.log('Jobs API: Starting GET request...');
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Extract query parameters
    const category = searchParams.get('category');
    const zipcode = searchParams.get('zipcode');
    const distance = searchParams.get('distance'); // 5, 10, 25, 50, or 'all'
    const skills = searchParams.get('skills')?.split(',').filter(Boolean);
    const timeCommitment = searchParams.get('time_commitment');
    const urgency = searchParams.get('urgency');
    const remoteOk = searchParams.get('remote') === 'true';
    const backgroundCheck = searchParams.get('background_check');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Jobs API: Search parameters:', {
      category, zipcode, distance, skills, timeCommitment, urgency, remoteOk, backgroundCheck
    });

    let baseQuery = `
      SELECT 
        j.*,
        zc.city as zip_city,
        zc.state as zip_state,
        COALESCE(j.latitude, zc.latitude) as computed_latitude,
        COALESCE(j.longitude, zc.longitude) as computed_longitude,
        (
          SELECT COUNT(*) 
          FROM job_applications ja 
          WHERE ja.job_id = j.id AND ja.status = 'accepted'
        ) as filled_positions,
        (j.volunteers_needed - COALESCE(
          (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted'), 
          0
        )) as positions_remaining
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      WHERE j.status = 'active' 
        AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
    `;

    const queryParams: any[] = [];
    let paramCount = 0;

    // Add filters
    if (category) {
      paramCount++;
      baseQuery += ` AND j.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (skills && skills.length > 0) {
      paramCount++;
      baseQuery += ` AND j.skills_needed && $${paramCount}`;
      queryParams.push(skills);
    }

    if (timeCommitment) {
      paramCount++;
      baseQuery += ` AND j.time_commitment = $${paramCount}`;
      queryParams.push(timeCommitment);
    }

    if (urgency) {
      paramCount++;
      baseQuery += ` AND j.urgency = $${paramCount}`;
      queryParams.push(urgency);
    }

    if (remoteOk) {
      baseQuery += ` AND j.remote_possible = true`;
    }

    if (backgroundCheck === 'required') {
      baseQuery += ` AND j.background_check_required = true`;
    } else if (backgroundCheck === 'not_required') {
      baseQuery += ` AND j.background_check_required = false`;
    }

    // Distance filtering
    if (zipcode && distance && distance !== 'all') {
      const userCoords = await getZipcodeCoordinates(zipcode);
      
      if (userCoords) {
        const maxDistance = parseInt(distance);
        paramCount += 2;
        
        baseQuery += `
          AND (
            j.remote_possible = true OR
            calculate_distance_miles(
              $${paramCount - 1}, $${paramCount}, 
              COALESCE(j.latitude, zc.latitude), 
              COALESCE(j.longitude, zc.longitude)
            ) <= ${maxDistance}
          )
        `;
        
        queryParams.push(userCoords.latitude, userCoords.longitude);
      }
    }

    // Add distance calculation for sorting if zipcode provided
    if (zipcode) {
      const userCoords = await getZipcodeCoordinates(zipcode);
      
      if (userCoords) {
        baseQuery = baseQuery.replace(
          'positions_remaining',
          `positions_remaining,
           calculate_distance_miles(
             ${userCoords.latitude}, ${userCoords.longitude}, 
             COALESCE(j.latitude, zc.latitude), 
             COALESCE(j.longitude, zc.longitude)
           ) as distance_miles`
        );
      }
    }

    // Add ordering and pagination
    baseQuery += zipcode 
      ? ` ORDER BY j.urgency DESC, distance_miles ASC, j.created_at DESC`
      : ` ORDER BY j.urgency DESC, j.created_at DESC`;
    
    paramCount += 2;
    baseQuery += ` LIMIT $${paramCount - 1} OFFSET $${paramCount}`;
    queryParams.push(limit, offset);

    console.log('Jobs API: Executing query...');
    const jobs = await sql(baseQuery, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      WHERE j.status = 'active' 
        AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
    `;

    // Apply same filters to count query (simplified)
    const countParams: any[] = [];
    let countParamIndex = 0;

    if (category) {
      countParamIndex++;
      countQuery += ` AND j.category = $${countParamIndex}`;
      countParams.push(category);
    }

    if (skills && skills.length > 0) {
      countParamIndex++;
      countQuery += ` AND j.skills_needed && $${countParamIndex}`;
      countParams.push(skills);
    }

    if (timeCommitment) {
      countParamIndex++;
      countQuery += ` AND j.time_commitment = $${countParamIndex}`;
      countParams.push(timeCommitment);
    }

    if (urgency) {
      countParamIndex++;
      countQuery += ` AND j.urgency = $${countParamIndex}`;
      countParams.push(urgency);
    }

    if (remoteOk) {
      countQuery += ` AND j.remote_possible = true`;
    }

    if (backgroundCheck === 'required') {
      countQuery += ` AND j.background_check_required = true`;
    } else if (backgroundCheck === 'not_required') {
      countQuery += ` AND j.background_check_required = false`;
    }

    const totalResult = await sql(countQuery, countParams);
    const total = parseInt(totalResult[0]?.total || '0');

    console.log(`Jobs API: Found ${jobs.length} jobs (${total} total)`);

    return NextResponse.json({
      jobs: jobs.map(job => ({
        ...job,
        distance_miles: job.distance_miles ? parseFloat(job.distance_miles) : null,
        filled_positions: parseInt(job.filled_positions || '0'),
        positions_remaining: parseInt(job.positions_remaining || job.volunteers_needed || '0')
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        category,
        zipcode,
        distance,
        skills,
        timeCommitment,
        urgency,
        remoteOk,
        backgroundCheck
      }
    });

  } catch (error) {
    console.error('Jobs API: Error fetching jobs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new job listing
export async function POST(request: NextRequest) {
  try {
    console.log('Jobs API: Starting POST request...');
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Jobs API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      organization,
      contact_name,
      contact_email,
      contact_phone,
      address,
      city,
      state,
      zipcode,
      category,
      skills_needed,
      time_commitment,
      duration_hours,
      volunteers_needed,
      age_requirement,
      background_check_required,
      training_provided,
      start_date,
      end_date,
      flexible_schedule,
      preferred_times,
      urgency,
      remote_possible,
      transportation_provided,
      meal_provided,
      stipend_amount,
      expires_at
    } = body;

    console.log('Jobs API: Creating job with data:', { title, organization, zipcode, category });

    // Validate required fields
    if (!title || !description || !organization || !contact_name || !contact_email || !zipcode) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, organization, contact_name, contact_email, zipcode' },
        { status: 400 }
      );
    }

    // Get coordinates for zipcode
    const coords = await getZipcodeCoordinates(zipcode);
    
    if (!coords && !remote_possible) {
      return NextResponse.json(
        { error: 'Invalid zipcode. Please enter a valid US zipcode or mark the position as remote.' },
        { status: 400 }
      );
    }

    // Insert the job
    const result = await sql`
      INSERT INTO jobs (
        title, description, organization, contact_name, contact_email, contact_phone,
        address, city, state, zipcode, latitude, longitude,
        category, skills_needed, time_commitment, duration_hours, volunteers_needed,
        age_requirement, background_check_required, training_provided,
        start_date, end_date, flexible_schedule, preferred_times,
        urgency, remote_possible, transportation_provided, meal_provided, stipend_amount,
        expires_at, posted_by
      ) VALUES (
        ${title}, ${description}, ${organization}, ${contact_name}, ${contact_email}, ${contact_phone || null},
        ${address || null}, ${city || coords?.city || null}, ${state || coords?.state || null}, 
        ${zipcode}, ${coords?.latitude || null}, ${coords?.longitude || null},
        ${category || null}, ${skills_needed || []}, ${time_commitment || 'Flexible'}, 
        ${duration_hours || null}, ${volunteers_needed || 1},
        ${age_requirement || 'All ages'}, ${background_check_required || false}, ${training_provided || false},
        ${start_date || null}, ${end_date || null}, ${flexible_schedule !== false}, ${preferred_times || null},
        ${urgency || 'normal'}, ${remote_possible || false}, ${transportation_provided || false}, 
        ${meal_provided || false}, ${stipend_amount || null},
        ${expires_at || null}, ${currentUser.id}
      )
      RETURNING id, created_at
    `;

    console.log(`Jobs API: Successfully created job with ID: ${result[0].id}`);

    return NextResponse.json({
      success: true,
      id: result[0].id,
      created_at: result[0].created_at,
      message: 'Job listing created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Jobs API: Error creating job:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'A similar job listing already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('invalid input syntax')) {
        return NextResponse.json(
          { error: 'Invalid data format provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create job listing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}