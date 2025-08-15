import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { t, type Locale } from '@/lib/i18n'

type HomePageProps = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  console.log("Currently in page.tsx, locale:", locale)

  const validLocale = (['en', 'id'].includes(locale) ? locale : 'en') as Locale
  
  const featuredProducts = await db
    .select()
    .from(products)
    .where(eq(products.isFeatured, true))
    .limit(8)
    .orderBy(desc(products.createdAt))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t(validLocale, 'home.title')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t(validLocale, 'home.subtitle')}
        </p>
        <a 
          href={`/${validLocale}/products`}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-block"
        >
          {t(validLocale, 'home.viewAllProducts')}
        </a>
      </div>

      <div className="py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t(validLocale, 'home.featuredProducts')}
        </h2>
        
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-w-1 aspect-h-1">
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={validLocale === 'id' ? product.nameId : product.nameEn}
                      className="w-full h-48 object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {validLocale === 'id' ? product.nameId : product.nameEn}
                  </h3>
                  <p className="text-green-600 font-bold">
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              No featured products available.
            </p>
            <a href={`/${validLocale}/admin`} className="text-blue-600 hover:underline">
              Add some products in admin panel
            </a>
          </div>
        )}
      </div>
    </div>
  )
}