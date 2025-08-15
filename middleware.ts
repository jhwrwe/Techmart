// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  console.log('Middleware running for:', pathname)
  
  // If accessing root, redirect to /en
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', request.url))
  }
  
  // Check if path has valid locale
  const pathSegments = pathname.split('/').filter(Boolean)
  const locale = pathSegments[0]
  
  if (!['en', 'id'].includes(locale)) {
    // If no valid locale, redirect to /en + original path
    return NextResponse.redirect(new URL('/en' + pathname, request.url))
  }
  
  // Check if this is a protected route
  const pathWithoutLocale = '/' + pathSegments.slice(1).join('/')
  const isProtectedRoute = pathWithoutLocale.startsWith('/admin') || 
                          pathWithoutLocale.startsWith('/account')
  
  if (isProtectedRoute) {
    return auth((req) => {
      if (!req.auth) {
        const signInUrl = new URL(`/${locale}/auth/signin`, request.url)
        return NextResponse.redirect(signInUrl)
      }
      return NextResponse.next()
    })(request, {} as any)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}