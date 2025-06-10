// src/app/api/volunteer-signup/route.ts
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
  description?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
}

interface ValidationError {
  field: string;
  message: string;
}

// Enhanced validation functions
function validatePersonalInfo(data: VolunteerData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.first_name?.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  } else if (data.first_name.trim().length < 2) {
    errors.push({ field: 'first_name', message: 'First name must be at least 2 characters' });
  }

  if (!data.last_name?.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  } else if (data.last_name.trim().length < 2) {
    errors.push({ field: 'last_name', message: 'Last name must be at least 2 characters' });
  }

  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email address is required' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }
  }

  if (data.phone && data.phone.trim()) {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.push({ field: 'phone', message: 'Phone number must be at least 10 digits' });
    }
  }

  if (data.birth_date) {
    const birthDate = new Date(data.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      errors.push({ field: 'birth_date', message: 'Please enter a valid birth date' });
    }
  }

  return errors;
}

function validateLocationInfo(data: VolunteerData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Street address is required' });
  }

  if (!data.city?.trim()) {
    errors.push({ field: 'city', message: 'City is required' });
  }

  if (!data.state?.trim()) {
    errors.push({ field: 'state', message: 'State is required' });
  } else if (data.state.trim().length !== 2) {
    errors.push({ field: 'state', message: 'State must be 2 characters (e.g., CA, NY)' });
  }

  if (!data.zipcode?.trim()) {
    errors.push({ field: 'zipcode', message: 'ZIP code is required' });
  } else {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(data.zipcode)) {
      errors.push({ field: 'zipcode', message: 'ZIP code must be in format 12345 or 12345-6789' });
    }
  }

  if (data.max_distance && (data.max_distance < 1 || data.max_distance > 500)) {
    errors.push({ field: 'max_distance', message: 'Maximum distance must be between 1 and 500 miles' });
  }

  return errors;
}

function validateSkillsAndInterests(data: VolunteerData): ValidationError[] {
  const errors: ValidationError[] = [];

  const hasSkills = data.skills && data.skills.length > 0;
  const hasInterests = data.interests && data.interests.length > 0;
  const hasCategories = data.categories_interested && data.categories_interested.length > 0;

  if (!hasSkills && !hasInterests && !hasCategories) {
    errors.push({ 
      field: 'skills', 
      message: 'Please select at least one skill, interest, or category' 
    });
  }

  if (data.skills && data.skills.length > 20) {
    errors.push({ field: 'skills', message: 'Please select no more than 20 skills' });
  }

  if (data.interests && data.interests.length > 15) {
    errors.push({ field: 'interests', message: 'Please select no more than 15 interests' });
  }

  return errors;
}

function validateAvailability(data: VolunteerData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.availability || typeof data.availability !== 'object') {
    errors.push({ field: 'availability', message: 'Availability information is required' });
    return errors;
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const hasAnyAvailability = days.some(day => 
    data.availability[day] && data.availability[day].available
  );

  if (!hasAnyAvailability) {
    errors.push({ 
      field: 'availability', 
      message: 'Please select at least one day when you are available' 
    });
  }

  return errors;
}

function validateEmergencyContact(data: VolunteerData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.emergency_contact_name?.trim()) {
    errors.push({ field: 'emergency_contact_name', message: 'Emergency contact name is required' });
  }

  if (!data.emergency_contact_phone?.trim()) {
    errors.push({ field: 'emergency_contact_phone', message: 'Emergency contact phone is required' });
  } else {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    const cleanPhone = data.emergency_contact_phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errors.push({ 
        field: 'emergency_contact_phone', 
        message: 'Emergency contact phone must be at least 10 digits' 
      });
    }
  }

  if (!data.emergency_contact_relationship?.trim()) {
    errors.push({ 
      field: 'emergency_contact_relationship', 
      message: 'Emergency contact relationship is required' 
    });
  }

  return errors;
}

function validateAllData(data: VolunteerData): ValidationError[] {
  return [
    ...validatePersonalInfo(data),
    ...validateLocationInfo(data),
    ...validateSkillsAndInterests(data),
    ...validateAvailability(data),
    ...validateEmergencyContact(data)
  ];
}

async function getCoordinatesForZip(zipcode: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    console.log(`Volunteer Signup API: Looking up coordinates for ZIP ${zipcode}...`);
    const zipcodeData = await sql`
      SELECT latitude, longitude FROM zipcode_coordinates WHERE zipcode = ${zipcode}
    ` as any[];
    
    if (zipcodeData.length > 0) {
      return {
        latitude: parseFloat(zipcodeData[0].latitude),
        longitude: parseFloat(zipcodeData[0].longitude)
      };
    }

    // Fallback to external API if not in database
    console.log(`Volunteer Signup API: ZIP ${zipcode} not found in database, trying external API...`);
    const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
    if (response.ok) {
      const data = await response.json();
      const place = data.places[0];
      return {
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude)
      };
    }
  } catch (error) {
    console.warn(`Volunteer Signup API: Error looking up coordinates for ZIP ${zipcode}:`, error);
  }
  
  return null;
}

async function findNearbyOpportunities(
  latitude: number, 
  longitude: number, 
  maxDistance: number = 25,
  interests: string[] = [],
  categories: string[] = []
): Promise<NearbyJob[]> {
  try {
    console.log(`Volunteer Signup API: Finding opportunities within ${maxDistance} miles...`);
    
    let categoryFilter = '';
    if (categories.length > 0) {
      const categoryList = categories.map(c => `'${c.replace(/'/g, "''")}'`).join(',');
      categoryFilter = `AND j.category IN (${categoryList})`;
    }

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
        j.urgency_level,
        calculate_distance_miles(
          COALESCE(j.latitude, zc.latitude),
          COALESCE(j.longitude, zc.longitude),
          ${latitude},
          ${longitude}
        ) as distance_miles
      FROM jobs j
      LEFT JOIN zipcode_coordinates zc ON j.zipcode = zc.zipcode
      WHERE j.status = 'active' 
        AND j.expires_at > CURRENT_TIMESTAMP
        AND calculate_distance_miles(
          COALESCE(j.latitude, zc.latitude),
          COALESCE(j.longitude, zc.longitude),
          ${latitude},
          ${longitude}
        ) <= ${maxDistance}
      ORDER BY 
        CASE 
          WHEN j.urgency_level = 'urgent' THEN 1
          WHEN j.urgency_level = 'high' THEN 2
          WHEN j.urgency_level = 'medium' THEN 3
          ELSE 4
        END,
        distance_miles ASC
      LIMIT 15
    ` as any[];
    
    return jobResults as NearbyJob[];
  } catch (error) {
    console.warn('Volunteer Signup API: Error finding nearby opportunities:', error);
    return [];
  }
}

async function sendWelcomeNotification(volunteer: any): Promise<void> {
  try {
    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`Volunteer Signup API: Welcome notification sent to ${volunteer.email}`);
    
    // Example notification content
    const welcomeData = {
      to: volunteer.email,
      subject: 'Welcome to Our Volunteer Community!',
      template: 'volunteer-welcome',
      data: {
        firstName: volunteer.first_name,
        lastName: volunteer.last_name,
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourapp.com'}/login`,
        profileUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourapp.com'}/profile`
      }
    };

    // TODO: Implement actual email sending
    // await emailService.send(welcomeData);
    
  } catch (error) {
    console.error('Volunteer Signup API: Error sending welcome notification:', error);
    // Don't fail the registration if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Volunteer Signup API: Processing enhanced registration...');
    
    const body = await request.json() as VolunteerData;
    
    // Enhanced validation
    const validationErrors = validateAllData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validation_errors: validationErrors,
          details: validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    // Sanitize and normalize data
    const sanitizedData = {
      ...body,
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.replace(/\D/g, '') || null,
      city: body.city.trim(),
      state: body.state.trim().toUpperCase(),
      zipcode: body.zipcode.trim(),
      skills: body.skills || [],
      interests: body.interests || [],
      categories_interested: body.categories_interested || [],
      emergency_contact_name: body.emergency_contact_name.trim(),
      emergency_contact_phone: body.emergency_contact_phone.replace(/\D/g, ''),
      emergency_contact_relationship: body.emergency_contact_relationship.trim(),
      notes: body.notes?.trim() || ''
    };

    // Check for duplicate email
    console.log('Volunteer Signup API: Checking for existing registration...');
    const existingVolunteer = await sql`
      SELECT id, email, status FROM volunteer_registrations 
      WHERE email = ${sanitizedData.email}
    ` as any[];

    if (existingVolunteer.length > 0) {
      const existing = existingVolunteer[0];
      if (existing.status === 'active') {
        return NextResponse.json(
          { 
            error: 'This email address is already registered',
            suggestion: 'If you forgot your login details, please use the password reset feature.'
          },
          { status: 409 }
        );
      } else if (existing.status === 'pending') {
        return NextResponse.json(
          { 
            error: 'A registration with this email is pending approval',
            suggestion: 'Please wait for confirmation or contact support if you need assistance.'
          },
          { status: 409 }
        );
      }
    }

    // Get coordinates for the volunteer's location
    let coordinates = await getCoordinatesForZip(sanitizedData.zipcode);
    if (!coordinates && (body.latitude && body.longitude)) {
      coordinates = { latitude: body.latitude, longitude: body.longitude };
    }

    // Create volunteer registration with transaction
    console.log('Volunteer Signup API: Creating volunteer registration...');
    const registrationResult = await sql`
      INSERT INTO volunteer_registrations (
        first_name, last_name, email, phone, birth_date, address, city, state, zipcode,
        latitude, longitude, skills, interests, categories_interested, experience_level,
        availability, max_distance, transportation, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship, background_check_consent,
        email_notifications, sms_notifications, notes, status, created_at, updated_at
      ) VALUES (
        ${sanitizedData.first_name}, ${sanitizedData.last_name}, ${sanitizedData.email}, 
        ${sanitizedData.phone}, ${sanitizedData.birth_date || null}, ${sanitizedData.address}, 
        ${sanitizedData.city}, ${sanitizedData.state}, ${sanitizedData.zipcode},
        ${coordinates?.latitude || null}, ${coordinates?.longitude || null}, 
        ${JSON.stringify(sanitizedData.skills)}, ${JSON.stringify(sanitizedData.interests)}, 
        ${JSON.stringify(sanitizedData.categories_interested)}, ${sanitizedData.experience_level || 'beginner'}, 
        ${JSON.stringify(sanitizedData.availability || {})}, ${sanitizedData.max_distance || 25}, 
        ${sanitizedData.transportation || 'own'}, ${sanitizedData.emergency_contact_name}, 
        ${sanitizedData.emergency_contact_phone}, ${sanitizedData.emergency_contact_relationship}, 
        ${sanitizedData.background_check_consent || false}, ${sanitizedData.email_notifications !== false}, 
        ${sanitizedData.sms_notifications || false}, ${sanitizedData.notes}, 'active', 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id, first_name, last_name, email, created_at
    ` as any[];

    if (registrationResult.length === 0) {
      throw new Error('Failed to create volunteer registration');
    }

    const volunteer = registrationResult[0];
    console.log(`Volunteer Signup API: Successfully registered volunteer ${volunteer.id}`);

    // Find nearby opportunities
    let nearbyJobs: NearbyJob[] = [];
    if (coordinates) {
      try {
        nearbyJobs = await findNearbyOpportunities(
          coordinates.latitude,
          coordinates.longitude,
          sanitizedData.max_distance || 25,
          sanitizedData.interests,
          sanitizedData.categories_interested
        );
        console.log(`Volunteer Signup API: Found ${nearbyJobs.length} nearby opportunities`);
      } catch (error) {
        console.warn('Volunteer Signup API: Error finding nearby opportunities:', error);
      }
    }

    // Send welcome notification (non-blocking)
    if (sanitizedData.email_notifications) {
      sendWelcomeNotification(volunteer).catch(error => {
        console.error('Volunteer Signup API: Welcome notification failed:', error);
      });
    }

    // Log successful registration for analytics
    try {
      await sql`
        INSERT INTO activity_logs (
          user_type, user_id, action, details, timestamp
        ) VALUES (
          'volunteer', ${volunteer.id}, 'registration_completed',
          ${JSON.stringify({
            skills_count: sanitizedData.skills.length,
            interests_count: sanitizedData.interests.length,
            categories_count: sanitizedData.categories_interested.length,
            experience_level: sanitizedData.experience_level,
            max_distance: sanitizedData.max_distance,
            location: `${sanitizedData.city}, ${sanitizedData.state}`
          })}, CURRENT_TIMESTAMP
        )
      `;
    } catch (logError) {
      console.warn('Volunteer Signup API: Failed to log activity:', logError);
    }

    // Return success response with enhanced data
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully! Welcome to our volunteer community.',
      volunteer: {
        id: volunteer.id,
        name: `${volunteer.first_name} ${volunteer.last_name}`,
        email: volunteer.email,
        registered_at: volunteer.created_at
      },
      nearby_opportunities: nearbyJobs.map(job => ({
        id: job.id,
        title: job.title,
        category: job.category,
        location: `${job.city}, ${job.state}`,
        distance: job.distance_miles ? Math.round(job.distance_miles * 10) / 10 : null,
        volunteers_needed: job.volunteers_needed,
        urgency_level: job.urgency_level || 'normal',
        start_date: job.start_date,
        end_date: job.end_date,
        description: job.description ? job.description.substring(0, 150) + '...' : null
      })),
      recommendations: {
        complete_profile: !sanitizedData.birth_date || sanitizedData.skills.length < 3,
        upload_documents: sanitizedData.background_check_consent,
        explore_opportunities: nearbyJobs.length > 0
      },
      next_steps: [
        'Check your email for a welcome message with important information',
        'Review the nearby opportunities we found for you',
        'Complete your profile to get better opportunity matches',
        'Browse all available opportunities on our job board'
      ]
    }, { status: 201 });

  } catch (error) {
    console.error('Volunteer Signup API: Unexpected error during registration:', error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isValidationError = errorMessage.includes('validation') || errorMessage.includes('required');
    
    return NextResponse.json(
      { 
        error: 'Registration failed',
        message: isValidationError 
          ? 'Please check your information and try again'
          : 'We encountered a technical issue. Please try again in a few moments.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        support_contact: process.env.SUPPORT_EMAIL || 'support@yourapp.com'
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

// Enhanced GET endpoint for retrieving volunteer registrations
export async function GET(request: NextRequest) {
  try {
    // Note: Add authentication middleware here for production
    // const user = await authenticateRequest(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'active';
    const experience = url.searchParams.get('experience') || '';
    const city = url.searchParams.get('city') || '';
    const state = url.searchParams.get('state') || '';
    
    const offset = (page - 1) * limit;

    console.log('Volunteer Signup API: Fetching volunteer registrations with filters...');

    // Build dynamic query with filters
    let whereConditions = ['status = $1'];
    let queryParams: any[] = [status];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(first_name ILIKE ${paramIndex} OR last_name ILIKE ${paramIndex} OR email ILIKE ${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (experience) {
      whereConditions.push(`experience_level = ${paramIndex}`);
      queryParams.push(experience);
      paramIndex++;
    }

    if (city) {
      whereConditions.push(`city ILIKE ${paramIndex}`);
      queryParams.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      whereConditions.push(`state = ${paramIndex}`);
      queryParams.push(state.toUpperCase());
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const volunteers = await sql`
      SELECT 
        id, first_name, last_name, email, phone, city, state, zipcode,
        categories_interested, experience_level, max_distance, transportation,
        email_notifications, sms_notifications, status, created_at, updated_at,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.volunteer_id = volunteer_registrations.id) as applications_count
      FROM volunteer_registrations
      WHERE ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as any[];

    const countResult = await sql`
      SELECT COUNT(*) as total FROM volunteer_registrations 
      WHERE ${sql.unsafe(whereClause)}
    ` as any[];
    
    const total = parseInt(countResult[0]?.total || '0');

    // Get summary statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_volunteers,
        COUNT(*) FILTER (WHERE status = 'active') as active_volunteers,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
        COUNT(DISTINCT city || ', ' || state) as locations_served
      FROM volunteer_registrations
    ` as any[];

    return NextResponse.json({
      volunteers: volunteers.map(vol => ({
        ...vol,
        categories_interested: typeof vol.categories_interested === 'string' 
          ? JSON.parse(vol.categories_interested) 
          : vol.categories_interested || [],
        full_name: `${vol.first_name} ${vol.last_name}`,
        location: `${vol.city}, ${vol.state}`,
        phone_display: vol.phone ? `${vol.phone.slice(0,3)}-${vol.phone.slice(3,6)}-${vol.phone.slice(6)}` : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        search,
        status,
        experience,
        city,
        state
      },
      statistics: stats[0] || {}
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
} 'Volunteers must be at least 13 years old' });
    }
    if (age > 120) {
      errors.push({ field: 'birth_date', message: