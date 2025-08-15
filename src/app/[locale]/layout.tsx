import Image from 'next/image'
import Link from 'next/link'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth/config'
import { Inter } from 'next/font/google'
import { t, type Locale } from '@/lib/i18n'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TechMart - Your Electronics Destination',
  description: 'Modern e-commerce platform for electronics and gadgets',
}

type LocaleLayoutProps = {
  children: React.ReactNode
  params: { locale: string } 
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = params
  const session = await auth()

  const validLocale = (['en', 'id'].includes(locale) ? locale : 'en') as Locale

  return (
    <html lang={validLocale}>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
              <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <h1 className="text-xl font-bold text-gray-900">TechMart</h1>
                    </div>

                    <div className="ml-10 flex space-x-8">
                      <Link href={`/${validLocale}`} className="text-gray-500 hover:text-gray-700">
                        {t(validLocale, 'nav.home')}
                      </Link>

                      <Link
                        href={`/${validLocale}/products`}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {t(validLocale, 'nav.products')}
                      </Link>

                      {session?.user ? (
                        <Link
                          href={`/${validLocale}/account`}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {t(validLocale, 'nav.account') || 'Account'}
                        </Link>
                      ) : (
                        <Link
                          href={`/${validLocale}/auth/signin`}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {t(validLocale, 'nav.signin')}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {session?.user && (
                      <div className="flex items-center space-x-3">
                        {session.user.image && (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <span className="text-sm text-gray-700">{session.user.name}</span>
                      </div>
                    )}

                    {/* Language switches — juga internal route: gunakan Link */}
                    <Link href="/en" className={`px-2 py-1 text-sm ${validLocale === 'en' ? 'font-bold' : ''}`}>
                      EN
                    </Link>
                    <Link href="/id" className={`px-2 py-1 text-sm ${validLocale === 'id' ? 'font-bold' : ''}`}>
                      ID
                    </Link>
                  </div>
                </div>
              </nav>
            </header>

            <main>{children}</main>

            <footer className="bg-white border-t border-gray-200">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">© 2025 TechMart. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
