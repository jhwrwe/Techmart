import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export default async function AddProductPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  const allCategories = await db.select().from(categories)

  async function createProduct(formData: FormData) {
    'use server'
    
    const name = formData.get('name') as string
    const nameId = formData.get('nameId') as string
    const description = formData.get('description') as string
    const descriptionId = formData.get('descriptionId') as string
    const price = formData.get('price') as string
    const comparePrice = formData.get('comparePrice') as string
    const stock = parseInt(formData.get('stock') as string)
    const categoryId = formData.get('categoryId') as string
    const imageUrl = formData.get('imageUrl') as string
    const isFeatured = formData.get('isFeatured') === 'on'

    try {
      await db.insert(products).values({
        name,
        nameEn: name,
        nameId: nameId || name,
        description,
        descriptionEn: description,
        descriptionId: descriptionId || description,
        price,
        comparePrice: comparePrice || null,
        stock,
        categoryId: categoryId ? parseInt(categoryId) : null,
        imageUrl: imageUrl || null,
        isFeatured,
        isActive: true,
      })

      revalidatePath(`/${locale}/admin/products`)
      redirect(`/${locale}/admin/products`)
    } catch (error) {
      console.error('Failed to create product:', error)
      // Handle error (you might want to show this to user)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <a
          href={`/${locale}/admin/products`}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Products
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form action={createProduct} className="space-y-6">
          {/* English Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="iPhone 15 Pro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (Indonesian)
              </label>
              <input
                type="text"
                name="nameId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="iPhone 15 Pro"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (English)
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Advanced smartphone with..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Indonesian)
              </label>
              <textarea
                name="descriptionId"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Smartphone canggih dengan..."
              />
            </div>
          </div>

          {/* Price and Compare Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="999.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare Price (USD)
              </label>
              <input
                type="number"
                name="comparePrice"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1199.00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Show original price for discounts
              </p>
            </div>
          </div>

          {/* Stock and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="categoryId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Category</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional: URL to product image
            </p>
          </div>

          {/* Featured Product */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isFeatured"
              id="isFeatured"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
              Feature this product on homepage
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <a
              href={`/${locale}/admin/products`}
              className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}