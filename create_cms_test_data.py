"""
使用 API 創建測試分類和文章的腳本
用於測試 CMS 系統功能
"""

import requests
import json
import sys

API_BASE = "http://localhost:5001"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

def login():
    """登入獲取 token"""
    response = requests.post(
        f"{API_BASE}/api/v2/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get('token')
    else:
        print(f"登入失敗: {response.status_code} - {response.text}")
        return None

def create_category(token, name, color="blue", description=""):
    """創建分類"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{API_BASE}/api/v2/cms/article-categories",
        headers=headers,
        json={
            "name": name,
            "color": color,
            "description": description
        }
    )
    if response.status_code == 201:
        category = response.json().get('category', {})
        print(f"✅ 創建分類成功: {name} (ID: {category.get('id')})")
        return category
    else:
        print(f"❌ 創建分類失敗: {response.status_code} - {response.text}")
        return None

def get_categories(token):
    """獲取所有分類"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_BASE}/api/v2/cms/article-categories",
        headers=headers
    )
    if response.status_code == 200:
        return response.json().get('categories', [])
    return []

def create_article(token, title, content, category_id=None, status="published"):
    """創建文章"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": title,
        "content": content,
        "summary": f"{title} 的摘要內容",
        "status": status
    }
    if category_id:
        data["category_id"] = category_id
    
    response = requests.post(
        f"{API_BASE}/api/v2/cms/articles",
        headers=headers,
        json=data
    )
    if response.status_code == 201:
        article = response.json().get('article', {})
        print(f"✅ 創建文章成功: {title} (ID: {article.get('id')})")
        return article
    else:
        print(f"❌ 創建文章失敗: {response.status_code} - {response.text}")
        return None

def main():
    print("🚀 開始創建測試資料...\n")
    
    # 登入
    print("1. 登入管理員帳號...")
    token = login()
    if not token:
        print("❌ 無法登入，測試終止")
        return
    
    print("✅ 登入成功\n")
    
    # 獲取現有分類
    print("2. 檢查現有分類...")
    existing_categories = get_categories(token)
    print(f"   現有分類數量: {len(existing_categories)}\n")
    
    # 創建測試分類
    print("3. 創建測試分類...")
    categories = []
    
    test_categories = [
        {"name": "系友動態", "color": "blue", "description": "系友最新動態和新聞"},
        {"name": "學術新知", "color": "green", "description": "學術研究和知識分享"},
        {"name": "活動公告", "color": "orange", "description": "系友會活動和聚會"},
        {"name": "職涯分享", "color": "purple", "description": "職場經驗和職涯發展"},
    ]
    
    for cat_data in test_categories:
        # 檢查是否已存在
        existing = [c for c in existing_categories if c.get('name') == cat_data['name']]
        if existing:
            print(f"⏭️  分類已存在: {cat_data['name']} (ID: {existing[0].get('id')})")
            categories.append(existing[0])
        else:
            category = create_category(token, **cat_data)
            if category:
                categories.append(category)
    
    print(f"\n✅ 準備好 {len(categories)} 個分類\n")
    
    # 創建測試文章
    print("4. 創建測試文章...")
    articles = []
    
    test_articles = [
        {
            "title": "歡迎新系友加入平台",
            "content": "<p>歡迎所有新加入的系友！本平台提供多項功能，包括職缺分享、活動報名、訊息交流等。</p><p>希望大家能善用這個平台，促進系友間的聯繫與合作。</p>",
            "category": "系友動態"
        },
        {
            "title": "最新研究成果發表",
            "content": "<p>本系教授最新研究成果已發表於國際頂尖期刊。</p><p>研究主題涵蓋顯示技術的創新應用，歡迎有興趣的系友參考。</p>",
            "category": "學術新知"
        },
        {
            "title": "2024年度系友會活動預告",
            "content": "<p>即將舉辦年度系友會活動，預計時間為年底。</p><p>活動內容包括：</p><ul><li>系友聯誼</li><li>專題演講</li><li>聚餐交流</li></ul>",
            "category": "活動公告"
        },
        {
            "title": "職場經驗分享：如何轉換跑道",
            "content": "<p>許多系友詢問如何轉換職涯跑道，本文分享一些實用建議。</p><p>重點包括：</p><ol><li>明確目標</li><li>提升技能</li><li>建立網絡</li></ol>",
            "category": "職涯分享"
        },
    ]
    
    for article_data in test_articles:
        # 找到對應的分類 ID
        category = next((c for c in categories if c.get('name') == article_data['category']), None)
        category_id = category.get('id') if category else None
        
        article = create_article(
            token,
            article_data['title'],
            article_data['content'],
            category_id=category_id,
            status="published"
        )
        if article:
            articles.append(article)
    
    print(f"\n✅ 創建了 {len(articles)} 篇文章\n")
    
    print("=" * 50)
    print("✅ 測試資料創建完成！")
    print("=" * 50)
    print(f"\n分類總數: {len(categories)}")
    print(f"文章總數: {len(articles)}")
    print("\n現在可以進行前端測試了！")
    print("訪問: http://localhost:3000/cms")

if __name__ == "__main__":
    main()

