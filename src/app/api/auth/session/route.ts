import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false, error: 'No session' }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.id, s.user_id, u.username, u.email, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId} 
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401 });
    }

    const session = sessions[0];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ authenticated: false, error: 'Session check failed' }, { status: 500 });
  }
}