import { NextRequest, NextResponse } from 'next/server';
import { getVolunteerStats, searchVolunteers } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    if (searchParams.get('stats') === 'true') {
      const stats = await getVolunteerStats();
      return NextResponse.json(stats);
    }

    const searchData = {
      name: searchParams.get('name') || undefined,
      organization: searchParams.get('organization') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    };

    const volunteers = await searchVolunteers(searchData);
    return NextResponse.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
