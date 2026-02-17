/**
 * API 客戶端測試
 * 測試 fetchAPI 核心邏輯：GET/POST 請求、401 處理、非 JSON 回應、網路錯誤
 */
import { setMockAuth, clearMockAuth, mockToken } from '../test-utils';

// 儲存原始 fetch 以便還原
const originalFetch = global.fetch;

beforeEach(() => {
  // 清除 module cache 以重新載入 api 模組
  jest.resetModules();
  clearMockAuth();
});

afterEach(() => {
  global.fetch = originalFetch;
});

function mockGlobalFetch(response: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  jsonError?: boolean;
}) {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    headers = { 'content-type': 'application/json' },
    body = {},
    jsonError = false,
  } = response;

  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    statusText,
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || null,
    },
    json: jsonError
      ? jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      : jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(
      typeof body === 'string' ? body : JSON.stringify(body)
    ),
  });
}

describe('API Client - fetchAPI', () => {
  it('should make a successful GET request', async () => {
    const responseData = { jobs: [], total: 0 };
    mockGlobalFetch({ body: responseData });

    const { api } = await import('@/lib/api');
    const result = await api.jobs.getAll();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/jobs'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(responseData);
  });

  it('should make a successful POST request with body and token', async () => {
    const responseData = { token: 'new-token', user: { id: 1 } };
    mockGlobalFetch({ body: responseData });

    const { api } = await import('@/lib/api');
    const result = await api.auth.login('admin@example.com', 'admin123');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(responseData);
  });

  it('should include Authorization header when token is provided', async () => {
    const responseData = { user: { id: 1, email: 'admin@example.com' } };
    mockGlobalFetch({ body: responseData });

    const { api } = await import('@/lib/api');
    await api.auth.getCurrentUser(mockToken);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v2/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    );
  });

  it('should handle 401 response by clearing localStorage and redirecting', async () => {
    setMockAuth();
    mockGlobalFetch({
      ok: false,
      status: 401,
      body: { error: 'Token expired' },
    });

    const { api } = await import('@/lib/api');

    await expect(api.auth.getCurrentUser(mockToken)).rejects.toThrow('認證已過期，請重新登入');

    // 應該清除 localStorage
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('should throw error for non-JSON response', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html>Error</html>',
    });

    const { api } = await import('@/lib/api');

    await expect(api.jobs.getAll()).rejects.toThrow();
  });

  it('should handle network errors (TypeError from fetch)', async () => {
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    const { api } = await import('@/lib/api');

    await expect(api.jobs.getAll()).rejects.toThrow('無法連接到伺服器');
  });

  it('should handle API error response with error message', async () => {
    mockGlobalFetch({
      ok: false,
      status: 400,
      body: { error: '參數錯誤' },
    });

    const { api } = await import('@/lib/api');

    await expect(api.auth.login('', '')).rejects.toThrow('參數錯誤');
  });

  it('should handle JSON parse failure gracefully', async () => {
    mockGlobalFetch({
      ok: true,
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: 'invalid json',
      jsonError: true,
    });

    const { api } = await import('@/lib/api');

    await expect(api.jobs.getAll()).rejects.toThrow();
  });
});
