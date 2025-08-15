import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { like, and, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const search = searchParams.get('search')
    
    const query = db
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

    const conditions: any[] = []
    
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
