// src/components/AddToCartButton.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: number
  name: string
  nameEn?: string
  nameId?: string
  price: string | number
  imageUrl?: string | null
  stock: number
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
  stock: number
}

interface AddToCartButtonProps {
  product: Product
  locale: string
  quantity?: number
  className?: string
  showQuantitySelector?: boolean
}

export default function AddToCartButton({
  product,
  locale,
  quantity = 1,
  className = '',
  showQuantitySelector = false
}: AddToCartButtonProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(quantity)
  const [isAdding, setIsAdding] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const router = useRouter()

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }, [])

  const addToCart = async () => {
    if (product.stock < selectedQuantity) {
      alert('Not enough stock available!')
      return
    }

    setIsAdding(true)

    try {
      const existingItemIndex = cartItems.findIndex(item => item.id === product.id)
      let updatedCart: CartItem[]

      if (existingItemIndex >= 0) {
        // Update existing item
        updatedCart = [...cartItems]
        const newQuantity = updatedCart[existingItemIndex].quantity + selectedQuantity
        
        if (newQuantity > product.stock) {
          alert(`Cannot add more items. Only ${product.stock} available in stock.`)
          setIsAdding(false)
          return
        }

        updatedCart[existingItemIndex].quantity = newQuantity
      } else {
        // Add new item
        const newItem: CartItem = {
          id: product.id,
          name: locale === 'id' && product.nameId ? product.nameId : (product.nameEn || product.name),
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          quantity: selectedQuantity,
          imageUrl: product.imageUrl || undefined,
          stock: product.stock
        }
        updatedCart = [...cartItems, newItem]
      }

      // Save to localStorage and update state
      localStorage.setItem('cart', JSON.stringify(updatedCart))
      setCartItems(updatedCart)

      // Show success feedback
      alert('Product added to cart!')
      
      // Optional: redirect to cart page
      // router.push(`/${locale}/cart`)
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add product to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const isOutOfStock = product.stock === 0
  const isInsufficientStock = product.stock < selectedQuantity

  return (
    <div className="space-y-4">
      {showQuantitySelector && (
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Quantity:
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
              disabled={selectedQuantity <= 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span className="font-semibold text-lg w-8 text-center">{selectedQuantity}</span>
            <button
              type="button"
              onClick={() => setSelectedQuantity(Math.min(product.stock, selectedQuantity + 1))}
              disabled={selectedQuantity >= product.stock}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <span className="text-sm text-gray-500">
            ({product.stock} available)
          </span>
        </div>
      )}

      <button
        onClick={addToCart}
        disabled={isAdding || isOutOfStock || isInsufficientStock}
        className={`
          px-6 py-3 rounded-lg font-medium transition-colors
          ${isOutOfStock || isInsufficientStock
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
          ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {isAdding ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Adding...</span>
          </span>
        ) : isOutOfStock ? (
          'Out of Stock'
        ) : isInsufficientStock ? (
          'Not Enough Stock'
        ) : (
          'Add to Cart'
        )}
      </button>
    </div>
  )
}