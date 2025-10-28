/**
 * API 服務層
 * 處理所有與後端 API v2 的通訊
 */

const API_BASE_URL = 'http://localhost:5001';

// ========================================
// 通用請求處理
// ========================================

/**
 * 取得認證 Token
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken') || '';
};

/**
 * 通用 API 請求函式
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// ========================================
// 認證 API
// ========================================

export const authAPI = {
  /**
   * 登入
   */
  login: async (email, password) => {
    const data = await apiRequest('/api/auth/v2/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // 儲存 token (API 回傳 access_token)
    if (data.access_token) {
      localStorage.setItem('authToken', data.access_token);
    }

    return data;
  },

  /**
   * 註冊
   */
  register: async (userData) => {
    const data = await apiRequest('/api/auth/v2/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  },

  /**
   * 取得當前使用者資訊
   */
  getCurrentUser: async () => {
    return await apiRequest('/api/auth/v2/me');
  },

  /**
   * 更新個人檔案
   */
  updateProfile: async (profileData) => {
    return await apiRequest('/api/auth/v2/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  /**
   * 登出
   */
  logout: () => {
    localStorage.removeItem('authToken');
  },
};

// ========================================
// 職缺 API
// ========================================

export const jobsAPI = {
  /**
   * 取得職缺列表
   */
  getJobs: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.category_id) queryParams.append('category_id', params.category_id);
    if (params.job_type) queryParams.append('job_type', params.job_type);
    if (params.location) queryParams.append('location', params.location);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/jobs${query ? `?${query}` : ''}`);
  },

  /**
   * 取得單一職缺
   */
  getJob: async (jobId) => {
    return await apiRequest(`/api/v2/jobs/${jobId}`);
  },

  /**
   * 發布職缺
   */
  createJob: async (jobData) => {
    return await apiRequest('/api/v2/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * 更新職缺
   */
  updateJob: async (jobId, jobData) => {
    return await apiRequest(`/api/v2/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * 刪除職缺
   */
  deleteJob: async (jobId) => {
    return await apiRequest(`/api/v2/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },

  /**
   * 關閉職缺
   */
  closeJob: async (jobId) => {
    return await apiRequest(`/api/v2/jobs/${jobId}/close`, {
      method: 'POST',
    });
  },

  /**
   * 取得我發布的職缺
   */
  getMyJobs: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/my-jobs${query ? `?${query}` : ''}`);
  },

  /**
   * 取得職缺分類
   */
  getCategories: async () => {
    return await apiRequest('/api/v2/job-categories');
  },

  /**
   * 建立職缺交流請求
   */
  createRequest: async (jobId, message) => {
    return await apiRequest('/api/v2/job-requests', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, message }),
    });
  },

  /**
   * 取得收到的交流請求
   */
  getReceivedRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/job-requests/received${query ? `?${query}` : ''}`);
  },

  /**
   * 取得發送的交流請求
   */
  getSentRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/job-requests/sent${query ? `?${query}` : ''}`);
  },

  /**
   * 接受交流請求
   */
  acceptRequest: async (requestId) => {
    return await apiRequest(`/api/v2/job-requests/${requestId}/accept`, {
      method: 'POST',
    });
  },

  /**
   * 拒絕交流請求
   */
  rejectRequest: async (requestId, reason) => {
    return await apiRequest(`/api/v2/job-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// ========================================
// 活動 API
// ========================================

export const eventsAPI = {
  /**
   * 取得活動列表
   */
  getEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.category_id) queryParams.append('category_id', params.category_id);
    if (params.status) queryParams.append('status', params.status);
    if (params.time_filter) queryParams.append('time_filter', params.time_filter);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/events${query ? `?${query}` : ''}`);
  },

  /**
   * 取得單一活動
   */
  getEvent: async (eventId) => {
    return await apiRequest(`/api/v2/events/${eventId}`);
  },

  /**
   * 建立活動
   */
  createEvent: async (eventData) => {
    return await apiRequest('/api/v2/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  /**
   * 更新活動
   */
  updateEvent: async (eventId, eventData) => {
    return await apiRequest(`/api/v2/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  /**
   * 刪除活動
   */
  deleteEvent: async (eventId) => {
    return await apiRequest(`/api/v2/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  /**
   * 取消活動
   */
  cancelEvent: async (eventId, reason) => {
    return await apiRequest(`/api/v2/events/${eventId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * 取得我主辦的活動
   */
  getMyEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/my-events${query ? `?${query}` : ''}`);
  },

  /**
   * 取得活動分類
   */
  getCategories: async () => {
    return await apiRequest('/api/v2/event-categories');
  },

  /**
   * 報名活動
   */
  registerEvent: async (eventId, registrationData) => {
    return await apiRequest(`/api/v2/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  /**
   * 取消報名
   */
  unregisterEvent: async (eventId) => {
    return await apiRequest(`/api/v2/events/${eventId}/unregister`, {
      method: 'POST',
    });
  },

  /**
   * 取得我的報名記錄
   */
  getMyRegistrations: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/my-registrations${query ? `?${query}` : ''}`);
  },

  /**
   * 取得活動報名列表 (主辦者)
   */
  getEventRegistrations: async (eventId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/events/${eventId}/registrations${query ? `?${query}` : ''}`);
  },

  /**
   * 簽到
   */
  checkIn: async (registrationId) => {
    return await apiRequest(`/api/v2/event-registrations/${registrationId}/check-in`, {
      method: 'POST',
    });
  },
};

// ========================================
// 公告 API
// ========================================

export const bulletinsAPI = {
  /**
   * 取得公告列表
   */
  getBulletins: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.category_id) queryParams.append('category_id', params.category_id);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/bulletins${query ? `?${query}` : ''}`);
  },

  /**
   * 取得單一公告
   */
  getBulletin: async (bulletinId) => {
    return await apiRequest(`/api/v2/bulletins/${bulletinId}`);
  },

  /**
   * 建立公告
   */
  createBulletin: async (bulletinData) => {
    return await apiRequest('/api/v2/bulletins', {
      method: 'POST',
      body: JSON.stringify(bulletinData),
    });
  },

  /**
   * 更新公告
   */
  updateBulletin: async (bulletinId, bulletinData) => {
    return await apiRequest(`/api/v2/bulletins/${bulletinId}`, {
      method: 'PUT',
      body: JSON.stringify(bulletinData),
    });
  },

  /**
   * 刪除公告
   */
  deleteBulletin: async (bulletinId) => {
    return await apiRequest(`/api/v2/bulletins/${bulletinId}`, {
      method: 'DELETE',
    });
  },

  /**
   * 置頂公告
   */
  pinBulletin: async (bulletinId) => {
    return await apiRequest(`/api/v2/bulletins/${bulletinId}/pin`, {
      method: 'POST',
    });
  },

  /**
   * 取消置頂
   */
  unpinBulletin: async (bulletinId) => {
    return await apiRequest(`/api/v2/bulletins/${bulletinId}/unpin`, {
      method: 'POST',
    });
  },

  /**
   * 取得公告分類
   */
  getCategories: async () => {
    return await apiRequest('/api/v2/bulletin-categories');
  },

  /**
   * 發表留言
   */
  createComment: async (bulletinId, content, parentId = null) => {
    return await apiRequest(`/api/v2/bulletins/${bulletinId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  },

  /**
   * 刪除留言
   */
  deleteComment: async (commentId) => {
    return await apiRequest(`/api/v2/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// ========================================
// 訊息 API
// ========================================

export const messagesAPI = {
  /**
   * 取得對話列表
   */
  getConversations: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/conversations${query ? `?${query}` : ''}`);
  },

  /**
   * 取得單一對話
   */
  getConversation: async (conversationId) => {
    return await apiRequest(`/api/v2/conversations/${conversationId}`);
  },

  /**
   * 建立或取得與特定使用者的對話
   */
  createOrGetConversation: async (userId) => {
    return await apiRequest(`/api/v2/conversations/with/${userId}`, {
      method: 'POST',
    });
  },

  /**
   * 取得對話的訊息列表
   */
  getMessages: async (conversationId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const query = queryParams.toString();
    return await apiRequest(`/api/v2/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  },

  /**
   * 發送訊息
   */
  sendMessage: async (conversationId, messageData) => {
    return await apiRequest(`/api/v2/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  /**
   * 刪除訊息
   */
  deleteMessage: async (messageId) => {
    return await apiRequest(`/api/v2/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  /**
   * 標記對話為已讀
   */
  markAsRead: async (conversationId) => {
    return await apiRequest(`/api/v2/conversations/${conversationId}/mark-read`, {
      method: 'POST',
    });
  },

  /**
   * 取得未讀訊息總數
   */
  getUnreadCount: async () => {
    return await apiRequest('/api/v2/messages/unread-count');
  },
};

// ========================================
// CSV 匯入匯出 API
// ========================================

export const csvAPI = {
  /**
   * 匯出使用者
   */
  exportUsers: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/csv/export/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * 匯出職缺
   */
  exportJobs: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/csv/export/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * 匯出活動
   */
  exportEvents: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/csv/export/events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * 匯出公告
   */
  exportBulletins: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/csv/export/bulletins`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * 匯出所有資料
   */
  exportAll: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/csv/export/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * 匯入 CSV
   */
  import: async (type, file) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/csv/import/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Import failed');
    }

    return data;
  },
};

export default {
  auth: authAPI,
  jobs: jobsAPI,
  events: eventsAPI,
  bulletins: bulletinsAPI,
  messages: messagesAPI,
  csv: csvAPI,
};
