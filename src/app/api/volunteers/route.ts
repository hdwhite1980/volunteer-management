// src/app/api/volunteers/route.ts (Updated with Authentication)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to check authentication
async function checkAuth(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    return null;
  }

  const sessions = await sql`
    SELECT 
      u.id, u.username, u.email, u.role
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ${sessionToken}
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.is_active = true
  `;

  return sessions.length > 0 ? sessions[0] : null;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const statsOnly = url.searchParams.get('stats') === 'true';

    if (statsOnly) {
      // Return summary statistics
      const stats = await sql`
        SELECT 
          COUNT(DISTINCT volunteer_name) as total_volunteers,
          COUNT(DISTINCT organization) as total_organizations,
          COALESCE(SUM(total_hours), 0) as total_hours
        FROM comprehensive_volunteer_view
        WHERE volunteer_name IS NOT NULL
      `;

      return NextResponse.json(stats[0] || {
        total_volunteers: 0,
        total_organizations: 0,
        total_hours: 0
      });
    }

    // Return detailed volunteer data
    const volunteers = await sql`
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

    return NextResponse.json(volunteers);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volunteer data' },
      { status: 500 }
    );
  }
}