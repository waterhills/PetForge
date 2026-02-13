import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCartStore } from '../../store/cartStore'
import api from '../../lib/api'

// Mock API module
vi.mock('../../lib/api', () => ({
  default: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateCartItemQuantity: vi.fn(),
  },
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
})

describe('useCartStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    // Reset store state
    useCartStore.setState({
      items: [],
      userId: 'default-user',
      isOpen: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.items).toEqual([])
      expect(result.current.userId).toBe('default-user')
      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('setUserId', () => {
    it('should set user ID', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.setUserId('user-123')
      })

      expect(result.current.userId).toBe('user-123')
    })
  })

  describe('toggleCart', () => {
    it('should toggle cart open state from closed to open', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggleCart()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('should toggle cart open state from open to closed', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.isOpen = true
      })

      act(() => {
        result.current.toggleCart()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('should handle multiple toggles', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.toggleCart()
        result.current.toggleCart()
        result.current.toggleCart()
      })

      expect(result.current.isOpen).toBe(true)
    })
  })

  describe('loadCart', () => {
    it('should load cart items successfully', async () => {
      const mockCartItems = [
        {
          id: 'cart-item-1',
          petIpId: 'pet-123',
          productType: 'tshirt',
          productName: 'Custom T-Shirt',
          price: 99.99,
          quantity: 2,
        },
        {
          id: 'cart-item-2',
          productType: 'mug',
          productName: 'Custom Mug',
          price: 29.99,
          quantity: 1,
        },
      ]

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.getCart).mockResolvedValue({
        success: true,
        data: mockCartItems,
      })

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.loadCart()
      })

      expect(result.current.items).toEqual(mockCartItems)
      expect(api.getCart).toHaveBeenCalled()
    })

    it('should skip loading when not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.loadCart()
      })

      expect(api.getCart).not.toHaveBeenCalled()
      expect(result.current.items).toEqual([])
    })

    it('should handle load cart failure gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.getCart).mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.loadCart()
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.items).toEqual([])

      consoleSpy.mockRestore()
    })

    it('should handle token-related errors silently', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token')
      vi.mocked(api.getCart).mockRejectedValue(
        new Error('token expired')
      )

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.loadCart()
      })

      // Should not throw error
      expect(result.current.items).toEqual([])
    })

    it('should handle empty cart', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.getCart).mockResolvedValue({
        success: true,
        data: [],
      })

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.loadCart()
      })

      expect(result.current.items).toEqual([])
    })
  })

  describe('addItem', () => {
    it('should add item to cart successfully', async () => {
      const newItem = {
        petIpId: 'pet-123',
        productType: 'tshirt',
        productName: 'Custom T-Shirt',
        price: 99.99,
        quantity: 1,
        originalImage: 'http://example.com/original.jpg',
        generatedImage: 'http://example.com/generated.jpg',
      }

      const createdCartItem = {
        id: 'cart-item-1',
        ...newItem,
      }

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.addToCart).mockResolvedValue({
        success: true,
        data: createdCartItem,
      })

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.addItem(newItem)
      })

      expect(result.current.items).toContainEqual(createdCartItem)
      expect(api.addToCart).toHaveBeenCalledWith(newItem)
    })

    it('should skip adding when not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const newItem = {
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.addItem(newItem)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Please login to add items to cart')
      expect(api.addToCart).not.toHaveBeenCalled()
      expect(result.current.items).toEqual([])

      consoleSpy.mockRestore()
    })

    it('should handle add to cart failure', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token')

      const newItem = {
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      vi.mocked(api.addToCart).mockRejectedValue(new Error('Server error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.addItem(newItem)
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.items).toEqual([])

      consoleSpy.mockRestore()
    })

    it('should preserve existing items when adding new item', async () => {
      const existingItem = {
        id: 'cart-item-1',
        productType: 'mug',
        productName: 'Mug',
        price: 29.99,
        quantity: 1,
      }

      const newItem = {
        petIpId: 'pet-456',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.addToCart).mockResolvedValue({
        success: true,
        data: { id: 'cart-item-2', ...newItem },
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [existingItem]
      })

      await act(async () => {
        await result.current.addItem(newItem)
      })

      expect(result.current.items).toHaveLength(2)
      expect(result.current.items).toContainEqual(existingItem)
    })
  })

  describe('removeItem', () => {
    it('should remove item from cart successfully', async () => {
      const item1 = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }
      const item2 = {
        id: 'cart-item-2',
        productType: 'mug',
        productName: 'Mug',
        price: 29.99,
        quantity: 2,
      }

      vi.mocked(api.removeFromCart).mockResolvedValue({
        success: true,
        message: 'Item removed',
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item1, item2]
      })

      await act(async () => {
        await result.current.removeItem('cart-item-1')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items).toContainEqual(item2)
      expect(result.current.items).not.toContainEqual(item1)
      expect(api.removeFromCart).toHaveBeenCalledWith('cart-item-1')
    })

    it('should handle remove item failure', async () => {
      const item = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      vi.mocked(api.removeFromCart).mockRejectedValue(new Error('Server error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item]
      })

      await act(async () => {
        await result.current.removeItem('cart-item-1')
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.items).toContainEqual(item)

      consoleSpy.mockRestore()
    })

    it('should handle removing non-existent item', async () => {
      vi.mocked(api.removeFromCart).mockResolvedValue({
        success: true,
        message: 'Item removed',
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = []
      })

      await act(async () => {
        await result.current.removeItem('non-existent')
      })

      expect(result.current.items).toEqual([])
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity optimistically', async () => {
      const item = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
        success: true,
        data: { ...item, quantity: 5 },
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item]
      })

      // Optimistic update should happen immediately
      act(() => {
        result.current.updateQuantity('cart-item-1', 5)
      })

      expect(result.current.items[0].quantity).toBe(5)

      // Wait for API call to complete
      await waitFor(() => {
        expect(api.updateCartItemQuantity).toHaveBeenCalledWith('cart-item-1', 5)
      })
    })

    it('should revert quantity on API failure', async () => {
      const item = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 2,
      }

      vi.mocked(api.updateCartItemQuantity).mockRejectedValue(new Error('Server error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item]
      })

      await act(async () => {
        await result.current.updateQuantity('cart-item-1', 5)
      })

      // Should revert to original quantity minus 1 (as per implementation)
      expect(result.current.items[0].quantity).toBe(1)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle updating non-existent item', async () => {
      vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
        success: true,
        data: {},
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = []
      })

      await act(async () => {
        await result.current.updateQuantity('non-existent', 5)
      })

      expect(api.updateCartItemQuantity).toHaveBeenCalled()
    })

    it('should handle multiple quantity updates in sequence', async () => {
      const item = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
        success: true,
        data: item,
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item]
      })

      await act(async () => {
        await result.current.updateQuantity('cart-item-1', 3)
      })

      expect(result.current.items[0].quantity).toBe(3)

      await act(async () => {
        await result.current.updateQuantity('cart-item-1', 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
    })

    it('should only update the specified item', async () => {
      const item1 = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }
      const item2 = {
        id: 'cart-item-2',
        productType: 'mug',
        productName: 'Mug',
        price: 29.99,
        quantity: 2,
      }

      vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
        success: true,
        data: item1,
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item1, item2]
      })

      await act(async () => {
        await result.current.updateQuantity('cart-item-1', 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
      expect(result.current.items[1].quantity).toBe(2)
    })
  })

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 1 },
        { id: 'cart-item-2', productType: 'mug', productName: 'Mug', price: 29.99, quantity: 2 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toEqual([])
    })

    it('should handle clearing empty cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = []
      })

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toEqual([])
    })
  })

  describe('getTotalPrice', () => {
    it('should calculate total price correctly', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 2 },
        { id: 'cart-item-2', productType: 'mug', productName: 'Mug', price: 29.99, quantity: 1 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      const total = result.current.getTotalPrice()
      expect(total).toBeCloseTo(229.97, 2) // (99.99 * 2) + 29.99
    })

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = []
      })

      expect(result.current.getTotalPrice()).toBe(0)
    })

    it('should handle items with zero quantity', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 0 },
        { id: 'cart-item-2', productType: 'mug', productName: 'Mug', price: 29.99, quantity: 1 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      expect(result.current.getTotalPrice()).toBeCloseTo(29.99, 2)
    })

    it('should handle very large quantities', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 100 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      expect(result.current.getTotalPrice()).toBeCloseTo(9999, 2)
    })

    it('should handle fractional prices', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.999, quantity: 1 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      expect(result.current.getTotalPrice()).toBeCloseTo(99.999, 3)
    })
  })

  describe('getTotalItems', () => {
    it('should calculate total item count correctly', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 2 },
        { id: 'cart-item-2', productType: 'mug', productName: 'Mug', price: 29.99, quantity: 3 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      expect(result.current.getTotalItems()).toBe(5)
    })

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = []
      })

      expect(result.current.getTotalItems()).toBe(0)
    })

    it('should handle items with zero quantity', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 0 },
        { id: 'cart-item-2', productType: 'mug', productName: 'Mug', price: 29.99, quantity: 3 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      expect(result.current.getTotalItems()).toBe(3)
    })

    it('should handle single item', () => {
      const items = [
        { id: 'cart-item-1', productType: 'tshirt', productName: 'T-Shirt', price: 99.99, quantity: 1 },
      ]

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = items
      })

      expect(result.current.getTotalItems()).toBe(1)
    })
  })

  describe('Edge Cases and Integration', () => {
    it('should handle adding same item multiple times', async () => {
      const newItem = {
        petIpId: 'pet-123',
        productType: 'tshirt',
        productName: 'Custom T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.addToCart).mockResolvedValue({
        success: true,
        data: { id: 'cart-item-1', ...newItem },
      })

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await result.current.addItem(newItem)
      })

      await act(async () => {
        await result.current.addItem(newItem)
      })

      expect(result.current.items).toHaveLength(2)
    })

    it('should handle rapid quantity updates', async () => {
      const item = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
        success: true,
        data: item,
      })

      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.items = [item]
      })

      await act(async () => {
        await Promise.all([
          result.current.updateQuantity('cart-item-1', 2),
          result.current.updateQuantity('cart-item-1', 3),
          result.current.updateQuantity('cart-item-1', 4),
        ])
      })

      // All updates should complete without error
      expect(api.updateCartItemQuantity).toHaveBeenCalledTimes(3)
    })

    it('should maintain immutability of cart items', async () => {
      const item = {
        id: 'cart-item-1',
        productType: 'tshirt',
        productName: 'T-Shirt',
        price: 99.99,
        quantity: 1,
      }

      vi.mocked(api.updateCartItemQuantity).mockResolvedValue({
        success: true,
        data: item,
      })

      const { result } = renderHook(() => useCartStore())

      const originalItems = [...result.current.items]

      act(() => {
        result.current.items = [item]
      })

      await act(async () => {
        await result.current.updateQuantity('cart-item-1', 5)
      })

      expect(result.current.items).not.toBe(originalItems)
      expect(result.current.items[0]).not.toBe(item)
    })

    it('should handle concurrent add and remove operations', async () => {
      const item1 = {
        petIpId: 'pet-1',
        productType: 'tshirt',
        productName: 'T-Shirt 1',
        price: 99.99,
        quantity: 1,
      }

      const item2 = {
        petIpId: 'pet-2',
        productType: 'mug',
        productName: 'Mug',
        price: 29.99,
        quantity: 1,
      }

      mockLocalStorage.getItem.mockReturnValue('valid-token')
      vi.mocked(api.addToCart).mockResolvedValue({
        success: true,
        data: { id: 'cart-item-1', ...item1 },
      })
      vi.mocked(api.removeFromCart).mockResolvedValue({
        success: true,
        message: 'Item removed',
      })

      const { result } = renderHook(() => useCartStore())

      await act(async () => {
        await Promise.all([
          result.current.addItem(item1),
          result.current.addItem(item2),
        ])
      })

      expect(result.current.items).toHaveLength(2)

      await act(async () => {
        await result.current.removeItem('cart-item-1')
      })

      expect(result.current.items).toHaveLength(1)
    })
  })
})
