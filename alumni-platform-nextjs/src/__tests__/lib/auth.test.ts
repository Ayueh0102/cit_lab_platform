/**
 * auth.ts 單元測試
 * 測試認證工具的所有功能
 */
import {
  setAuth,
  getToken,
  getUser,
  updateUser,
  clearAuth,
  isAuthenticated,
  hasRole,
  isAdmin,
} from '@/lib/auth';
import { mockToken, mockAdminUser, mockRegularUser } from '../test-utils';

describe('auth.ts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setAuth / getToken / getUser', () => {
    it('should store token and user in localStorage', () => {
      setAuth(mockToken, mockAdminUser);

      expect(getToken()).toBe(mockToken);
      const user = getUser();
      expect(user).not.toBeNull();
      expect(user!.id).toBe(1);
      expect(user!.email).toBe('admin@example.com');
      expect(user!.role).toBe('admin');
    });

    it('should extract name from profile for backward compatibility', () => {
      setAuth(mockToken, mockAdminUser);
      const user = getUser();
      expect(user!.name).toBe('管理員');
    });

    it('should fallback to email when profile has no full_name', () => {
      const userWithoutName = {
        ...mockRegularUser,
        profile: { ...mockRegularUser.profile, full_name: undefined },
        name: undefined,
      };
      setAuth(mockToken, userWithoutName as any);
      const user = getUser();
      expect(user!.name).toBe('user@example.com');
    });
  });

  describe('getToken', () => {
    it('should return null when no token is set', () => {
      expect(getToken()).toBeNull();
    });

    it('should return stored token', () => {
      localStorage.setItem('auth_token', mockToken);
      expect(getToken()).toBe(mockToken);
    });
  });

  describe('getUser', () => {
    it('should return null when no user is set', () => {
      expect(getUser()).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('user_data', 'not-json');
      expect(getUser()).toBeNull();
    });

    it('should parse and return user data', () => {
      localStorage.setItem('user_data', JSON.stringify(mockAdminUser));
      const user = getUser();
      expect(user!.id).toBe(1);
    });
  });

  describe('updateUser', () => {
    it('should update user data without changing token', () => {
      setAuth(mockToken, mockAdminUser);
      const updatedProfile = { ...mockAdminUser, profile: { ...mockAdminUser.profile, display_name: '新名字' } };
      updateUser(updatedProfile);

      expect(getToken()).toBe(mockToken);
      const user = getUser();
      expect(user!.profile!.display_name).toBe('新名字');
    });

    it('should dispatch user-updated event', () => {
      const handler = jest.fn();
      window.addEventListener('user-updated', handler);

      setAuth(mockToken, mockAdminUser);
      updateUser(mockAdminUser);

      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener('user-updated', handler);
    });
  });

  describe('clearAuth', () => {
    it('should remove token and user from localStorage', () => {
      setAuth(mockToken, mockAdminUser);
      clearAuth();

      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not logged in', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', mockToken);
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('should return false when no user', () => {
      expect(hasRole('admin')).toBe(false);
    });

    it('should return true for matching role', () => {
      setAuth(mockToken, mockAdminUser);
      expect(hasRole('admin')).toBe(true);
    });

    it('should return false for non-matching role', () => {
      setAuth(mockToken, mockRegularUser);
      expect(hasRole('admin')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      setAuth(mockToken, mockAdminUser);
      expect(isAdmin()).toBe(true);
    });

    it('should return false for regular user', () => {
      setAuth(mockToken, mockRegularUser);
      expect(isAdmin()).toBe(false);
    });
  });
});
