/**
 * Notifications 頁面測試
 * 測試通知列表載入、Tab 篩選、全部已讀
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import NotificationsPage from '@/app/notifications/page';
import { setMockAuth, mockAdminUser, mockToken, mockNotification } from '../test-utils';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

jest.mock('@/lib/api', () => ({
  api: {
    notifications: {
      getAll: jest.fn(),
      getUnreadCount: jest.fn().mockResolvedValue({ unread_count: 1 }),
      markAllAsRead: jest.fn().mockResolvedValue({}),
      markAsRead: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}));

jest.mock('@/components/layout/SidebarLayout', () => ({
  SidebarLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-layout">{children}</div>,
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

function renderNotifications() {
  return render(
    <MantineProvider>
      <NotificationsPage />
    </MantineProvider>
  );
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    setMockAuth(mockAdminUser, mockToken);
    const { api } = require('@/lib/api');
    api.notifications.getAll.mockResolvedValue({
      notifications: [mockNotification],
      pagination: { page: 1, per_page: 20, total: 1, pages: 1 },
    });
  });

  it('should render page title', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('通知中心')).toBeInTheDocument();
    });
  });

  it('should show unread count', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText(/1 則未讀通知/)).toBeInTheDocument();
    });
  });

  it('should display notification items', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('新的職缺交流請求')).toBeInTheDocument();
    });
  });

  it('should render filter tabs', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('未讀')).toBeInTheDocument();
    });
  });

  it('should render mark-all-as-read button', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText(/全部標示為已讀/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no notifications', async () => {
    const { api } = require('@/lib/api');
    api.notifications.getAll.mockResolvedValue({
      notifications: [],
      pagination: { page: 1, per_page: 20, total: 0, pages: 0 },
    });
    api.notifications.getUnreadCount.mockResolvedValue({ unread_count: 0 });

    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText(/沒有通知/i)).toBeInTheDocument();
    });
  });
});
