// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET - Fetch categories
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'volunteer', 'requester', or null for all
    const active = url.searchParams.get('active') !== 'false'; // default to true

    let query = `
      SELECT 
        id,
        category_name,
        category_type,
        description,
        display_order,
        is_active
      FROM job_categories
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (type && (type === 'volunteer' || type === 'requester')) {
      paramCount++;
      query += ` AND category_type = $${paramCount}`;
      params.push(type);
    }

    if (active) {
      query += ` AND is_active = true`;
    }

    query += ` ORDER BY display_order, category_name`;

    const categories = await sql(query, params);

    // Group by type if no specific type requested
    if (!type) {
      const grouped = {
        volunteer: categories.filter((cat: any) => cat.category_type === 'volunteer'),
        requester: categories.filter((cat: any) => cat.category_type === 'requester')
      };
      return NextResponse.json(grouped);
    }

    return NextResponse.json(categories);

  } catch (error) {
    console.error('Categories API: Error fetching categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}