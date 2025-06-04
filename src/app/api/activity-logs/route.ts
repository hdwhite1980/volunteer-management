import { NextRequest, NextResponse } from 'next/server';
import { createActivityLog } from '@/lib/database';

interface ActivityData {
  date: string;
  activity: string;
  organization: string;
  location: string;
  hours: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Received activity log data:', data);
    
    // Enhanced validation
    if (!data.volunteer_name || !data.email) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: {
          volunteer_name: !data.volunteer_name ? 'Required' : 'OK',
          email: !data.email ? 'Required' : 'OK'
        }
      }, { status: 400 });
    }

    // Validate activities array
    if (!data.activities || !Array.isArray(data.activities) || data.activities.length === 0) {
      return NextResponse.json({ 
        error: 'At least one activity is required' 
      }, { status: 400 });
    }

    // Validate each activity
    for (let i = 0; i < data.activities.length; i++) {
      const activity = data.activities[i];
      if (!activity.date || !activity.activity || !activity.organization || !activity.description) {
        return NextResponse.json({ 
          error: `Activity ${i + 1} is missing required fields (date, activity type, organization, or description)` 
        }, { status: 400 });
      }
      
      if (!activity.hours || isNaN(parseFloat(activity.hours))) {
        return NextResponse.json({ 
          error: `Activity ${i + 1} has invalid hours. Must be a number.` 
        }, { status: 400 });
      }
    }

    // Clean and validate activities
    const cleanActivities = data.activities.map((activity: ActivityData) => ({
      date: activity.date,
      activity: activity.activity,
      organization: activity.organization.trim(),
      location: activity.location?.trim() || '',
      hours: activity.hours,
      description: activity.description.trim()
    }));

    // Prepare cleaned data for database
    const cleanedData = {
      volunteer_name: data.volunteer_name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      student_id: data.student_id?.trim() || null,
      activities: cleanActivities
    };

    console.log('Cleaned data for database:', cleanedData);

    const result = await createActivityLog(cleanedData);
    console.log('Database insert result:', result);

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Activity log created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating activity log:', error);
    
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