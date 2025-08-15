import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export default async function EditProductPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/auth/signin`)
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, parseInt(id)))

  if (!product) {
    notFound()
  }

  const allCategories = await db.select().from(categories)

  async function updateProduct(formData: FormData) {
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
    const isActive = formData.get('isActive') === 'on'

    try {
      await db
        .update(products)
        .set({
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
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parseInt(id)))

      revalidatePath(`/${locale}/admin/products`)
      redirect(`/${locale}/admin/products`)
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <a
          href={`/${locale}/admin/products`}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Products
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form action={updateProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={product.nameEn || product.name}
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
                defaultValue={product.nameId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="iPhone 15 Pro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (English)
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={product.descriptionEn || product.description || ''}
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
                defaultValue={product.descriptionId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Smartphone canggih dengan..."
              />
            </div>
          </div>

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
                defaultValue={product.price}
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
                defaultValue={product.comparePrice || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1199.00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Show original price for discounts
              </p>
            </div>
          </div>

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
                defaultValue={product.stock}
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
                defaultValue={product.categoryId || ''}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              defaultValue={product.imageUrl || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional: URL to product image
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                id="isFeatured"
                defaultChecked={product.isFeatured}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                Feature this product on homepage
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                defaultChecked={product.isActive}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Product is active and visible to customers
              </label>
            </div>
          </div>

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
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}