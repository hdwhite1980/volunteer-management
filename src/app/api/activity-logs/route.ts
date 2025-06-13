// src/app/api/activity-logs/route.ts (Updated for ICS 214 format)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const {
      incident_name,
      date_from,
      date_to,
      time_from,
      time_to,
      prepared_by_first,
      prepared_by_last,
      position_title,
      team_members,
      activities,
      is_complete
    } = await request.json();

    // Validate required fields
    if (!incident_name || !date_from || !date_to || !time_from || !time_to) {
      return NextResponse.json(
        { error: 'Missing required fields: incident_name, date_from, date_to, time_from, time_to' },
        { status: 400 }
      );
    }

    if (!prepared_by_first || !prepared_by_last || !position_title) {
      return NextResponse.json(
        { error: 'Missing required prepared by fields: prepared_by_first, prepared_by_last, position_title' },
        { status: 400 }
      );
    }

    if (!is_complete) {
      return NextResponse.json(
        { error: 'Form must be marked as complete before submission' },
        { status: 400 }
      );
    }

    // Validate arrays (optional but should be arrays if provided)
    if (team_members && !Array.isArray(team_members)) {
      return NextResponse.json(
        { error: 'team_members must be an array' },
        { status: 400 }
      );
    }

    if (activities && !Array.isArray(activities)) {
      return NextResponse.json(
        { error: 'activities must be an array' },
        { status: 400 }
      );
    }

    // Insert the activity log
    const result = await sql`
      INSERT INTO activity_logs (
        incident_name,
        date_from,
        date_to,
        time_from,
        time_to,
        prepared_by_first,
        prepared_by_last,
        position_title,
        team_members,
        activities,
        is_complete
      )
      VALUES (
        ${incident_name.trim()},
        ${date_from},
        ${date_to},
        ${time_from},
        ${time_to},
        ${prepared_by_first.trim()},
        ${prepared_by_last.trim()},
        ${position_title.trim()},
        ${JSON.stringify(team_members || [])},
        ${JSON.stringify(activities || [])},
        ${is_complete}
      )
      RETURNING id, created_at
    `;

    return NextResponse.json({
      success: true,
      id: result[0].id,
      created_at: result[0].created_at,
      message: 'Activity log (ICS 214) created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Database error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'A record with this information already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('invalid input syntax')) {
        return NextResponse.json(
          { error: 'Invalid data format provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create activity log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await sql`
      SELECT 
        id,
        incident_name,
        date_from,
        date_to,
        time_from,
        time_to,
        prepared_by_first,
        prepared_by_last,
        position_title,
        team_members,
        activities,
        is_complete,
        created_at
      FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const totalCount = await sql`SELECT COUNT(*) as count FROM activity_logs`;

    return NextResponse.json({
      logs,
      total: totalCount[0].count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}