import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { orders, orderItems, products, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface OrderDetail {
  id: number
  totalAmount: string
  status: string
  paymentStatus: string
  email: string
  shippingAddress: string | null
  orderNotes: string | null
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
      price: string
    } | null
  }>
}

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${locale}/auth/signin`)
  }

  // Get order details
  const orderData = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      email: orders.email,
      shippingAddress: orders.shippingAddress,
      orderNotes: orders.orderNotes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, parseInt(id)))
    .limit(1)

  if (orderData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-8">The order you're looking for doesn't exist.</p>
        <a
          href={`/${locale}/account`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Account
        </a>
      </div>
    )
  }

  const order = orderData[0]

  // Check if user can view this order
  if (session.user.role !== 'admin' && order.userId !== session.user.id) {
    redirect(`/${locale}/account`)
  }

  // Get order items
  const orderItemsData = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productId: orderItems.productId,
      productName: products.name,
      productNameEn: products.nameEn,
      productNameId: products.nameId,
      productImageUrl: products.imageUrl,
      productPrice: products.price,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, parseInt(id)))

  const orderDetail: OrderDetail = {
    id: order.id,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    email: order.email,
    shippingAddress: order.shippingAddress,
    orderNotes: order.orderNotes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: order.userId ? {
      id: order.userId,
      name: order.userName,
      email: order.userEmail
    } : null,
    items: orderItemsData.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      product: item.productId ? {
        id: item.productId,
        name: item.productName || '',
        nameEn: item.productNameEn || '',
        nameId: item.productNameId || '',
        imageUrl: item.productImageUrl,
        price: item.productPrice || '0'
      } : null
    }))
  }

  const subtotal = orderDetail.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
  const tax = subtotal * 0.1
  const shipping = subtotal > 100 ? 0 : 10

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order #{orderDetail.id}</h1>
          <p className="text-gray-600">
            Placed on {orderDetail.createdAt.toLocaleDateString()} at {orderDetail.createdAt.toLocaleTimeString()}
          </p>
        </div>
        <a
          href={`/${locale}/account`}
          className="btn-secondary"
        >
          ← Back to Account
        </a>
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Order Status</h2>
          <div className="flex space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              orderDetail.status === 'completed' ? 'bg-green-100 text-green-800' :
              orderDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              orderDetail.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              orderDetail.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
              'bg-red-100 text-red-800'
            }`}>
              {orderDetail.status.charAt(0).toUpperCase() + orderDetail.status.slice(1)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              orderDetail.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
              orderDetail.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Payment: {orderDetail.paymentStatus}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className={orderDetail.status === 'pending' ? 'text-blue-600 font-medium' : ''}>
              Order Placed
            </span>
            <span className={orderDetail.status === 'processing' ? 'text-blue-600 font-medium' : ''}>
              Processing
            </span>
            <span className={orderDetail.status === 'shipped' ? 'text-blue-600 font-medium' : ''}>
              Shipped
            </span>
            <span className={orderDetail.status === 'completed' ? 'text-blue-600 font-medium' : ''}>
              Delivered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: 
                  orderDetail.status === 'pending' ? '25%' :
                  orderDetail.status === 'processing' ? '50%' :
                  orderDetail.status === 'shipped' ? '75%' :
                  orderDetail.status === 'completed' ? '100%' : '0%'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Items Ordered</h2>
          
          <div className="space-y-4">
            {orderDetail.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.product?.imageUrl ? 'hidden' : ''}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {item.product ? (
                      locale === 'id' ? item.product.nameId : item.product.nameEn
                    ) : (
                      'Product not found'
                    )}
                  </h3>
                  <p className="text-gray-600">
                    Quantity: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg text-blue-600">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Shipping */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping:</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-blue-600">${parseFloat(orderDetail.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer:</label>
                <p className="text-gray-900">
                  {orderDetail.user?.name || 'Guest Customer'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <p className="text-gray-900">{orderDetail.email}</p>
              </div>

              {orderDetail.shippingAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipping Address:</label>
                  <p className="text-gray-900 whitespace-pre-line">
                    {orderDetail.shippingAddress}
                  </p>
                </div>
              )}

              {orderDetail.orderNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Notes:</label>
                  <p className="text-gray-900">{orderDetail.orderNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-blue-700 text-sm mb-4">
              Have questions about your order? We're here to help!
            </p>
            <a
              href={`/${locale}/contact`}
              className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}