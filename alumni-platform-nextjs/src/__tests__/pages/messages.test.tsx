/**
 * Messages 頁面測試
 * 測試對話列表載入和空狀態
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import MessagesPage from '@/app/messages/page';
import { setMockAuth, mockAdminUser, mockToken, mockConversation } from '../test-utils';

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
    messages: {
      getConversations: jest.fn(),
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

function renderMessages() {
  return render(
    <MantineProvider>
      <MessagesPage />
    </MantineProvider>
  );
}

describe('MessagesPage', () => {
  beforeEach(() => {
    setMockAuth(mockAdminUser, mockToken);
  });

  it('should render page title', async () => {
    const { api } = require('@/lib/api');
    api.messages.getConversations.mockResolvedValue({ conversations: [] });

    renderMessages();
    await waitFor(() => {
      expect(screen.getByText('訊息中心')).toBeInTheDocument();
    });
  });

  it('should show empty state when no conversations', async () => {
    const { api } = require('@/lib/api');
    api.messages.getConversations.mockResolvedValue({ conversations: [] });

    renderMessages();
    await waitFor(() => {
      expect(screen.getByText(/尚無對話記錄/i)).toBeInTheDocument();
    });
  });

  it('should handle API returning array fallback correctly', async () => {
    const { api } = require('@/lib/api');
    // 模擬 API 回傳沒有 conversations 包裝的情況
    api.messages.getConversations.mockResolvedValue({});

    renderMessages();
    // 不應該 crash，應該顯示空狀態
    await waitFor(() => {
      expect(screen.getByText(/尚無對話記錄/i)).toBeInTheDocument();
    });
  });

  it('should display conversations when available', async () => {
    const { api } = require('@/lib/api');
    api.messages.getConversations.mockResolvedValue({
      conversations: [mockConversation],
    });

    renderMessages();
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
  });
});
