import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { volunteerId: string } }
) {
  try {
    const { jobId, action } = await request.json();
    
    if (!jobId || !action || !['like', 'skip'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Log the swipe action
    await sql`
      INSERT INTO activity_logs (user_id, activity_type, details, swipe_at, swipe_action)
      VALUES (${params.volunteerId}, 'swipe', ${`Job ID: ${jobId}`}, NOW(), ${action})
    `;

    // Update recommendation as clicked
    await sql`
      UPDATE recommendations 
      SET clicked = true 
      WHERE volunteer_id = ${params.volunteerId} AND job_id = ${jobId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging feedback:', error);
    return NextResponse.json({ error: 'Failed to log feedback' }, { status: 500 });
  }
}