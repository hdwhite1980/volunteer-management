import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Create tables
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

    await sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        volunteer_name VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        student_id VARCHAR(50),
        activities JSONB NOT NULL,
        total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
          (SELECT SUM((activity->>'hours')::DECIMAL) 
           FROM jsonb_array_elements(activities) AS activity)
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

    // Create view
    await sql`
      CREATE OR REPLACE VIEW volunteer_stats AS
      SELECT 
        'partnership' as log_type,
        first_name || ' ' || last_name as name,
        email,
        organization,
        (SELECT SUM((event->>'hours')::DECIMAL) 
         FROM jsonb_array_elements(events) AS event) as total_hours,
        families_served as impact_metric,
        created_at
      FROM partnership_logs
      UNION ALL
      SELECT 
        'activity' as log_type,
        volunteer_name as name,
        email,
        (SELECT DISTINCT activity->>'organization' 
         FROM jsonb_array_elements(activities) AS activity LIMIT 1) as organization,
        total_hours,
        (SELECT COUNT(*) FROM jsonb_array_elements(activities)) as impact_metric,
        created_at
      FROM activity_logs;
    `;

    return NextResponse.json({ success: true, message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
