// src/app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { orders, orderItems, products } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  stock: number
}

interface CustomerInfo {
  email: string
  firstName: string
  lastName: string
  address: string
  city: string
  postalCode: string
  phone?: string
}

interface OrderRequest {
  items: OrderItem[]
  customerInfo: CustomerInfo
  totalAmount: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body: OrderRequest = await request.json()

    if (!body.items || !body.customerInfo || !body.totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    for (const item of body.items) {
      const product = await db
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, item.id))
        .limit(1)

      if (product.length === 0) {
        return NextResponse.json(
          { success: false, error: `Product ${item.name} not found` },
          { status: 400 }
        )
      }

      if (product[0].stock < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Insufficient stock for ${item.name}. Available: ${product[0].stock}, Requested: ${item.quantity}` 
          },
          { status: 400 }
        )
      }
    }

    const shippingAddress = `${body.customerInfo.firstName} ${body.customerInfo.lastName}\n${body.customerInfo.address}\n${body.customerInfo.city}, ${body.customerInfo.postalCode}${body.customerInfo.phone ? `\nPhone: ${body.customerInfo.phone}` : ''}`

    const result = await db.transaction(async (tx) => {
      const newOrder = await tx
        .insert(orders)
        .values({
          userId: session?.user?.id || null,
          email: body.customerInfo.email,
          totalAmount: body.totalAmount.toString(),
          status: 'pending',
          paymentStatus: 'pending',
          shippingAddress,
        })
        .returning({ id: orders.id })

      const orderId = newOrder[0].id

      for (const item of body.items) {
        await tx.insert(orderItems).values({
          orderId,
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toString(),
        })

        await tx
          .update(products)
          .set({ 
            stock: sql`GREATEST(0, ${products.stock} - ${item.quantity})`, 
            updatedAt: new Date()
          })
          .where(eq(products.id, item.id))
      }

      return orderId
    })

    return NextResponse.json({
      success: true,
      orderId: result,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereCondition
    if (session.user.role === 'admin') {
      whereCondition = status ? eq(orders.status, status) : undefined
    } else {
      whereCondition = status 
        ? eq(orders.userId, session.user.id) && eq(orders.status, status)
        : eq(orders.userId, session.user.id)
    }

    const userOrders = await db
      .select({
        id: orders.id,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        email: orders.email,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(whereCondition)
      .orderBy(orders.createdAt)
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      orders: userOrders,
      pagination: {
        page,
        limit,
        total: userOrders.length
      }
    })

  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}