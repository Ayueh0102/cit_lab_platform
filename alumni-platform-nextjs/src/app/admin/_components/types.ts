export interface Statistics {
  total_users: number;
  total_jobs: number;
  total_events: number;
  total_bulletins: number;
  active_users: number;
  pending_users: number;
  pending_jobs: number;
  active_users_30d?: number;
  active_jobs?: number;
  upcoming_events?: number;
  published_bulletins?: number;
  jobs_this_month?: number;
  events_this_month?: number;
  bulletins_this_month?: number;
  bulletins_this_week?: number;
}

export interface PendingUser {
  id: number;
  email: string;
  status: string;
  created_at: string;
  profile: {
    full_name?: string;
    display_name?: string;
    phone?: string;
    graduation_year?: number;
    class_year?: number;
    degree?: string;
    major?: string;
    student_id?: string;
    thesis_title?: string;
    advisor_1?: string;
    advisor_2?: string;
  };
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface ImportResult {
  imported?: number;
  created?: number;
  updated?: number;
  failed?: number;
  errors?: string[];
  count?: number;
  total?: number;
}

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  name: string;
  description: string;
  is_public: boolean;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

export const CSV_FIELD_DESCRIPTIONS: Record<string, { fields: string[]; required: string[]; description: string }> = {
  users: {
    fields: ['email', 'name', 'display_name', 'phone', 'graduation_year', 'class_year', 'degree', 'major', 'student_id', 'advisor_1', 'advisor_2', 'thesis_title'],
    required: ['email', 'name'],
    description: '匯入使用者資料。email 必須唯一，已存在的 email 將更新資料。',
  },
  jobs: {
    fields: ['title', 'company', 'location', 'description', 'requirements', 'salary_range', 'job_type', 'contact_email'],
    required: ['title', 'company'],
    description: '匯入職缺資料。job_type 可選值：full_time, part_time, internship, contract。',
  },
  bulletins: {
    fields: ['title', 'content', 'bulletin_type', 'category', 'is_pinned'],
    required: ['title', 'content'],
    description: '匯入公告資料。bulletin_type 可選值：announcement, news, event。',
  },
};
