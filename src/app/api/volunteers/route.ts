// src/app/api/volunteers/route.ts (Fixed for actual database structure)
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

export async function GET(request: NextRequest) {
  try {
    console.log('Volunteers API: Starting request...');
    
    // Check authentication
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Volunteers API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Volunteers API: Authenticated user: ${currentUser.username}`);

    const url = new URL(request.url);
    const statsOnly = url.searchParams.get('stats') === 'true';

    if (statsOnly) {
      console.log('Volunteers API: Fetching stats only...');
      
      // Use volunteer_stats table for aggregated data
      try {
        const stats = await sql`
          SELECT 
            COUNT(DISTINCT name) as total_volunteers,
            COUNT(DISTINCT organization) as total_organizations,
            COALESCE(SUM(total_hours), 0) as total_hours
          FROM volunteer_stats
          WHERE name IS NOT NULL AND name != ''
        `;
        
        console.log('Volunteers API: Stats from volunteer_stats table');
        return NextResponse.json(stats[0] || {
          total_volunteers: 0,
          total_organizations: 0,
          total_hours: 0
        });
      } catch (error) {
        console.log('Volunteers API: Error fetching stats from volunteer_stats:', error);
        
        // Fallback: calculate from individual tables
        const partnershipCount = await sql`
          SELECT COUNT(*) as count FROM partnership_logs 
          WHERE first_name IS NOT NULL AND last_name IS NOT NULL
        `.catch(() => [{ count: 0 }]);

        const activityCount = await sql`
          SELECT COUNT(*) as count FROM activity_logs 
          WHERE volunteer_name IS NOT NULL
        `.catch(() => [{ count: 0 }]);

        return NextResponse.json({
          total_volunteers: partnershipCount[0].count + activityCount[0].count,
          total_organizations: 0,
          total_hours: 0
        });
      }
    }

    console.log('Volunteers API: Fetching detailed volunteer data...');
    
    // First try to get data from volunteer_stats table (preferred)
    try {
      const volunteers = await sql`
        SELECT 
          name,
          email,
          organization,
          total_hours,
          log_type,
          created_at
        FROM volunteer_stats
        WHERE name IS NOT NULL AND name != ''
        ORDER BY created_at DESC
        LIMIT 1000
      `;
      
      console.log(`Volunteers API: Found ${volunteers.length} volunteers from volunteer_stats table`);
      
      if (volunteers.length > 0) {
        return NextResponse.json(volunteers);
      }
    } catch (error) {
      console.log('Volunteers API: volunteer_stats table query failed:', error);
    }

    // Fallback: aggregate from individual tables
    console.log('Volunteers API: Using fallback - aggregating from individual tables...');
    
    let allVolunteers: any[] = [];

    // Get partnership logs
    try {
      const partnershipData = await sql`
        SELECT 
          CONCAT(first_name, ' ', last_name) as name,
          email,
          organization,
          'partnership' as log_type,
          created_at,
          events
        FROM partnership_logs
        WHERE first_name IS NOT NULL 
          AND last_name IS NOT NULL
          AND TRIM(first_name) != ''
          AND TRIM(last_name) != ''
        ORDER BY created_at DESC
      `;
      
      console.log(`Volunteers API: Found ${partnershipData.length} partnership logs`);
      
      // Calculate hours from events JSONB
      for (const log of partnershipData) {
        let totalHours = 0;
        
        if (log.events && Array.isArray(log.events)) {
          totalHours = log.events.reduce((sum: number, event: any) => {
            const hours = parseInt(event.hours) || 0;
            const volunteers = parseInt(event.volunteers) || 1;
            return sum + (hours * volunteers);
          }, 0);
        }
        
        allVolunteers.push({
          name: log.name,
          email: log.email,
          organization: log.organization,
          total_hours: totalHours,
          log_type: log.log_type,
          created_at: log.created_at
        });
      }
    } catch (error) {
      console.log('Volunteers API: Error fetching partnership logs:', error);
    }

    // Get activity logs
    try {
      const activityData = await sql`
        SELECT 
          volunteer_name as name,
          email,
          'Individual Volunteer' as organization,
          'activity' as log_type,
          created_at,
          activities
        FROM activity_logs
        WHERE volunteer_name IS NOT NULL 
          AND TRIM(volunteer_name) != ''
        ORDER BY created_at DESC
      `;
      
      console.log(`Volunteers API: Found ${activityData.length} activity logs`);
      
      // Calculate hours from activities JSONB
      for (const log of activityData) {
        let totalHours = 0;
        
        if (log.activities && Array.isArray(log.activities)) {
          totalHours = log.activities.reduce((sum: number, activity: any) => {
            return sum + (parseFloat(activity.hours) || 0);
          }, 0);
        }
        
        allVolunteers.push({
          name: log.name,
          email: log.email,
          organization: log.organization,
          total_hours: totalHours,
          log_type: log.log_type,
          created_at: log.created_at
        });
      }
    } catch (error) {
      console.log('Volunteers API: Error fetching activity logs:', error);
    }

    // Sort by created_at descending
    allVolunteers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`Volunteers API: Successfully returning ${allVolunteers.length} volunteers`);
    return NextResponse.json(allVolunteers);

  } catch (error) {
    console.error('Volunteers API: Database error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch volunteer data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}