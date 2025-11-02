"""
效能監控模組
用於追蹤應用程式效能指標
"""
import time
from functools import wraps
from flask import request, g
from src.models_v2 import db, UserActivity
from datetime import datetime

def track_performance(func):
    """效能追蹤裝飾器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # 記錄效能指標
            log_performance_metric(
                endpoint=request.path,
                method=request.method,
                execution_time=execution_time,
                status_code=200
            )
            
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            
            # 記錄錯誤
            log_performance_metric(
                endpoint=request.path,
                method=request.method,
                execution_time=execution_time,
                status_code=500,
                error=str(e)
            )
            
            raise
    
    return wrapper


def log_performance_metric(endpoint, method, execution_time, status_code, error=None):
    """記錄效能指標"""
    try:
        with db.session.begin():
            # 記錄到 UserActivity（如果有的話）
            # 或者可以創建專門的 PerformanceMetric 模型
            if hasattr(g, 'user_id') and g.user_id:
                activity = UserActivity(
                    user_id=g.user_id,
                    activity_type='api_request',
                    activity_data={
                        'endpoint': endpoint,
                        'method': method,
                        'execution_time': execution_time,
                        'status_code': status_code,
                        'error': error
                    }
                )
                db.session.add(activity)
    except Exception as e:
        print(f"Failed to log performance metric: {e}")


class PerformanceMonitor:
    """效能監控類"""
    
    def __init__(self):
        self.metrics = {
            'requests': [],
            'errors': [],
            'slow_queries': []
        }
    
    def record_request(self, endpoint, method, execution_time, status_code):
        """記錄請求"""
        self.metrics['requests'].append({
            'endpoint': endpoint,
            'method': method,
            'execution_time': execution_time,
            'status_code': status_code,
            'timestamp': datetime.utcnow()
        })
        
        # 記錄慢查詢（超過 1 秒）
        if execution_time > 1.0:
            self.metrics['slow_queries'].append({
                'endpoint': endpoint,
                'method': method,
                'execution_time': execution_time,
                'timestamp': datetime.utcnow()
            })
    
    def record_error(self, endpoint, method, error):
        """記錄錯誤"""
        self.metrics['errors'].append({
            'endpoint': endpoint,
            'method': method,
            'error': str(error),
            'timestamp': datetime.utcnow()
        })
    
    def get_stats(self):
        """獲取統計資訊"""
        if not self.metrics['requests']:
            return {
                'total_requests': 0,
                'avg_execution_time': 0,
                'error_rate': 0,
                'slow_queries_count': 0
            }
        
        total_requests = len(self.metrics['requests'])
        total_time = sum(r['execution_time'] for r in self.metrics['requests'])
        avg_time = total_time / total_requests
        error_rate = len(self.metrics['errors']) / total_requests if total_requests > 0 else 0
        
        return {
            'total_requests': total_requests,
            'avg_execution_time': avg_time,
            'error_rate': error_rate,
            'slow_queries_count': len(self.metrics['slow_queries'])
        }


# 全局效能監控實例
performance_monitor = PerformanceMonitor()

