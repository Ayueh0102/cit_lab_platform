/**
 * 使用 React 19 useOptimistic 的活動報名元件
 * 提供即時 UI 回饋，提升使用者體驗
 */

import { useState, useOptimistic } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Loader2, Check, Building } from 'lucide-react';

/**
 * 活動卡片元件（使用樂觀更新）
 * 
 * @param {Object} props
 * @param {Object} props.event - 活動資訊
 * @param {Function} props.onRegister - 報名活動的 API 函式
 * @param {boolean} props.isRegistered - 是否已報名
 */
export function OptimisticEventCard({ event, onRegister, isRegistered: initialIsRegistered }) {
  const [currentEvent, setCurrentEvent] = useState({
    ...event,
    isRegistered: initialIsRegistered,
    currentParticipants: event.currentParticipants || 0,
  });
  
  // 使用 useOptimistic 實現樂觀 UI 更新
  const [optimisticEvent, setOptimisticEvent] = useOptimistic(
    currentEvent,
    (state, updates) => ({ ...state, ...updates })
  );

  const handleRegister = async () => {
    if (optimisticEvent.isRegistered) {
      return; // 已報名，不執行
    }

    try {
      // 立即更新 UI（樂觀更新）
      setOptimisticEvent({
        isRegistered: true,
        currentParticipants: optimisticEvent.currentParticipants + 1,
      });

      // 實際的 API 呼叫
      const result = await onRegister(event.id);
      
      // 更新為伺服器回傳的實際狀態
      setCurrentEvent(prev => ({
        ...prev,
        isRegistered: true,
        currentParticipants: result.currentParticipants || (prev.currentParticipants + 1),
        registrationId: result.registrationId,
      }));
    } catch (error) {
      console.error('報名失敗:', error);
      // React 會自動回滾到 currentEvent 的狀態
    }
  };

  const isProcessing = optimisticEvent.isRegistered && !currentEvent.isRegistered;
  const participantRatio = optimisticEvent.maxParticipants 
    ? `${optimisticEvent.currentParticipants}/${optimisticEvent.maxParticipants}`
    : optimisticEvent.currentParticipants;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {event.emoji || '📅'} {event.title}
            </CardTitle>
            <CardDescription className="mt-1">{event.subtitle}</CardDescription>
          </div>
          {optimisticEvent.isRegistered && (
            <Badge variant={isProcessing ? "secondary" : "success"} className="ml-2">
              {isProcessing ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  處理中
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  已報名
                </span>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 活動資訊 */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {event.date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{event.date}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{participantRatio} 人</span>
          </div>
          {event.organizer && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>主辦：{event.organizer}</span>
            </div>
          )}
        </div>

        {/* 活動描述 */}
        {event.description && (
          <p className="text-sm line-clamp-3">{event.description}</p>
        )}

        {/* 報名按鈕 */}
        <Button
          onClick={handleRegister}
          className="w-full"
          disabled={optimisticEvent.isRegistered}
          variant={optimisticEvent.isRegistered ? "secondary" : "default"}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              報名中...
            </>
          ) : optimisticEvent.isRegistered ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              已完成報名
            </>
          ) : (
            '立即報名'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 活動列表元件（展示多個活動）
 * 
 * @param {Object} props
 * @param {Array} props.events - 活動列表
 * @param {Function} props.onRegister - 報名活動的 API 函式
 * @param {Set} props.registeredEventIds - 已報名的活動 ID 集合
 */
export function OptimisticEventList({ events, onRegister, registeredEventIds = new Set() }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => (
        <OptimisticEventCard
          key={event.id}
          event={event}
          onRegister={onRegister}
          isRegistered={registeredEventIds.has(event.id)}
        />
      ))}
    </div>
  );
}

/**
 * 使用範例：
 * 
 * import { OptimisticEventList } from '@/components/OptimisticEventRegistration';
 * import { registerForEvent } from '@/services/api';
 * 
 * function EventsPage() {
 *   const [events, setEvents] = useState([...]);
 *   const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
 * 
 *   const handleRegister = async (eventId) => {
 *     const result = await registerForEvent(eventId);
 *     setRegisteredEventIds(prev => new Set([...prev, eventId]));
 *     return result;
 *   };
 * 
 *   return (
 *     <OptimisticEventList 
 *       events={events}
 *       onRegister={handleRegister}
 *       registeredEventIds={registeredEventIds}
 *     />
 *   );
 * }
 */

