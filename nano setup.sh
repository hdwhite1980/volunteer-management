# Navigate to your project directory (if not already there)
cd volunteer-management

# Install the required dependencies
npm install @vercel/postgres lucide-react jspdf html2canvas
npm install -D @types/node

# Create the directory structure
mkdir -p src/app/api/partnership-logs
mkdir -p src/app/api/activity-logs  
mkdir -p src/app/api/volunteers
mkdir -p src/app/api/migrate
mkdir -p src/components
mkdir -p src/lib

# Replace the default page.tsx with our app
cat > src/app/page.tsx << 'EOF'
import VolunteerApp from '@/components/VolunteerApp';

export default function Home() {
  return <VolunteerApp />;
}
EOF

# Update the layout
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

# Create the database utilities
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

# Create the API routes
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

# Create the main React component (this is a large file)
echo "Creating main React component..."
# Note: You'll need to copy the VolunteerApp component content manually
# from the artifact I created earlier due to its size

echo "✅ Basic structure created!"
echo ""
echo "⚠️  IMPORTANT: You still need to create the main component file:"
echo "Copy the VolunteerApp component code from my previous response"
echo "and save it as: src/components/VolunteerApp.tsx"
echo ""
echo "After that, run:"
echo "npm run dev"