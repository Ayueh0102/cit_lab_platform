/**
 * ProtectedRoute 元件測試
 * 測試路由保護邏輯
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { setMockAuth, clearMockAuth, mockAdminUser, mockToken } from '../test-utils';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

function renderProtected(requireAuth = true) {
  return render(
    <MantineProvider>
      <ProtectedRoute requireAuth={requireAuth}>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRoute>
    </MantineProvider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    clearMockAuth();
    mockPush.mockClear();
  });

  describe('requireAuth=true (default)', () => {
    it('should redirect to login when not authenticated', async () => {
      renderProtected(true);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should not render children when not authenticated', async () => {
      renderProtected(true);
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should render children when authenticated', async () => {
      setMockAuth(mockAdminUser, mockToken);
      renderProtected(true);
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth=false (login/register pages)', () => {
    it('should redirect to home when already authenticated', async () => {
      setMockAuth(mockAdminUser, mockToken);
      renderProtected(false);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should render children when not authenticated', async () => {
      renderProtected(false);
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });
});
