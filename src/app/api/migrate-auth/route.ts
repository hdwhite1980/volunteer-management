// src/app/api/migrate-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    console.log('Starting authentication database migration...');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'user', 'viewer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address INET
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)`;

    // Add prepared_by fields to existing tables if they don't exist
    try {
      await sql`
        ALTER TABLE partnership_logs 
        ADD COLUMN IF NOT EXISTS prepared_by_first VARCHAR(255),
        ADD COLUMN IF NOT EXISTS prepared_by_last VARCHAR(255),
        ADD COLUMN IF NOT EXISTS position_title VARCHAR(255)
      `;
    } catch (error) {
      console.log('Partnership logs columns may already exist');
    }

    try {
      await sql`
        ALTER TABLE activity_logs 
        ADD COLUMN IF NOT EXISTS prepared_by_first VARCHAR(255),
        ADD COLUMN IF NOT EXISTS prepared_by_last VARCHAR(255),
        ADD COLUMN IF NOT EXISTS position_title VARCHAR(255)
      `;
    } catch (error) {
      console.log('Activity logs columns may already exist');
    }

    // Create comprehensive volunteer view
    await sql`
      CREATE OR REPLACE VIEW comprehensive_volunteer_view AS
      SELECT 
        p.first_name || ' ' || p.last_name as volunteer_name,
        p.email,
        p.phone,
        p.organization,
        p.families_served,
        CASE 
          WHEN p.prepared_by_first IS NOT NULL AND p.prepared_by_last IS NOT NULL 
          THEN p.prepared_by_first || ' ' || p.prepared_by_last 
          ELSE NULL 
        END as prepared_by,
        p.position_title,
        'partnership' as log_type,
        p.created_at,
        p.id as record_id,
        (SELECT SUM(CAST(events->>'hours' AS INTEGER) * CAST(events->>'volunteers' AS INTEGER)) 
         FROM jsonb_array_elements(p.events) AS events 
         WHERE events->>'hours' IS NOT NULL AND events->>'volunteers' IS NOT NULL) as total_hours
      FROM partnership_logs p
      WHERE p.first_name IS NOT NULL AND p.last_name IS NOT NULL

      UNION ALL

      SELECT 
        a.volunteer_name,
        a.email,
        a.phone,
        'Individual Volunteer' as organization,
        NULL as families_served,
        CASE 
          WHEN a.prepared_by_first IS NOT NULL AND a.prepared_by_last IS NOT NULL 
          THEN a.prepared_by_first || ' ' || a.prepared_by_last 
          ELSE NULL 
        END as prepared_by,
        a.position_title,
        'activity' as log_type,
        a.created_at,
        a.id as record_id,
        (SELECT SUM(CAST(activities->>'hours' AS DECIMAL)) 
         FROM jsonb_array_elements(a.activities) AS activities 
         WHERE activities->>'hours' IS NOT NULL) as total_hours
      FROM activity_logs a
      WHERE a.volunteer_name IS NOT NULL
    `;

    // Create default admin user if it doesn't exist
    const existingAdmin = await sql`
      SELECT id FROM users WHERE username = 'admin'
    `;

    if (existingAdmin.length === 0) {
      // Hash the default password 'admin123'
      const defaultPassword = 'admin123';
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      await sql`
        INSERT INTO users (username, password_hash, email, role) 
        VALUES ('admin', ${passwordHash}, 'admin@virtu.org', 'admin')
      `;

      console.log('Created default admin user');
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication system migrated successfully',
      default_credentials: {
        username: 'admin',
        password: 'admin123',
        note: 'IMPORTANT: Change this password immediately after first login!'
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}