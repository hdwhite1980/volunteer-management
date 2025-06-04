// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      // Delete session from database
      await sql`
        DELETE FROM user_sessions 
        WHERE session_token = ${sessionToken}
      `;
    }

    // Create response and clear cookie
    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.cookies.delete('session_token');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}