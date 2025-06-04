// src/app/api/users/route.ts (Fixed Authentication)
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to check authentication (Fixed to match login system)
async function checkAuth(request: NextRequest) {
  try {
    // Use 'session' cookie (not 'session_token') to match login system
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      return null;
    }

    // Query sessions table (not user_sessions) to match login system
    const sessions = await sql`
      SELECT 
        u.id, u.username, u.email, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId}
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;
    
    return sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error('Authentication check error:', error);
    return null;
  }
}

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    console.log('Users API: Starting GET request...');
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Users API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Users API: Authenticated as ${currentUser.username} (${currentUser.role})`);

    // Only admins can view users
    if (currentUser.role !== 'admin') {
      console.log('Users API: Non-admin user attempted to access users list');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('Users API: Fetching users list...');
    const users = await sql`
      SELECT id, username, email, role, created_at, last_login, is_active
      FROM users
      ORDER BY created_at DESC
    `;

    console.log(`Users API: Found ${users.length} users`);
    return NextResponse.json(users);

  } catch (error) {
    console.error('Users API: Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    console.log('Users API: Starting POST request...');
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Users API: Authentication failed for user creation');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Users API: User creation requested by ${currentUser.username}`);

    // Only admins can create users
    if (currentUser.role !== 'admin') {
      console.log('Users API: Non-admin user attempted to create user');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, email, role = 'user' } = body;

    console.log(`Users API: Creating user with username: ${username}, email: ${email}, role: ${role}`);

    // Validate required fields
    if (!username || !password || !email) {
      console.log('Users API: Missing required fields');
      return NextResponse.json(
        { error: 'Username, password, and email are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'user', 'viewer'].includes(role)) {
      console.log(`Users API: Invalid role provided: ${role}`);
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, user, or viewer' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    console.log('Users API: Checking for existing username/email...');
    const existingUsers = await sql`
      SELECT id, username, email FROM users 
      WHERE username = ${username} OR email = ${email}
    `;

    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      const conflict = existing.username === username ? 'Username' : 'Email';
      console.log(`Users API: ${conflict} already exists`);
      return NextResponse.json(
        { error: `${conflict} already exists` },
        { status: 409 }
      );
    }

    // Hash password
    console.log('Users API: Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    console.log('Users API: Creating user in database...');
    const newUsers = await sql`
      INSERT INTO users (username, password_hash, email, role)
      VALUES (${username}, ${passwordHash}, ${email}, ${role})
      RETURNING id, username, email, role, created_at
    `;

    const newUser = newUsers[0];
    console.log(`Users API: Successfully created user with ID: ${newUser.id}`);

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at
    }, { status: 201 });

  } catch (error) {
    console.error('Users API: Error creating user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}