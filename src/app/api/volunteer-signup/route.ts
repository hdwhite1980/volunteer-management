// src/app/api/volunteer-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to get coordinates for zipcode
async function getZipcodeCoordinates(zipcode: string) {
  try {
    const result = await sql`
      SELECT latitude, longitude, city, state 
      FROM zipcode_coordinates 
      WHERE zipcode = ${zipcode}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching zipcode coordinates:', error);
    return null;
  }
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone format
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// POST - Register new volunteer
export async function POST(request: NextRequest) {
  try {
    console.log('Volunteer Signup API: Starting registration...');
    
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      address,
      city,
      state,
      zipcode,
      availability,
      skills,
      interests,
      max_distance,
      transportation_available,
      background_check_completed,
      background_check_date,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      newsletter_opt_in,
      sms_opt_in
    } = body;

    console.log('Volunteer Signup API: Processing registration for:', first_name, last_name, email);

    // Validate required fields
    if (!first_name || !last_name || !email || !zipcode) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, email, zipcode' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate zipcode and get coordinates
    const coords = await getZipcodeCoordinates(zipcode);
    
    if (!coords) {
      return NextResponse.json(
        { error: 'Invalid zipcode. Please enter a valid US zipcode.' },
        { status: 400 }
      );
    }

    // Validate age if date_of_birth is provided
    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        return NextResponse.json(
          { error: 'Volunteers must be at least 13 years old' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingVolunteer = await sql`
      SELECT id, email FROM volunteer_registrations 
      WHERE email = ${email.toLowerCase()}
    `;

    if (existingVolunteer.length > 0) {
      return NextResponse.json(
        { error: 'A volunteer with this email address is already registered' },
        { status: 409 }
      );
    }

    // Validate and process arrays
    const processedSkills = Array.isArray(skills) ? skills : (skills ? [skills] : []);
    const processedInterests = Array.isArray(interests) ? interests : (interests ? [interests] : []);
    
    // Validate availability JSON if provided
    let processedAvailability = null;
    if (availability) {
      try {
        processedAvailability = typeof availability === 'string' 
          ? JSON.parse(availability) 
          : availability;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid availability format' },
          { status: 400 }
        );
      }
    }

    // Insert the volunteer registration
    const result = await sql`
      INSERT INTO volunteer_registrations (
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        address,
        city,
        state,
        zipcode,
        latitude,
        longitude,
        availability,
        skills,
        interests,
        max_distance,
        transportation_available,
        background_check_completed,
        background_check_date,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        newsletter_opt_in,
        sms_opt_in
      ) VALUES (
        ${first_name.trim()},
        ${last_name.trim()},
        ${email.toLowerCase().trim()},
        ${phone ? phone.trim() : null},
        ${date_of_birth || null},
        ${address ? address.trim() : null},
        ${city ? city.trim() : coords.city},
        ${state ? state.trim() : coords.state},
        ${zipcode.trim()},
        ${coords.latitude},
        ${coords.longitude},
        ${processedAvailability ? JSON.stringify(processedAvailability) : null},
        ${processedSkills},
        ${processedInterests},
        ${max_distance || 25},
        ${transportation_available !== false},
        ${background_check_completed || false},
        ${background_check_date || null},
        ${emergency_contact_name ? emergency_contact_name.trim() : null},
        ${emergency_contact_phone ? emergency_contact_phone.trim() : null},
        ${emergency_contact_relationship ? emergency_contact_relationship.trim() : null},
        ${newsletter_opt_in !== false},
        ${sms_opt_in || false}
      )
      RETURNING id, created_at
    `;

    console.log(`Volunteer Signup API: Successfully registered volunteer with ID: ${result[0].id}`);

    // Find nearby opportunities
    let nearbyJobs = [];
    try {
      const maxDist = max_distance || 25;
      nearbyJobs = await sql`
        SELECT 
          j.id,
          j.title,
          j.organization,
          j.category,
          j.urgency,
          j.volunteers_needed,
          calculate_distance_miles(
            ${coords.latitude}, ${coords.longitude}, 
            COALESCE(j.latitude, zc.latitude), 
            COALESCE(j.longitude, zc.longitude)
          ) as distance_miles
        FROM jobs j
        LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
        WHERE j.status = 'active' 
          AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
          AND (
            j.remote_possible = true OR
            calculate_distance_miles(
              ${coords.latitude}, ${coords.longitude}, 
              COALESCE(j.latitude, zc.latitude), 
              COALESCE(j.longitude, zc.longitude)
            ) <= ${maxDist}
          )
        ORDER BY j.urgency DESC, distance_miles ASC
        LIMIT 5
      `;
    } catch (error) {
      console.log('Volunteer Signup API: Error fetching nearby jobs:', error);
    }

    return NextResponse.json({
      success: true,
      id: result[0].id,
      created_at: result[0].created_at,
      message: 'Volunteer registration completed successfully!',
      location: {
        city: coords.city,
        state: coords.state,
        coordinates: {
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      },
      nearby_opportunities: nearbyJobs.map(job => ({
        ...job,
        distance_miles: job.distance_miles ? parseFloat(job.distance_miles) : null
      }))
    }, { status: 201 });

  } catch (error) {
    console.error('Volunteer Signup API: Registration error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'A volunteer with this information already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('invalid input syntax')) {
        return NextResponse.json(
          { error: 'Invalid data format provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to complete volunteer registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Get volunteer registration by email (for profile lookup)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const id = url.searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { error: 'Email or ID parameter required' },
        { status: 400 }
      );
    }

    console.log('Volunteer Signup API: Looking up volunteer by:', email || `ID: ${id}`);

    let volunteer;
    if (id) {
      const volunteers = await sql`
        SELECT 
          vr.*,
          zc.city as zip_city,
          zc.state as zip_state
        FROM volunteer_registrations vr
        LEFT JOIN zipcode_coordinates zc ON vr.zipcode = zc.zipcode
        WHERE vr.id = ${parseInt(id)}
      `;
      volunteer = volunteers[0];
    } else {
      const volunteers = await sql`
        SELECT 
          vr.*,
          zc.city as zip_city,
          zc.state as zip_state
        FROM volunteer_registrations vr
        LEFT JOIN zipcode_coordinates zc ON vr.zipcode = zc.zipcode
        WHERE vr.email = ${email!.toLowerCase()}
      `;
      volunteer = volunteers[0];
    }

    if (!volunteer) {
      return NextResponse.json(
        { error: 'Volunteer not found' },
        { status: 404 }
      );
    }

    // Get their applications
    const applications = await sql`
      SELECT 
        ja.*,
        j.title as job_title,
        j.organization,
        j.category,
        j.start_date,
        j.end_date
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.volunteer_id = ${volunteer.id}
      ORDER BY ja.applied_at DESC
    `;

    console.log(`Volunteer Signup API: Found volunteer with ${applications.length} applications`);

    return NextResponse.json({
      ...volunteer,
      applications: applications.map(app => ({
        ...app,
        applied_at: app.applied_at,
        responded_at: app.responded_at
      }))
    });

  } catch (error) {
    console.error('Volunteer Signup API: Error fetching volunteer:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch volunteer information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}