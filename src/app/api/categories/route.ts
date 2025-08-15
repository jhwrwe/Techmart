import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq, like, and, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const search = searchParams.get('search')
    
    let query = db
      .select({
        id: categories.id,
        name: locale === 'id' ? categories.nameId : categories.nameEn,
        nameEn: categories.nameEn,
        nameId: categories.nameId,
        slug: categories.slug,
        image: categories.image,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)

    const conditions = []
    
    if (search) {
      conditions.push(
        locale === 'id'
          ? like(categories.nameId, `%${search}%`)
          : like(categories.nameEn, `%${search}%`)
      )
    }

    const results = await query
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(categories.createdAt))

    return NextResponse.json({
      success: true,
      categories: results
    })
  } catch (error) {
    console.error('Categories API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nameEn, nameId, image } = body

    if (!nameEn || !nameId) {
      return NextResponse.json(
        { success: false, error: 'Name (English and Indonesian) is required' },
        { status: 400 }
      )
    }

    // Generate slug from English name
    const slug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const newCategory = await db.insert(categories).values({
      name: nameEn, // Default to English
      nameEn,
      nameId,
      slug,
      image: image || null,
    }).returning()

    return NextResponse.json({
      success: true,
      category: newCategory[0]
    })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}