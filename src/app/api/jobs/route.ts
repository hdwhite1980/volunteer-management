// src/app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  city: string;
  state: string;
  zipcode: string;
  [key: string]: any;
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

// GET - List jobs with filtering
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const zipcode = url.searchParams.get('zipcode');
    const distance = parseInt(url.searchParams.get('distance') || '25');
    const skills = url.searchParams.get('skills');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Jobs API: Fetching jobs with filters:', { category, zipcode, distance, skills, search, page });

    // Base query for active jobs with location data
    let query = `
      SELECT 
        j.*,
        zc.city as zip_city,
        zc.state as zip_state,
        zc.latitude as zip_latitude,
        zc.longitude as zip_longitude,
        COALESCE(j.latitude, zc.latitude) as computed_latitude,
        COALESCE(j.longitude, zc.longitude) as computed_longitude,
        u.username as posted_by_username,
        (
          SELECT COUNT(*) 
          FROM job_applications ja 
          WHERE ja.job_id = j.id AND ja.status = 'accepted'
        ) as filled_positions,
        (j.volunteers_needed - COALESCE(
          (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted'), 
          0
        )) as positions_remaining
    `;

    // Add distance calculation if zipcode is provided
    if (zipcode) {
      query += `,
        calculate_distance_miles(
          COALESCE(j.latitude, zc.latitude),
          COALESCE(j.longitude, zc.longitude),
          user_zc.latitude,
          user_zc.longitude
        ) as distance_miles
      `;
    }

    query += `
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      LEFT JOIN users u ON j.posted_by = u.id
    `;

    // Add user zipcode join for distance calculation
    if (zipcode) {
      query += `
        LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = $${zipcode ? 1 : 0}
      `;
    }

    query += ` WHERE j.status = 'active' AND j.expires_at > CURRENT_TIMESTAMP`;

    const params: any[] = [];
    let paramCount = zipcode ? 1 : 0;

    if (zipcode) {
      params.push(zipcode);
    }

    // Add filters
    if (category && category !== 'all') {
      paramCount++;
      query += ` AND j.category = $${paramCount}`;
      params.push(category);
    }

    if (skills) {
      paramCount++;
      query += ` AND j.skills_needed ILIKE $${paramCount}`;
      params.push(`%${skills}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (j.title ILIKE $${paramCount} OR j.description ILIKE $${paramCount + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount++;
    }

    // Add distance filter
    if (zipcode && distance) {
      query += ` AND calculate_distance_miles(
        COALESCE(j.latitude, zc.latitude),
        COALESCE(j.longitude, zc.longitude),
        user_zc.latitude,
        user_zc.longitude
      ) <= ${distance}`;
    }

    // Add ordering and pagination
    if (zipcode) {
      query += ` ORDER BY distance_miles ASC, j.urgency DESC, j.created_at DESC`;
    } else {
      query += ` ORDER BY j.urgency DESC, j.created_at DESC`;
    }

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log('Jobs API: Executing query with params:', params);

    const jobs = await sql(query, params) as Job[];

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
    `;

    if (zipcode) {
      countQuery += `
        LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = $1
      `;
    }

    countQuery += ` WHERE j.status = 'active' AND j.expires_at > CURRENT_TIMESTAMP`;

    let countParams: any[] = [];
    let countParamCount = 0;

    if (zipcode) {
      countParams.push(zipcode);
      countParamCount = 1;
    }

    if (category && category !== 'all') {
      countParamCount++;
      countQuery += ` AND j.category = $${countParamCount}`;
      countParams.push(category);
    }

    if (skills) {
      countParamCount++;
      countQuery += ` AND j.skills_needed ILIKE $${countParamCount}`;
      countParams.push(`%${skills}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (j.title ILIKE $${countParamCount} OR j.description ILIKE $${countParamCount + 1})`;
      countParams.push(`%${search}%`, `%${search}%`);
      countParamCount++;
    }

    if (zipcode && distance) {
      countQuery += ` AND calculate_distance_miles(
        COALESCE(j.latitude, zc.latitude),
        COALESCE(j.longitude, zc.longitude),
        user_zc.latitude,
        user_zc.longitude
      ) <= ${distance}`;
    }

    const countResult = await sql(countQuery, countParams) as any[];
    const total = parseInt(countResult[0]?.total || '0');

    console.log(`Jobs API: Returning ${jobs.length} jobs out of ${total} total`);

    return NextResponse.json({
      jobs: jobs.map(job => ({
        ...job,
        computed_latitude: job.computed_latitude ? parseFloat(job.computed_latitude) : null,
        computed_longitude: job.computed_longitude ? parseFloat(job.computed_longitude) : null,
        distance_miles: job.distance_miles ? parseFloat(job.distance_miles) : null,
        filled_positions: parseInt(job.filled_positions || '0'),
        positions_remaining: parseInt(job.positions_remaining || job.volunteers_needed || '0')
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

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Jobs API: User ${currentUser.username} creating new job`);

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'contact_email', 'zipcode', 'volunteers_needed'];
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create job record
    const result = await sql`
      INSERT INTO jobs (
        title, description, category, contact_name, contact_email, contact_phone,
        address, city, state, zipcode, latitude, longitude, skills_needed,
        time_commitment, duration_hours, volunteers_needed, age_requirement,
        background_check_required, training_provided, start_date, end_date,
        flexible_schedule, preferred_times, urgency, remote_possible,
        transportation_provided, meal_provided, stipend_amount, posted_by,
        expires_at, status
      ) VALUES (
        ${body.title}, ${body.description}, ${body.category}, 
        ${body.contact_name || ''}, ${body.contact_email}, ${body.contact_phone || ''},
        ${body.address || ''}, ${body.city || ''}, ${body.state || ''}, ${body.zipcode},
        ${body.latitude || null}, ${body.longitude || null}, ${body.skills_needed || ''},
        ${body.time_commitment || ''}, ${body.duration_hours || null}, ${body.volunteers_needed},
        ${body.age_requirement || ''}, ${body.background_check_required || false},
        ${body.training_provided || false}, ${body.start_date || null}, ${body.end_date || null},
        ${body.flexible_schedule || false}, ${body.preferred_times || ''},
        ${body.urgency || 'medium'}, ${body.remote_possible || false},
        ${body.transportation_provided || false}, ${body.meal_provided || false},
        ${body.stipend_amount || null}, ${currentUser.id},
        ${body.expires_at || sql`CURRENT_TIMESTAMP + INTERVAL '30 days'`}, 'active'
      )
      RETURNING id, title, created_at
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    console.log(`Jobs API: Successfully created job ${result[0].id}`);

    return NextResponse.json({
      success: true,
      job: result[0],
      message: 'Job posted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Jobs API: Error creating job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}