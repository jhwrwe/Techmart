import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import ImagePreview from '@/components/admin/ImagePreview' 

export default async function EditCategoryPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  const existingCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.id, parseInt(id)))
    .limit(1)

  if (!existingCategory.length) {
    notFound()
  }

  const category = existingCategory[0]

  async function updateCategory(formData: FormData) {
    'use server'
    
    const nameEn = formData.get('nameEn') as string
    const nameId = formData.get('nameId') as string
    const image = formData.get('image') as string

    if (!nameEn || !nameId) {
      return
    }

    const slug = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    try {
      await db
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

      revalidatePath(`/${locale}/admin/categories`)
      redirect(`/${locale}/admin/categories`)
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                Edit Category
              </h1>
              <p className="text-gray-600 mt-1">Update category information</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Category Details
            </h2>
          </div>

          <form action={updateCategory} className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name (English) *
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    required
                    defaultValue={category.nameEn}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Electronics"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current slug: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{category.slug}</code>
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
                    defaultValue={category.nameId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Elektronik"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  defaultValue={category.image || ''}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://example.com/category-image.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: URL to category image (recommended size: 400x300px)
                </p>
              </div>

              {/* Current Image Preview */}
              {category.image && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Current Image
                  </h3>
                  <ImagePreview 
                    src={category.image} 
                    alt={category.nameEn}
                  />
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Category Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Created:</span>
                    <br />
                    <span className="text-blue-600">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Last Updated:</span>
                    <br />
                    <span className="text-blue-600">
                      {new Date(category.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

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
                  Update Category
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}