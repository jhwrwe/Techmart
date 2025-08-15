import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.id, parseInt(id)))
      .limit(1)

    if (!category.length) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category: category[0]
    })
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
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

    const updatedCategory = await db
      .update(categories)
      .set({
        name: nameEn,
        nameEn,
        nameId,
        slug,
        image: image || null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, parseInt(id)))
      .returning()

    if (!updatedCategory.length) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category: updatedCategory[0]
    })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const deletedCategory = await db
      .delete(categories)
      .where(eq(categories.id, parseInt(id)))
      .returning()

    if (!deletedCategory.length) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}