export const translations = {
  en: {
    home: {
      title: 'Welcome to TechMart',
      subtitle: 'Your Electronics Destination',
      viewAllProducts: 'View All Products',
      featuredProducts: 'Featured Products'
    },
    nav: {
      home: 'Home',
      products: 'Products',
      signin: 'Sign In',
      admin: 'Admin',
      account: 'Account'
    },
    auth: {
      welcome: 'Welcome back',
      signInToYourAccount: 'Sign in to your account',
      signInWithGoogle: 'Sign in with Google'
    },
    products: {
      title: 'Products',
      search: 'Search products...',
      category: 'Category',
      price: 'Price',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      addToCart: 'Add to Cart'
    },
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      remove: 'Remove',
      total: 'Total',
      checkout: 'Proceed to Checkout'
    }
  },
  id: {
    home: {
      title: 'Selamat Datang di TechMart',
      subtitle: 'Destinasi Elektronik Anda',
      viewAllProducts: 'Lihat Semua Produk',
      featuredProducts: 'Produk Unggulan'
    },
    nav: {
      home: 'Beranda',
      products: 'Produk',
      signin: 'Masuk',
      admin: 'Admin',
      account: 'Akun'
    },
    auth: {
      welcome: 'Selamat datang kembali',
      signInToYourAccount: 'Masuk ke akun Anda',
      signInWithGoogle: 'Masuk dengan Google'
    },
    products: {
      title: 'Produk',
      search: 'Cari produk...',
      category: 'Kategori',
      price: 'Harga',
      inStock: 'Tersedia',
      outOfStock: 'Habis',
      addToCart: 'Tambah ke Keranjang'
    },
    cart: {
      title: 'Keranjang Belanja',
      empty: 'Keranjang Anda kosong',
      remove: 'Hapus',
      total: 'Total',
      checkout: 'Lanjut ke Pembayaran'
    }
  }
}

export type Locale = 'en' | 'id'

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.')
  let value: any = translations[locale]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  return value || key
}

export function t(locale: Locale, key: string): string {
  return getTranslation(locale, key)
}

export const authTranslations = {
  en: {
    welcome: 'Welcome back',
    signInToYourAccount: 'Sign in to your account',
    signInWithGoogle: 'Sign in with Google'
  },
  id: {
    welcome: 'Selamat datang kembali',
    signInToYourAccount: 'Masuk ke akun Anda',
    signInWithGoogle: 'Masuk dengan Google'
  }
}