// src/app/api/migrate-job-board/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    console.log('Job Board Migration: Starting database migration...');

    // Create jobs table
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zipcode VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        category VARCHAR(100) NOT NULL,
        skills_needed TEXT[],
        time_commitment VARCHAR(100),
        duration_hours INTEGER,
        volunteers_needed INTEGER NOT NULL DEFAULT 1,
        age_requirement VARCHAR(50),
        background_check_required BOOLEAN DEFAULT FALSE,
        training_provided BOOLEAN DEFAULT FALSE,
        start_date DATE,
        end_date DATE,
        flexible_schedule BOOLEAN DEFAULT FALSE,
        preferred_times TEXT,
        urgency VARCHAR(20) DEFAULT 'medium',
        remote_possible BOOLEAN DEFAULT FALSE,
        transportation_provided BOOLEAN DEFAULT FALSE,
        meal_provided BOOLEAN DEFAULT FALSE,
        stipend_amount DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'active',
        posted_by INTEGER,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create volunteer_registrations table
    await sql`
      CREATE TABLE IF NOT EXISTS volunteer_registrations (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        birth_date DATE,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zipcode VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        skills TEXT[],
        interests TEXT[],
        categories_interested TEXT[],
        experience_level VARCHAR(50) DEFAULT 'beginner',
        availability JSONB,
        max_distance INTEGER DEFAULT 25,
        transportation VARCHAR(50),
        emergency_contact_name VARCHAR(255) NOT NULL,
        emergency_contact_phone VARCHAR(20) NOT NULL,
        emergency_contact_relationship VARCHAR(100) NOT NULL,
        background_check_consent BOOLEAN DEFAULT FALSE,
        email_notifications BOOLEAN DEFAULT TRUE,
        sms_notifications BOOLEAN DEFAULT FALSE,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create job_applications table
    await sql`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL,
        volunteer_id INTEGER,
        volunteer_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        cover_letter TEXT,
        availability JSONB,
        experience TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        feedback TEXT,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (volunteer_id) REFERENCES volunteer_registrations(id) ON DELETE SET NULL
      )
    `;

    // Create zipcode_coordinates table
    await sql`
      CREATE TABLE IF NOT EXISTS zipcode_coordinates (
        id SERIAL PRIMARY KEY,
        zipcode VARCHAR(10) UNIQUE NOT NULL,
        city VARCHAR(100),
        state VARCHAR(50),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        county VARCHAR(100),
        timezone VARCHAR(50)
      )
    `;

    // Create distance calculation function
    await sql`
      CREATE OR REPLACE FUNCTION calculate_distance_miles(
        lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
      ) RETURNS DECIMAL AS $$
      DECLARE
        radius_miles CONSTANT DECIMAL := 3959;
        dlat DECIMAL;
        dlon DECIMAL;
        a DECIMAL;
        c DECIMAL;
      BEGIN
        IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
          RETURN NULL;
        END IF;
        
        dlat := radians(lat2 - lat1);
        dlon := radians(lon2 - lon1);
        a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
        c := 2 * atan2(sqrt(a), sqrt(1-a));
        RETURN radius_miles * c;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `;

    // Create updated_at trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Create triggers for updated_at
    await sql`
      DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
      CREATE TRIGGER update_jobs_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_volunteer_registrations_updated_at ON volunteer_registrations;
      CREATE TRIGGER update_volunteer_registrations_updated_at
        BEFORE UPDATE ON volunteer_registrations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
      CREATE TRIGGER update_job_applications_updated_at
        BEFORE UPDATE ON job_applications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Create indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_jobs_status_expires ON jobs(status, expires_at);
      CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
      CREATE INDEX IF NOT EXISTS idx_jobs_zipcode ON jobs(zipcode);
      CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_email ON volunteer_registrations(email);
      CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_zipcode ON volunteer_registrations(zipcode);
      CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_location ON volunteer_registrations(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_volunteer_id ON job_applications(volunteer_id);
      CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email);
      CREATE INDEX IF NOT EXISTS idx_zipcode_coordinates_zipcode ON zipcode_coordinates(zipcode);
    `;

    // Create active jobs view
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
      WHERE j.status = 'active' AND j.expires_at > CURRENT_TIMESTAMP;
    `;

    console.log('Job Board Migration: Creating sample data...');

    // Insert sample zipcode data for Norfolk, Virginia area
    const sampleZipcodes = [
      { zipcode: '23502', city: 'Norfolk', state: 'VA', latitude: 36.8945, longitude: -76.2590 },
      { zipcode: '23503', city: 'Norfolk', state: 'VA', latitude: 36.8520, longitude: -76.2869 },
      { zipcode: '23504', city: 'Norfolk', state: 'VA', latitude: 36.8850, longitude: -76.2200 },
      { zipcode: '23505', city: 'Norfolk', state: 'VA', latitude: 36.9180, longitude: -76.2080 },
      { zipcode: '23507', city: 'Norfolk', state: 'VA', latitude: 36.8640, longitude: -76.2440 },
      { zipcode: '23508', city: 'Norfolk', state: 'VA', latitude: 36.8790, longitude: -76.1950 },
      { zipcode: '23509', city: 'Norfolk', state: 'VA', latitude: 36.9260, longitude: -76.2590 },
      { zipcode: '23510', city: 'Norfolk', state: 'VA', latitude: 36.8470, longitude: -76.2950 },
      { zipcode: '23511', city: 'Norfolk', state: 'VA', latitude: 36.8850, longitude: -76.3050 },
      { zipcode: '23513', city: 'Norfolk', state: 'VA', latitude: 36.8650, longitude: -76.1750 },
      { zipcode: '23518', city: 'Norfolk', state: 'VA', latitude: 36.8380, longitude: -76.1450 },
      { zipcode: '23529', city: 'Norfolk', state: 'VA', latitude: 36.9470, longitude: -76.2350 }
    ];

    for (const zipData of sampleZipcodes) {
      try {
        await sql`
          INSERT INTO zipcode_coordinates (zipcode, city, state, latitude, longitude)
          VALUES (${zipData.zipcode}, ${zipData.city}, ${zipData.state}, ${zipData.latitude}, ${zipData.longitude})
          ON CONFLICT (zipcode) DO NOTHING
        `;
      } catch (error) {
        console.warn(`Warning: Could not insert zipcode ${zipData.zipcode}:`, error);
      }
    }

    // Insert sample jobs
    const sampleJobs = [
      {
        title: 'Community Garden Volunteer',
        description: 'Help maintain our community garden by weeding, watering, and harvesting vegetables for local food bank distribution.',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah@communitygarden.org',
        contact_phone: '(757) 555-0123',
        address: '123 Garden Street',
        city: 'Norfolk',
        state: 'VA',
        zipcode: '23502',
        category: 'Environment',
        skills_needed: ['Gardening', 'Physical Labor'],
        time_commitment: 'Weekly',
        duration_hours: 3,
        volunteers_needed: 5,
        background_check_required: false,
        training_provided: true,
        flexible_schedule: true,
        urgency: 'medium'
      },
      {
        title: 'Youth Mentorship Program',
        description: 'Mentor at-risk youth in academic and life skills development. Provide guidance and support in a structured after-school program.',
        contact_name: 'Michael Davis',
        contact_email: 'michael@youthcenter.org',
        contact_phone: '(757) 555-0456',
        address: '456 Youth Center Drive',
        city: 'Norfolk',
        state: 'VA',
        zipcode: '23505',
        category: 'Education',
        skills_needed: ['Teaching', 'Communication', 'Patience'],
        time_commitment: 'Bi-weekly',
        duration_hours: 2,
        volunteers_needed: 8,
        age_requirement: '18+',
        background_check_required: true,
        training_provided: true,
        urgency: 'high'
      },
      {
        title: 'Food Bank Distribution',
        description: 'Sort, pack, and distribute food to families in need. Help with setup, service, and cleanup at our weekly food distribution events.',
        contact_name: 'Lisa Martinez',
        contact_email: 'lisa@norfolkfoodbank.org',
        contact_phone: '(757) 555-0789',
        address: '789 Service Road',
        city: 'Norfolk',
        state: 'VA',
        zipcode: '23503',
        category: 'Human Services',
        skills_needed: ['Organization', 'Customer Service'],
        time_commitment: 'Weekly',
        duration_hours: 4,
        volunteers_needed: 12,
        meal_provided: true,
        transportation_provided: false,
        urgency: 'urgent'
      },
      {
        title: 'Beach Cleanup Event',
        description: 'Join our monthly beach cleanup to protect marine life and keep our coastline beautiful. All supplies provided.',
        contact_name: 'David Wilson',
        contact_email: 'david@cleanocean.org',
        contact_phone: '(757) 555-0321',
        address: 'Ocean View Beach',
        city: 'Norfolk',
        state: 'VA',
        zipcode: '23518',
        category: 'Environment',
        skills_needed: ['Physical Labor'],
        time_commitment: 'Monthly',
        duration_hours: 3,
        volunteers_needed: 25,
        age_requirement: 'All ages welcome',
        transportation_provided: true,
        urgency: 'low'
      }
    ];

    for (const jobData of sampleJobs) {
      try {
        await sql`
          INSERT INTO jobs (
            title, description, contact_name, contact_email, contact_phone,
            address, city, state, zipcode, category, skills_needed,
            time_commitment, duration_hours, volunteers_needed, age_requirement,
            background_check_required, training_provided, flexible_schedule,
            meal_provided, transportation_provided, urgency, status, posted_by
          ) VALUES (
            ${jobData.title}, ${jobData.description}, ${jobData.contact_name},
            ${jobData.contact_email}, ${jobData.contact_phone}, ${jobData.address},
            ${jobData.city}, ${jobData.state}, ${jobData.zipcode}, ${jobData.category},
            ${jobData.skills_needed}, ${jobData.time_commitment}, ${jobData.duration_hours},
            ${jobData.volunteers_needed}, ${jobData.age_requirement || ''},
            ${jobData.background_check_required}, ${jobData.training_provided},
            ${jobData.flexible_schedule || false}, ${jobData.meal_provided || false},
            ${jobData.transportation_provided || false}, ${jobData.urgency}, 'active', 1
          )
        `;
      } catch (error) {
        console.warn(`Warning: Could not insert sample job "${jobData.title}":`, error);
      }
    }

    console.log('Job Board Migration: Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Job board system migrated successfully',
      details: {
        tables_created: ['jobs', 'volunteer_registrations', 'job_applications', 'zipcode_coordinates'],
        functions_created: ['calculate_distance_miles', 'update_updated_at_column'],
        views_created: ['active_jobs_with_location'],
        sample_data: {
          zipcodes: sampleZipcodes.length,
          jobs: sampleJobs.length
        }
      }
    });

  } catch (error) {
    console.error('Job Board Migration: Error during migration:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}