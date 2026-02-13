import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import api from '../../lib/api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

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

describe('APIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  describe('Token Management', () => {
    it('should load token from localStorage on initialization', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token')
      // Create a new instance to test initialization
      const { ApiClient } = require('../../lib/api')
      const client = new ApiClient('http://localhost:4000')
      expect(client.token).toBe('test-token')
    })

    it('should set token and update localStorage', () => {
      api.setToken('new-token')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token')
    })

    it('should clear token and remove from localStorage', () => {
      api.clearToken()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('should include auth header when token is set', async () => {
      api.setToken('test-token')
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      })

      await api.getCurrentUser()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })
  })

  describe('Authentication', () => {
    describe('register', () => {
      it('should register successfully with valid data', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        }
        const mockToken = 'jwt-token'

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { user: mockUser, token: mockToken },
          }),
        })

        const result = await api.register('test@example.com', 'password123', 'Test User')

        expect(result.success).toBe(true)
        expect(result.data.user).toEqual(mockUser)
        expect(result.data.token).toBe(mockToken)
      })

      it('should handle registration failure with validation errors', async () => {
        const mockErrors = [
          { message: 'Email is required', path: ['email'] },
          { message: 'Password must be at least 6 characters', path: ['password'] },
        ]

        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: mockErrors,
          }),
        })

        await expect(api.register('', '123', '')).rejects.toThrow(
          'Email is required, Password must be at least 6 characters'
        )
      })

      it('should handle registration failure with single error message', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: 'User already exists',
          }),
        })

        await expect(api.register('existing@example.com', 'password123')).rejects.toThrow(
          'User already exists'
        )
      })

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'))

        await expect(
          api.register('test@example.com', 'password123')
        ).rejects.toThrow('Network error')
      })

      it('should send correct request data', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: { user: {}, token: 'token' } }),
        })

        await api.register('test@example.com', 'password123', 'Test User')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
              name: 'Test User',
            }),
          })
        )
      })
    })

    describe('login', () => {
      it('should login successfully with valid credentials', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          credits: 100,
        }
        const mockToken = 'jwt-token'

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { user: mockUser, token: mockToken },
          }),
        })

        const result = await api.login('test@example.com', 'password123')

        expect(result.success).toBe(true)
        expect(result.data.user).toEqual(mockUser)
        expect(result.data.token).toBe(mockToken)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken)
      })

      it('should handle login failure with invalid credentials', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Invalid credentials',
          }),
        })

        await expect(api.login('test@example.com', 'wrongpassword')).rejects.toThrow(
          'Invalid credentials'
        )
      })

      it('should not set token on failed login', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Invalid credentials',
          }),
        })

        try {
          await api.login('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected error
        }

        expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
      })
    })

    describe('getCurrentUser', () => {
      it('should get current user with valid token', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          credits: 50,
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockUser,
          }),
        })

        api.setToken('valid-token')
        const result = await api.getCurrentUser()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockUser)
      })

      it('should include auth header', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        })

        api.setToken('test-token')
        await api.getCurrentUser()

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/auth/me',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        )
      })

      it('should handle unauthorized response', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Unauthorized',
          }),
        })

        api.setToken('invalid-token')
        await expect(api.getCurrentUser()).rejects.toThrow('Unauthorized')
      })
    })
  })

  describe('PetIP Management', () => {
    describe('createPetIP', () => {
      it('should create PetIP successfully', async () => {
        const petIPData = {
          name: 'Fluffy',
          style: 'cartoon',
          generatedImage: 'http://example.com/image.jpg',
          rarity: 'common',
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'pet-123', ...petIPData },
          }),
        })

        api.setToken('test-token')
        const result = await api.createPetIP(petIPData)

        expect(result.success).toBe(true)
        expect(result.data.id).toBe('pet-123')
      })

      it('should include authentication', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        })

        api.setToken('test-token')
        await api.createPetIP({
          name: 'Fluffy',
          style: 'cartoon',
          generatedImage: 'http://example.com/image.jpg',
        })

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          })
        )
      })
    })

    describe('getPetIPs', () => {
      it('should fetch PetIPs without filters', async () => {
        const mockPetIPs = [
          { id: 'pet-1', name: 'Fluffy' },
          { id: 'pet-2', name: 'Rex' },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPetIPs,
          }),
        })

        api.setToken('test-token')
        const result = await api.getPetIPs()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockPetIPs)
      })

      it('should fetch PetIPs with query parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })

        api.setToken('test-token')
        await api.getPetIPs({ page: 1, limit: 10, style: 'cartoon' })

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/petips?page=1&limit=10&style=cartoon',
          expect.any(Object)
        )
      })

      it('should handle undefined filter parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })

        api.setToken('test-token')
        await api.getPetIPs({ page: 1, limit: undefined, style: 'cartoon' })

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/petips?page=1&style=cartoon',
          expect.any(Object)
        )
      })
    })

    describe('getPetIP', () => {
      it('should fetch single PetIP by ID', async () => {
        const mockPetIP = {
          id: 'pet-123',
          name: 'Fluffy',
          style: 'cartoon',
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockPetIP,
          }),
        })

        api.setToken('test-token')
        const result = await api.getPetIP('pet-123')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockPetIP)
      })

      it('should handle not found error', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: 'PetIP not found',
          }),
        })

        api.setToken('test-token')
        await expect(api.getPetIP('nonexistent')).rejects.toThrow('PetIP not found')
      })
    })

    describe('likePetIP', () => {
      it('should like a PetIP successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'pet-123', likesCount: 1 },
          }),
        })

        api.setToken('test-token')
        const result = await api.likePetIP('pet-123')

        expect(result.success).toBe(true)
        expect(result.data.likesCount).toBe(1)
      })

      it('should send POST request', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        })

        api.setToken('test-token')
        await api.likePetIP('pet-123')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/petips/pet-123/like',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })
  })

  describe('Cart Management', () => {
    describe('getCart', () => {
      it('should fetch user cart', async () => {
        const mockCart = [
          { id: 'item-1', productName: 'T-Shirt', price: 99.99, quantity: 1 },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockCart,
          }),
        })

        api.setToken('test-token')
        const result = await api.getCart()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockCart)
      })
    })

    describe('addToCart', () => {
      it('should add item to cart successfully', async () => {
        const cartItem = {
          petIpId: 'pet-123',
          productType: 'tshirt',
          productName: 'Custom T-Shirt',
          price: 99.99,
          quantity: 1,
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'cart-item-1', ...cartItem },
          }),
        })

        api.setToken('test-token')
        const result = await api.addToCart(cartItem)

        expect(result.success).toBe(true)
        expect(result.data.productName).toBe('Custom T-Shirt')
      })

      it('should handle validation errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: [{ message: 'Price must be positive', path: ['price'] }],
          }),
        })

        api.setToken('test-token')
        await expect(
          api.addToCart({ productType: 'tshirt', productName: 'Test', price: -10, quantity: 1 })
        ).rejects.toThrow('Price must be positive')
      })
    })

    describe('removeFromCart', () => {
      it('should remove item from cart', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Item removed',
          }),
        })

        api.setToken('test-token')
        const result = await api.removeFromCart('cart-item-1')

        expect(result.success).toBe(true)
      })

      it('should send DELETE request', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, message: 'Item removed' }),
        })

        api.setToken('test-token')
        await api.removeFromCart('cart-item-1')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/cart/cart-item-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })

    describe('updateCartItemQuantity', () => {
      it('should update cart item quantity', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'cart-item-1', quantity: 5 },
          }),
        })

        api.setToken('test-token')
        const result = await api.updateCartItemQuantity('cart-item-1', 5)

        expect(result.success).toBe(true)
        expect(result.data.quantity).toBe(5)
      })

      it('should send PATCH request with quantity', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        })

        api.setToken('test-token')
        await api.updateCartItemQuantity('cart-item-1', 3)

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/cart/cart-item-1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ quantity: 3 }),
          })
        )
      })
    })
  })

  describe('Order Management', () => {
    describe('createOrder', () => {
      it('should create order successfully', async () => {
        const orderData = {
          items: [
            {
              productType: 'tshirt',
              productName: 'T-Shirt',
              price: 99.99,
              quantity: 1,
            },
          ],
          receiverName: 'John Doe',
          receiverPhone: '13800138000',
          receiverAddress: 'Test Address',
          paymentMethod: 'alipay',
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'order-123', status: 'pending', ...orderData },
          }),
        })

        api.setToken('test-token')
        const result = await api.createOrder(orderData)

        expect(result.success).toBe(true)
        expect(result.data.id).toBe('order-123')
      })
    })

    describe('getOrders', () => {
      it('should fetch orders without filters', async () => {
        const mockOrders = [
          { id: 'order-1', status: 'pending' },
          { id: 'order-2', status: 'paid' },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockOrders,
          }),
        })

        api.setToken('test-token')
        const result = await api.getOrders()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockOrders)
      })

      it('should fetch orders with status filter', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })

        api.setToken('test-token')
        await api.getOrders({ status: 'pending' })

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/orders?status=pending',
          expect.any(Object)
        )
      })
    })

    describe('getOrder', () => {
      it('should fetch single order by ID', async () => {
        const mockOrder = {
          id: 'order-123',
          status: 'paid',
          totalAmount: 99.99,
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockOrder,
          }),
        })

        api.setToken('test-token')
        const result = await api.getOrder('order-123')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockOrder)
      })
    })

    describe('updateOrderStatus', () => {
      it('should update order status', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'order-123', status: 'paid' },
          }),
        })

        api.setToken('test-token')
        const result = await api.updateOrderStatus('order-123', 'paid')

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('paid')
      })
    })
  })

  describe('AI Generation', () => {
    describe('queueGeneration', () => {
      it('should queue generation task successfully', async () => {
        const params = {
          type: 'image',
          style: 'cartoon',
          petName: 'Fluffy',
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { taskId: 'task-123', status: 'queued' },
          }),
        })

        api.setToken('test-token')
        const result = await api.queueGeneration(params)

        expect(result.success).toBe(true)
        expect(result.data.taskId).toBe('task-123')
      })

      it('should handle optional parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: { taskId: 'task-1' } }),
        })

        api.setToken('test-token')
        await api.queueGeneration({})

        expect(mockFetch).toHaveBeenCalled()
      })
    })

    describe('checkGenerationStatus', () => {
      it('should check generation status', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { taskId: 'task-123', status: 'completed', outputUrl: 'http://example.com/result.jpg' },
          }),
        })

        api.setToken('test-token')
        const result = await api.checkGenerationStatus('task-123')

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('completed')
      })
    })

    describe('getGenerationHistory', () => {
      it('should fetch generation history', async () => {
        const mockHistory = [
          { id: 'gen-1', type: 'image', status: 'completed' },
          { id: 'gen-2', type: '3d', status: 'processing' },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockHistory,
          }),
        })

        api.setToken('test-token')
        const result = await api.getGenerationHistory()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockHistory)
      })

      it('should filter by type', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })

        api.setToken('test-token')
        await api.getGenerationHistory({ type: 'image' })

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/generation/history?type=image',
          expect.any(Object)
        )
      })
    })

    describe('cancelGeneration', () => {
      it('should cancel generation task', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { taskId: 'task-123', status: 'cancelled' },
          }),
        })

        api.setToken('test-token')
        const result = await api.cancelGeneration('task-123')

        expect(result.success).toBe(true)
      })

      it('should send DELETE request', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        })

        api.setToken('test-token')
        await api.cancelGeneration('task-123')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/generation/task-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })
  })

  describe('User Profile', () => {
    describe('updateProfile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          phone: '13800138000',
          bio: 'New bio',
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'user-123', ...updateData },
          }),
        })

        api.setToken('test-token')
        const result = await api.updateProfile(updateData)

        expect(result.success).toBe(true)
        expect(result.data.name).toBe('Updated Name')
      })

      it('should handle partial updates', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: { id: 'user-123' } }),
        })

        api.setToken('test-token')
        await api.updateProfile({ name: 'New Name' })

        expect(mockFetch).toHaveBeenCalled()
      })
    })

    describe('getUserProfile', () => {
      it('should fetch user profile', async () => {
        const mockProfile = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          credits: 100,
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockProfile,
          }),
        })

        api.setToken('test-token')
        const result = await api.getUserProfile()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockProfile)
      })
    })

    describe('changePassword', () => {
      it('should change password successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Password changed successfully',
          }),
        })

        api.setToken('test-token')
        const result = await api.changePassword('oldPassword123', 'newPassword456')

        expect(result.success).toBe(true)
      })

      it('should handle incorrect current password', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Current password is incorrect',
          }),
        })

        api.setToken('test-token')
        await expect(
          api.changePassword('wrongPassword', 'newPassword')
        ).rejects.toThrow('Current password is incorrect')
      })
    })
  })

  describe('Address Management', () => {
    describe('getAddresses', () => {
      it('should fetch user addresses', async () => {
        const mockAddresses = [
          { id: 'addr-1', receiverName: 'John Doe', isDefault: true },
          { id: 'addr-2', receiverName: 'Jane Doe', isDefault: false },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockAddresses,
          }),
        })

        api.setToken('test-token')
        const result = await api.getAddresses()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockAddresses)
      })
    })

    describe('addAddress', () => {
      it('should add new address', async () => {
        const addressData = {
          receiverName: 'John Doe',
          receiverPhone: '13800138000',
          province: 'Beijing',
          city: 'Beijing',
          district: 'Chaoyang',
          detailAddress: 'Test Street 123',
          isDefault: true,
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'addr-1', ...addressData },
          }),
        })

        api.setToken('test-token')
        const result = await api.addAddress(addressData)

        expect(result.success).toBe(true)
        expect(result.data.receiverName).toBe('John Doe')
      })
    })

    describe('updateAddress', () => {
      it('should update existing address', async () => {
        const updates = {
          receiverName: 'Updated Name',
          detailAddress: 'New Address',
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'addr-1', ...updates },
          }),
        })

        api.setToken('test-token')
        const result = await api.updateAddress('addr-1', updates)

        expect(result.success).toBe(true)
        expect(result.data.receiverName).toBe('Updated Name')
      })
    })

    describe('deleteAddress', () => {
      it('should delete address', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Address deleted',
          }),
        })

        api.setToken('test-token')
        const result = await api.deleteAddress('addr-1')

        expect(result.success).toBe(true)
      })

      it('should send DELETE request', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, message: 'Address deleted' }),
        })

        api.setToken('test-token')
        await api.deleteAddress('addr-1')

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/addresses/addr-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })

    describe('setDefaultAddress', () => {
      it('should set default address', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { id: 'addr-1', isDefault: true },
          }),
        })

        api.setToken('test-token')
        const result = await api.setDefaultAddress('addr-1')

        expect(result.success).toBe(true)
        expect(result.data.isDefault).toBe(true)
      })
    })
  })

  describe('Points Management', () => {
    describe('getPointsBalance', () => {
      it('should fetch points balance', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { balance: 500 },
          }),
        })

        api.setToken('test-token')
        const result = await api.getPointsBalance()

        expect(result.success).toBe(true)
        expect(result.data.balance).toBe(500)
      })
    })

    describe('getPointsHistory', () => {
      it('should fetch points history', async () => {
        const mockHistory = [
          { id: 'pt-1', amount: 100, type: 'earned' },
          { id: 'pt-2', amount: -50, type: 'spent' },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockHistory,
          }),
        })

        api.setToken('test-token')
        const result = await api.getPointsHistory()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockHistory)
      })

      it('should support pagination', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })

        api.setToken('test-token')
        await api.getPointsHistory({ page: 1, limit: 20 })

        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:4000/api/points/history?page=1&limit=20',
          expect.any(Object)
        )
      })
    })
  })

  describe('Upload Operations', () => {
    describe('uploadPetPhoto', () => {
      it('should upload pet photo successfully', async () => {
        const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { url: 'http://example.com/uploaded.jpg' },
          }),
        })

        api.setToken('test-token')
        const result = await api.uploadPetPhoto(mockFile, 'Fluffy', 'cartoon')

        expect(result.success).toBe(true)
        expect(result.data.url).toBeDefined()
      })

      it('should send FormData', async () => {
        const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        })

        api.setToken('test-token')
        await api.uploadPetPhoto(mockFile, 'Fluffy', 'cartoon')

        const callArgs = mockFetch.mock.calls[0]
        expect(callArgs[0]).toBe('http://localhost:4000/api/upload')
        expect(callArgs[1].body).toBeInstanceOf(FormData)
      })
    })

    describe('uploadAvatar', () => {
      it('should upload avatar successfully', async () => {
        const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' })

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { avatarUrl: 'http://example.com/avatar.jpg' },
          }),
        })

        api.setToken('test-token')
        const result = await api.uploadAvatar(mockFile)

        expect(result.success).toBe(true)
      })
    })
  })

  describe('Admin Operations', () => {
    describe('getStats', () => {
      it('should fetch admin statistics', async () => {
        const mockStats = {
          totalUsers: 100,
          totalPetIPs: 500,
          totalOrders: 50,
          revenue: 5000,
        }

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockStats,
          }),
        })

        api.setToken('admin-token')
        const result = await api.getStats()

        expect(result.success).toBe(true)
        expect(result.data.totalUsers).toBe(100)
      })
    })

    describe('getAllUsers', () => {
      it('should fetch all users', async () => {
        const mockUsers = [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: mockUsers,
          }),
        })

        api.setToken('admin-token')
        const result = await api.getAllUsers()

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockUsers)
      })
    })

    describe('getAllPetIPs', () => {
      it('should fetch all PetIPs', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })

        api.setToken('admin-token')
        const result = await api.getAllPetIPs()

        expect(result.success).toBe(true)
      })
    })

    describe('getAllOrders', () => {
      it('should fetch all orders', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: [],
          }),
        })

        api.setToken('admin-token')
        const result = await api.getAllOrders()

        expect(result.success).toBe(true)
      })
    })
  })

  describe('Payment Operations', () => {
    describe('createPayment', () => {
      it('should create payment successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { paymentId: 'pay-123', status: 'pending' },
          }),
        })

        api.setToken('test-token')
        const result = await api.createPayment('order-123', 'alipay')

        expect(result.success).toBe(true)
        expect(result.data.paymentId).toBe('pay-123')
      })

      it('should support credit usage', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { paymentId: 'pay-456' },
          }),
        })

        api.setToken('test-token')
        await api.createPayment('order-123', 'alipay', true, 50)

        expect(mockFetch).toHaveBeenCalled()
      })
    })

    describe('confirmPayment', () => {
      it('should confirm payment successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: { paymentId: 'pay-123', status: 'paid' },
          }),
        })

        api.setToken('test-token')
        const result = await api.confirmPayment('pay-123')

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('paid')
      })
    })
  })
})
