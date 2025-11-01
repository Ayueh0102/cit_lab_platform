/**
 * API 緩存 Hook
 * 用於緩存 API 請求結果,減少不必要的網絡請求
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 分鐘

interface UseApiCacheOptions {
  cacheTime?: number; // 緩存時間(毫秒)
  enabled?: boolean; // 是否啟用緩存
}

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseApiCacheOptions = {}
) {
  const { cacheTime = DEFAULT_CACHE_TIME, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) {
      return;
    }

    // 檢查緩存
    if (!force) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        if (mounted.current) {
          setData(cached.data);
          setLoading(false);
        }
        return;
      }
    }

    // 獲取新數據
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      
      if (mounted.current) {
        setData(result);
        cache.set(key, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      if (mounted.current) {
        setError(err as Error);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [key, fetcher, cacheTime, enabled]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cache.delete(key);
  }, [key]);

  useEffect(() => {
    mounted.current = true;
    fetchData();

    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  };
}

// 清除所有緩存
export function clearAllCache() {
  cache.clear();
}

// 清除特定前綴的緩存
export function clearCacheByPrefix(prefix: string) {
  Array.from(cache.keys())
    .filter(key => key.startsWith(prefix))
    .forEach(key => cache.delete(key));
}


