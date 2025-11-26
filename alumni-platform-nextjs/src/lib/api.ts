// API 客戶端配置
// 使用相對路徑，讓 Next.js rewrites 代理到後端，避免 CORS 問題
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchOptions {
  method?: string;
  body?: BodyInit | any;
  token?: string;
  headers?: HeadersInit;
}

// 類型定義
interface JobData {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string;
  salary_range?: string;
  job_type?: string;
  category_id?: number;
}

interface EventData {
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  location_detail?: string;
  category_id?: number;
  event_type?: string;
  max_participants?: number;
  allow_waitlist?: boolean;
  is_online?: boolean;
  online_url?: string;
  is_free?: boolean;
  fee?: number;
  fee_currency?: string;
  registration_start?: string;
  registration_end?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tags?: string[];
  status?: string;
  cover_image_url?: string;
}

interface BulletinData {
  title: string;
  content: string;
  category_id?: number;
  is_pinned?: boolean;
}

interface JobApplicationData {
  message?: string;
  resume_url?: string;
}

interface EventRegistrationData {
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  participants_count?: number;
  notes?: string;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { method = 'GET', body, token, headers: customHeaders } = options;

  const headers: HeadersInit = {};

  // 如果不是 FormData，設置 Content-Type
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 合併自定義標頭
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });

    // 檢查響應是否為 JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data;
    if (isJson) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // JSON 解析失敗，可能是空響應或格式錯誤
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.ok) {
      // 如果是 401 未授權或 Token 過期，清除認證並跳轉登入
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/auth/login';
        }
        throw new Error('認證已過期，請重新登入');
      }

      // 確保 data 是對象，如果不是則轉換為對象
      const errorMessage = typeof data === 'string'
        ? data
        : (data?.error || data?.message || `API 請求失敗: ${response.status}`);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // 處理網路錯誤
    if (error instanceof TypeError) {
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('failed') || errorMsg.includes('cors')) {
        const errorInfo = {
          url: `${API_BASE_URL}${endpoint}`,
          error: error.message || 'Unknown error',
          endpoint,
          type: error.name || 'TypeError',
          stack: error.stack,
        };
        console.error('API 連接錯誤:', JSON.stringify(errorInfo, null, 2));
        throw new Error(`無法連接到伺服器 (${API_BASE_URL})，請檢查網路連線或伺服器狀態`);
      }
    }
    // 如果已經是 Error 對象，直接拋出
    if (error instanceof Error) {
      // 記錄詳細錯誤信息
      console.error('API 請求錯誤:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        endpoint,
        url: `${API_BASE_URL}${endpoint}`,
      });
      throw error;
    }
    // 其他情況轉換為 Error
    const errorMessage = String(error);
    console.error('未知錯誤類型:', error);
    throw new Error(errorMessage || '未知錯誤');
  }
}

export const api = {
  // 認證相關
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('/api/v2/auth/login', {
        method: 'POST',
        body: { email, password }, // 傳遞對象，讓 fetchAPI 處理 JSON.stringify
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
        body: data, // 傳遞對象，讓 fetchAPI 處理 JSON.stringify
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
    getAll: (token?: string, params?: {
      search?: string;
      job_type?: string;
      location?: string;
      category_id?: number;
      status?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.job_type) queryParams.append('job_type', params.job_type);
      if (params?.location) queryParams.append('location', params.location);
      if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/v2/jobs?${queryParams.toString()}`
        : '/api/v2/jobs';

      return fetchAPI(url, { token });
    },

    getById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/jobs/${id}`, { token }),

    create: (data: JobData, token: string) =>
      fetchAPI('/api/v2/jobs', {
        method: 'POST',
        body: data,
        token,
      }),

    update: (id: number, data: Partial<JobData>, token: string) =>
      fetchAPI(`/api/v2/jobs/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    delete: (id: number, token: string) =>
      fetchAPI(`/api/v2/jobs/${id}`, {
        method: 'DELETE',
        token,
      }),

    getMyJobs: (token: string, status?: string) => {
      const url = status ? `/api/v2/my-jobs?status=${status}` : '/api/v2/my-jobs';
      return fetchAPI(url, { token });
    },

    apply: (jobId: number, data: JobApplicationData, token: string) =>
      fetchAPI('/api/v2/job-requests', {
        method: 'POST',
        body: { job_id: jobId, ...data },
        token,
      }),
  },

  // 活動相關
  events: {
    getAll: (token?: string, params?: {
      search?: string;
      category_id?: number;
      status?: string;
      time_filter?: 'upcoming' | 'ongoing' | 'past';
      location?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.time_filter) queryParams.append('time_filter', params.time_filter);
      if (params?.location) queryParams.append('location', params.location);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/v2/events?${queryParams.toString()}`
        : '/api/v2/events';

      return fetchAPI(url, { token });
    },

    getCategories: (token?: string) =>
      fetchAPI('/api/v2/event-categories', { token }),

    getById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/events/${id}`, { token }),

    create: (data: EventData, token: string) =>
      fetchAPI('/api/v2/events', {
        method: 'POST',
        body: data,
        token,
      }),

    update: (id: number, data: Partial<EventData>, token: string) =>
      fetchAPI(`/api/v2/events/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    delete: (id: number, token: string) =>
      fetchAPI(`/api/v2/events/${id}`, {
        method: 'DELETE',
        token,
      }),

    cancel: (id: number, reason: string, token: string) =>
      fetchAPI(`/api/v2/events/${id}/cancel`, {
        method: 'POST',
        body: { reason },
        token,
      }),

    getMyEvents: (token: string, status?: string) => {
      const url = status ? `/api/v2/my-events?status=${status}` : '/api/v2/my-events';
      return fetchAPI(url, { token });
    },

    register: (eventId: number, data: EventRegistrationData, token: string) =>
      fetchAPI(`/api/v2/events/${eventId}/register`, {
        method: 'POST',
        body: data,
        token,
      }),

    unregister: (eventId: number, token: string) =>
      fetchAPI(`/api/v2/events/${eventId}/unregister`, {
        method: 'POST',
        token,
      }),

    getMyRegistrations: (token: string, status?: string) => {
      const url = status ? `/api/v2/my-registrations?status=${status}` : '/api/v2/my-registrations';
      return fetchAPI(url, { token });
    },
  },

  // 公告相關
  bulletins: {
    getAll: (token?: string, params?: {
      search?: string;
      type?: string;
      category_id?: number;
      status?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/v2/bulletins?${queryParams.toString()}`
        : '/api/v2/bulletins';

      return fetchAPI(url, { token });
    },

    getCategories: (token?: string) =>
      fetchAPI('/api/v2/bulletin-categories', { token }),

    getById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/bulletins/${id}`, { token }),

    createComment: (bulletinId: number, content: string, token: string) =>
      fetchAPI(`/api/v2/bulletins/${bulletinId}/comments`, {
        method: 'POST',
        body: { content },
        token,
      }),

    deleteComment: (commentId: number, token: string) =>
      fetchAPI(`/api/v2/comments/${commentId}`, {
        method: 'DELETE',
        token,
      }),

    create: (data: BulletinData, token: string) =>
      fetchAPI('/api/v2/bulletins', {
        method: 'POST',
        body: data,
        token,
      }),

    update: (id: number, data: Partial<BulletinData>, token: string) =>
      fetchAPI(`/api/v2/bulletins/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    delete: (id: number, token: string) =>
      fetchAPI(`/api/v2/bulletins/${id}`, {
        method: 'DELETE',
        token,
      }),

    getMyBulletins: (token: string, status?: string) => {
      const url = status ? `/api/v2/my-bulletins?status=${status}` : '/api/v2/my-bulletins';
      return fetchAPI(url, { token });
    },
  },

  // 訊息相關
  messages: {
    getConversations: (token: string) =>
      fetchAPI('/api/v2/conversations', { token }),

    getConversation: (conversationId: number, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}`, { token }),

    getMessages: (conversationId: number, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}/messages`, { token }),

    send: (conversationId: number, data: { content: string }, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: data,
        token,
      }),

    markAsRead: (conversationId: number, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        token,
      }),

    deleteConversation: (conversationId: number, token: string) =>
      fetchAPI(`/api/v2/conversations/${conversationId}`, {
        method: 'DELETE',
        token,
      }),

    search: (params: {
      q: string;
      conversation_id?: number;
      page?: number;
      per_page?: number;
    }, token: string) => {
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.q);
      if (params.conversation_id) queryParams.append('conversation_id', params.conversation_id.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());

      return fetchAPI(`/api/v2/messages/search?${queryParams.toString()}`, { token });
    },

    createConversation: (userId: number, token: string) =>
      fetchAPI(`/api/v2/conversations/with/${userId}`, {
        method: 'POST',
        token,
      }),

    getUnreadCount: (token: string) =>
      fetchAPI('/api/v2/messages/unread-count', { token }),
  },

  // 個人資料相關
  profile: {
    update: (data: any, token: string) =>
      fetchAPI('/api/v2/auth/profile', {
        method: 'PUT',
        body: data,
        token,
      }),

    getUsers: (token?: string, params?: {
      search?: string;
      graduation_year?: number;
      industry?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.graduation_year) queryParams.append('graduation_year', params.graduation_year.toString());
      if (params?.industry) queryParams.append('industry', params.industry);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/v2/users?${queryParams.toString()}`
        : '/api/v2/users';

      return fetchAPI(url, { token });
    },

    getUserById: (id: number, token?: string) =>
      fetchAPI(`/api/v2/users/${id}`, { token }),
  },

  // 通知相關
  notifications: {
    getAll: (token: string, params?: {
      status?: 'unread' | 'read' | 'archived';
      type?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/notifications?${queryParams.toString()}`
        : '/api/notifications';

      return fetchAPI(url, { token });
    },

    getUnreadCount: (token: string) =>
      fetchAPI('/api/notifications/unread-count', { token }),

    markAsRead: (id: number, token: string) =>
      fetchAPI(`/api/notifications/${id}/read`, {
        method: 'POST',
        token,
      }),

    markAllAsRead: (token: string) =>
      fetchAPI('/api/notifications/mark-all-read', {
        method: 'POST',
        token,
      }),

    archive: (id: number, token: string) =>
      fetchAPI(`/api/notifications/${id}/archive`, {
        method: 'POST',
        token,
      }),

    delete: (id: number, token: string) =>
      fetchAPI(`/api/notifications/${id}`, {
        method: 'DELETE',
        token,
      }),
  },

  // 職涯相關
  career: {
    getWorkExperiences: (token: string) =>
      fetchAPI('/api/career/work-experiences', { token }),

    // 獲取特定用戶的工作經歷（公開資料）
    getUserWorkExperiences: (userId: number, token?: string) =>
      fetchAPI(`/api/career/users/${userId}/work-experiences`, { token }),

    addWorkExperience: (data: any, token: string) =>
      fetchAPI('/api/career/work-experiences', {
        method: 'POST',
        body: data,
        token,
      }),

    updateWorkExperience: (id: number, data: any, token: string) =>
      fetchAPI(`/api/career/work-experiences/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    deleteWorkExperience: (id: number, token: string) =>
      fetchAPI(`/api/career/work-experiences/${id}`, {
        method: 'DELETE',
        token,
      }),

    getEducations: (token: string) =>
      fetchAPI('/api/career/educations', { token }),

    // 獲取特定用戶的教育背景（公開資料）
    getUserEducations: (userId: number, token?: string) =>
      fetchAPI(`/api/career/users/${userId}/educations`, { token }),

    addEducation: (data: any, token: string) =>
      fetchAPI('/api/career/educations', {
        method: 'POST',
        body: data,
        token,
      }),

    updateEducation: (id: number, data: any, token: string) =>
      fetchAPI(`/api/career/educations/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    deleteEducation: (id: number, token: string) =>
      fetchAPI(`/api/career/educations/${id}`, {
        method: 'DELETE',
        token,
      }),

    getSkills: (token?: string) =>
      fetchAPI('/api/career/skills', { token }),

    getMySkills: (token: string) =>
      fetchAPI('/api/career/my-skills', { token }),

    addSkill: (skillId: number, token: string) =>
      fetchAPI('/api/career/my-skills', {
        method: 'POST',
        body: { skill_id: skillId },
        token,
      }),

    deleteSkill: (id: number, token: string) =>
      fetchAPI(`/api/career/my-skills/${id}`, {
        method: 'DELETE',
        token,
      }),
  },

  // 檔案上傳相關
  files: {
    upload: (file: File, relatedType?: string, relatedId?: number, token?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (relatedType) formData.append('related_type', relatedType);
      if (relatedId) formData.append('related_id', relatedId.toString());

      return fetchAPI('/api/files/upload', {
        method: 'POST',
        body: formData,
        token,
        headers: {}, // 不要設置 Content-Type，讓瀏覽器自動設置
      });
    },

    getFiles: (token?: string, params?: {
      user_id?: number;
      related_type?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
      if (params?.related_type) queryParams.append('related_type', params.related_type);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/files?${queryParams.toString()}`
        : '/api/files';

      return fetchAPI(url, { token });
    },

    deleteFile: (fileId: number, token: string) =>
      fetchAPI(`/api/files/${fileId}`, {
        method: 'DELETE',
        token,
      }),
  },

  // 設定相關
  settings: {
    changePassword: (data: {
      current_password: string;
      new_password: string;
    }, token: string) =>
      fetchAPI('/api/v2/auth/change-password', {
        method: 'POST',
        body: data,
        token,
      }),

    getNotificationPreferences: (token: string) =>
      fetchAPI('/api/user/notification-preferences', { token }),

    updateNotificationPreferences: (data: {
      emailNotifications?: boolean;
      jobAlerts?: boolean;
      eventReminders?: boolean;
      messageNotifications?: boolean;
    }, token: string) =>
      fetchAPI('/api/user/notification-preferences', {
        method: 'PUT',
        body: data,
        token,
      }),
  },

  // 管理後台相關
  admin: {
    getStatistics: (token: string) =>
      fetchAPI('/api/v2/admin/statistics', { token }),

    getUsers: (token: string, params?: {
      page?: number;
      per_page?: number;
      search?: string;
      role?: string;
      status?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);

      const url = queryParams.toString()
        ? `/api/v2/admin/users?${queryParams.toString()}`
        : '/api/v2/admin/users';

      return fetchAPI(url, { token });
    },

    updateUser: (userId: number, data: {
      role?: string;
      status?: string;
    }, token: string) =>
      fetchAPI(`/api/v2/admin/users/${userId}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    deleteUser: (userId: number, token: string) =>
      fetchAPI(`/api/v2/admin/users/${userId}`, {
        method: 'DELETE',
        token,
      }),

    approveJob: (jobId: number, token: string) =>
      fetchAPI(`/api/v2/admin/jobs/${jobId}/approve`, {
        method: 'POST',
        token,
      }),

    approveEvent: (eventId: number, token: string) =>
      fetchAPI(`/api/v2/admin/events/${eventId}/approve`, {
        method: 'POST',
        token,
      }),

    approveBulletin: (bulletinId: number, token: string) =>
      fetchAPI(`/api/v2/admin/bulletins/${bulletinId}/approve`, {
        method: 'POST',
        token,
      }),
  },

  // CMS 內容管理系統
  cms: {
    getCategories: (token?: string) =>
      fetchAPI('/api/v2/cms/article-categories', { token }),

    createCategory: (data: {
      name: string;
      name_en?: string;
      description?: string;
      icon?: string;
      color?: string;
      sort_order?: number;
    }, token: string) =>
      fetchAPI('/api/v2/cms/article-categories', {
        method: 'POST',
        body: data,
        token,
      }),

    updateCategory: (id: number, data: {
      name?: string;
      name_en?: string;
      description?: string;
      icon?: string;
      color?: string;
      sort_order?: number;
      is_active?: boolean;
    }, token: string) =>
      fetchAPI(`/api/v2/cms/article-categories/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    deleteCategory: (id: number, token: string) =>
      fetchAPI(`/api/v2/cms/article-categories/${id}`, {
        method: 'DELETE',
        token,
      }),

    getArticles: (token?: string, params?: {
      status?: 'published' | 'draft' | 'archived';
      category_id?: number;
      search?: string;
      page?: number;
      per_page?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

      const url = queryParams.toString()
        ? `/api/v2/cms/articles?${queryParams.toString()}`
        : '/api/v2/cms/articles';

      return fetchAPI(url, { token });
    },

    getArticle: (id: number, token?: string) =>
      fetchAPI(`/api/v2/cms/articles/${id}`, { token }),

    create: (data: {
      title: string;
      subtitle?: string;
      content: string;
      summary?: string;
      category_id?: number;
      status?: 'published' | 'draft' | 'pending' | 'archived';
      cover_image_url?: string;
      tags?: string;
    }, token: string) =>
      fetchAPI('/api/v2/cms/articles', {
        method: 'POST',
        body: data,
        token,
      }),

    update: (id: number, data: {
      title?: string;
      subtitle?: string;
      content?: string;
      summary?: string;
      category_id?: number;
      status?: 'published' | 'draft' | 'pending' | 'archived';
      cover_image_url?: string;
      tags?: string;
    }, token: string) =>
      fetchAPI(`/api/v2/cms/articles/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),

    delete: (id: number, token: string) =>
      fetchAPI(`/api/v2/cms/articles/${id}`, {
        method: 'DELETE',
        token,
      }),

    publish: (id: number, token: string) =>
      fetchAPI(`/api/v2/cms/articles/${id}/publish`, {
        method: 'POST',
        token,
      }),

    archive: (id: number, token: string) =>
      fetchAPI(`/api/v2/cms/articles/${id}/archive`, {
        method: 'POST',
        token,
      }),

    like: (id: number, token: string) =>
      fetchAPI(`/api/v2/cms/articles/${id}/like`, {
        method: 'POST',
        token,
      }),
  },

  // CSV 匯入匯出相關
  csv: {
    exportUsers: (token: string): Promise<Blob> => {
      return fetch('/api/csv/export/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || error.message || '匯出失敗');
        }
        return res.blob();
      });
    },

    exportJobs: (token: string): Promise<Blob> => {
      return fetch('/api/csv/export/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || error.message || '匯出失敗');
        }
        return res.blob();
      });
    },

    exportEvents: (token: string): Promise<Blob> => {
      return fetch('/api/csv/export/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || error.message || '匯出失敗');
        }
        return res.blob();
      });
    },

    exportBulletins: (token: string): Promise<Blob> => {
      return fetch('/api/csv/export/bulletins', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || error.message || '匯出失敗');
        }
        return res.blob();
      });
    },

    importUsers: (file: File, token: string) => {
      const formData = new FormData();
      formData.append('file', file);

      return fetch('/api/csv/import/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || '匯入失敗');
        }
        return data;
      });
    },

    importJobs: (file: File, token: string) => {
      const formData = new FormData();
      formData.append('file', file);

      return fetch('/api/csv/import/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || '匯入失敗');
        }
        return data;
      });
    },

    importEvents: (file: File, token: string) => {
      const formData = new FormData();
      formData.append('file', file);

      return fetch('/api/csv/import/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || '匯入失敗');
        }
        return data;
      });
    },

    importBulletins: (file: File, token: string) => {
      const formData = new FormData();
      formData.append('file', file);

      return fetch('/api/csv/import/bulletins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || '匯入失敗');
        }
        return data;
      });
    },
  },

  search: {
    global: (query: string, type: string = 'all', page: number = 1, perPage: number = 20, token: string) => {
      return fetchAPI(`/api/v2/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&per_page=${perPage}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },

    suggestions: (query: string, token: string) => {
      return fetchAPI(`/api/v2/search/suggestions?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
  },
};
