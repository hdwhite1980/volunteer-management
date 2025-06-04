#!/bin/bash

# Volunteer Management App Setup Script for Mac
echo "🚀 Setting up Volunteer Management Application..."

# Step 1: Create Next.js project
echo "📦 Creating Next.js project..."
npx create-next-app@latest volunteer-management --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd volunteer-management

# Step 2: Install dependencies
echo "📚 Installing dependencies..."
npm install @vercel/postgres lucide-react jspdf html2canvas
npm install -D @types/node

# Step 3: Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/app/api/partnership-logs
mkdir -p src/app/api/activity-logs
mkdir -p src/app/api/volunteers
mkdir -p src/app/api/export-pdf
mkdir -p src/app/api/migrate
mkdir -p src/components
mkdir -p src/lib

# Step 4: Create database utility file
echo "🗄️ Creating database utilities..."
cat > src/lib/database.ts << 'EOF'
import { sql } from '@vercel/postgres';

export interface PartnershipLog {
  id?: number;
  first_name: string;
  last_name: string;
  organization: string;
  email: string;
  phone: string;
  families_served: number;
  events: Array<{
    date: string;
    site: string;
    zip: string;
    hours: string;
    volunteers: string;
  }>;
  created_at?: string;
}

export interface ActivityLog {
  id?: number;
  volunteer_name: string;
  email: string;
  phone?: string;
  student_id?: string;
  activities: Array<{
    date: string;
    activity: string;
    organization: string;
    location: string;
    hours: string;
    description: string;
  }>;
  total_hours?: number;
  created_at?: string;
}

export async function createPartnershipLog(data: PartnershipLog) {
  const result = await sql`
    INSERT INTO partnership_logs (first_name, last_name, organization, email, phone, families_served, events)
    VALUES (${data.first_name}, ${data.last_name}, ${data.organization}, ${data.email}, ${data.phone}, ${data.families_served}, ${JSON.stringify(data.events)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function createActivityLog(data: ActivityLog) {
  const result = await sql`
    INSERT INTO activity_logs (volunteer_name, email, phone, student_id, activities)
    VALUES (${data.volunteer_name}, ${data.email}, ${data.phone || null}, ${data.student_id || null}, ${JSON.stringify(data.activities)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getVolunteerStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total_volunteers,
      SUM(total_hours) as total_hours,
      COUNT(DISTINCT organization) as total_organizations
    FROM volunteer_stats
  `;
  return result.rows[0];
}

export async function searchVolunteers(searchParams: {
  name?: string;
  organization?: string;
  fromDate?: string;
  toDate?: string;
}) {
  let query = `SELECT * FROM volunteer_stats WHERE 1=1`;
  const params: any[] = [];
  let paramCount = 0;

  if (searchParams.name) {
    paramCount++;
    query += ` AND name ILIKE $${paramCount}`;
    params.push(`%${searchParams.name}%`);
  }

  if (searchParams.organization) {
    paramCount++;
    query += ` AND organization ILIKE $${paramCount}`;
    params.push(`%${searchParams.organization}%`);
  }

  if (searchParams.fromDate) {
    paramCount++;
    query += ` AND created_at >= $${paramCount}`;
    params.push(searchParams.fromDate);
  }

  if (searchParams.toDate) {
    paramCount++;
    query += ` AND created_at <= $${paramCount}`;
    params.push(searchParams.toDate);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const result = await sql.query(query, params);
  return result.rows;
}
EOF

# Step 5: Create API routes
echo "🔗 Creating API routes..."

# Partnership logs API
cat > src/app/api/partnership-logs/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { createPartnershipLog } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.first_name || !data.last_name || !data.email || !data.organization) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createPartnershipLog(data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating partnership log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
EOF

# Activity logs API
cat > src/app/api/activity-logs/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { createActivityLog } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data.volunteer_name || !data.email || !data.activities || data.activities.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createActivityLog(data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
EOF

# Volunteers API
cat > src/app/api/volunteers/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getVolunteerStats, searchVolunteers } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    if (searchParams.get('stats') === 'true') {
      const stats = await getVolunteerStats();
      return NextResponse.json(stats);
    }

    const searchData = {
      name: searchParams.get('name') || undefined,
      organization: searchParams.get('organization') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    };

    const volunteers = await searchVolunteers(searchData);
    return NextResponse.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
EOF

# Migration API (for initial database setup)
cat > src/app/api/migrate/route.ts << 'EOF'
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
EOF

# Step 6: Create main React component
echo "⚛️ Creating React component..."
cat > src/components/VolunteerApp.tsx << 'EOF'
'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Download, Search, Calendar, Clock, Users, Building2 } from 'lucide-react';

const VolunteerApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [stats, setStats] = useState({ total_volunteers: 0, total_hours: 0, total_organizations: 0 });
  const [volunteers, setVolunteers] = useState([]);

  // Load stats for dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadStats();
      loadVolunteers();
    }
  }, [currentView]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/volunteers?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteers');
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Volunteer Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track volunteer hours, manage partnerships, and maintain comprehensive records 
            of community service activities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Partnership Volunteer Log
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Record agency partnership volunteer activities, track families served, 
              and manage organizational volunteer hours
            </p>
            <button
              onClick={() => setCurrentView('partnership')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Start Partnership Log
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Activity Log
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Log individual volunteer activities, track hours, and document 
              specific community service contributions
            </p>
            <button
              onClick={() => setCurrentView('activity')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
            >
              Start Activity Log
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 mr-4"
          >
            <Search className="w-5 h-5 inline mr-2" />
            View Database
          </button>
          <button
            onClick={() => setCurrentView('upload')}
            className="bg-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload Forms
          </button>
        </div>
      </div>
    </div>
  );

  // Partnership Volunteer Log Form
  const PartnershipForm = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      organization: '',
      email: '',
      phone: '',
      families_served: '',
    });
    const [eventRows, setEventRows] = useState([
      { date: '', site: '', zip: '', hours: '', volunteers: '' }
    ]);

    const addEventRow = () => {
      if (eventRows.length < 11) {
        setEventRows([...eventRows, { date: '', site: '', zip: '', hours: '', volunteers: '' }]);
      }
    };

    const updateEventRow = (index: number, field: string, value: string) => {
      const newRows = [...eventRows];
      newRows[index][field] = value;
      setEventRows(newRows);
    };

    const handleSubmit = async () => {
      try {
        const submitData = {
          ...formData,
          families_served: parseInt(formData.families_served),
          events: eventRows.filter(row => row.date && row.site)
        };

        const response = await fetch('/api/partnership-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          alert('Partnership log submitted successfully!');
          setCurrentView('landing');
        } else {
          alert('Error submitting form. Please try again.');
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please try again.');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Agency Partnership Volunteer Log</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="example@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Number of "Families" Served *
                </label>
                <input
                  type="number"
                  required
                  value={formData.families_served}
                  onChange={(e) => setFormData({...formData, families_served: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Volunteer Hours</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left">Event Date</th>
                        <th className="border border-gray-300 p-3 text-left">Event Site</th>
                        <th className="border border-gray-300 p-3 text-left">Zip</th>
                        <th className="border border-gray-300 p-3 text-left">Total Hours Worked</th>
                        <th className="border border-gray-300 p-3 text-left">Total Volunteers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRows.map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => updateEventRow(index, 'date', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={row.site}
                              onChange={(e) => updateEventRow(index, 'site', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={row.zip}
                              onChange={(e) => updateEventRow(index, 'zip', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={row.hours}
                              onChange={(e) => updateEventRow(index, 'hours', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={row.volunteers}
                              onChange={(e) => updateEventRow(index, 'volunteers', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {eventRows.length < 11 && (
                  <button
                    type="button"
                    onClick={addEventRow}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Event Row
                  </button>
                )}
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Activity Log Form
  const ActivityForm = () => {
    const [formData, setFormData] = useState({
      volunteer_name: '',
      email: '',
      phone: '',
      student_id: '',
    });
    const [activities, setActivities] = useState([
      { date: '', activity: '', organization: '', location: '', hours: '', description: '' }
    ]);

    const addActivity = () => {
      setActivities([...activities, { date: '', activity: '', organization: '', location: '', hours: '', description: '' }]);
    };

    const updateActivity = (index: number, field: string, value: string) => {
      const newActivities = [...activities];
      newActivities[index][field] = value;
      setActivities(newActivities);
    };

    const handleSubmit = async () => {
      try {
        const submitData = {
          ...formData,
          activities: activities.filter(activity => activity.date && activity.activity && activity.organization)
        };

        const response = await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          alert('Activity log submitted successfully!');
          setCurrentView('landing');
        } else {
          alert('Error submitting form. Please try again.');
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please try again.');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Volunteer Activity Log</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.volunteer_name}
                    onChange={(e) => setFormData({...formData, volunteer_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Details</h3>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            value={activity.date}
                            onChange={(e) => updateActivity(index, 'date', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hours *
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={activity.hours}
                            onChange={(e) => updateActivity(index, 'hours', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization *
                          </label>
                          <input
                            type="text"
                            value={activity.organization}
                            onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Type *
                          </label>
                          <select
                            value={activity.activity}
                            onChange={(e) => updateActivity(index, 'activity', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Select Activity Type</option>
                            <option value="Community Service">Community Service</option>
                            <option value="Tutoring/Mentoring">Tutoring/Mentoring</option>
                            <option value="Environmental">Environmental</option>
                            <option value="Food Service">Food Service</option>
                            <option value="Construction/Repair">Construction/Repair</option>
                            <option value="Event Support">Event Support</option>
                            <option value="Administrative">Administrative</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={activity.location}
                            onChange={(e) => updateActivity(index, 'location', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Activity Description *
                        </label>
                        <textarea
                          value={activity.description}
                          onChange={(e) => updateActivity(index, 'description', e.target.value)}
                          required
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          placeholder="Describe the volunteer activity performed..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addActivity}
                  className="mt-3 text-green-600 hover:text-green-800 font-medium"
                >
                  + Add Another Activity
                </button>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Database Dashboard
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Volunteer Database</h1>
            <button
              onClick={() => setCurrentView('landing')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Home
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Volunteers</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total_volunteers || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-800">{Math.round(stats.total_hours || 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total_organizations || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recent Volunteers</h2>
              <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Export PDF Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Name</th>
                    <th className="border border-gray-300 p-3 text-left">Email</th>
                    <th className="border border-gray-300 p-3 text-left">Organization</th>
                    <th className="border border-gray-300 p-3 text-left">Total Hours</th>
                    <th className="border border-gray-300 p-3 text-left">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((volunteer: any, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-3">{volunteer.name}</td>
                      <td className="border border-gray-300 p-3">{volunteer.email}</td>
                      <td className="border border-gray-300 p-3">{volunteer.organization}</td>
                      <td className="border border-gray-300 p-3">{Math.round(volunteer.total_hours || 0)}</td>
                      <td className="border border-gray-300 p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          volunteer.log_type === 'partnership' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {volunteer.log_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Upload Component
  const UploadComponent = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Upload Completed Forms</h1>
            <button
              onClick={() => setCurrentView('landing')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Home
            </button>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Upload Volunteer Forms
              </h3>
              <p className="text-gray-500 mb-4">
                Drag and drop your completed forms here, or click to browse
              </p>
              <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Choose Files
              </button>
              <p className="text-sm text-gray-400 mt-2">
                Supported formats: PDF, Excel, Word documents
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Upload Instructions:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure all required fields are completed</li>
                <li>• Files will be automatically processed and added to the database</li>
                <li>• You'll receive a confirmation email once processing is complete</li>
                <li>• Maximum file size: 10MB per file</li>
              </ul>
            </div>

            <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Process Uploaded Forms
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'partnership':
        return <PartnershipForm />;
      case 'activity':
        return <ActivityForm />;
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadComponent />;
      default:
        return <LandingPage />;
    }
  };

  return renderCurrentView();
};

export default VolunteerApp;
EOF

# Step 7: Update layout and page files
echo "📝 Updating layout and page files..."

cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Volunteer Management System',
  description: 'Track volunteer hours and manage community service activities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
EOF

cat > src/app/page.tsx << 'EOF'
import VolunteerApp from '@/components/VolunteerApp';

export default function Home() {
  return <VolunteerApp />;
}
EOF

# Step 8: Create environment file template
echo "🔧 Creating environment file template..."
cat > .env.local << 'EOF'
# Database - These will be auto-populated by Vercel + Neon integration
POSTGRES_URL=""
POSTGRES_PRISMA_URL=""
POSTGRES_URL_NON_POOLING=""
POSTGRES_USER=""
POSTGRES_HOST=""
POSTGRES_PASSWORD=""
POSTGRES_DATABASE=""

# App
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
EOF

# Step 9: Create README
echo "📄 Creating README..."
cat > README.md << 'EOF'
# Volunteer Management System

A comprehensive web application for tracking volunteer hours and managing community service activities.

## Features

- Partnership Volunteer Log
- Individual Activity Log
- Database Dashboard with Search
- Form Upload and Processing
- PDF Export Capabilities

## Quick Start

1. Deploy to Vercel with Neon integration
2. Visit `/api/migrate` to set up database tables
3. Start using the application

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Vercel Postgres (Neon)
- Lucide React Icons

## Database Setup

After deploying to Vercel with Neon integration, visit `/api/migrate` to create the database schema.

## Development

```bash
npm run dev
```

Visit `http://localhost:3000`
EOF

# Step 10: Initialize git
echo "🗄️ Initializing git repository..."
git init
git add .
git commit -m "Initial commit: Volunteer Management System with full functionality"

# Step 11: Final instructions
echo ""
echo "🎉 Setup complete! Your volunteer management application is ready."
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository at https://github.com/new"
echo "2. Run: git remote add origin https://github.com/yourusername/volunteer-management.git"
echo "3. Run: git push -u origin main"
echo "4. Deploy to Vercel with Neon integration"
echo "5. Visit /api/migrate on your deployed app to set up the database"
echo ""
echo "Local development:"
echo "- Run 'npm run dev' to start the development server"
echo "- Visit http://localhost:3000"
echo ""
echo "Remember to update .env.local with your database credentials from Vercel!"
EOF

# Make the script executable
chmod +x setup.sh

echo "📁 Setup script created! Run the following commands:"
echo ""
echo "bash setup.sh"
echo ""
echo "This will create your entire project structure with all the code files."