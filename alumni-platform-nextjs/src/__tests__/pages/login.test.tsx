/**
 * Login 頁面測試
 * 測試登入表單驗證與提交流程
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import LoginPage from '@/app/auth/login/page';
import { clearMockAuth } from '../test-utils';

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
    auth: {
      login: jest.fn(),
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

function renderLogin() {
  return render(
    <MantineProvider>
      <LoginPage />
    </MantineProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearMockAuth();
    mockPush.mockClear();
  });

  it('should render login form with email and password fields', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByText('電子郵件')).toBeInTheDocument();
      expect(screen.getByText('密碼')).toBeInTheDocument();
    });
  });

  it('should render login button', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /登入/i })).toBeInTheDocument();
    });
  });

  it('should render link to register page', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByText(/立即註冊/i)).toBeInTheDocument();
    });
  });

  it('should show test account info', async () => {
    renderLogin();
    await waitFor(() => {
      expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();
    });
  });

  it('should call login API on form submit', async () => {
    const { api } = require('@/lib/api');
    api.auth.login.mockResolvedValue({
      access_token: 'token123',
      user: { id: 1, email: 'admin@example.com', role: 'admin', profile: {} },
    });

    renderLogin();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('電子郵件')).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/電子郵件/i);
    const passwordInput = screen.getByPlaceholderText(/密碼/i) || screen.getAllByRole('textbox')[1];

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'admin123');

    const submitButton = screen.getByRole('button', { name: /登入/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith('admin@example.com', 'admin123');
    });
  });
});
