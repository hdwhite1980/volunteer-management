import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const volunteerId = searchParams.get('volunteerId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!volunteerId) {
      return NextResponse.json({ error: 'Volunteer ID is required' }, { status: 400 });
    }

    const recommendations = await sql`
      SELECT r.*, j.title, j.description, j.location, j.time_commitment,
             j.category, j.required_skills, u.username as organization_name
      FROM recommendations r
      JOIN jobs j ON r.job_id = j.id
      JOIN users u ON j.user_id = u.id
      WHERE r.volunteer_id = ${volunteerId} AND j.status = 'active'
      ORDER BY r.score DESC
      LIMIT ${limit}
    `;

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}