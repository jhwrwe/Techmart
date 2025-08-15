import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { eq, like, and, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    
    let query = db
      .select({
        id: products.id,
        name: locale === 'id' ? products.nameId : products.nameEn,
        description: locale === 'id' ? products.descriptionId : products.descriptionEn,
        price: products.price,
        stock: products.stock,
        imageUrl: products.imageUrl,
        category: locale === 'id' ? categories.nameId : categories.nameEn,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))

    const conditions = [eq(products.isActive, true)]

    if (search) {
      conditions.push(
        locale === 'id'
          ? like(products.nameId, `%${search}%`)
          : like(products.nameEn, `%${search}%`)
      )
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)))
    }

    const results = await query
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(50)

    return NextResponse.json({
      success: true,
      products: results
    })
  } catch (error) {
    console.error('Products API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}