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

// POST - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { category_name, category_type, description, display_order } = body;
    
    if (!category_name || !category_type) {
      return NextResponse.json(
        { error: 'Category name and type are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO job_categories (category_name, category_type, description, display_order)
      VALUES (${category_name}, ${category_type}, ${description || null}, ${display_order || 999})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });

  } catch (error) {
    console.error('Categories API: Error creating category:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category_name, description, display_order, is_active } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE job_categories
      SET 
        category_name = COALESCE(${category_name}, category_name),
        description = COALESCE(${description}, description),
        display_order = COALESCE(${display_order}, display_order),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error('Categories API: Error updating category:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}