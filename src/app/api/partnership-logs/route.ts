// src/app/api/partnership-logs/route.ts (Updated with new fields)
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const {
      first_name,
      last_name,
      organization,
      email,
      phone,
      families_served,
      prepared_by_first,
      prepared_by_last,
      position_title,
      events
    } = await request.json();

    // Validate required fields
    if (!first_name || !last_name || !organization || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, organization, email, phone' },
        { status: 400 }
      );
    }

    if (!prepared_by_first || !prepared_by_last || !position_title) {
      return NextResponse.json(
        { error: 'Missing required prepared by fields: prepared_by_first, prepared_by_last, position_title' },
        { status: 400 }
      );
    }

    if (!families_served || isNaN(parseInt(families_served))) {
      return NextResponse.json(
        { error: 'families_served must be a valid number' },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'At least one event is required' },
        { status: 400 }
      );
    }

    // Validate events
    for (const event of events) {
      if (!event.date || !event.site) {
        return NextResponse.json(
          { error: 'Each event must have a date and site' },
          { status: 400 }
        );
      }
    }

    // Insert the partnership log
    const result = await sql`
      INSERT INTO partnership_logs (
        first_name, 
        last_name, 
        organization, 
        email, 
        phone, 
        families_served, 
        events,
        prepared_by_first,
        prepared_by_last,
        position_title
      )
      VALUES (
        ${first_name.trim()}, 
        ${last_name.trim()}, 
        ${organization.trim()}, 
        ${email.trim()}, 
        ${phone.trim()}, 
        ${parseInt(families_served)}, 
        ${JSON.stringify(events)},
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
      message: 'Partnership volunteer log created successfully'
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
      { error: 'Failed to create partnership volunteer log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}