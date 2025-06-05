// src/app/api/migrate-job-board/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting job board database migration...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(process.env.DATABASE_URL);

    // Create jobs table
    console.log('Creating jobs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        organization VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zipcode VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        
        -- Job details
        category VARCHAR(100),
        skills_needed TEXT[],
        time_commitment VARCHAR(100),
        duration_hours INTEGER,
        volunteers_needed INTEGER DEFAULT 1,
        age_requirement VARCHAR(50),
        background_check_required BOOLEAN DEFAULT false,
        training_provided BOOLEAN DEFAULT false,
        
        -- Scheduling
        start_date DATE,
        end_date DATE,
        flexible_schedule BOOLEAN DEFAULT true,
        preferred_times TEXT,
        
        -- Status and metadata
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'draft')),
        urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
        posted_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        
        -- Additional features
        remote_possible BOOLEAN DEFAULT false,
        transportation_provided BOOLEAN DEFAULT false,
        meal_provided BOOLEAN DEFAULT false,
        stipend_amount DECIMAL(8, 2),
        
        CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date <= end_date),
        CONSTRAINT valid_coordinates CHECK (
          (latitude IS NULL AND longitude IS NULL) OR 
          (latitude IS NOT NULL AND longitude IS NOT NULL)
        )
      )
    `;

    // Create volunteer registrations table
    console.log('Creating volunteer_registrations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS volunteer_registrations (
        id SERIAL PRIMARY KEY,
        
        -- Personal information
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        
        -- Location
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zipcode VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        
        -- Volunteer preferences
        availability TEXT,
        skills TEXT[],
        interests TEXT[],
        max_distance INTEGER DEFAULT 25,
        transportation_available BOOLEAN DEFAULT true,
        background_check_completed BOOLEAN DEFAULT false,
        background_check_date DATE,
        
        -- Emergency contact
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(100),
        
        -- Status and preferences
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        newsletter_opt_in BOOLEAN DEFAULT true,
        sms_opt_in BOOLEAN DEFAULT false,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP,
        
        -- References to existing system
        user_id INTEGER REFERENCES users(id) NULL
      )
    `;

    // Create job applications table
    console.log('Creating job_applications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        volunteer_id INTEGER REFERENCES volunteer_registrations(id) ON DELETE CASCADE,
        
        -- Application details
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
        message TEXT,
        admin_notes TEXT,
        
        -- Scheduling
        preferred_start_date DATE,
        availability_notes TEXT,
        
        -- Timestamps
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(job_id, volunteer_id)
      )
    `;

    // Create zipcode coordinates table
    console.log('Creating zipcode_coordinates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS zipcode_coordinates (
        zipcode VARCHAR(10) PRIMARY KEY,
        city VARCHAR(100),
        state VARCHAR(2),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        county VARCHAR(100),
        timezone VARCHAR(50)
      )
    `;

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_zipcode ON jobs(zipcode)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_dates ON jobs(start_date, end_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at)`;

    await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_zipcode ON volunteer_registrations(zipcode)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteer_registrations(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteer_registrations(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_location ON volunteer_registrations(latitude, longitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_volunteers_skills ON volunteer_registrations USING GIN(skills)`;

    await sql`CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_volunteer ON job_applications(volunteer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status)`;

    // Create update triggers
    console.log('Creating update triggers...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`
      CREATE TRIGGER update_volunteer_registrations_updated_at BEFORE UPDATE ON volunteer_registrations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`
      CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    // Create distance calculation function
    console.log('Creating distance calculation function...');
    await sql`
      CREATE OR REPLACE FUNCTION calculate_distance_miles(
        lat1 DECIMAL, lon1 DECIMAL, 
        lat2 DECIMAL, lon2 DECIMAL
      )
      RETURNS DECIMAL AS $$
      DECLARE
        earth_radius DECIMAL := 3959; -- Miles
        dlat DECIMAL;
        dlon DECIMAL;
        a DECIMAL;
        c DECIMAL;
      BEGIN
        IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
          RETURN NULL;
        END IF;
        
        dlat := RADIANS(lat2 - lat1);
        dlon := RADIANS(lon2 - lon1);
        
        a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
        c := 2 * ATAN2(SQRT(a), SQRT(1-a));
        
        RETURN earth_radius * c;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE
    `;

    // Insert sample zipcode data
    console.log('Inserting sample zipcode data...');
    await sql`
      INSERT INTO zipcode_coordinates (zipcode, city, state, latitude, longitude, county) VALUES
      ('23502', 'Norfolk', 'VA', 36.8468, -76.2852, 'Norfolk City'),
      ('23503', 'Norfolk', 'VA', 36.8879, -76.2058, 'Norfolk City'),
      ('23504', 'Norfolk', 'VA', 36.8377, -76.2419, 'Norfolk City'),
      ('23505', 'Norfolk', 'VA', 36.8671, -76.2774, 'Norfolk City'),
      ('23451', 'Virginia Beach', 'VA', 36.7793, -76.0240, 'Virginia Beach City'),
      ('23452', 'Virginia Beach', 'VA', 36.8468, -76.1224, 'Virginia Beach City'),
      ('23320', 'Chesapeake', 'VA', 36.7682, -76.2875, 'Chesapeake City'),
      ('23321', 'Chesapeake', 'VA', 36.7793, -76.2441, 'Chesapeake City'),
      ('23455', 'Virginia Beach', 'VA', 36.7335, -76.0435, 'Virginia Beach City'),
      ('23456', 'Virginia Beach', 'VA', 36.7879, -76.0502, 'Virginia Beach City'),
      ('23322', 'Chesapeake', 'VA', 36.8213, -76.3052, 'Chesapeake City'),
      ('23323', 'Chesapeake', 'VA', 36.8879, -76.2441, 'Chesapeake City')
      ON CONFLICT (zipcode) DO NOTHING
    `;

    // Create sample jobs
    console.log('Creating sample job listings...');
    await sql`
      INSERT INTO jobs (
        title, description, organization, contact_name, contact_email, 
        zipcode, category, time_commitment, volunteers_needed, urgency
      ) VALUES
      (
        'Food Bank Volunteer Needed',
        'Help sort and distribute food to families in need. No experience required, training provided.',
        'Norfolk Food Bank',
        'Sarah Johnson',
        'sarah@norfolkfoodbank.org',
        '23502',
        'Community Service',
        'Weekly',
        5,
        'high'
      ),
      (
        'Tutoring Assistant for After-School Program',
        'Assist elementary students with homework and reading. Must enjoy working with children.',
        'Norfolk Community Center',
        'Mike Davis',
        'mike@norfolkcenter.org',
        '23503',
        'Education',
        'Weekly',
        3,
        'normal'
      ),
      (
        'Beach Cleanup Coordinator',
        'Help organize and lead monthly beach cleanup events. Environmental passion preferred.',
        'Virginia Beach Environmental Group',
        'Lisa Chen',
        'lisa@vbenv.org',
        '23451',
        'Environment',
        'Monthly',
        2,
        'normal'
      ),
      (
        'Senior Center Activity Leader',
        'Lead games, activities, and social events for seniors. Must be patient and enthusiastic.',
        'Chesapeake Senior Services',
        'Robert Wilson',
        'robert@chesapeakeseniors.org',
        '23320',
        'Community Service',
        'Flexible',
        4,
        'low'
      )
      ON CONFLICT DO NOTHING
    `;

    // Create helpful views
    console.log('Creating database views...');
    await sql`
      CREATE OR REPLACE VIEW active_jobs_with_location AS
      SELECT 
        j.*,
        zc.city as zip_city,
        zc.state as zip_state,
        COALESCE(j.latitude, zc.latitude) as computed_latitude,
        COALESCE(j.longitude, zc.longitude) as computed_longitude,
        (
          SELECT COUNT(*) 
          FROM job_applications ja 
          WHERE ja.job_id = j.id AND ja.status = 'accepted'
        ) as filled_positions,
        (j.volunteers_needed - COALESCE(
          (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'accepted'), 
          0
        )) as positions_remaining
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      WHERE j.status = 'active' 
        AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
    `;

    console.log('Job board migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Job board system migrated successfully',
      details: {
        tables_created: [
          'jobs',
          'volunteer_registrations',
          'job_applications',
          'zipcode_coordinates'
        ],
        functions_created: [
          'calculate_distance_miles',
          'update_updated_at_column'
        ],
        views_created: [
          'active_jobs_with_location'
        ],
        sample_data: {
          zipcodes: 12,
          jobs: 4
        }
      },
      next_steps: [
        'Visit /job-board to see available opportunities',
        'Visit /volunteer-signup to register as a volunteer',
        'Add more zipcode data for better location coverage',
        'Configure email notifications for applications'
      ]
    });

  } catch (error) {
    console.error('Job board migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}