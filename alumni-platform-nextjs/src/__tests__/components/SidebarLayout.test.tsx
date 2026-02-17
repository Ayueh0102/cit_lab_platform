/**
 * SidebarLayout 元件測試
 * 測試側邊欄佈局：導航項目、用戶名稱顯示
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { setMockAuth, mockAdminUser, mockToken } from '../test-utils';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  usePathname: () => '/',
}));

jest.mock('@/lib/api', () => ({
  api: {
    notifications: {
      getUnreadCount: jest.fn().mockResolvedValue({ unread_count: 0 }),
    },
    messages: {
      getUnreadCount: jest.fn().mockResolvedValue({ unread_count: 0 }),
    },
  },
}));

jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}));

function renderSidebar() {
  return render(
    <MantineProvider>
      <SidebarLayout>
        <div data-testid="child-content">測試內容</div>
      </SidebarLayout>
    </MantineProvider>
  );
}

describe('SidebarLayout', () => {
  beforeEach(() => {
    setMockAuth(mockAdminUser, mockToken);
  });

  it('should render children content', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  it('should display navigation items', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('首頁總覽')).toBeInTheDocument();
      expect(screen.getByText('職缺機會')).toBeInTheDocument();
      expect(screen.getByText('活動聚會')).toBeInTheDocument();
    });
  });

  it('should display directory link', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('系友通訊錄')).toBeInTheDocument();
    });
  });

  it('should display user display name', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('管理員')).toBeInTheDocument();
    });
  });

  it('should show admin panel link for admin users', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('管理後台')).toBeInTheDocument();
    });
  });

  it('should not show admin panel link for regular users', async () => {
    const regularUser = {
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
        current_company: '',
        current_position: '',
      },
    };
    setMockAuth(regularUser, mockToken);

    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('首頁總覽')).toBeInTheDocument();
    });

    expect(screen.queryByText('管理後台')).not.toBeInTheDocument();
  });

  it('should display messaging and notification links', async () => {
    renderSidebar();
    await waitFor(() => {
      expect(screen.getByText('訊息中心')).toBeInTheDocument();
    });
  });
});
