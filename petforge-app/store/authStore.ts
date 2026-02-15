import { create } from 'zustand'
import api from '@/lib/api'

export interface User {
  id: string
  email: string
  name: string
  credits: number
  role?: string
  createdAt?: string
  avatar?: string
  phone?: string
  bio?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  getCurrentUser: () => Promise<void>
  clearError: () => void
  initializeAuth: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Initialize auth from localStorage on client side
  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')

      if (savedToken && savedUser) {
        try {
          const user = JSON.parse(savedUser)
          set({
            token: savedToken,
            user,
            isAuthenticated: true,
          })
        } catch (error) {
          console.error('Failed to parse saved user:', error)
          // Clear invalid data
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await api.login(email, password)

      if (response.success && response.data) {
        const { user, token } = response.data

        // Save to state
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        }
      } else {
        set({
          isLoading: false,
          error: response.error || '登录失败，请检查邮箱和密码',
        })
      }
    } catch (error: any) {
      // 处理双重认证错误
      set({
        isLoading: false,
        error: error.message || '登录失败，请稍后重试',
      })

      // 如果是会话过期错误，清除所有状态
      if (error.message && error.message.includes('Session expired')) {
        get().logout()
      }
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await api.register(email, password, name)

      if (response.success && response.data) {
        const { user, token } = response.data

        // Auto-login after successful registration
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
          localStorage.setItem('auth_user', JSON.stringify(user))
        }
      } else {
        set({
          isLoading: false,
          error: response.error || '注册失败，请稍后重试',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || '注册失败，请稍后重试',
      })
    }
  },

  getCurrentUser: async () => {
    const { token } = get()

    if (!token) {
      return
    }

    set({ isLoading: true })

    try {
      const response = await api.getCurrentUser()

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        })

        // Update saved user
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(response.data))
        }
      } else {
        // Token might be invalid, clear auth
        get().logout()
      }
    } catch (error) {
      console.error('Failed to get current user:', error)
      // Don't clear auth on network error, just set loading to false
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      // Call backend logout endpoint to clear httpOnly cookie
      await api.logout()
    } catch (error) {
      console.error('Backend logout failed:', error)
      // Continue with local cleanup even if backend call fails
    }

    // Clear state
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })

    // Clear token from API client
    api.clearToken()

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  },

  clearError: () => set({ error: null }),

  updateUser: (user: User) => {
    set({ user })
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user))
    }
  },
}))
