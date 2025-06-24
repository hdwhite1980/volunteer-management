import { neon } from '@neondatabase/serverless';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

export { sql };

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
  prepared_by?: string;
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
  prepared_by?: string;
  created_at?: string;
}

// Authentication interfaces
export interface User {
  id?: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at?: string;
}

// Discovery Feed interfaces
export interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  time_commitment: string;
  required_skills?: string[];
  user_id: number;
  organization_name: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Recommendation {
  id?: number;
  volunteer_id: number;
  job_id: number;
  score: number;
  algo: string;
  served_at: string;
  clicked: boolean;
  created_at?: string;
}

export interface VolunteerProfile {
  id?: number;
  user_id: number;
  preferred_location?: string;
  preferred_categories?: string[];
  skills?: string[];
  availability?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createPartnershipLog(data: PartnershipLog) {
  const result = await sql`
    INSERT INTO partnership_logs (first_name, last_name, organization, email, phone, families_served, events, prepared_by)
    VALUES (${data.first_name}, ${data.last_name}, ${data.organization}, ${data.email}, ${data.phone}, ${data.families_served}, ${JSON.stringify(data.events)}, ${data.prepared_by || 'System'})
    RETURNING *
  `;
  return result[0];
}

export async function createActivityLog(data: ActivityLog) {
  const result = await sql`
    INSERT INTO activity_logs (volunteer_name, email, phone, student_id, activities, prepared_by)
    VALUES (${data.volunteer_name}, ${data.email}, ${data.phone || null}, ${data.student_id || null}, ${JSON.stringify(data.activities)}, ${data.prepared_by || 'System'})
    RETURNING *
  `;
  return result[0];
}

export async function getVolunteerStats() {
  try {
    const result = await sql`
      SELECT 
        COUNT(*)::INTEGER as total_volunteers,
        COALESCE(SUM(total_hours), 0)::DECIMAL as total_hours,
        COUNT(DISTINCT organization)::INTEGER as total_organizations
      FROM volunteer_stats
    `;
    
    return {
      total_volunteers: result[0]?.total_volunteers || 0,
      total_hours: parseFloat(result[0]?.total_hours || '0'),
      total_organizations: result[0]?.total_organizations || 0
    };
  } catch (error) {
    console.error('Error getting volunteer stats:', error);
    return {
      total_volunteers: 0,
      total_hours: 0,
      total_organizations: 0
    };
  }
}

export async function searchVolunteers(searchParams: {
  name?: string;
  organization?: string;
  fromDate?: string;
  toDate?: string;
}) {
  try {
    let query = `
      SELECT 
        log_type,
        name,
        email,
        organization,
        COALESCE(total_hours, 0) as total_hours,
        impact_metric,
        created_at
      FROM volunteer_stats 
      WHERE 1=1
    `;
    
    const params: string[] = [];
    let paramCount = 0;
    
    if (searchParams.name) {
      paramCount++;
      query += ` AND name ILIKE ${paramCount}`;
      params.push(`%${searchParams.name}%`);
    }
    
    if (searchParams.organization) {
      paramCount++;
      query += ` AND organization ILIKE ${paramCount}`;
      params.push(`%${searchParams.organization}%`);
    }
    
    if (searchParams.fromDate) {
      paramCount++;
      query += ` AND created_at >= ${paramCount}::timestamp`;
      params.push(searchParams.fromDate);
    }
    
    if (searchParams.toDate) {
      paramCount++;
      query += ` AND created_at <= ${paramCount}::timestamp`;
      params.push(searchParams.toDate);
    }
    
    query += ` ORDER BY created_at DESC LIMIT 100`;
    
    // Use the neon sql function with parameterized query
    const result = await sql(query, params);
    
    return result.map(row => ({
      ...row,
      total_hours: parseFloat(row.total_hours || '0')
    }));
  } catch (error) {
    console.error('Error searching volunteers:', error);
    return [];
  }
}

// Discovery Feed functions
export async function getRecommendationsForVolunteer(volunteerId: number, limit = 20) {
  try {
    const result = await sql`
      SELECT r.*, j.title, j.description, j.location, j.time_commitment,
             j.category, j.required_skills, o.username as organization_name
      FROM recommendations r
      JOIN jobs j ON r.job_id = j.id
      JOIN users o ON j.user_id = o.id
      WHERE r.volunteer_id = ${volunteerId} AND j.status = 'active'
      ORDER BY r.score DESC
      LIMIT ${limit}
    `;
    return result;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

export async function logSwipeFeedback(volunteerId: number, jobId: number, action: 'like' | 'skip') {
  try {
    // Log the swipe action
    await sql`
      INSERT INTO activity_logs (user_id, activity_type, details, swipe_at, swipe_action)
      VALUES (${volunteerId}, 'swipe', ${`Job ID: ${jobId}`}, NOW(), ${action})
    `;

    // Update recommendation as clicked
    await sql`
      UPDATE recommendations 
      SET clicked = true 
      WHERE volunteer_id = ${volunteerId} AND job_id = ${jobId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error logging swipe feedback:', error);
    throw error;
  }
}

export async function generateRecommendations() {
  try {
    console.log('Generating recommendations...');
    
    // Get all volunteers
    const volunteers = await sql`SELECT id FROM users WHERE role = 'volunteer'`;
    
    for (const volunteer of volunteers) {
      const volunteerId = volunteer.id;
      
      // Simple recommendation algorithm
      const jobs = await sql`
        SELECT j.*, u.username as organization_name,
        CASE 
          WHEN j.location ILIKE '%norfolk%' THEN 0.3
          ELSE 0.1 
        END +
        CASE 
          WHEN j.category = 'Community Service' THEN 0.4
          ELSE 0.2 
        END +
        (1.0 - EXTRACT(EPOCH FROM (NOW() - j.created_at)) / 604800.0) * 0.3 as score
        FROM jobs j
        JOIN users u ON j.user_id = u.id
        WHERE j.status = 'active'
        AND j.id NOT IN (
          SELECT job_id FROM job_applications WHERE volunteer_id = ${volunteerId}
        )
        ORDER BY score DESC
        LIMIT 50
      `;

      // Clear old recommendations for this volunteer
      await sql`DELETE FROM recommendations WHERE volunteer_id = ${volunteerId}`;

      // Insert new recommendations
      for (const job of jobs) {
        await sql`
          INSERT INTO recommendations (volunteer_id, job_id, score, algo, served_at)
          VALUES (${volunteerId}, ${job.id}, ${job.score}, 'simple_hybrid', NOW())
        `;
      }
    }
    
    console.log('Recommendations generated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}