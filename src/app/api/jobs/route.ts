/* --------------------------------------------------------------------------
   src/app/api/jobs/route.ts
   Volunteer‑Management – Jobs API (Next.js 14 App Router, server‑only)
-------------------------------------------------------------------------- */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';        // singleton Neon client

/* ──────────────────────────────── Types ──────────────────────────────── */

interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  city: string;
  state: string;
  zipcode: string;
  latitude: string | null;
  longitude: string | null;
  volunteers_needed: number;
  /* dynamic columns */
  computed_latitude?: string | null;
  computed_longitude?: string | null;
  distance_miles?: string | null;
  filled_positions?: string | null;
  positions_remaining?: string | null;
  [key: string]: any;
}

/* ─────────────────── Helper: authenticate via “session” cookie ─────────────────── */

async function checkAuth(request: NextRequest): Promise<SessionUser | null> {
  const sessionId = request.cookies.get('session')?.value;
  if (!sessionId) return null;

  // *** CHANGE 1: removed generic here ***
  const rows = await sql/* sql */`
    SELECT u.id, u.username, u.email, u.role
    FROM sessions  s
    JOIN users     u ON u.id = s.user_id
    WHERE s.id          = ${sessionId}
      AND s.expires_at  > CURRENT_TIMESTAMP
      AND u.is_active   = true
  ` as SessionUser[];                      // *** CHANGE 2: cast result ***

  return rows.length ? rows[0] : null;
}

/* ─────────────────────────────── GET /api/jobs ─────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category  = searchParams.get('category');
    const zipcode   = searchParams.get('zipcode');
    const distance  = Number(searchParams.get('distance') ?? '25');
    const skills    = searchParams.get('skills');
    const search    = searchParams.get('search');

    const page      = Number(searchParams.get('page')   ?? '1');
    const limit     = Number(searchParams.get('limit')  ?? '20');
    const offset    = (page - 1) * limit;

    /* ----- Build dynamic SQL ----- */

    const params: any[] = [];
    let   param = 0;
    const where: string[] = [`j.status = 'active'`, `j.expires_at > CURRENT_TIMESTAMP`];

    if (category && category !== 'all') {
      params.push(category);  where.push(`j.category = $${++param}`);
    }

    if (skills) {
      params.push(`%${skills}%`);  where.push(`j.skills_needed ILIKE $${++param}`);
    }

    if (search) {
      params.push(`%${search}%`);
      where.push(`(j.title ILIKE $${++param} OR j.description ILIKE $${param})`);
    }

    const joinUserZip = zipcode
      ? `LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = $1`
      : '';

    if (zipcode) {
      params.unshift(zipcode);
      ++param;
    }

    const distanceSelect = zipcode
      ? `, calculate_distance_miles(
            COALESCE(j.latitude, zc.latitude),
            COALESCE(j.longitude, zc.longitude),
            user_zc.latitude,
            user_zc.longitude
        ) AS distance_miles`
      : '';

    const distanceFilter = zipcode
      ? `AND calculate_distance_miles(
            COALESCE(j.latitude, zc.latitude),
            COALESCE(j.longitude, zc.longitude),
            user_zc.latitude,
            user_zc.longitude
        ) <= ${distance}`
      : '';

    const baseQuery = `
      SELECT
        j.*,
        zc.city  AS zip_city,
        zc.state AS zip_state,
        zc.latitude  AS zip_latitude,
        zc.longitude AS zip_longitude,
        COALESCE(j.latitude,  zc.latitude)  AS computed_latitude,
        COALESCE(j.longitude, zc.longitude) AS computed_longitude,
        u.username AS posted_by_username,
        (SELECT COUNT(*) FROM job_applications ja
          WHERE ja.job_id = j.id AND ja.status = 'accepted')        AS filled_positions,
        (j.volunteers_needed -
          COALESCE((SELECT COUNT(*) FROM job_applications ja
                     WHERE ja.job_id = j.id AND ja.status = 'accepted'), 0)
        ) AS positions_remaining
        ${distanceSelect}
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON zc.zipcode = j.zipcode
      LEFT JOIN users u               ON u.id        = j.posted_by
      ${joinUserZip}
      WHERE ${where.join(' AND ')}
      ${distanceFilter}
      ORDER BY
        ${zipcode ? 'distance_miles ASC,' : ''}
        j.urgency DESC,
        j.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const jobs = await sql<Job[]>(baseQuery, params);

    /* ----- total-count query ----- */

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON zc.zipcode = j.zipcode
      ${joinUserZip}
      WHERE ${where.join(' AND ')}
      ${distanceFilter};
    `;

    const [{ total }] = await sql<{ total: string }[]>(countQuery, params);
    const totalInt = Number(total);

    return NextResponse.json({
      jobs: jobs.map(j => ({
        ...j,
        computed_latitude : j.computed_latitude  ? Number(j.computed_latitude)  : null,
        computed_longitude: j.computed_longitude ? Number(j.computed_longitude) : null,
        distance_miles    : j.distance_miles     ? Number(j.distance_miles)     : null,
        filled_positions  : Number(j.filled_positions  ?? 0),
        positions_remaining: Number(j.positions_remaining ?? j.volunteers_needed ?? 0)
      })),
      pagination: {
        page,
        limit,
        total : totalInt,
        totalPages: Math.ceil(totalInt / limit),
        hasNext : page * limit < totalInt,
        hasPrev : page > 1
      }
    });
  } catch (err) {
    console.error('Jobs API GET error →', err);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────── POST /api/jobs ─────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const currentUser = await checkAuth(request);
    if (!currentUser)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const required = ['title', 'description', 'category', 'contact_email', 'zipcode', 'volunteers_needed'];
    const missing  = required.filter(k => !body[k]);

    if (missing.length)
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 }
      );

    const [{ id, title, created_at }] = await sql<{ id: number; title: string; created_at: Date }[]>`
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
      )
      RETURNING id, title, created_at;
    `;

    return NextResponse.json(
      { success: true, job: { id, title, created_at }, message: 'Job posted successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('Jobs API POST error →', err);
    return NextResponse.json(
      { error: 'Failed to create job', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
