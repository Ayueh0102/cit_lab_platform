"""
資料庫優化腳本
添加索引以提升查詢性能
"""

import sqlite3
import os

# 資料庫路徑
DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'app_v2.db')

def create_indexes():
    """創建索引以優化查詢性能"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🔧 開始優化資料庫...")
    
    # 職缺索引
    indexes = [
        # 職缺表索引
        ("idx_jobs_status", "jobs_v2", "status"),
        ("idx_jobs_job_type", "jobs_v2", "job_type"),
        ("idx_jobs_location", "jobs_v2", "location"),
        ("idx_jobs_category_id", "jobs_v2", "category_id"),
        ("idx_jobs_poster_id", "jobs_v2", "poster_id"),
        ("idx_jobs_created_at", "jobs_v2", "created_at DESC"),
        ("idx_jobs_published_at", "jobs_v2", "published_at DESC"),
        
        # 活動表索引
        ("idx_events_status", "events_v2", "status"),
        ("idx_events_event_type", "events_v2", "event_type"),
        ("idx_events_category_id", "events_v2", "category_id"),
        ("idx_events_organizer_id", "events_v2", "organizer_id"),
        ("idx_events_start_time", "events_v2", "start_time"),
        ("idx_events_created_at", "events_v2", "created_at DESC"),
        
        # 公告表索引
        ("idx_bulletins_status", "bulletins_v2", "status"),
        ("idx_bulletins_bulletin_type", "bulletins_v2", "bulletin_type"),
        ("idx_bulletins_category_id", "bulletins_v2", "category_id"),
        ("idx_bulletins_author_id", "bulletins_v2", "author_id"),
        ("idx_bulletins_is_pinned", "bulletins_v2", "is_pinned"),
        ("idx_bulletins_is_featured", "bulletins_v2", "is_featured"),
        ("idx_bulletins_published_at", "bulletins_v2", "published_at DESC"),
        
        # 用戶表索引
        ("idx_users_email", "users_v2", "email"),
        ("idx_users_status", "users_v2", "status"),
        ("idx_users_role", "users_v2", "role"),
        ("idx_users_last_login", "users_v2", "last_login_at DESC"),
        
        # 用戶資料表索引
        ("idx_profiles_user_id", "user_profiles_v2", "user_id"),
        ("idx_profiles_graduation_year", "user_profiles_v2", "graduation_year"),
        
        # 職缺申請表索引
        ("idx_job_requests_job_id", "job_requests_v2", "job_id"),
        ("idx_job_requests_applicant_id", "job_requests_v2", "applicant_id"),
        ("idx_job_requests_status", "job_requests_v2", "status"),
        ("idx_job_requests_created_at", "job_requests_v2", "created_at DESC"),
        
        # 活動報名表索引
        ("idx_event_registrations_event_id", "event_registrations_v2", "event_id"),
        ("idx_event_registrations_user_id", "event_registrations_v2", "user_id"),
        ("idx_event_registrations_status", "event_registrations_v2", "status"),
        ("idx_event_registrations_created_at", "event_registrations_v2", "registered_at DESC"),
        
        # 訊息表索引
        ("idx_messages_conversation_id", "messages_v2", "conversation_id"),
        ("idx_messages_sender_id", "messages_v2", "sender_id"),
        ("idx_messages_created_at", "messages_v2", "created_at DESC"),
        
        # 通知表索引
        ("idx_notifications_user_id", "notifications_v2", "user_id"),
        ("idx_notifications_is_read", "notifications_v2", "is_read"),
        ("idx_notifications_created_at", "notifications_v2", "created_at DESC"),
    ]
    
    created_count = 0
    skipped_count = 0
    
    for index_name, table_name, columns in indexes:
        try:
            # 檢查索引是否已存在
            cursor.execute(f"""
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name='{index_name}'
            """)
            
            if cursor.fetchone():
                print(f"  ⏭️  索引已存在: {index_name}")
                skipped_count += 1
                continue
            
            # 創建索引
            cursor.execute(f"""
                CREATE INDEX {index_name} ON {table_name} ({columns})
            """)
            print(f"  ✅ 已創建索引: {index_name} on {table_name}({columns})")
            created_count += 1
            
        except sqlite3.Error as e:
            print(f"  ❌ 創建索引失敗 {index_name}: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"\n📊 優化完成!")
    print(f"  新增索引: {created_count} 個")
    print(f"  已存在: {skipped_count} 個")
    print(f"  總計: {created_count + skipped_count} 個索引")

def analyze_database():
    """分析資料庫以更新統計信息"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n📈 正在分析資料庫...")
    cursor.execute("ANALYZE")
    conn.commit()
    conn.close()
    print("  ✅ 分析完成")

def vacuum_database():
    """清理資料庫以優化存儲"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n🧹 正在清理資料庫...")
    cursor.execute("VACUUM")
    conn.commit()
    conn.close()
    print("  ✅ 清理完成")

if __name__ == '__main__':
    print("=" * 50)
    print("資料庫性能優化工具")
    print("=" * 50)
    
    create_indexes()
    analyze_database()
    vacuum_database()
    
    print("\n🎉 所有優化完成!")
    print("=" * 50)


