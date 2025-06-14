// src/app/api/volunteer-signup/route.ts
// Updated version with username generation
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface VolunteerData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  skills: string[];
  interests: string[];
  categories_interested: string[];
  experience_level: string;
  availability: any;
  max_distance?: number;
  transportation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  background_check_consent: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  notes?: string;
}

interface NearbyJob {
  id: number;
  title: string;
  category: string;
  city: string;
  state: string;
  distance_miles: number;
  volunteers_needed: number;
  [key: string]: any;
}

// Helper function to generate username
const generateUsername = (firstName: string, lastName: string, birthDate?: string) => {
  const firstTwoLetters = firstName.substring(0, 2).toLowerCase();
  const fullLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const year = birthDate ? new Date(birthDate).getFullYear().toString() : new Date().getFullYear().toString();
  return `${firstTwoLetters}${fullLastName}${year}`;
};

// Function to ensure unique username
const generateUniqueUsername = async (firstName: string, lastName: string, birthDate?: string) => {
  const baseUsername = generateUsername(firstName, lastName, birthDate);
  let counter = 0;
  let username = baseUsername;
  
  while (true) {
    const existing = await sql`
      SELECT id FROM volunteer_registrations WHERE username = ${username}
    ` as any[];
    
    if (existing.length === 0) {
      return username;
    }
    
    counter++;
    username = `${baseUsername}${counter}`;
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('Volunteer Signup API: Processing registration...');
    
    const body = await request.json() as VolunteerData;
    
    // Validate required fields
    const requiredFields = [
      'first_name', 'last_name', 'email', 'address', 'city', 'state', 'zipcode',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'
    ];
    
    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!body[field as keyof VolunteerData]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate zipcode
    if (!/^\d{5}(-\d{4})?$/.test(body.zipcode)) {
      return NextResponse.json(
        { error: 'Invalid zipcode format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    console.log('Volunteer Signup API: Checking for existing email...');
    const existingVolunteer = await sql`
      SELECT id, username FROM volunteer_registrations WHERE email = ${body.email}
    ` as any[];

    if (existingVolunteer.length > 0) {
      return NextResponse.json(
        { 
          error: 'Email address already registered',
          existing_volunteer: {
            id: existingVolunteer[0].id,
            username: existingVolunteer[0].username
          }
        },
        { status: 409 }
      );
    }

    // Generate unique username
    console.log('Volunteer Signup API: Generating unique username...');
    const username = await generateUniqueUsername(body.first_name, body.last_name, body.birth_date);

    // Get coordinates for zipcode if not provided
    let latitude = body.latitude;
    let longitude = body.longitude;
    
    if (!latitude || !longitude) {
      console.log('Volunteer Signup API: Looking up zipcode coordinates...');
      const zipcodeData = await sql`
        SELECT latitude, longitude FROM zipcode_coordinates WHERE zipcode = ${body.zipcode}
      ` as any[];
      
      if (zipcodeData.length > 0) {
        latitude = parseFloat(zipcodeData[0].latitude);
        longitude = parseFloat(zipcodeData[0].longitude);
      }
    }

    // Create volunteer registration with username
    console.log('Volunteer Signup API: Creating registration...');
    const result = await sql`
      INSERT INTO volunteer_registrations (
        username, first_name, last_name, email, phone, birth_date, address, city, state, zipcode,
        latitude, longitude, skills, interests, categories_interested, experience_level,
        availability, max_distance, transportation, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship, background_check_consent,
        email_notifications, sms_notifications, notes, status
      ) VALUES (
        ${username}, ${body.first_name}, ${body.last_name}, ${body.email}, ${body.phone || null},
        ${body.birth_date || null}, ${body.address}, ${body.city}, ${body.state}, ${body.zipcode},
        ${latitude || null}, ${longitude || null}, ${JSON.stringify(body.skills || [])},
        ${JSON.stringify(body.interests || [])}, ${JSON.stringify(body.categories_interested || [])},
        ${body.experience_level || 'beginner'}, ${JSON.stringify(body.availability || {})},
        ${body.max_distance || 25}, ${body.transportation || 'own'},
        ${body.emergency_contact_name}, ${body.emergency_contact_phone},
        ${body.emergency_contact_relationship}, ${body.background_check_consent || false},
        ${body.email_notifications !== false}, ${body.sms_notifications || false},
        ${body.notes || ''}, 'active'
      )
      RETURNING id, first_name, last_name, email, username
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create volunteer registration' },
        { status: 500 }
      );
    }

    const volunteer = result[0];
    console.log(`Volunteer Signup API: Successfully registered volunteer ${volunteer.id} with username: ${volunteer.username}`);

    // Find nearby opportunities
    let nearbyJobs: NearbyJob[] = [];
    try {
      const maxDist = body.max_distance || 25;
      const jobResults = await sql`
        SELECT 
          j.id,
          j.title,
          j.category,
          j.city,
          j.state,
          j.volunteers_needed,
          j.description,
          j.start_date,
          j.end_date,
          calculate_distance_miles(
            COALESCE(j.latitude, zc.latitude),
            COALESCE(j.longitude, zc.longitude),
            ${latitude || 0},
            ${longitude || 0}
          ) as distance_miles
        FROM jobs j
        LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
        WHERE j.status = 'active' 
          AND j.expires_at > CURRENT_TIMESTAMP
          AND calculate_distance_miles(
            COALESCE(j.latitude, zc.latitude),
            COALESCE(j.longitude, zc.longitude),
            ${latitude || 0},
            ${longitude || 0}
          ) <= ${maxDist}
        ORDER BY distance_miles ASC
        LIMIT 10
      ` as any[];
      
      nearbyJobs = jobResults as NearbyJob[];
    } catch (error) {
      console.warn('Volunteer Signup API: Error finding nearby jobs:', error);
      // Continue without nearby jobs if there's an error
    }

    // Return success response with username
    return NextResponse.json({
      success: true,
      volunteer: {
        id: volunteer.id,
        username: volunteer.username,
        name: `${volunteer.first_name} ${volunteer.last_name}`,
        email: volunteer.email
      },
      nearby_opportunities: nearbyJobs.map(job => ({
        id: job.id,
        title: job.title,
        category: job.category,
        location: `${job.city}, ${job.state}`,
        distance: job.distance_miles ? Math.round(job.distance_miles * 10) / 10 : null,
        volunteers_needed: job.volunteers_needed,
        start_date: job.start_date,
        end_date: job.end_date
      })),
      message: `Registration successful! Your volunteer ID is: ${volunteer.username}. Thank you for volunteering!`
    }, { status: 201 });

  } catch (error) {
    console.error('Volunteer Signup API: Error processing registration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve volunteer registrations (admin only)
export async function GET(request: NextRequest) {
  try {
    // Note: This would need authentication check for admin access
    // For now, returning basic volunteer stats with usernames
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    console.log('Volunteer Signup API: Fetching volunteer registrations...');

    let whereClause = "WHERE status = 'active'";
    const params: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (
        first_name ILIKE ${paramCount} OR 
        last_name ILIKE ${paramCount} OR 
        email ILIKE ${paramCount} OR 
        username ILIKE ${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    const volunteersQuery = `
      SELECT 
        id,
        username,
        first_name,
        last_name,
        email,
        phone,
        city,
        state,
        zipcode,
        categories_interested,
        experience_level,
        status,
        created_at
      FROM volunteer_registrations
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const volunteers = await sql(volunteersQuery, params) as any[];

    const countQuery = `
      SELECT COUNT(*) as total FROM volunteer_registrations ${whereClause}
    `;
    const countResult = await sql(countQuery, params) as any[];
    const total = parseInt(countResult[0]?.total || '0');

    return NextResponse.json({
      volunteers: volunteers.map(vol => ({
        ...vol,
        categories_interested: typeof vol.categories_interested === 'string' 
          ? JSON.parse(vol.categories_interested) 
          : vol.categories_interested
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Volunteer Signup API: Error fetching registrations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch volunteer registrations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}