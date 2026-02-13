import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'

// Mock API module
vi.mock('../../lib/api', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
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

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('initializeAuth', () => {
    it('should initialize auth from localStorage when valid data exists', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
      }
      const mockToken = 'valid-jwt-token'

      mockLocalStorage.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(JSON.stringify(mockUser))

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.initializeAuth()
      })

      expect(result.current.token).toBe(mockToken)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(api.setToken).toHaveBeenCalledWith(mockToken)
    })

    it('should not initialize auth when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.initializeAuth()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
    })

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('valid-token')
        .mockReturnValueOnce('invalid-json{')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.initializeAuth()
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
      expect(result.current.isAuthenticated).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should not run on server side', () => {
      // Save original window
      const originalWindow = global.window

      // @ts-ignore - Remove window to simulate server side
      delete global.window

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.initializeAuth()
      })

      expect(result.current.isAuthenticated).toBe(false)

      // Restore window
      global.window = originalWindow
    })
  })

  describe('login', () => {
    it('should login successfully and update state', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        credits: 100,
      }
      const mockToken = 'jwt-token'

      vi.mocked(api.login).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe(mockToken)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockUser)
      )
    })

    it('should handle login failure with error message', async () => {
      vi.mocked(api.login).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Invalid credentials')
    })

    it('should use default error message when none provided', async () => {
      vi.mocked(api.login).mockResolvedValue({
        success: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password')
      })

      expect(result.current.error).toBe('登录失败，请检查邮箱和密码')
    })

    it('should handle network errors', async () => {
      vi.mocked(api.login).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Network error')
    })

    it('should set loading to true during login attempt', async () => {
      vi.mocked(api.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: { user: { id: '1' }, token: 'token' },
              })
            }, 100)
          })
      )

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('test@example.com', 'password')
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('register', () => {
    it('should register successfully and auto-login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        credits: 100,
      }
      const mockToken = 'jwt-token'

      vi.mocked(api.register).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123', 'New User')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe(mockToken)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken)
    })

    it('should handle registration failure', async () => {
      vi.mocked(api.register).mockResolvedValue({
        success: false,
        error: 'User already exists',
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('existing@example.com', 'password123')
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('User already exists')
    })

    it('should work without name parameter', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', credits: 100 }
      const mockToken = 'jwt-token'

      vi.mocked(api.register).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should use default error message on failure', async () => {
      vi.mocked(api.register).mockResolvedValue({
        success: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('test@example.com', 'pass')
      })

      expect(result.current.error).toBe('注册失败，请稍后重试')
    })

    it('should handle network errors during registration', async () => {
      vi.mocked(api.register).mockRejectedValue(
        new Error('Connection timeout')
      )

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('test@example.com', 'password')
      })

      expect(result.current.error).toBe('Connection timeout')
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch and update current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated User',
        credits: 50,
      }

      vi.mocked(api.getCurrentUser).mockResolvedValue({
        success: true,
        data: mockUser,
      })

      const { result } = renderHook(() => useAuthStore())

      // Set initial token
      act(() => {
        result.current.token = 'valid-token'
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockUser)
      )
    })

    it('should not fetch user when no token exists', async () => {
      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(api.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should logout on failed getCurrentUser', async () => {
      vi.mocked(api.getCurrentUser).mockResolvedValue({
        success: false,
        error: 'Invalid token',
      })

      const { result } = renderHook(() => useAuthStore())

      // Set initial authenticated state
      act(() => {
        result.current.token = 'invalid-token'
        result.current.isAuthenticated = true
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should handle network errors gracefully', async () => {
      vi.mocked(api.getCurrentUser).mockRejectedValue(
        new Error('Network error')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.token = 'valid-token'
      })

      await act(async () => {
        await result.current.getCurrentUser()
      })

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
      // Should not logout on network error
      expect(result.current.token).toBe('valid-token')

      consoleSpy.mockRestore()
    })
  })

  describe('logout', () => {
    it('should clear all auth state', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set authenticated state
      act(() => {
        result.current.user = { id: 'user-123', email: 'test@example.com', credits: 100 }
        result.current.token = 'valid-token'
        result.current.isAuthenticated = true
        result.current.error = 'Some error'
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user')
      expect(api.clearToken).toHaveBeenCalled()
    })

    it('should clear localStorage', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.logout()
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.error = 'Some error'
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user in state and localStorage', () => {
      const { result } = renderHook(() => useAuthStore())

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        credits: 150,
        phone: '13800138000',
      }

      act(() => {
        result.current.updateUser(updatedUser as any)
      })

      expect(result.current.user).toEqual(updatedUser)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(updatedUser)
      )
    })

    it('should handle partial updates', () => {
      const { result } = renderHook(() => useAuthStore())

      const initialUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Original Name',
        credits: 100,
      }

      const partialUpdate = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'New Name',
        credits: 100,
      }

      act(() => {
        result.current.user = initialUser
      })

      act(() => {
        result.current.updateUser(partialUpdate as any)
      })

      expect(result.current.user.name).toBe('New Name')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', credits: 100 }
      const mockToken = 'jwt-token'

      vi.mocked(api.login).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      })

      const { result } = renderHook(() => useAuthStore())

      await Promise.all([
        act(async () => {
          await result.current.login('test@example.com', 'password')
        }),
        act(async () => {
          await result.current.login('test@example.com', 'password')
        }),
      ])

      // Should complete without errors
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle logout during login', async () => {
      vi.mocked(api.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: { user: { id: '1' }, token: 'token' },
              })
            }, 100)
          })
      )

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('test@example.com', 'password')
        expect(result.current.isLoading).toBe(true)

        // Logout before login completes
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle localStorage being disabled', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage disabled')
      })

      const mockUser = { id: 'user-123', email: 'test@example.com', credits: 100 }
      const mockToken = 'jwt-token'

      vi.mocked(api.login).mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken },
      })

      const { result } = renderHook(() => useAuthStore())

      // Should not throw, but localStorage will fail
      expect(async () => {
        await act(async () => {
          await result.current.login('test@example.com', 'password')
        })
      }).not.toThrow()
    })
  })
})
