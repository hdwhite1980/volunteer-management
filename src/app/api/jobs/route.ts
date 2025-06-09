/* --------------------------------------------------------------------------
   src/app/api/jobs/route.ts  – UPDATED with skills_needed normalization
-------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

/* ───────────────── Types ───────────────── */
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
  skills_needed: string[] | string | null;  // <- raw shape from DB
  computed_latitude?: string | null;
  computed_longitude?: string | null;
  distance_miles?: string | null;
  filled_positions?: string | null;
  positions_remaining?: string | null;
  [key: string]: any;
}

/* ───────── helpers ───────── */
/**
 * Ensure skills_needed is always a string[] when returned to the client.
 * Handles TEXT[], postgres array literal "{A,B}", comma‑separated string,
 * null / undefined.
 */
const normalizeSkills = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw; // TEXT[] already parsed by driver
  if (raw == null) return [];

  if (typeof raw === 'string') {
    // strip braces if an array literal then split on commas
    return raw
      .replace(/^\{|\}$/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

/* ───────── Auth helper ───────── */
async function checkAuth(req: NextRequest): Promise<SessionUser | null> {
  const sid = req.cookies.get('session')?.value;
  if (!sid) return null;

  const rows = (await sql<SessionUser[]>`
    SELECT u.id, u.username, u.email, u.role
    FROM sessions s
    JOIN users    u ON u.id = s.user_id
    WHERE s.id = ${sid}
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.is_active = true
  `);

  return rows[0] ?? null;
}

/* ───────── GET /api/jobs ───────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const zipcode  = searchParams.get('zipcode');
    const distance = Number(searchParams.get('distance') ?? '25');
    const skills   = searchParams.get('skills');
    const search   = searchParams.get('search');
    const page     = Number(searchParams.get('page')  ?? '1');
    const limit    = Number(searchParams.get('limit') ?? '20');
    const offset   = (page - 1) * limit;

    const params: any[] = [];
    let   p = 0;
    const where: string[] = [
      `j.status = 'active'`,
      `j.expires_at > CURRENT_TIMESTAMP`
    ];

    if (category && category !== 'all') {
      params.push(category);
      where.push(`j.category = $${++p}`);
    }
    if (skills) {
      params.push(`%${skills}%`);
      where.push(`j.skills_needed::text ILIKE $${++p}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(j.title ILIKE $${++p} OR j.description ILIKE $${p})`);
    }

    const userZipJoin = zipcode ? `LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = $1` : '';
    if (zipcode) {
      params.unshift(zipcode);
      ++p;
    }

    const distSel = zipcode ? `,
      calculate_distance_miles(
        COALESCE(j.latitude, zc.latitude), COALESCE(j.longitude, zc.longitude),
        user_zc.latitude, user_zc.longitude
      ) AS distance_miles` : '';

    const distWhere = zipcode ? `AND calculate_distance_miles(
        COALESCE(j.latitude, zc.latitude), COALESCE(j.longitude, zc.longitude),
        user_zc.latitude, user_zc.longitude
      ) <= ${distance}` : '';

    const baseQuery = `
      SELECT j.*, zc.city AS zip_city, zc.state AS zip_state,
             zc.latitude AS zip_latitude, zc.longitude AS zip_longitude,
             COALESCE(j.latitude, zc.latitude)  AS computed_latitude,
             COALESCE(j.longitude, zc.longitude) AS computed_longitude,
             u.username AS posted_by_username,
             (SELECT COUNT(*) FROM job_applications ja
                WHERE ja.job_id = j.id AND ja.status = 'accepted') AS filled_positions,
             (j.volunteers_needed -
              COALESCE((SELECT COUNT(*) FROM job_applications ja
                         WHERE ja.job_id = j.id AND ja.status = 'accepted'),0)
             ) AS positions_remaining
             ${distSel}
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON zc.zipcode = j.zipcode
      LEFT JOIN users u ON u.id = j.posted_by
      ${userZipJoin}
      WHERE ${where.join(' AND ')}
      ${distWhere}
      ORDER BY ${zipcode ? 'distance_miles ASC,' : ''} j.urgency DESC, j.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const jobs = await sql<Job[]>(baseQuery, params);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON zc.zipcode = j.zipcode
      ${userZipJoin}
      WHERE ${where.join(' AND ')}
      ${distWhere};
    `;
    const [{ total }] = await sql<{ total: string }[]>(countQuery, params);
    const totalNum = Number(total);

    return NextResponse.json({
      jobs: jobs.map(j => ({
        ...j,
        skills_needed: normalizeSkills(j.skills_needed),
        computed_latitude : j.computed_latitude  ? Number(j.computed_latitude)  : null,
        computed_longitude: j.computed_longitude ? Number(j.computed_longitude) : null,
        distance_miles    : j.distance_miles     ? Number(j.distance_miles)     : null,
        filled_positions  : Number(j.filled_positions  ?? 0),
        positions_remaining: Number(j.positions_remaining ?? j.volunteers_needed ?? 0)
      })),
      pagination: {
        page, limit, total: totalNum,
        totalPages: Math.ceil(totalNum / limit),
        hasNext: page * limit < totalNum,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Jobs GET error →', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/* ───────── POST /api/jobs ───────── */
export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth(req);
    if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

    const body = await req.json();
    const reqd = ['title','description','category','contact_email','zipcode','volunteers_needed'];
    const miss = reqd.filter(k => !body[k]);
    if (miss.length) return NextResponse.json({ error: `Missing: ${miss.join(', ')}` }, { status: 400 });

    // ensure we store an ARRAY in Postgres
    const skillsArray = Array.isArray(body.skills_needed)
      ? body.skills_needed
      : typeof body.skills_needed === 'string' && body.skills_needed.length
        ? body.skills_needed.split(',').map((s:string)=>s.trim())
        : [];

    const insert = await sql<{
      id: number; title: string; created_at: Date
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
        ${body.latitude ?? null}, ${body.longitude ?? null}, ${skillsArray},
        ${body.time_commitment ?? ''}, ${body.duration_hours ?? null}, ${body.volunteers_needed},
        ${body.age_requirement ?? ''}, ${body.background_check_required ?? false},
        ${body.training_provided ?? false}, ${body.start_date ?? null}, ${body.end_date ?? null},
        ${body.flexible_schedule ?? false}, ${body.preferred_times ?? ''},
        ${body.urgency ?? 'medium'}, ${body.remote_possible ?? false},
        ${body.transportation_provided ?? false}, ${body.meal_provided ?? false},
        ${body.stipend_amount ?? null}, ${user.id},
        ${body.expires_at ?? sql`CURRENT_TIMESTAMP + INTERVAL '30 days'`}, 'active'
      )
      RETURNING id, title, created_at;
    `;

    return NextResponse.json(
      { success: true, job: insert[0], message: 'Job posted' },
      { status: 201 }
    );
  } catch (err) {
    console.error('Jobs POST error →', err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
