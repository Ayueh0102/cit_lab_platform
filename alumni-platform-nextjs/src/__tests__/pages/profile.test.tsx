/**
 * Profile 頁面測試
 * 測試個人資料頁面：載入用戶資料、顯示用戶名稱、編輯按鈕
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import ProfilePage from '@/app/profile/page';
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
  usePathname: () => '/profile',
}));

jest.mock('@/lib/api', () => ({
  api: {
    auth: {
      getCurrentUser: jest.fn(),
    },
    profile: {
      update: jest.fn(),
    },
    career: {
      getWorkExperiences: jest.fn(),
      getEducations: jest.fn(),
      getMySkills: jest.fn(),
      getSkills: jest.fn(),
    },
    files: {
      upload: jest.fn(),
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

const mockProfileUser = {
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
  profile: {
    full_name: '管理員',
    display_name: '管理員',
    graduation_year: 2020,
    current_company: '測試公司',
    current_position: '工程師',
    phone: '0912345678',
    bio: '系統管理員',
  },
};

function renderProfile() {
  return render(
    <MantineProvider>
      <ProfilePage />
    </MantineProvider>
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    setMockAuth(mockAdminUser, mockToken);
    const { api } = require('@/lib/api');
    api.auth.getCurrentUser.mockResolvedValue({
      user: mockProfileUser,
    });
    api.career.getWorkExperiences.mockResolvedValue({
      work_experiences: [],
    });
    api.career.getEducations.mockResolvedValue({
      educations: [],
    });
  });

  it('should render page title', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('個人資料')).toBeInTheDocument();
    });
  });

  it('should load and display user name', async () => {
    renderProfile();
    await waitFor(() => {
      // 「管理員」出現在標題 h2 和 Badge 中，使用 getAllByText
      const elements = screen.getAllByText('管理員');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should display edit button', async () => {
    renderProfile();
    await waitFor(() => {
      const editButtons = screen.getAllByText('編輯資料');
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  it('should call api.auth.getCurrentUser on mount', async () => {
    const { api } = require('@/lib/api');
    renderProfile();
    await waitFor(() => {
      expect(api.auth.getCurrentUser).toHaveBeenCalledWith(mockToken);
    });
  });

  it('should call career APIs on mount', async () => {
    const { api } = require('@/lib/api');
    renderProfile();
    await waitFor(() => {
      expect(api.career.getWorkExperiences).toHaveBeenCalled();
      expect(api.career.getEducations).toHaveBeenCalled();
    });
  });
});
