import { NextRequest, NextResponse } from 'next/server';
import { createPartnershipLog } from '@/lib/database';

interface EventData {
  date: string;
  site: string;
  zip: string;
  hours: string;
  volunteers: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Received partnership log data:', data);
    
    // Enhanced validation
    if (!data.first_name || !data.last_name || !data.email || !data.organization) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: {
          first_name: !data.first_name ? 'Required' : 'OK',
          last_name: !data.last_name ? 'Required' : 'OK', 
          email: !data.email ? 'Required' : 'OK',
          organization: !data.organization ? 'Required' : 'OK'
        }
      }, { status: 400 });
    }

    if (!data.phone) {
      return NextResponse.json({ 
        error: 'Missing required field: phone' 
      }, { status: 400 });
    }

    // Validate families_served
    const familiesServed = parseInt(data.families_served);
    if (isNaN(familiesServed) || familiesServed < 0) {
      return NextResponse.json({ 
        error: 'Invalid families served number. Must be a positive number.' 
      }, { status: 400 });
    }

    // Validate events array
    if (!data.events || !Array.isArray(data.events)) {
      return NextResponse.json({ 
        error: 'Events must be an array' 
      }, { status: 400 });
    }

    // Clean and validate events
    const cleanEvents = data.events.filter((event: EventData) => {
      return event.date && event.site; // Only keep events with at least date and site
    }).map((event: EventData) => ({
      date: event.date || '',
      site: event.site || '',
      zip: event.zip || '',
      hours: event.hours || '0',
      volunteers: event.volunteers || '0'
    }));

    // Prepare cleaned data for database
    const cleanedData = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      organization: data.organization.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      families_served: familiesServed,
      events: cleanEvents
    };

    console.log('Cleaned data for database:', cleanedData);

    const result = await createPartnershipLog(cleanedData);
    console.log('Database insert result:', result);

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Partnership log created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating partnership log:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const postgresError = error as { detail?: string; hint?: string; code?: string };
    
    // Handle specific database errors
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database tables not found. Please visit /api/migrate first.',
        details: 'Run migration endpoint before submitting data'
      }, { status: 500 });
    }

    if (errorMessage.includes('duplicate key')) {
      return NextResponse.json({ 
        error: 'Duplicate entry detected',
        details: postgresError.detail || 'A similar record may already exist'
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: postgresError.detail || 'Database operation failed'
    }, { status: 500 });
  }
}