import { NextRequest, NextResponse } from 'next/server';
import { createPartnershipLog } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.first_name || !data.last_name || !data.email || !data.organization) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createPartnershipLog(data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating partnership log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
