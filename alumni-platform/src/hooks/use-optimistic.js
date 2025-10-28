/**
 * React 19 useOptimistic Hook 範例
 * 用於實現樂觀 UI 更新，在等待伺服器回應時立即更新 UI
 */

import { useOptimistic } from 'react';

/**
 * 職缺申請的樂觀更新 Hook
 * @param {Object} job - 職缺物件
 * @returns {[Object, Function]} - [樂觀狀態, 設定樂觀狀態的函式]
 * 
 * @example
 * const [optimisticJob, applyOptimistically] = useOptimisticJobApplication(job);
 * 
 * const handleApply = async () => {
 *   applyOptimistically({ ...job, applied: true });
 *   await applyToJob(job.id);
 * };
 */
export function useOptimisticJobApplication(initialJob) {
  const [optimisticJob, setOptimisticJob] = useOptimistic(
    initialJob,
    (current, newStatus) => ({
      ...current,
      ...newStatus,
    })
  );

  return [optimisticJob, setOptimisticJob];
}

/**
 * 活動報名的樂觀更新 Hook
 * @param {Object} event - 活動物件
 * @returns {[Object, Function]} - [樂觀狀態, 設定樂觀狀態的函式]
 * 
 * @example
 * const [optimisticEvent, registerOptimistically] = useOptimisticEventRegistration(event);
 * 
 * const handleRegister = async () => {
 *   registerOptimistically({ ...event, registered: true, participantCount: event.participantCount + 1 });
 *   await registerForEvent(event.id);
 * };
 */
export function useOptimisticEventRegistration(initialEvent) {
  const [optimisticEvent, setOptimisticEvent] = useOptimistic(
    initialEvent,
    (current, updates) => ({
      ...current,
      ...updates,
    })
  );

  return [optimisticEvent, setOptimisticEvent];
}

/**
 * 通用的樂觀更新包裝 Hook
 * @param {*} initialState - 初始狀態
 * @param {Function} updateFn - 更新函式，接收 (currentState, optimisticValue) => newState
 * @returns {[*, Function]} - [樂觀狀態, 設定樂觀狀態的函式]
 * 
 * @example
 * const [likes, addOptimisticLike] = useOptimisticUpdate(0, (current) => current + 1);
 * 
 * const handleLike = async () => {
 *   addOptimisticLike();
 *   await likePost(postId);
 * };
 */
export function useOptimisticUpdate(initialState, updateFn) {
  const [optimisticState, setOptimisticState] = useOptimistic(
    initialState,
    updateFn || ((current, update) => update)
  );

  return [optimisticState, setOptimisticState];
}

