/**
 * 認證工具
 * 處理 JWT token 的儲存和管理
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export interface UserProfile {
  id?: number;
  user_id?: number;
  full_name?: string;
  display_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  graduation_year?: number | null;
  current_company?: string | null;
  current_position?: string | null;
  current_location?: string | null;
  industry?: string | null;
  email?: string;
  [key: string]: any;
}

export interface User {
  id: number;
  email: string;
  role: string;
  status: string;
  email_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
  profile?: UserProfile;
  // 向後兼容的欄位
  name?: string;
  student_id?: string;
  graduation_year?: number;
}

/**
 * 儲存認證資訊
 */
export function setAuth(token: string, user: any): void {
  if (typeof window === 'undefined') return;
  
  // 確保用戶對象格式正確
  const userData: User = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    email_verified: user.email_verified || false,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    profile: user.profile,
    // 向後兼容：從 profile 中提取 name
    name: user.profile?.full_name || user.name || user.email,
    student_id: user.profile?.student_id || user.student_id,
    graduation_year: user.profile?.graduation_year || user.graduation_year,
  };
  
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
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
 * 更新用戶資訊（不更新 token）
 * 用於用戶更新個人資料後同步 localStorage
 */
export function updateUser(user: any): void {
  if (typeof window === 'undefined') return;
  
  // 確保用戶對象格式正確
  const userData: User = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    email_verified: user.email_verified || false,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    profile: user.profile,
    // 向後兼容：從 profile 中提取欄位
    name: user.profile?.full_name || user.name || user.email,
    full_name: user.profile?.full_name,
    student_id: user.profile?.student_id || user.student_id,
    graduation_year: user.profile?.graduation_year || user.graduation_year,
  };
  
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  
  // 觸發 storage 事件，讓其他組件可以監聽更新
  window.dispatchEvent(new Event('user-updated'));
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

