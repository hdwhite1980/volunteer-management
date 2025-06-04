// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Check if session exists and is valid
    const sessions = await sql`
      SELECT 
        s.user_id,
        s.expires_at,
        u.id,
        u.username,
        u.email,
        u.role,
        u.last_login
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;

    if (sessions.length === 0) {
      // Invalid or expired session - clear cookie
      const response = NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
      response.cookies.delete('session_token');
      return response;
    }

    const session = sessions[0];

    // Return user data
    return NextResponse.json({
      id: session.id,
      username: session.username,
      email: session.email,
      role: session.role,
      last_login: session.last_login
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}