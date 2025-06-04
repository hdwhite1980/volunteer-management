// src/app/api/volunteers/route.ts (Updated with Authentication)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to check authentication (Fixed to match login system)
async function checkAuth(request: NextRequest) {
  try {
    // Use 'session' cookie (not 'session_token') to match login system
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      return null;
    }

    // Query sessions table (not user_sessions) to match login system
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
      
      // Try comprehensive view first, fallback to individual tables
      let stats;
      try {
        stats = await sql`
          SELECT 
            COUNT(DISTINCT volunteer_name) as total_volunteers,
            COUNT(DISTINCT organization) as total_organizations,
            COALESCE(SUM(total_hours), 0) as total_hours
          FROM comprehensive_volunteer_view
          WHERE volunteer_name IS NOT NULL
        `;
        console.log('Volunteers API: Stats from comprehensive view');
      } catch (viewError) {
        console.log('Volunteers API: Comprehensive view not available, calculating stats manually...');
        
        // Fallback: calculate stats from individual tables
        const partnershipStats = await sql`
          SELECT COUNT(DISTINCT CONCAT(first_name, ' ', last_name)) as volunteers
          FROM partnership_logs 
          WHERE first_name IS NOT NULL AND last_name IS NOT NULL
        `.catch(() => [{ volunteers: 0 }]);

        const activityStats = await sql`
          SELECT COUNT(DISTINCT volunteer_name) as volunteers
          FROM activity_logs 
          WHERE volunteer_name IS NOT NULL
        `.catch(() => [{ volunteers: 0 }]);

        const orgStats = await sql`
          SELECT COUNT(DISTINCT organization) as orgs
          FROM partnership_logs 
          WHERE organization IS NOT NULL
        `.catch(() => [{ orgs: 0 }]);

        stats = [{
          total_volunteers: (partnershipStats[0]?.volunteers || 0) + (activityStats[0]?.volunteers || 0),
          total_organizations: orgStats[0]?.orgs || 0,
          total_hours: 0
        }];
      }
      
      return NextResponse.json(stats[0] || {
        total_volunteers: 0,
        total_organizations: 0,
        total_hours: 0
      });
    }

    console.log('Volunteers API: Fetching detailed volunteer data...');
    
    // Try comprehensive view first, fallback to individual tables
    let volunteers;
    try {
      volunteers = await sql`
        SELECT 
          volunteer_name as name,
          email,
          organization,
          COALESCE(total_hours, 0) as total_hours,
          log_type,
          created_at,
          prepared_by,
          position_title
        FROM comprehensive_volunteer_view
        WHERE volunteer_name IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1000
      `;
      console.log(`Volunteers API: Found ${volunteers.length} volunteers from comprehensive view`);
    } catch (viewError) {
      console.log('Volunteers API: Comprehensive view failed, using fallback query...');
      
      // Fallback: get data from individual tables
      const partnershipData = await sql`
        SELECT 
          CONCAT(first_name, ' ', last_name) as name,
          email,
          organization,
          0 as total_hours,
          'partnership' as log_type,
          created_at,
          CASE 
            WHEN prepared_by_first IS NOT NULL AND prepared_by_last IS NOT NULL 
            THEN CONCAT(prepared_by_first, ' ', prepared_by_last)
            ELSE 'System'
          END as prepared_by,
          COALESCE(position_title, 'N/A') as position_title
        FROM partnership_logs
        WHERE first_name IS NOT NULL 
          AND last_name IS NOT NULL
          AND TRIM(first_name) != ''
          AND TRIM(last_name) != ''
        ORDER BY created_at DESC
        LIMIT 500
      `.catch(() => []);

      const activityData = await sql`
        SELECT 
          volunteer_name as name,
          email,
          '' as organization,
          0 as total_hours,
          'activity' as log_type,
          created_at,
          CASE 
            WHEN prepared_by_first IS NOT NULL AND prepared_by_last IS NOT NULL 
            THEN CONCAT(prepared_by_first, ' ', prepared_by_last)
            ELSE 'System'
          END as prepared_by,
          COALESCE(position_title, 'N/A') as position_title
        FROM activity_logs
        WHERE volunteer_name IS NOT NULL 
          AND TRIM(volunteer_name) != ''
        ORDER BY created_at DESC
        LIMIT 500
      `.catch(() => []);

      volunteers = [...partnershipData, ...activityData]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 1000);
      
      console.log(`Volunteers API: Found ${volunteers.length} volunteers from individual tables`);
    }

    console.log('Volunteers API: Successfully returning data');
    return NextResponse.json(volunteers);

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