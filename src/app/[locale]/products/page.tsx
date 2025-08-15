import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { eq, like, and, gte, lte, desc } from 'drizzle-orm'
import AddToCartButton from '@/components/AddToCartButton'
import { t, type Locale } from '@/lib/i18n'

interface SearchParams {
  search?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  page?: string
}

export default async function ProductsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: SearchParams
}) {
  const { locale } = await params
  const validLocale = (['en', 'id'].includes(locale) ? locale : 'en') as Locale
  
  const conditions = [eq(products.isActive, true)]
  
  if (searchParams.search) {
    const searchTerm = `%${searchParams.search}%`
    conditions.push(
      validLocale === 'id' 
        ? like(products.nameId, searchTerm)
        : like(products.nameEn, searchTerm)
    )
  }
  
  if (searchParams.category) {
    conditions.push(eq(products.categoryId, parseInt(searchParams.category)))
  }
  
  if (searchParams.minPrice) {
    conditions.push(gte(products.price, searchParams.minPrice))
  }
  
  if (searchParams.maxPrice) {
    conditions.push(lte(products.price, searchParams.maxPrice))
  }

  const [productsData, categoriesData] = await Promise.all([
    db
      .select({
        id: products.id,
        name: validLocale === 'id' ? products.nameId : products.nameEn,
        description: validLocale === 'id' ? products.descriptionId : products.descriptionEn,
        price: products.price,
        stock: products.stock,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(20),
    
    db
      .select({
        id: categories.id,
        name: validLocale === 'id' ? categories.nameId : categories.nameEn
      })
      .from(categories)
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t(validLocale, 'products.title')}</h1>
          
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder={t(validLocale, 'products.search')}
              defaultValue={searchParams.search}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              <form method="GET" className="space-y-4">
                {searchParams.search && (
                  <input type="hidden" name="search" value={searchParams.search} />
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(validLocale, 'products.category')}
                  </label>
                  <select
                    name="category"
                    defaultValue={searchParams.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categoriesData.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(validLocale, 'products.price')} Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      placeholder="Min"
                      defaultValue={searchParams.minPrice}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      placeholder="Max"
                      defaultValue={searchParams.maxPrice}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </form>
            </div>
          </aside>

          <main className="lg:w-3/4">
            {productsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-blue-600">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                        <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.stock > 0 ? t(validLocale, 'products.inStock') : t(validLocale, 'products.outOfStock')}
                        </span>
                      </div>
                      <AddToCartButton product={product} locale={validLocale} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}