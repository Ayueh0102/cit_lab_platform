/**
 * 測試工具函數
 * 提供統一的渲染包裝器和 mock 資料
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

// ==============================
// Mock 資料
// ==============================

export const mockToken = 'eyJhbGciOiJIUzI1NiJ9.mock-token';

export const mockAdminUser = {
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
  status: 'active',
  email_verified: true,
  created_at: '2025-01-01T00:00:00',
  profile: {
    full_name: '管理員',
    display_name: '管理員',
    graduation_year: 2020,
    current_company: '測試公司',
    current_position: '工程師',
  },
};

export const mockRegularUser = {
  id: 2,
  email: 'user@example.com',
  role: 'user',
  status: 'active',
  email_verified: true,
  created_at: '2025-01-01T00:00:00',
  profile: {
    full_name: '一般用戶',
    display_name: '小明',
    graduation_year: 2022,
  },
};

export const mockJob = {
  id: 1,
  title: '光學工程師',
  company: '台積電',
  location: '新竹',
  job_type: 'full_time',
  description: '負責光學系統設計',
  status: 'active',
  created_at: '2025-11-01T00:00:00',
  publisher_name: '王小明',
};

export const mockEvent = {
  id: 1,
  title: '2025 年度系友大會',
  description: '歡迎所有系友參加',
  start_time: '2025-12-01T10:00:00',
  end_time: '2025-12-01T17:00:00',
  location: '台北',
  status: 'upcoming',
  category_name: '系友聚會',
  organizer_name: '管理員',
  registered_count: 10,
  max_participants: 50,
};

export const mockConversation = {
  id: 1,
  user_id: 2,
  user_name: '小明',
  last_message: '你好',
  last_message_time: '2025-11-26T10:00:00',
  unread_count: 2,
};

export const mockNotification = {
  id: 1,
  notification_type: 'job_request',
  title: '新的職缺交流請求',
  message: '小明對您的職缺發出了交流請求',
  status: 'unread',
  created_at: '2025-11-26T10:00:00',
  related_type: 'job_request',
  related_id: 1,
  action_url: '/jobs/1/requests',
};

// ==============================
// Auth mock 工具
// ==============================

export function setMockAuth(user = mockAdminUser, token = mockToken) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(user));
}

export function clearMockAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}

// ==============================
// Mantine Provider 包裝器
// ==============================

function AllProviders({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ==============================
// API mock 工具
// ==============================

export function mockFetch(responses: Record<string, unknown>) {
  return jest.fn((url: string) => {
    const matchedKey = Object.keys(responses).find((key) => url.includes(key));
    const data = matchedKey ? responses[matchedKey] : { error: 'Not found' };
    return Promise.resolve({
      ok: !!matchedKey,
      status: matchedKey ? 200 : 404,
      json: () => Promise.resolve(data),
    });
  }) as jest.Mock;
}
