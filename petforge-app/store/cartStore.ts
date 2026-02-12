import { create } from 'zustand'
import api from '@/lib/api'

// Check if user is authenticated
const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('auth_token')
}

export interface CartItem {
  id: string
  petIpId?: string
  productType: string
  productName: string
  price: number
  size?: string
  baseStyle?: string
  quantity: number
  originalImage?: string
  generatedImage?: string
}

interface CartStore {
  items: CartItem[]
  userId: string
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  setUserId: (userId: string) => void
  loadCart: () => Promise<void>
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  userId: 'default-user',
  isOpen: false,

  setUserId: (userId: string) => set({ userId }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  loadCart: async () => {
    // Skip if not authenticated
    if (!isAuthenticated()) {
      return
    }
    try {
      const result = await api.getCart()

      if (result.success) {
        set({ items: result.data })
      }
    } catch (error) {
      // Silently handle auth errors
      if (error instanceof Error && error.message.includes('token')) {
        return
      }
      console.error('Failed to load cart:', error)
    }
  },

  addItem: async (item) => {
    // Skip if not authenticated
    if (!isAuthenticated()) {
      console.warn('Please login to add items to cart')
      return
    }
    try {
      const result = await api.addToCart(item)

      if (result.success) {
        set((state) => ({ items: [...state.items, result.data] }))
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  },

  removeItem: async (id: string) => {
    try {
      await api.removeFromCart(id)

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }))
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  },

  updateQuantity: async (id: string, quantity: number) => {
    // Optimistic update
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }))

    try {
      await api.updateCartItemQuantity(id, quantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
      // Revert on error
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: Math.max(1, quantity - 1) } : item
        ),
      }))
    }
  },

  clearCart: () => set({ items: [] }),

  getTotalPrice: () => {
    const { items } = get()
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  },

  getTotalItems: () => {
    const { items } = get()
    return items.reduce((total, item) => total + item.quantity, 0)
  },
}))
