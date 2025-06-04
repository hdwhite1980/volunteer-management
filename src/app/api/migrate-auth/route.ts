import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting authentication database migration...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(process.env.DATABASE_URL);

    // Create users table with comprehensive fields
    console.log('Creating users table...');
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
    console.log('Creating sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address INET
      )
    `;

    // Create user_sessions table for compatibility
    console.log('Creating user_sessions table...');
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

    // Create indexes for performance
    console.log('Creating database indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)`;

    // Add prepared_by fields to existing tables (enhanced version)
    console.log('Adding prepared_by columns to existing tables...');
    
    // Check if partnership_logs table exists and add columns
    try {
      const partnershipTableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'partnership_logs'
        )
      `;
      
      if (partnershipTableExists[0].exists) {
        await sql`
          ALTER TABLE partnership_logs 
          ADD COLUMN IF NOT EXISTS prepared_by_first VARCHAR(255),
          ADD COLUMN IF NOT EXISTS prepared_by_last VARCHAR(255),
          ADD COLUMN IF NOT EXISTS position_title VARCHAR(255)
        `;
        console.log('Added prepared_by columns to partnership_logs');
      }
    } catch (error) {
      console.log('Partnership logs table might not exist yet, skipping column addition');
    }

    // Check if activity_logs table exists and add columns
    try {
      const activityTableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'activity_logs'
        )
      `;
      
      if (activityTableExists[0].exists) {
        await sql`
          ALTER TABLE activity_logs 
          ADD COLUMN IF NOT EXISTS prepared_by_first VARCHAR(255),
          ADD COLUMN IF NOT EXISTS prepared_by_last VARCHAR(255),
          ADD COLUMN IF NOT EXISTS position_title VARCHAR(255)
        `;
        console.log('Added prepared_by columns to activity_logs');
      }
    } catch (error) {
      console.log('Activity logs table might not exist yet, skipping column addition');
    }

    // Create comprehensive volunteer view (fixed GROUP BY issues)
    console.log('Creating comprehensive volunteer view...');
    try {
      await sql`
        CREATE OR REPLACE VIEW comprehensive_volunteer_view AS
        SELECT 
          CONCAT(p.first_name, ' ', p.last_name) as volunteer_name,
          p.email,
          p.phone,
          p.organization,
          p.families_served,
          CASE 
            WHEN p.prepared_by_first IS NOT NULL AND p.prepared_by_last IS NOT NULL 
            THEN CONCAT(p.prepared_by_first, ' ', p.prepared_by_last)
            ELSE 'System'
          END as prepared_by,
          COALESCE(p.position_title, 'N/A') as position_title,
          'partnership' as log_type,
          p.created_at,
          p.id as record_id,
          COALESCE((
            SELECT SUM(
              CASE 
                WHEN events->>'hours' ~ '^[0-9]+ AND events->>'volunteers' ~ '^[0-9]+ 
                THEN (events->>'hours')::INTEGER * (events->>'volunteers')::INTEGER 
                ELSE 0 
              END
            )
            FROM jsonb_array_elements(COALESCE(p.events, '[]'::jsonb)) AS events
          ), 0) as total_hours
        FROM partnership_logs p
        WHERE p.first_name IS NOT NULL 
          AND p.last_name IS NOT NULL 
          AND TRIM(p.first_name) != '' 
          AND TRIM(p.last_name) != ''

        UNION ALL

        SELECT 
          COALESCE(a.volunteer_name, 'Unknown Volunteer') as volunteer_name,
          a.email,
          a.phone,
          'Individual Volunteer' as organization,
          NULL as families_served,
          CASE 
            WHEN a.prepared_by_first IS NOT NULL AND a.prepared_by_last IS NOT NULL 
            THEN CONCAT(a.prepared_by_first, ' ', a.prepared_by_last)
            ELSE 'System'
          END as prepared_by,
          COALESCE(a.position_title, 'N/A') as position_title,
          'activity' as log_type,
          a.created_at,
          a.id as record_id,
          COALESCE((
            SELECT SUM(
              CASE 
                WHEN activities->>'hours' ~ '^[0-9.]+ 
                THEN (activities->>'hours')::DECIMAL 
                ELSE 0 
              END
            )
            FROM jsonb_array_elements(COALESCE(a.activities, '[]'::jsonb)) AS activities
          ), 0) as total_hours
        FROM activity_logs a
        WHERE a.volunteer_name IS NOT NULL 
          AND TRIM(a.volunteer_name) != ''
      `;
      console.log('Created comprehensive volunteer view successfully');
    } catch (viewError) {
      console.log('Could not create comprehensive view, tables may not exist yet:', viewError);
    }

    // Create default admin user if it doesn't exist
    console.log('Checking for existing admin user...');
    const existingAdmin = await sql`
      SELECT id FROM users WHERE username = 'admin'
    `;

    if (existingAdmin.length === 0) {
      console.log('Creating default admin user...');
      const defaultPassword = 'admin123';
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      await sql`
        INSERT INTO users (username, password_hash, email, role) 
        VALUES ('admin', ${passwordHash}, 'admin@virtu.org', 'admin')
      `;

      console.log('Created default admin user successfully');
    } else {
      console.log('Admin user already exists, skipping creation');
    }

    console.log('Authentication migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Authentication system migrated successfully',
      details: {
        tables_created: [
          'users',
          'sessions', 
          'user_sessions'
        ],
        views_created: [
          'comprehensive_volunteer_view'
        ],
        indexes_created: [
          'Performance indexes for users, sessions, and user_sessions tables'
        ],
        columns_added: [
          'prepared_by_first, prepared_by_last, position_title to existing tables'
        ]
      },
      default_credentials: {
        username: 'admin',
        password: 'admin123',
        email: 'admin@virtu.org',
        note: 'IMPORTANT: Change this password immediately after first login!'
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'Check server logs for more details'
      },
      { status: 500 }
    );
  }
}