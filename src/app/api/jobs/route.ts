import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

/**
 * Centralised DB client is imported from src/lib/database.ts so we reuse the
 * same Neon connection pool across every request and avoid the “too many
 * connections” problem on Vercel.
 */

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

/*************************************
 * Helper – is the requester authenticated?
 *************************************/
async function checkAuth(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) return null;

    const userRows = await sql<{
      id: number;
      username: string;
      email: string;
      role: string;
    }[]>`
      SELECT u.id, u.username, u.email, u.role
      FROM sessions       AS s
      JOIN users          AS u ON u.id = s.user_id
      WHERE s.id = ${sessionId}
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true;
    `;

    return userRows.length ? userRows[0] : null;
  } catch (err) {
    console.error('checkAuth error:', err);
    return null;
  }
}

/*************************************
 * GET /api/jobs – list jobs with rich filtering & pagination
 *************************************/
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query‑string params with fallbacks
    const category = searchParams.get('category');
    const zipcode  = searchParams.get('zipcode');
    const distance = Number(searchParams.get('distance') ?? '25');
    const skills   = searchParams.get('skills');
    const search   = searchParams.get('search');
    const page     = Math.max(1, Number(searchParams.get('page')  ?? '1'));
    const limit    = Math.max(1, Number(searchParams.get('limit') ?? '20'));
    const offset   = (page - 1) * limit;

    /***** Dynamic query builder helpers *****/
    const params: any[] = [];
    const where: string[] = [
      "j.status = 'active'",
      'j.expires_at > CURRENT_TIMESTAMP',
    ];
    const add = (val: any) => `$${(params.push(val), params.length)}`; // push + return $index

    /***** SELECT clause *****/
    let select = `SELECT 
      j.*,
      zc.city  AS zip_city,
      zc.state AS zip_state,
      zc.latitude  AS zip_latitude,
      zc.longitude AS zip_longitude,
      COALESCE(j.latitude,  zc.latitude)  AS computed_latitude,
      COALESCE(j.longitude, zc.longitude) AS computed_longitude,
      u.username AS posted_by_username,
      (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') AS filled_positions,
      (j.volunteers_needed - COALESCE((SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted'), 0)) AS positions_remaining`;

    /***** Optional distance calculation *****/
    if (zipcode) {
      const userZcParam = add(zipcode);
      select += `,
        calculate_distance_miles(
          COALESCE(j.latitude, zc.latitude),
          COALESCE(j.longitude, zc.longitude),
          user_zc.latitude,
          user_zc.longitude
        ) AS distance_miles`;
    }

    /***** FROM & JOINs *****/
    let from = `FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      LEFT JOIN users u               ON j.posted_by = u.id`;

    if (zipcode) {
      // user_zc join uses the very first param we already pushed (the zipcode)
      from += `
      LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = $1`;
    }

    /***** WHERE filters *****/
    if (category && category !== 'all') {
      where.push(`j.category = ${add(category)}`);
    }

    if (skills) {
      where.push(`j.skills_needed ILIKE ${add(`%${skills}%`)}`);
    }

    if (search) {
      const titleParam = add(`%${search}%`);
      const descParam  = add(`%${search}%`);
      where.push(`(j.title ILIKE ${titleParam} OR j.description ILIKE ${descParam})`);
    }

    if (zipcode && distance) {
      where.push(`calculate_distance_miles(
        COALESCE(j.latitude, zc.latitude),
        COALESCE(j.longitude, zc.longitude),
        user_zc.latitude,
        user_zc.longitude
      ) <= ${distance}`);
    }

    const whereSQL  = `WHERE ${where.join(' AND ')}`;
    const orderBy   = zipcode ? 'ORDER BY distance_miles ASC, j.urgency DESC, j.created_at DESC'
                              : 'ORDER BY j.urgency DESC, j.created_at DESC';
    const paginate  = `LIMIT ${limit} OFFSET ${offset}`;

    const listQuery = `${select}
      ${from}
      ${whereSQL}
      ${orderBy}
      ${paginate};`;

    const jobs = await sql<Job[]>(listQuery, params);

    /***** Total‑count query for pagination *****/
    const countParams: any[] = [];
    const countWhere: string[] = [
      "j.status = 'active'",
      'j.expires_at > CURRENT_TIMESTAMP',
    ];
    const addCount = (val: any) => `$${(countParams.push(val), countParams.length)}`;

    let countFrom = `FROM jobs j LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode`;

    if (zipcode) {
      countFrom += ` LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = ${addCount(zipcode)}`;
    }

    if (category && category !== 'all') countWhere.push(`j.category = ${addCount(category)}`);
    if (skills) countWhere.push(`j.skills_needed ILIKE ${addCount(`%${skills}%`)}`);
    if (search) {
      const t = addCount(`%${search}%`);
      const d = addCount(`%${search}%`);
      countWhere.push(`(j.title ILIKE ${t} OR j.description ILIKE ${d})`);
    }
    if (zipcode && distance) {
      countWhere.push(`calculate_distance_miles(
        COALESCE(j.latitude, zc.latitude),
        COALESCE(j.longitude, zc.longitude),
        user_zc.latitude,
        user_zc.longitude
      ) <= ${distance}`);
    }

    const countQuery = `SELECT COUNT(*) AS total ${countFrom} WHERE ${countWhere.join(' AND ')};`;
    const [{ total }] = await sql<{ total: string }[]>(countQuery, countParams);
    const totalInt = Number(total);

    /***** Shape the response *****/
    return NextResponse.json({
      jobs: jobs.map((job) => ({
        ...job,
        computed_latitude:  job.computed_latitude  ? Number(job.computed_latitude)  : null,
        computed_longitude: job.computed_longitude ? Number(job.computed_longitude) : null,
        distance_miles:     (job as any).distance_miles ? Number((job as any).distance_miles) : null,
        filled_positions:   Number(job.filled_positions ?? 0),
        positions_remaining: Number(job.positions_remaining ?? job.volunteers_needed ?? 0),
      })),
      pagination: {
        page,
        limit,
        total: totalInt,
        totalPages: Math.ceil(totalInt / limit),
        hasNext: page * limit < totalInt,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('GET /api/jobs error →', err);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/*************************************
 * POST /api/jobs – create a new job
 *************************************/
export async function POST(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const required = ['title', 'description', 'category', 'contact_email', 'zipcode', 'volunteers_needed'];
    const missing  = required.filter((f) => !body[f]);
    if (missing.length) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const [inserted] = await sql<{
      id: number;
      title: string;
      created_at: string;
    }[]>`
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
        ${body.contact_name ?? ''}, ${body.contact_email}, ${body.contact_phone ?? ''},
        ${body.address ?? ''}, ${body.city ?? ''}, ${body.state ?? ''}, ${body.zipcode},
        ${body.latitude ?? null}, ${body.longitude ?? null}, ${body.skills_needed ?? ''},
        ${body.time_commitment ?? ''}, ${body.duration_hours ?? null}, ${body.volunteers_needed},
        ${body.age_requirement ?? ''}, ${body.background_check_required ?? false},
        ${body.training_provided ?? false}, ${body.start_date ?? null}, ${body.end_date ?? null},
        ${body.flexible_schedule ?? false}, ${body.preferred_times ?? ''},
        ${body.urgency ?? 'medium'}, ${body.remote_possible ?? false},
        ${body.transportation_provided ?? false}, ${body.meal_provided ?? false},
        ${body.stipend_amount ?? null}, ${currentUser.id},
        ${body.expires_at ?? sql`CURRENT_TIMESTAMP + INTERVAL '30 days'`}, 'active'
      ) RETURNING id, title, created_at;
    `;

    return NextResponse.json({ success: true, job: inserted, message: 'Job posted successfully' }, { status: 201 });
  } catch (err) {
    console.error('POST /api/jobs error →', err);
    return NextResponse.json(
      { error: 'Failed to create job', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
