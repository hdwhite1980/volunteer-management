// src/app/api/activity-logs/route.ts (Updated with new fields)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const {
      volunteer_name,
      email,
      phone,
      student_id,
      prepared_by_first,
      prepared_by_last,
      position_title,
      activities
    } = await request.json();

    // Validate required fields
    if (!volunteer_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: volunteer_name, email' },
        { status: 400 }
      );
    }

    if (!prepared_by_first || !prepared_by_last || !position_title) {
      return NextResponse.json(
        { error: 'Missing required prepared by fields: prepared_by_first, prepared_by_last, position_title' },
        { status: 400 }
      );
    }

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return NextResponse.json(
        { error: 'At least one activity is required' },
        { status: 400 }
      );
    }

    // Validate activities
    for (const activity of activities) {
      if (!activity.date || !activity.activity || !activity.organization || !activity.description) {
        return NextResponse.json(
          { error: 'Each activity must have date, activity type, organization, and description' },
          { status: 400 }
        );
      }
      
      if (!activity.hours || isNaN(parseFloat(activity.hours))) {
        return NextResponse.json(
          { error: 'Each activity must have valid hours' },
          { status: 400 }
        );
      }
    }

    // Insert the activity log
    const result = await sql`
      INSERT INTO activity_logs (
        volunteer_name, 
        email, 
        phone, 
        student_id, 
        activities,
        prepared_by_first,
        prepared_by_last,
        position_title
      )
      VALUES (
        ${volunteer_name.trim()}, 
        ${email.trim()}, 
        ${phone?.trim() || null}, 
        ${student_id?.trim() || null}, 
        ${JSON.stringify(activities)},
        ${prepared_by_first.trim()},
        ${prepared_by_last.trim()},
        ${position_title.trim()}
      )
      RETURNING id, created_at
    `;

    return NextResponse.json({
      success: true,
      id: result[0].id,
      created_at: result[0].created_at,
      message: 'Activity volunteer log created successfully'
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
      { error: 'Failed to create activity volunteer log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}