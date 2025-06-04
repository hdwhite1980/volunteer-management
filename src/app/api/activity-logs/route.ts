import { NextRequest, NextResponse } from 'next/server';
import { createActivityLog } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.volunteer_name || !data.email || !data.activities || data.activities.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createActivityLog(data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
