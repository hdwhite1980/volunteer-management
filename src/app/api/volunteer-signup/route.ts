// src/app/api/volunteer-signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface VolunteerData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  background_check_consent: boolean;
}

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
      SELECT id FROM volunteer_registrations WHERE email = ${body.email}
    ` as any[];

    if (existingVolunteer.length > 0) {
      return NextResponse.json(
        { error: 'Email address already registered' },
        { status: 409 }
      );
    }

    // Create volunteer registration with only basic fields
    console.log('Volunteer Signup API: Creating registration...');
    const result = await sql`
      INSERT INTO volunteer_registrations (
        first_name, 
        last_name, 
        email, 
        phone, 
        address, 
        city, 
        state, 
        zipcode,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        background_check_consent,
        status
      ) VALUES (
        ${body.first_name}, 
        ${body.last_name}, 
        ${body.email}, 
        ${body.phone || null},
        ${body.address}, 
        ${body.city}, 
        ${body.state}, 
        ${body.zipcode},
        ${body.emergency_contact_name},
        ${body.emergency_contact_phone},
        ${body.emergency_contact_relationship},
        ${body.background_check_consent || false},
        'active'
      )
      RETURNING id, first_name, last_name, email
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create volunteer registration' },
        { status: 500 }
      );
    }

    const volunteer = result[0];
    console.log(`Volunteer Signup API: Successfully registered volunteer ${volunteer.id}`);

    // Return success response
    return NextResponse.json({
      success: true,
      volunteer: {
        id: volunteer.id,
        name: `${volunteer.first_name} ${volunteer.last_name}`,
        email: volunteer.email
      },
      message: 'Registration successful! Thank you for volunteering.'
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
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    console.log('Volunteer Signup API: Fetching volunteer registrations...');

    const volunteers = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        city,
        state,
        zipcode,
        status,
        created_at
      FROM volunteer_registrations
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as any[];

    const countResult = await sql`
      SELECT COUNT(*) as total FROM volunteer_registrations WHERE status = 'active'
    ` as any[];
    
    const total = parseInt(countResult[0]?.total || '0');

    return NextResponse.json({
      volunteers,
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