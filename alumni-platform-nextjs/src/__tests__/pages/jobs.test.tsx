/**
 * Jobs 頁面測試
 * 測試職缺列表載入、搜尋、篩選
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import JobsPage from '@/app/jobs/page';
import { setMockAuth, mockAdminUser, mockToken, mockJob } from '../test-utils';

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
    jobs: {
      getAll: jest.fn(),
    },
    notifications: {
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

function renderJobs() {
  return render(
    <MantineProvider>
      <JobsPage />
    </MantineProvider>
  );
}

describe('JobsPage', () => {
  beforeEach(() => {
    setMockAuth(mockAdminUser, mockToken);
    const { api } = require('@/lib/api');
    api.jobs.getAll.mockResolvedValue({
      jobs: [mockJob],
      total: 1,
    });
  });

  it('should render page title', async () => {
    renderJobs();
    await waitFor(() => {
      expect(screen.getByText('職缺媒合')).toBeInTheDocument();
    });
  });

  it('should render search input', async () => {
    renderJobs();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/搜尋職缺/i)).toBeInTheDocument();
    });
  });

  it('should load and display jobs', async () => {
    renderJobs();
    await waitFor(() => {
      expect(screen.getByText('光學工程師')).toBeInTheDocument();
    });
  });

  it('should display job company name', async () => {
    renderJobs();
    await waitFor(() => {
      expect(screen.getByText(/台積電/)).toBeInTheDocument();
    });
  });

  it('should show "post job" button', async () => {
    renderJobs();
    await waitFor(() => {
      expect(screen.getByText(/發布職缺/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no jobs', async () => {
    const { api } = require('@/lib/api');
    api.jobs.getAll.mockResolvedValue({
      jobs: [],
      total: 0,
    });

    renderJobs();
    await waitFor(() => {
      expect(screen.getByText(/目前沒有職缺/i)).toBeInTheDocument();
    });
  });

  it('should apply glass-card-soft class to job cards', async () => {
    renderJobs();
    await waitFor(() => {
      const jobCard = screen.getByText('光學工程師').closest('.glass-card-soft');
      expect(jobCard).toBeInTheDocument();
    });
  });
});
