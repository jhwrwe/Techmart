import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { products, orderItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      )
    }
    
    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has any orders
    const existingOrders = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
      .limit(1)

    if (existingOrders.length > 0) {
      // Instead of deleting, deactivate the product
      await db
        .update(products)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))

      return NextResponse.json({
        success: true,
        message: 'Product deactivated successfully (has existing orders)',
        deactivated: true
      })
    }

    // Safe to delete if no orders exist
    await db
      .delete(products)
      .where(eq(products.id, productId))

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      deleted: true
    })

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      )
    }
    
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product
    })

  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}