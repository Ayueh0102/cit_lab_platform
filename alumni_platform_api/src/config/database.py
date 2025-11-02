"""
PostgreSQL 資料庫配置
支援 SQLite (開發) 和 PostgreSQL (生產)
"""
import os
from urllib.parse import urlparse

def get_database_url():
    """
    獲取資料庫連接 URL
    優先順序：
    1. DATABASE_URL 環境變數
    2. 開發環境使用 SQLite
    """
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # 解析 PostgreSQL URL
        parsed = urlparse(database_url)
        return database_url
    else:
        # 預設使用 SQLite
        import sys
        current_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(
            current_dir,
            '..',
            'database',
            'app_v2.db'
        )
        return f'sqlite:///{db_path}'


def get_database_config():
    """
    獲取資料庫配置
    根據資料庫類型返回不同的配置
    """
    database_url = get_database_url()
    
    if database_url.startswith('postgresql'):
        # PostgreSQL 配置
        return {
            'SQLALCHEMY_DATABASE_URI': database_url,
            'SQLALCHEMY_ENGINE_OPTIONS': {
                'pool_size': 10,
                'max_overflow': 20,
                'pool_pre_ping': True,
                'pool_recycle': 3600,
            },
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        }
    else:
        # SQLite 配置
        return {
            'SQLALCHEMY_DATABASE_URI': database_url,
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        }

