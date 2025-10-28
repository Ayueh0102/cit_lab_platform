// API 客戶端配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface FetchOptions {
  method?: string;
  body?: string;
  token?: string;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API 請求失敗');
  }

  return data;
}

export const api = {
  // 認證相關
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/api/v2/auth/login', {
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
      fetchAPI('/api/v2/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getCurrentUser: (token: string) =>
      fetchAPI('/api/v2/auth/me', { token }),
    
    logout: (token: string) =>
      fetchAPI('/api/v2/auth/logout', {
        method: 'POST',
        token,
      }),
  },

  // 職缺相關
  jobs: {
    getAll: (token?: string) =>
      fetchAPI('/api/v2/jobs', { token }),
    
    getById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/jobs/${id}`, { token }),
    
    create: (data: any, token: string) =>
      fetchAPI('/api/v2/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    
    update: (id: number, data: any, token: string) =>
      fetchAPI(`/api/v2/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    
    delete: (id: number, token: string) =>
      fetchAPI(`/api/v2/jobs/${id}`, {
        method: 'DELETE',
        token,
      }),
    
    apply: (jobId: number, data: any, token: string) =>
      fetchAPI(`/api/v2/jobs/${jobId}/requests`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  // 活動相關
  events: {
    getAll: (token?: string) =>
      fetchAPI('/api/v2/events', { token }),
    
    getById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/events/${id}`, { token }),
    
    create: (data: any, token: string) =>
      fetchAPI('/api/v2/events', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    
    register: (eventId: number, data: any, token: string) =>
      fetchAPI(`/api/v2/events/${eventId}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  // 公告相關
  bulletins: {
    getAll: (token?: string) =>
      fetchAPI('/api/v2/bulletins', { token }),
    
    getById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/bulletins/${id}`, { token }),
    
    create: (data: any, token: string) =>
      fetchAPI('/api/v2/bulletins', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },

  // 訊息相關
  messages: {
    getConversations: (token: string) =>
      fetchAPI('/api/v2/conversations', { token }),
    
    getMessages: (conversationId: number, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}/messages`, { token }),
    
    send: (conversationId: number, data: { content: string }, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },
};
