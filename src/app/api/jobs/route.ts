/* --------------------------------------------------------------------------
   src/app/api/jobs/route.ts  – UPDATED (no auth required for POST)
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
  skills_needed: string[] | string | null;
  computed_latitude?: string | null;
  computed_longitude?: string | null;
  distance_miles?: string | null;
  filled_positions?: string | null;
  positions_remaining?: string | null;
  [key: string]: any;
}

/* ───────── helpers ───────── */
const normalizeSkills = (raw: any): string[] => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  if (typeof raw === 'string') {
    return raw.replace(/^{|}$/g, '').split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/* ───────── Auth helper ───────── */
async function checkAuth(req: NextRequest): Promise<SessionUser | null> {
  const sid = req.cookies.get('session')?.value;
  if (!sid) return null;

  const rows = await sql`\
    SELECT u.id, u.username, u.email, u.role\
    FROM sessions s\
    JOIN users    u ON u.id = s.user_id\
    WHERE s.id = ${sid}\
      AND s.expires_at > CURRENT_TIMESTAMP\
      AND u.is_active = true\
  ` as SessionUser[];

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
    const where: string[] = ["j.status = 'active'", "j.expires_at > CURRENT_TIMESTAMP"];

    if (category && category !== 'all') { params.push(category); where.push(`j.category = $${++p}`); }
    if (skills)  { params.push(`%${skills}%`); where.push(`j.skills_needed::text ILIKE $${++p}`); }
    if (search)  { params.push(`%${search}%`); where.push(`(j.title ILIKE $${++p} OR j.description ILIKE $${p})`); }

    const userZipJoin = zipcode ? `LEFT JOIN zipcode_coordinates user_zc ON user_zc.zipcode = $1` : '';
    if (zipcode) { params.unshift(zipcode); ++p; }

    const distSel = zipcode ? `, calculate_distance_miles(COALESCE(j.latitude, zc.latitude), COALESCE(j.longitude, zc.longitude), user_zc.latitude, user_zc.longitude) AS distance_miles` : '';

    const distWhere = zipcode ? `AND calculate_distance_miles(COALESCE(j.latitude, zc.latitude), COALESCE(j.longitude, zc.longitude), user_zc.latitude, user_zc.longitude) <= ${distance}` : '';

    const baseQuery = `SELECT j.*, zc.city AS zip_city, zc.state AS zip_state, zc.latitude AS zip_latitude, zc.longitude AS zip_longitude, COALESCE(j.latitude, zc.latitude) AS computed_latitude, COALESCE(j.longitude, zc.longitude) AS computed_longitude, u.username AS posted_by_username, (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted') AS filled_positions, (j.volunteers_needed - COALESCE((SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted'),0)) AS positions_remaining ${distSel} FROM jobs j LEFT JOIN zipcode_coordinates zc ON zc.zipcode = j.zipcode LEFT JOIN users u ON u.id = j.posted_by ${userZipJoin} WHERE ${where.join(' AND ')} ${distWhere} ORDER BY ${zipcode ? 'distance_miles ASC,' : ''} j.urgency DESC, j.created_at DESC LIMIT ${limit} OFFSET ${offset};`;

    const jobs = await sql(baseQuery, params) as Job[];

    const countQuery = `SELECT COUNT(*) AS total FROM jobs j LEFT JOIN zipcode_coordinates zc ON zc.zipcode = j.zipcode ${userZipJoin} WHERE ${where.join(' AND ')} ${distWhere};`;
    const [{ total }] = await sql(countQuery, params) as { total: string }[];
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

/* ───────── POST /api/jobs (NO AUTH REQUIRED) ───────── */
export async function POST(req: NextRequest) {
  try {
    console.log('Jobs API: Creating job (no auth required)');

    const body = await req.json();
    const reqd = ['title','description','category','contact_email','zipcode','volunteers_needed'];
    const miss = reqd.filter(k => !body[k]);
    if (miss.length) return NextResponse.json({ error: `Missing: ${miss.join(', ')}` }, { status: 400 });

    const skillsArray = Array.isArray(body.skills_needed)
      ? body.skills_needed
      : typeof body.skills_needed === 'string' && body.skills_needed.length
        ? body.skills_needed.split(',').map((s:string)=>s.trim())
        : [];

    // Insert job with posted_by as NULL (no auth required)
    const insert = await sql`\
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
        ${body.stipend_amount ?? null}, ${null},
        ${body.expires_at ?? sql`CURRENT_TIMESTAMP + INTERVAL '30 days'`}, 'active'
      ) 
      RETURNING id, title, created_at;\
    ` as { id: number; title: string; created_at: Date }[];

    console.log(`Jobs API: Successfully created job ${insert[0].id} (no auth)`);

    return NextResponse.json({ 
      success: true, 
      job: insert[0], 
      message: 'Job posted successfully' 
    }, { status: 201 });
    
  } catch (err) {
    console.error('Jobs POST error →', err);
    
    // Return detailed error for debugging
    return NextResponse.json({ 
      error: 'Failed to create job',
      details: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
  }
}