"""
資料庫遷移腳本
添加新欄位：
1. UserProfile.notification_preferences (TEXT)
2. Conversation.user1_deleted (BOOLEAN)
3. Conversation.user2_deleted (BOOLEAN)
"""

import os
import sqlite3

def migrate_database():
    """執行資料庫遷移"""
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app_v2.db')
    
    if not os.path.exists(db_path):
        print("❌ 資料庫檔案不存在，請先初始化資料庫")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 檢查並添加 UserProfile.notification_preferences 欄位
        try:
            cursor.execute("SELECT notification_preferences FROM user_profiles_v2 LIMIT 1")
            print("✅ user_profiles_v2.notification_preferences 欄位已存在")
        except sqlite3.OperationalError:
            print("📝 添加 user_profiles_v2.notification_preferences 欄位...")
            cursor.execute("ALTER TABLE user_profiles_v2 ADD COLUMN notification_preferences TEXT")
            print("✅ user_profiles_v2.notification_preferences 欄位已添加")
        
        # 檢查並添加 Conversation.user1_deleted 欄位
        try:
            cursor.execute("SELECT user1_deleted FROM conversations_v2 LIMIT 1")
            print("✅ conversations_v2.user1_deleted 欄位已存在")
        except sqlite3.OperationalError:
            print("📝 添加 conversations_v2.user1_deleted 欄位...")
            cursor.execute("ALTER TABLE conversations_v2 ADD COLUMN user1_deleted BOOLEAN DEFAULT 0")
            print("✅ conversations_v2.user1_deleted 欄位已添加")
        
        # 檢查並添加 Conversation.user2_deleted 欄位
        try:
            cursor.execute("SELECT user2_deleted FROM conversations_v2 LIMIT 1")
            print("✅ conversations_v2.user2_deleted 欄位已存在")
        except sqlite3.OperationalError:
            print("📝 添加 conversations_v2.user2_deleted 欄位...")
            cursor.execute("ALTER TABLE conversations_v2 ADD COLUMN user2_deleted BOOLEAN DEFAULT 0")
            print("✅ conversations_v2.user2_deleted 欄位已添加")
        
        conn.commit()
        print("\n✅ 資料庫遷移完成！")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ 遷移失敗: {str(e)}")
        return False
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_database()
