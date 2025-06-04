import { NextResponse } from 'next/server';
import { createPool } from '@vercel/postgres';

export async function GET() {
  try {
    // Try multiple connection string sources
    const connectionString = 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL || 
      process.env.POSTGRES_PRISMA_URL;

    if (!connectionString) {
      return NextResponse.json({
        error: 'No database connection string found',
        available_vars: Object.keys(process.env).filter(key => 
          key.includes('POSTGRES') || key.includes('DATABASE')
        )
      }, { status: 500 });
    }

    // Create connection with explicit string
    const db = createPool({
      connectionString: connectionString
    });

    // Create partnership_logs table
    await db.sql`
      CREATE TABLE IF NOT EXISTS partnership_logs (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        organization VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        families_served INTEGER NOT NULL,
        events JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create activity_logs table
    await db.sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        volunteer_name VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        student_id VARCHAR(50),
        activities JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create indexes
    await db.sql`CREATE INDEX IF NOT EXISTS idx_partnership_logs_email ON partnership_logs(email);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_partnership_logs_organization ON partnership_logs(organization);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_partnership_logs_created_at ON partnership_logs(created_at);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_email ON activity_logs(email);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_volunteer_name ON activity_logs(volunteer_name);`;
    await db.sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);`;

    // Create view
    await db.sql`
      CREATE OR REPLACE VIEW volunteer_stats AS
      SELECT 
        'partnership' as log_type,
        (first_name || ' ' || last_name) as name,
        email,
        organization,
        COALESCE((
          SELECT SUM(
            CASE 
              WHEN jsonb_typeof(event->'hours') = 'string' AND (event->>'hours') ~ '^[0-9]+\.?[0-9]*$'
              THEN (event->>'hours')::DECIMAL
              WHEN jsonb_typeof(event->'hours') = 'number'
              THEN (event->'hours')::DECIMAL
              ELSE 0
            END
          )
          FROM jsonb_array_elements(events) AS event
        ), 0) as total_hours,
        families_served as impact_metric,
        created_at
      FROM partnership_logs
      
      UNION ALL
      
      SELECT 
        'activity' as log_type,
        volunteer_name as name,
        email,
        COALESCE((
          SELECT activity->>'organization'
          FROM jsonb_array_elements(activities) AS activity 
          WHERE activity->>'organization' IS NOT NULL AND activity->>'organization' != ''
          LIMIT 1
        ), 'Unknown') as organization,
        COALESCE((
          SELECT SUM(
            CASE 
              WHEN jsonb_typeof(activity->'hours') = 'string' AND (activity->>'hours') ~ '^[0-9]+\.?[0-9]*$'
              THEN (activity->>'hours')::DECIMAL
              WHEN jsonb_typeof(activity->'hours') = 'number'
              THEN (activity->'hours')::DECIMAL
              ELSE 0
            END
          )
          FROM jsonb_array_elements(activities) AS activity
        ), 0) as total_hours,
        (
          SELECT COUNT(*)::INTEGER
          FROM jsonb_array_elements(activities)
        ) as impact_metric,
        created_at
      FROM activity_logs;
    `;

    // Test the created structures
    const tableCheck = await db.sql`SELECT COUNT(*) as partnership_count FROM partnership_logs;`;
    const activityCheck = await db.sql`SELECT COUNT(*) as activity_count FROM activity_logs;`;
    const viewCheck = await db.sql`SELECT COUNT(*) as total_volunteers FROM volunteer_stats;`;

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully',
      connection_string_source: connectionString ? 'Found' : 'Missing',
      tests: {
        partnership_logs: tableCheck.rows[0].partnership_count,
        activity_logs: activityCheck.rows[0].activity_count,
        volunteer_stats_view: viewCheck.rows[0].total_volunteers
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const postgresError = error as { detail?: string; hint?: string; position?: string; code?: string };
    
    return NextResponse.json({ 
      error: 'Migration failed',
      message: errorMessage,
      detail: postgresError.detail || 'No additional details',
      hint: postgresError.hint || 'No hint available',
      position: postgresError.position || 'Unknown position',
      code: postgresError.code || 'Unknown error code',
      available_env_vars: Object.keys(process.env).filter(key => 
        key.includes('POSTGRES') || key.includes('DATABASE')
      )
    }, { status: 500 });
  }
}