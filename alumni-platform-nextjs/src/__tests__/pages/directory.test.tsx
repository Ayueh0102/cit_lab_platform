/**
 * Directory 頁面測試
 * 測試系友通訊錄頁面：載入用戶列表、顯示用戶卡片、搜尋輸入框
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import DirectoryPage from '@/app/directory/page';
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
  usePathname: () => '/directory',
}));

jest.mock('@/lib/api', () => ({
  api: {
    profile: {
      getUsers: jest.fn(),
    },
    contactRequests: {
      getStatus: jest.fn(),
    },
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

jest.mock('@/components/layout/SidebarLayout', () => ({
  SidebarLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-layout">{children}</div>,
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

const mockUser = {
  id: 3,
  email: 'alumni@example.com',
  profile: {
    full_name: '張三豐',
    display_name: '三豐',
    graduation_year: 2020,
    current_company: '台積電',
    current_position: '光學工程師',
    location: '新竹',
  },
};

function renderDirectory() {
  return render(
    <MantineProvider>
      <DirectoryPage />
    </MantineProvider>
  );
}

describe('DirectoryPage', () => {
  beforeEach(() => {
    setMockAuth(mockAdminUser, mockToken);
    const { api } = require('@/lib/api');
    api.profile.getUsers.mockResolvedValue({
      users: [mockUser],
      total: 1,
      pages: 1,
    });
    api.contactRequests.getStatus.mockResolvedValue({
      status: 'none',
    });
  });

  it('should render page title', async () => {
    renderDirectory();
    await waitFor(() => {
      expect(screen.getByText('系友通訊錄')).toBeInTheDocument();
    });
  });

  it('should render search input', async () => {
    renderDirectory();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/搜尋姓名/i)).toBeInTheDocument();
    });
  });

  it('should load and display user cards', async () => {
    renderDirectory();
    await waitFor(() => {
      // display_name 優先於 full_name 顯示
      expect(screen.getByText('三豐')).toBeInTheDocument();
    });
  });

  it('should display user company info', async () => {
    renderDirectory();
    await waitFor(() => {
      expect(screen.getByText(/台積電/)).toBeInTheDocument();
    });
  });

  it('should call api.profile.getUsers on mount', async () => {
    const { api } = require('@/lib/api');
    renderDirectory();
    await waitFor(() => {
      expect(api.profile.getUsers).toHaveBeenCalled();
    });
  });

  it('should show empty state when no users', async () => {
    const { api } = require('@/lib/api');
    api.profile.getUsers.mockResolvedValue({
      users: [],
      total: 0,
      pages: 1,
    });

    renderDirectory();
    await waitFor(() => {
      expect(screen.getByText(/尚無系友資料/i)).toBeInTheDocument();
    });
  });
});
