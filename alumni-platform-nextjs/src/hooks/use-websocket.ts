'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getToken } from '@/lib/auth';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

interface UseWebSocketOptions {
  onNotification?: (data: any) => void;
  onNotificationCountUpdate?: (count: number) => void;
  onNewMessage?: (data: any) => void;
  onConversationUpdate?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const {
    onNotification,
    onNotificationCountUpdate,
    onNewMessage,
    onConversationUpdate,
    onError,
  } = options;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    // 建立 WebSocket 連接
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // 連接成功
    socket.on('connect', () => {
      console.log('WebSocket connected');
      
      // 訂閱通知
      socket.emit('subscribe_notifications');
    });

    // 連接錯誤
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      onError?.(error);
    });

    // 訂閱成功
    socket.on('subscribed', (data) => {
      console.log('Subscribed to:', data.room);
    });

    // 接收新通知
    socket.on('new_notification', (data) => {
      console.log('New notification:', data);
      onNotification?.(data);
    });

    // 接收通知數量更新
    socket.on('notification_count_update', (data) => {
      console.log('Notification count update:', data.unread_count);
      onNotificationCountUpdate?.(data.unread_count);
    });

    // 接收新訊息
    socket.on('new_message', (data) => {
      console.log('New message:', data);
      onNewMessage?.(data);
    });

    // 接收對話更新
    socket.on('conversation_update', (data) => {
      console.log('Conversation update:', data);
      onConversationUpdate?.(data);
    });

    // 斷開連接
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // 清理函數
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // 只在組件掛載時執行一次

  const subscribeToConversation = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_messages', { conversation_id: conversationId });
    }
  }, []);

  return {
    socket: socketRef.current,
    subscribeToConversation,
    isConnected: socketRef.current?.connected || false,
  };
}

