"""
資料庫遷移腳本 - 添加文章分類支援
添加 Article.category_id 欄位
"""

import os
import sqlite3

def migrate_article_categories():
    """執行資料庫遷移"""
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app_v2.db')
    
    if not os.path.exists(db_path):
        print("❌ 資料庫檔案不存在，請先初始化資料庫")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 檢查並添加 article_categories_v2 表
        try:
            cursor.execute("SELECT id FROM article_categories_v2 LIMIT 1")
            print("✅ article_categories_v2 表已存在")
        except sqlite3.OperationalError:
            print("📝 創建 article_categories_v2 表...")
            cursor.execute("""
                CREATE TABLE article_categories_v2 (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    name_en VARCHAR(100),
                    description TEXT,
                    icon VARCHAR(50),
                    color VARCHAR(20),
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME,
                    updated_at DATETIME,
                    sheet_row_id VARCHAR(100),
                    last_synced_at DATETIME
                )
            """)
            print("✅ article_categories_v2 表已創建")
        
        # 檢查並添加 Article.category_id 欄位
        try:
            cursor.execute("SELECT category_id FROM articles_v2 LIMIT 1")
            print("✅ articles_v2.category_id 欄位已存在")
        except sqlite3.OperationalError:
            print("📝 添加 articles_v2.category_id 欄位...")
            cursor.execute("ALTER TABLE articles_v2 ADD COLUMN category_id INTEGER")
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_articles_category 
                ON articles_v2(category_id)
            """)
            print("✅ articles_v2.category_id 欄位已添加")
        
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
    migrate_article_categories()

