import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the API and auth modules
jest.mock('@/lib/api', () => ({
  api: {
    jobs: {
      getAll: jest.fn().mockResolvedValue({ jobs: [] }),
    },
    events: {
      getAll: jest.fn().mockResolvedValue({ events: [] }),
    },
    bulletins: {
      getAll: jest.fn().mockResolvedValue({ bulletins: [] }),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn().mockReturnValue('mock-token'),
  getUser: jest.fn().mockReturnValue({ id: 1, role: 'user' }),
}));

jest.mock('@/components/layout/SidebarLayout', () => ({
  SidebarLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('HomePage', () => {
  it('renders welcome message', async () => {
    render(await HomePage());
    expect(screen.getByText(/歡迎回到系友大家庭/i)).toBeInTheDocument();
  });

  it('renders statistics cards', async () => {
    render(await HomePage());
    expect(screen.getByText(/本週新職缺/i)).toBeInTheDocument();
    expect(screen.getByText(/即將到來的活動/i)).toBeInTheDocument();
    expect(screen.getByText(/活躍系友/i)).toBeInTheDocument();
    expect(screen.getByText(/本週新增/i)).toBeInTheDocument();
  });
});

