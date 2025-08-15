// src/app/[locale]/admin/users/page.tsx

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import { eq, desc, count, sum } from 'drizzle-orm'

interface UserWithStats {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: Date
  orderCount: number
  totalSpent: string
  lastOrderDate: Date | null
}

async function updateUserRole(userId: string, newRole: string) {
  'use server'
  
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // Prevent admin from changing their own role
  if (session.user.id === userId) {
    throw new Error('Cannot change your own role')
  }

  await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

export default async function AdminUsersPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ role?: string; page?: string }>
}) {
  const { locale } = await params
  const { role: roleFilter = 'all', page = '1' } = await searchParams
  
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  const pageSize = 10
  const offset = (parseInt(page) - 1) * pageSize

  // Build where condition based on role filter
  const whereCondition = roleFilter === 'all' ? undefined : eq(users.role, roleFilter)

  // Get users with basic info
  const usersData = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereCondition)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset)

  // Get user statistics
  const userIds = usersData.map(user => user.id)
  const userStats = userIds.length > 0 ? await Promise.all(
    userIds.map(async (userId) => {
      const [orderCountResult, totalSpentResult, lastOrderResult] = await Promise.all([
        db.select({ count: count() }).from(orders).where(eq(orders.userId, userId)),
        db.select({ total: sum(orders.totalAmount) })
          .from(orders)
          .where(eq(orders.userId, userId)),
        db.select({ createdAt: orders.createdAt })
          .from(orders)
          .where(eq(orders.userId, userId))
          .orderBy(desc(orders.createdAt))
          .limit(1)
      ])

      return {
        userId,
        orderCount: orderCountResult[0]?.count || 0,
        totalSpent: totalSpentResult[0]?.total || '0',
        lastOrderDate: lastOrderResult[0]?.createdAt || null
      }
    })
  ) : []

  // Combine users with their stats
  const usersWithStats: UserWithStats[] = usersData.map(user => {
    const stats = userStats.find(stat => stat.userId === user.id)
    return {
      ...user,
      orderCount: stats?.orderCount || 0,
      totalSpent: stats?.totalSpent || '0',
      lastOrderDate: stats?.lastOrderDate || null
    }
  })

  const roleOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'user', label: 'Customers' },
    { value: 'admin', label: 'Administrators' }
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <div className="flex gap-4">
          <a
            href={`/${locale}/admin`}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* Role Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Users</h2>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((option) => (
            <a
              key={option.value}
              href={`/${locale}/admin/users?role=${option.value}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {usersWithStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersWithStats.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.image ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.image}
                            alt={user.name || user.email}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(user.totalSpent).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastOrderDate 
                        ? user.lastOrderDate.toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.id !== session.user.id && (
                          <>
                            {user.role === 'user' ? (
                              <form action={updateUserRole.bind(null, user.id, 'admin')} className="inline">
                                <button
                                  type="submit"
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Promote to Admin"
                                >
                                  Promote
                                </button>
                              </form>
                            ) : (
                              <form action={updateUserRole.bind(null, user.id, 'user')} className="inline">
                                <button
                                  type="submit"
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Demote to User"
                                >
                                  Demote
                                </button>
                              </form>
                            )}
                          </>
                        )}
                        <a
                          href={`/${locale}/admin/users/${user.id}/orders`}
                          className="text-green-600 hover:text-green-900"
                          title="View User Orders"
                        >
                          Orders
                        </a>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No users found</p>
            <p className="text-gray-400">Users will appear here when they sign up</p>
          </div>
        )}
      </div>

      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{usersWithStats.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersWithStats.filter(user => user.orderCount > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersWithStats.filter(user => user.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${usersWithStats.reduce((sum, user) => sum + parseFloat(user.totalSpent), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {usersWithStats.length === pageSize && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {parseInt(page) > 1 && (
              <a
                href={`/${locale}/admin/users?role=${roleFilter}&page=${parseInt(page) - 1}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            <span className="px-4 py-2 bg-blue-600 text-white rounded-md">
              {page}
            </span>
            <a
              href={`/${locale}/admin/users?role=${roleFilter}&page=${parseInt(page) + 1}`}
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