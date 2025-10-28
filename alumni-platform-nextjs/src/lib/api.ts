/**
 * API 客戶端工具
 * 提供與後端 Flask API 通訊的方法
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * 通用 API 請求函式
 */
async function fetchAPI<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'API 請求失敗',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * API 客戶端
 */
export const api = {
  // 認證相關
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    
    register: (data: {
      email: string;
      password: string;
      name: string;
      student_id?: string;
      graduation_year?: number;
    }) =>
      fetchAPI('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getCurrentUser: (token: string) =>
      fetchAPI('/api/user/me', { token }),
    
    logout: (token: string) =>
      fetchAPI('/api/auth/logout', {
        method: 'POST',
        token,
      }),
  },

  // 職缺相關
  jobs: {
    getAll: (token?: string) =>
      fetchAPI('/api/jobs', { token }),
    
    getById: (id: number, token?: string) =>
      fetchAPI(`/api/jobs/${id}`, { token }),
    
    create: (data: any, token: string) =>
      fetchAPI('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    
    update: (id: number, data: any, token: string) =>
      fetchAPI(`/api/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    
    delete: (id: number, token: string) =>
      fetchAPI(`/api/jobs/${id}`, {
        method: 'DELETE',
        token,
      }),
    
    apply: (jobId: number, data: any, token: string) =>
      fetchAPI(`/api/jobs/${jobId}/requests`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  // 活動相關
  events: {
    getAll: (token?: string) =>
      fetchAPI('/api/events', { token }),
    
    getById: (id: number, token?: string) =>
      fetchAPI(`/api/events/${id}`, { token }),
    
    create: (data: any, token: string) =>
      fetchAPI('/api/events', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    
    register: (eventId: number, data: any, token: string) =>
      fetchAPI(`/api/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  // 公告相關
  bulletins: {
    getAll: (token?: string) =>
      fetchAPI('/api/bulletins', { token }),
    
    getById: (id: number, token?: string) =>
      fetchAPI(`/api/bulletins/${id}`, { token }),
    
    create: (data: any, token: string) =>
      fetchAPI('/api/bulletins', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  // 訊息相關
  messages: {
    getConversations: (token: string) =>
      fetchAPI('/api/messages/conversations', { token }),
    
    getMessages: (userId: number, token: string) =>
      fetchAPI(`/api/messages/${userId}`, { token }),
    
    send: (data: { recipient_id: number; content: string }, token: string) =>
      fetchAPI('/api/messages', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },
};

export default api;

