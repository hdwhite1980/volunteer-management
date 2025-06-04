import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Create partnership_logs table
    await sql`
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

    // Create activity_logs table with proper computed column syntax
    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        volunteer_name VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        student_id VARCHAR(50),
        activities JSONB NOT NULL,
        total_hours DECIMAL(10,2) GENERATED ALWAYS AS (
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
          ), 0)
        ) STORED,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_partnership_logs_email ON partnership_logs(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_partnership_logs_organization ON partnership_logs(organization);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_partnership_logs_created_at ON partnership_logs(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_email ON activity_logs(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_volunteer_name ON activity_logs(volunteer_name);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);`;

    // Create properly structured view
    await sql`
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
        total_hours,
        (
          SELECT COUNT(*)::INTEGER
          FROM jsonb_array_elements(activities)
        ) as impact_metric,
        created_at
      FROM activity_logs;
    `;

    // Test the created structures
    const tableCheck = await sql`
      SELECT COUNT(*) as partnership_count FROM partnership_logs;
    `;
    
    const activityCheck = await sql`
      SELECT COUNT(*) as activity_count FROM activity_logs;
    `;
    
    const viewCheck = await sql`
      SELECT COUNT(*) as total_volunteers FROM volunteer_stats;
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully',
      tests: {
        partnership_logs: tableCheck.rows[0].partnership_count,
        activity_logs: activityCheck.rows[0].activity_count,
        volunteer_stats_view: viewCheck.rows[0].total_volunteers
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const postgresError = error as { detail?: string; hint?: string; position?: string; code?: string };
    const errorDetail = postgresError.detail || 'No additional details';
    const errorHint = postgresError.hint || 'No hint available';
    const errorPosition = postgresError.position || 'Unknown position';
    const errorCode = postgresError.code || 'Unknown error code';
    
    return NextResponse.json({ 
      error: 'Migration failed',
      message: errorMessage,
      detail: errorDetail,
      hint: errorHint,
      position: errorPosition,
      code: errorCode
    }, { status: 500 });
  }
}