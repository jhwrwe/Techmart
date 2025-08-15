import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'

export default async function CategoriesPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  const categoriesWithCount = await db
    .select({
      id: categories.id,
      nameEn: categories.nameEn,
      nameId: categories.nameId,
      slug: categories.slug,
      image: categories.image,
      createdAt: categories.createdAt,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(categories.id, products.categoryId))
    .groupBy(categories.id, categories.nameEn, categories.nameId, categories.slug, categories.image, categories.createdAt)
    .orderBy(categories.createdAt)

  async function deleteCategory(formData: FormData) {
    'use server'
    
    const categoryId = formData.get('categoryId') as string
    
    try {
      await db.delete(categories).where(eq(categories.id, parseInt(categoryId)))
      revalidatePath(`/${locale}/admin/categories`)
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <a
                href={`/${locale}/admin`}
                className="mr-4 p-2 rounded-lg bg-white shadow-sm hover:shadow-md border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Manage Categories
                </h1>
                <p className="text-gray-600 mt-1">Organize your product categories</p>
              </div>
            </div>
            
            <a
              href={`/${locale}/admin/categories/new`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-5v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              All Categories ({categoriesWithCount.length})
            </h2>
          </div>

          {categoriesWithCount.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-5v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first product category</p>
              <a
                href={`/${locale}/admin/categories/new`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Category
              </a>
            </div>
          ) : (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoriesWithCount.map((category) => (
                  <div key={category.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.nameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-5v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {locale === 'id' ? category.nameId : category.nameEn}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Slug: {category.slug}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          {category.productCount} products
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a
                          href={`/${locale}/admin/categories/${category.id}/edit`}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                        >
                          Edit
                        </a>
                        
                        <DeleteCategoryButton
                          categoryId={category.id}
                          categoryName={category.nameEn}
                          productCount={category.productCount}
                          deleteAction={deleteCategory}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}