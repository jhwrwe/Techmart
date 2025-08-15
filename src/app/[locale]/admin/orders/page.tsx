// src/app/[locale]/admin/orders/page.tsx

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { orders, orderItems, products, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

interface OrderWithDetails {
  id: number
  totalAmount: string
  status: string
  paymentStatus: string
  email: string 
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
  } | null
  items: Array<{
    id: number
    quantity: number
    price: string
    product: {
      id: number
      name: string
      nameEn: string
      nameId: string
      imageUrl: string | null
    }
  }>
}

async function updateOrderStatus(orderId: number, status: string) {
  'use server'
  
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  await db
    .update(orders)
    .set({ 
      status, 
      updatedAt: new Date(),
      ...(status === 'completed' && { paymentStatus: 'paid' })
    })
    .where(eq(orders.id, orderId))
}

export default async function AdminOrdersPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { locale } = await params
  const { status: statusFilter = 'all', page = '1' } = await searchParams
  
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  const pageSize = 10
  const offset = (parseInt(page) - 1) * pageSize

  // Build where condition based on status filter
  const whereCondition = statusFilter === 'all' ? undefined : eq(orders.status, statusFilter)

  const ordersData = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      email: orders.email,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userId: orders.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(whereCondition)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset)

  // Get order items for each order
  const orderIds = ordersData.map(order => order.id)
  const orderItemsData = orderIds.length > 0 ? await db
    .select({
      orderId: orderItems.orderId,
      id: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productId: orderItems.productId,
      productName: products.name,
      productNameEn: products.nameEn,
      productNameId: products.nameId,
      productImageUrl: products.imageUrl,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(and(...orderIds.map(id => eq(orderItems.orderId, id))))
  : []

  const ordersWithDetails: OrderWithDetails[] = ordersData.map(order => ({
    id: order.id,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    email: order.email,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: order.userId ? {
      id: order.userId,
      name: order.userName,
      email: order.userEmail
    } : null,
    items: orderItemsData
      .filter(item => item.orderId === order.id)
      .map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.productId,
          name: item.productName || '',
          nameEn: item.productNameEn || '',
          nameId: item.productNameId || '',
          imageUrl: item.productImageUrl
        }
      }))
  }))

  const statusOptions = [
    { value: 'all', label: 'All Orders', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'processing', label: 'Processing', count: 0 },
    { value: 'shipped', label: 'Shipped', count: 0 },
    { value: 'completed', label: 'Completed', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 }
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <div className="flex gap-4">
          <a
            href={`/${locale}/admin`}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Orders</h2>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <a
              key={option.value}
              href={`/${locale}/admin/orders?status=${option.value}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {ordersWithDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordersWithDetails.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user?.name || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={item.id}>
                            {item.quantity}x {locale === 'id' ? item.product.nameId : item.product.nameEn}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div>+{order.items.length - 2} more...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </div>
                      <div className={`text-xs ${
                        order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {order.paymentStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={`/${locale}/admin/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </a>
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                          <>
                            <form action={updateOrderStatus.bind(null, order.id, 'processing')} className="inline">
                              <button
                                type="submit"
                                className="text-green-600 hover:text-green-900"
                                disabled={order.status === 'processing'}
                              >
                                Process
                              </button>
                            </form>
                            <form action={updateOrderStatus.bind(null, order.id, 'completed')} className="inline">
                              <button
                                type="submit"
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Complete
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400">Orders will appear here when customers make purchases</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {ordersWithDetails.length === pageSize && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {parseInt(page) > 1 && (
              <a
                href={`/${locale}/admin/orders?status=${statusFilter}&page=${parseInt(page) - 1}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            <span className="px-4 py-2 bg-blue-600 text-white rounded-md">
              {page}
            </span>
            <a
              href={`/${locale}/admin/orders?status=${statusFilter}&page=${parseInt(page) + 1}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </a>
          </div>
        </div>
      )}
    </div>
  )
}