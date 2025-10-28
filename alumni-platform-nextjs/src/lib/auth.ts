/**
 * 認證工具
 * 處理 JWT token 的儲存和管理
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface User {
  id: number;
  email: string;
  name: string;
  student_id?: string;
  graduation_year?: number;
  role: string;
  created_at: string;
}

/**
 * 儲存認證資訊
 */
export function setAuth(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * 獲取 token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 獲取用戶資訊
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * 清除認證資訊
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * 檢查是否已登入
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * 檢查用戶角色
 */
export function hasRole(role: string): boolean {
  const user = getUser();
  return user?.role === role;
}

/**
 * 檢查是否為管理員
 */
export function isAdmin(): boolean {
  return hasRole('admin');
}

