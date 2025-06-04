import { sql } from '@vercel/postgres';

export interface PartnershipLog {
  id?: number;
  first_name: string;
  last_name: string;
  organization: string;
  email: string;
  phone: string;
  families_served: number;
  events: Array<{
    date: string;
    site: string;
    zip: string;
    hours: string;
    volunteers: string;
  }>;
  created_at?: string;
}

export interface ActivityLog {
  id?: number;
  volunteer_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  activities: Array<{
    date: string;
    activity: string;
    organization: string;
    location: string;
    hours: string;
    description: string;
  }>;
  total_hours?: number;
  created_at?: string;
}

export async function createPartnershipLog(data: PartnershipLog) {
  const result = await sql`
    INSERT INTO partnership_logs (first_name, last_name, organization, email, phone, families_served, events)
    VALUES (${data.first_name}, ${data.last_name}, ${data.organization}, ${data.email}, ${data.phone}, ${data.families_served}, ${JSON.stringify(data.events)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function createActivityLog(data: ActivityLog) {
  const result = await sql`
    INSERT INTO activity_logs (volunteer_name, email, phone, student_id, activities)
    VALUES (${data.volunteer_name}, ${data.email}, ${data.phone || null}, ${data.student_id || null}, ${JSON.stringify(data.activities)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getVolunteerStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total_volunteers,
      SUM(total_hours) as total_hours,
      COUNT(DISTINCT organization) as total_organizations
    FROM volunteer_stats
  `;
  return result.rows[0];
}

export async function searchVolunteers(searchParams: {
  name?: string;
  organization?: string;
  fromDate?: string;
  toDate?: string;
}) {
  let query = `SELECT * FROM volunteer_stats WHERE 1=1`;
  const params: any[] = [];
  let paramCount = 0;

  if (searchParams.name) {
    paramCount++;
    query += ` AND name ILIKE $${paramCount}`;
    params.push(`%${searchParams.name}%`);
  }

  if (searchParams.organization) {
    paramCount++;
    query += ` AND organization ILIKE $${paramCount}`;
    params.push(`%${searchParams.organization}%`);
  }

  if (searchParams.fromDate) {
    paramCount++;
    query += ` AND created_at >= $${paramCount}`;
    params.push(searchParams.fromDate);
  }

  if (searchParams.toDate) {
    paramCount++;
    query += ` AND created_at <= $${paramCount}`;
    params.push(searchParams.toDate);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await sql.query(query, params);
  return result.rows;
}
