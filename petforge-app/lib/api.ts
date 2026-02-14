// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  async updateUserCredits(userId: string, newCredits: number) {
    return this.request(`/api/admin/users/${userId}/credits`, {
      method: 'PATCH',
      body: JSON.stringify({ credits: newCredits }),
    }, true);
  }

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Note: Token is now stored in httpOnly cookie by backend
    // No need to load from localStorage
  }

  setToken(token: string) {
    // DEPRECATED: Token is now stored in httpOnly cookie by backend
    // This method is kept for backward compatibility but does nothing
    console.warn('[DEPRECATED] setToken is no longer needed. Token is stored in httpOnly cookie.');
    // Cookies are automatically handled by browser with credentials: 'include'
  }

  clearToken() {
    // DEPRECATED: Token is now stored in httpOnly cookie by backend
    // This method is kept for backward compatibility but does nothing
    console.warn('[DEPRECATED] clearToken is no longer needed. Use logout API endpoint instead.');
    // Cookies are automatically handled by browser
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // CRITICAL: Use credentials: 'include' to send httpOnly cookies
    // This is safer than manual Authorization header
    // Backend cookie will be sent automatically by browser
    if (includeAuth) {
      // Include auth if needed (e.g., for server-side calls)
      // But for browser-to-API calls, cookies are sent automatically
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
      // CRITICAL: Include cookies for httpOnly cookie authentication
      credentials: 'include',
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle Zod validation errors (array of error objects)
      if (Array.isArray(data.error)) {
        const errorMessages = data.error.map((e: any) => e.message || e).join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const data = await this.request<{ success: boolean; data: { user: any; token: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }

    return data;
  }

  async getCurrentUser() {
    return this.request('/api/auth/me', {}, true);
  }

  // 添加商品到购物车（旧端点，保留兼容但推荐使用下方完整版 addToCart）
  async addToCartSimple(petIpId: string, quantity: number = 1, productType?: string, productName?: string, price?: number, size?: string, baseStyle?: string) {
    return this.request('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ petIpId, quantity, productType, productName, price, size, baseStyle }),
    }, true);
  }

  // 获取管理员仪表板（新端点）
  async getAdminDashboard() {
    return this.request('/api/admin/dashboard', {}, true);
  }

  // Upload endpoints
  async uploadPetPhoto(file: File, name: string, style: string, userId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('style', style);
    if (userId) formData.append('userId', userId);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    });

    return await response.json();
  }

  // PetIP endpoints
  async createPetIP(data: {
    name: string;
    style: string;
    originalImage?: string;
    generatedImage: string;
    rarity?: string;
  }) {
    return this.request('/api/petips', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async getPetIPs(params?: { page?: number; limit?: number; userId?: string; style?: string; rarity?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request(`/api/petips?${searchParams.toString()}`, {}, true);
  }

  async getPetIP(id: string) {
    return this.request(`/api/petips/${id}`, {}, true);
  }

  async likePetIP(id: string) {
    return this.request(`/api/petips/${id}/like`, { method: 'POST' }, true);
  }

  // Cart endpoints
  async getCart() {
    return this.request('/api/cart', {}, true);
  }

  async addToCart(item: {
    petIpId?: string;
    productType: string;
    productName: string;
    price: number;
    size?: string;
    baseStyle?: string;
    quantity: number;
    originalImage?: string;
    generatedImage?: string;
  }) {
    return this.request('/api/cart', {
      method: 'POST',
      body: JSON.stringify(item),
    }, true);
  }

  async removeFromCart(itemId: string) {
    return this.request(`/api/cart/${itemId}`, { method: 'DELETE' }, true);
  }

  async updateCartItemQuantity(itemId: string, quantity: number) {
    return this.request(`/api/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }, true);
  }

  // Order endpoints
  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request(`/api/orders?${searchParams.toString()}`, {}, true);
  }

  async getOrder(id: string) {
    return this.request(`/api/orders/${id}`, {}, true);
  }

  async createOrder(orderData: {
    items: Array<{
      productType: string;
      productName: string;
      price: number;
      quantity: number;
      size?: string;
      baseStyle?: string;
    }>;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    paymentMethod: string;
  }) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }, true);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Admin endpoints
  async getStats() {
    return this.request('/api/admin/stats', {}, true);
  }

  async getAllUsers() {
    return this.request('/api/admin/users', {}, true);
  }

  async getAllPetIPs() {
    return this.request('/api/admin/petips', {}, true);
  }

  async getAllOrders() {
    return this.request('/api/admin/orders', {}, true);
  }

  async getUserById(userId: string) {
    return this.request(`/api/admin/users/${userId}`, {}, true);
  }

  async getUserPetIPs(userId: string) {
    return this.request(`/api/admin/petips?userId=${userId}`, {}, true);
  }

  async getUserOrders(userId: string) {
    return this.request(`/api/admin/orders?userId=${userId}`, {}, true);
  }

  // 管理端创建 PetIP，与用户端 createPetIP 区分
  async adminCreatePetIP(data: {
    name: string;
    style: string;
    rarity: string;
    userId: string;
  }) {
    return this.request('/api/admin/petips', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updatePetIP(id: string, data: {
    name?: string;
    style?: string;
    rarity?: string;
    isPublic?: boolean;
  }) {
    return this.request(`/api/admin/petips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async deletePetIP(id: string) {
    return this.request(`/api/admin/petips/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // 管理端创建订单，与用户端 createOrder 区分
  async adminCreateOrder(data: {
    userId: string;
    items: Array<{
      productType: string;
      productName: string;
      price: number;
      quantity: number;
      size?: string;
      baseStyle?: string;
    }>;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    paymentMethod: string;
    totalAmount: number;
  }) {
    return this.request('/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteOrder(id: string) {
    return this.request(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Payment endpoints
  async createPayment(orderId: string, paymentMethod: string, useCredits?: boolean, creditsAmount?: number) {
    return this.request('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod, useCredits, creditsAmount }),
    }, true);
  }

  async confirmPayment(paymentId: string) {
    return this.request('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    }, true);
  }

  // User profile endpoints
  async updateProfile(data: { name?: string; email?: string; phone?: string; avatar?: string; bio?: string }) {
    return this.request('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async getUserProfile() {
    return this.request('/api/user/profile', {}, true);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/user/avatar`, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    });

    return await response.json();
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/api/user/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, true);
  }

  // Address endpoints
  async getAddresses() {
    return this.request('/api/addresses', {}, true);
  }

  async addAddress(address: {
    receiverName: string;
    receiverPhone: string;
    province: string;
    city: string;
    district: string;
    detailAddress: string;
    isDefault?: boolean;
  }) {
    return this.request('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    }, true);
  }

  async updateAddress(id: string, address: {
    receiverName?: string;
    receiverPhone?: string;
    province?: string;
    city?: string;
    district?: string;
    detailAddress?: string;
    isDefault?: boolean;
  }) {
    return this.request('/api/addresses/' + id, {
      method: 'PATCH',
      body: JSON.stringify(address),
    }, true);
  }

  async deleteAddress(id: string) {
    return this.request('/api/addresses/' + id, {
      method: 'DELETE',
    }, true);
  }

  async setDefaultAddress(id: string) {
    return this.request('/api/addresses/' + id + '/default', {
      method: 'POST',
    }, true);
  }

  // Points endpoints
  async getPointsBalance() {
    return this.request('/api/points', {}, true);
  }

  async getPointsHistory(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request('/api/points/history?' + searchParams.toString(), {}, true);
  }

  // AI Generation endpoints
  async queueGeneration(params: {
    type?: 'image' | '3d';
    style?: string;
    petName?: string;
    customPrompt?: string;
    inputImage?: string;
    petIpId?: string;
  }) {
    return this.request('/api/generation/queue-comfyui', {
      method: 'POST',
      body: JSON.stringify(params),
    }, true);
  }

  async checkGenerationStatus(taskId: string) {
    return this.request(`/api/generation/status-comfyui/${taskId}`, {}, true);
  }

  async getGenerationHistory(filters?: {
    page?: number;
    limit?: number;
    type?: 'image' | '3d';
  }) {
    const searchParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.request('/api/generation/history?' + searchParams.toString(), {}, true);
  }

  async cancelGeneration(taskId: string) {
    return this.request(`/api/generation/${taskId}`, {
      method: 'DELETE',
    }, true);
  }

  // RBAC - Role Management
  async getAllRoles() {
    return this.request('/api/admin/roles', {}, true);
  }

  async getRoleById(roleId: string) {
    return this.request(`/api/admin/roles/${roleId}`, {}, true);
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }) {
    return this.request('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updateRole(roleId: string, data: {
    name?: string;
    description?: string;
    permissionIds?: string[];
  }) {
    return this.request(`/api/admin/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteRole(roleId: string) {
    return this.request(`/api/admin/roles/${roleId}`, {
      method: 'DELETE',
    }, true);
  }

  async getAllPermissions() {
    return this.request('/api/admin/permissions', {}, true);
  }

  async getGroupedPermissions() {
    return this.request('/api/admin/permissions/grouped', {}, true);
  }

  async updateUserRole(userId: string, roleId: string) {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId }),
    }, true);
  }
}

// Create singleton instance
const api = new ApiClient(API_BASE_URL);

export default api;
