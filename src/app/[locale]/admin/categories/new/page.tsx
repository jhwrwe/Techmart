import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export default async function AddCategoryPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  async function createCategory(formData: FormData) {
    'use server'
    
    const nameEn = formData.get('nameEn') as string
    const nameId = formData.get('nameId') as string
    const image = formData.get('image') as string

    if (!nameEn || !nameId) {
      // In a real app, you'd want to handle this error properly
      return
    }

    // Generate slug from English name
    const slug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    try {
      await db.insert(categories).values({
        name: nameEn, // Default to English
        nameEn,
        nameId,
        slug,
        image: image || null,
      })

      revalidatePath(`/${locale}/admin/categories`)
      redirect(`/${locale}/admin/categories`)
    } catch (error) {
      console.error('Failed to create category:', error)
      // Handle error (you might want to show this to user)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <a
              href={`/${locale}/admin/categories`}
              className="mr-4 p-2 rounded-lg bg-white shadow-sm hover:shadow-md border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Add New Category
              </h1>
              <p className="text-gray-600 mt-1">Create a new product category</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Category Details
            </h2>
          </div>

          <form action={createCategory} className="p-8">
            <div className="space-y-6">
              {/* Category Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name (English) *
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Electronics"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will be used to generate the URL slug
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name (Indonesian) *
                  </label>
                  <input
                    type="text"
                    name="nameId"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Elektronik"
                  />
                </div>
              </div>

              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://example.com/category-image.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: URL to category image (recommended size: 400x300px)
                </p>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </h3>
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
                  <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-5v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900">Category Name</h4>
                  <p className="text-sm text-gray-500">Your category will appear like this</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <a
                  href={`/${locale}/admin/categories`}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Category
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}