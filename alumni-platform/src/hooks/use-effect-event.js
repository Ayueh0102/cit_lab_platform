/**
 * React 19 useEffectEvent Hook 範例
 * 用於優化 useEffect 的依賴項，避免不必要的重新執行
 * 
 * 注意：useEffectEvent 目前可能還在實驗階段，如果未正式發布，
 * 可以改用 useCallback 配合 ref 的模式來實現類似功能
 */

import { useCallback, useRef, useLayoutEffect } from 'react';

/**
 * useEffectEvent 的 polyfill 實現
 * 用於將事件處理邏輯從 useEffect 的依賴中分離出來
 * 
 * @param {Function} fn - 事件處理函式
 * @returns {Function} - 穩定引用的事件處理函式
 * 
 * @example
 * function ChatRoom({ roomId, theme }) {
 *   const onConnected = useEffectEvent(() => {
 *     showNotification('已連線！', theme);
 *   });
 *   
 *   useEffect(() => {
 *     const connection = createConnection(roomId);
 *     connection.on('connected', onConnected);
 *     connection.connect();
 *     return () => connection.disconnect();
 *   }, [roomId]); // theme 不需要作為依賴
 * }
 */
export function useEffectEvent(fn) {
  const fnRef = useRef(fn);
  
  // 使用 useLayoutEffect 確保在效果執行前更新 ref
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  return useCallback((...args) => {
    return fnRef.current?.(...args);
  }, []);
}

/**
 * 實際使用範例：聊天室連接
 * 
 * @example
 * export function useChatRoom({ serverUrl, roomId, onMessage }) {
 *   // onMessage 使用 useEffectEvent 包裝，避免成為 useEffect 的依賴
 *   const handleMessage = useEffectEvent(onMessage);
 *   
 *   useEffect(() => {
 *     const connection = createConnection(serverUrl, roomId);
 *     connection.on('message', handleMessage);
 *     connection.connect();
 *     
 *     return () => {
 *       connection.disconnect();
 *     };
 *   }, [serverUrl, roomId]); // onMessage 不在依賴列表中
 * }
 */

/**
 * 實際使用範例：API 請求帶通知
 * 
 * @example
 * export function useFetchWithNotification({ url, onSuccess }) {
 *   const [data, setData] = useState(null);
 *   const [loading, setLoading] = useState(false);
 *   
 *   const handleSuccess = useEffectEvent(onSuccess);
 *   
 *   useEffect(() => {
 *     setLoading(true);
 *     fetch(url)
 *       .then(res => res.json())
 *       .then(data => {
 *         setData(data);
 *         handleSuccess(data);  // 使用穩定引用的回呼
 *       })
 *       .finally(() => setLoading(false));
 *   }, [url]);  // onSuccess 不在依賴列表中
 *   
 *   return { data, loading };
 * }
 */

