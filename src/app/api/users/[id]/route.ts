// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to check authentication (with debugging)
async function checkAuth(request: NextRequest) {
  console.log('🔍 Debug Auth - Starting authentication check...');
  
  // Check all cookies
  const allCookies = request.cookies.getAll();
  console.log('🍪 All cookies received:', allCookies);
  
  // Check specifically for session_token
  const sessionToken = request.cookies.get('session_token')?.value;
  console.log('🔑 Session token value:', sessionToken ? 'EXISTS' : 'MISSING');
  console.log('🔑 Session token (first 10 chars):', sessionToken ? sessionToken.substring(0, 10) + '...' : 'NONE');
  
  if (!sessionToken) {
    console.log('❌ No session token found in cookies');
    return null;
  }

  try {
    console.log('🔍 Querying user_sessions table...');
    const sessions = await sql`
      SELECT 
        u.id, u.username, u.email, u.role,
        s.expires_at,
        s.created_at as session_created,
        CURRENT_TIMESTAMP as current_time
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > CURRENT_TIMESTAMP
        AND u.is_active = true
    `;
    
    console.log('📊 Query results count:', sessions.length);
    
    if (sessions.length > 0) {
      const session = sessions[0];
      console.log('✅ Valid session found for user:', session.username);
      console.log('📅 Session expires at:', session.expires_at);
      console.log('📅 Current time:', session.current_time);
      return session;
    } else {
      console.log('❌ No valid session found. Checking why...');
      
      // Check if session exists but is expired
      const expiredSessions = await sql`
        SELECT 
          s.expires_at,
          CURRENT_TIMESTAMP as current_time,
          u.username,
          u.is_active
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken}
      `;
      
      if (expiredSessions.length > 0) {
        const expiredSession = expiredSessions[0];
        console.log('⏰ Found expired session for:', expiredSession.username);
        console.log('⏰ Expired at:', expiredSession.expires_at);
        console.log('⏰ Current time:', expiredSession.current_time);
        console.log('👤 User active:', expiredSession.is_active);
      } else {
        console.log('🔍 No session found with this token at all');
      }
      
      return null;
    }
  } catch (error) {
    console.error('💥 Database error during auth check:', error);
    return null;
  }
}

// GET - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Users API: Starting GET request for user ID: ${params.id}`);
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Users API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can view other users, or users can view themselves
    if (currentUser.role !== 'admin' && currentUser.id.toString() !== params.id) {
      console.log('Users API: Insufficient permissions to view user');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const users = await sql`
      SELECT id, username, email, role, created_at, last_login, is_active
      FROM users
      WHERE id = ${userId}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Users API: Successfully retrieved user ${userId}`);
    return NextResponse.json(users[0]);

  } catch (error) {
    console.error('Users API: Error fetching user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Users API: Starting PUT request for user ID: ${params.id}`);
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Users API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Only admins can update other users, or users can update themselves (limited fields)
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      console.log('Users API: Insufficient permissions to update user');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, role, password, is_active } = body;

    console.log(`Users API: Updating user ${userId} with data:`, { username, email, role, is_active });

    // Check if user exists
    const existingUsers = await sql`
      SELECT id, username, email, role, is_active FROM users WHERE id = ${userId}
    `;

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const existingUser = existingUsers[0];

    // If not admin, restrict what can be updated
    if (currentUser.role !== 'admin') {
      if (role && role !== existingUser.role) {
        return NextResponse.json(
          { error: 'Cannot change role' },
          { status: 403 }
        );
      }
      if (is_active !== undefined && is_active !== existingUser.is_active) {
        return NextResponse.json(
          { error: 'Cannot change account status' },
          { status: 403 }
        );
      }
    }

    // Validate role if provided
    if (role && !['admin', 'user', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, user, or viewer' },
        { status: 400 }
      );
    }

    // Check for username/email conflicts (excluding current user)
    if (username || email) {
      const conflicts = await sql`
        SELECT id, username, email FROM users 
        WHERE (username = ${username || existingUser.username} OR email = ${email || existingUser.email})
          AND id != ${userId}
      `;

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        const conflictType = conflict.username === (username || existingUser.username) ? 'Username' : 'Email';
        return NextResponse.json(
          { error: `${conflictType} already exists` },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (username !== undefined) {
      updateFields.push('username = $' + (updateValues.length + 1));
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push('email = $' + (updateValues.length + 1));
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push('role = $' + (updateValues.length + 1));
      updateValues.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = $' + (updateValues.length + 1));
      updateValues.push(is_active);
    }

    // Handle password update separately
    if (password) {
      console.log('Users API: Updating password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updateFields.push('password_hash = $' + (updateValues.length + 1));
      updateValues.push(passwordHash);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add user ID as the last parameter
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${updateValues.length}
      RETURNING id, username, email, role, created_at, last_login, is_active
    `;

    console.log('Users API: Executing update query...');
    const updatedUsers = await sql(updateQuery, updateValues);

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    const updatedUser = updatedUsers[0];
    console.log(`Users API: Successfully updated user ${userId}`);

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      last_login: updatedUser.last_login,
      is_active: updatedUser.is_active
    });

  } catch (error) {
    console.error('Users API: Error updating user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Users API: Starting DELETE request for user ID: ${params.id}`);
    
    const currentUser = await checkAuth(request);
    
    if (!currentUser) {
      console.log('Users API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can delete users
    if (currentUser.role !== 'admin') {
      console.log('Users API: Non-admin user attempted to delete user');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await sql`
      SELECT id, username FROM users WHERE id = ${userId}
    `;

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user's sessions first
    console.log('Users API: Deleting user sessions...');
    await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`;

    // Delete user
    console.log('Users API: Deleting user...');
    const deletedUsers = await sql`
      DELETE FROM users 
      WHERE id = ${userId}
      RETURNING id, username
    `;

    if (deletedUsers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    const deletedUser = deletedUsers[0];
    console.log(`Users API: Successfully deleted user ${userId} (${deletedUser.username})`);

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: deletedUser.id,
        username: deletedUser.username
      }
    });

  } catch (error) {
    console.error('Users API: Error deleting user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}