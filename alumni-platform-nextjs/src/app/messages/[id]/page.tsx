'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Avatar,
  TextInput,
  Button,
  Loader,
  Center,
  ScrollArea,
  Paper,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import {
  IconSend,
  IconArrowLeft,
  IconUser,
  IconClock,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';

interface Message {
  id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export default function MessageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = parseInt(params.id as string);
  const currentUser = getUser();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    // 自動滾動到底部
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadConversation = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await api.messages.getConversation(conversationId, token);
      
      if (response) {
        setConversation({
          id: response.id,
          other_user_id: response.user_id || response.other_user_id,
          other_user_name: response.user_name || response.other_user_name || '未知用戶',
          other_user_avatar: response.avatar_url,
          last_message: response.last_message,
          last_message_at: response.last_message_at,
          unread_count: response.unread_count || 0,
        });
      }
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入對話資訊',
        color: 'red',
      });
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await api.messages.getMessages(conversationId, token);
      const messagesData = response.messages || [];
      
      // 格式化訊息數據
      const formattedMessages = messagesData.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name || '未知用戶',
        content: msg.content,
        message_type: msg.message_type || 'text',
        created_at: msg.created_at,
        is_read: msg.is_read || false,
        attachment_url: msg.attachment_url,
        attachment_name: msg.attachment_name,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入訊息',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      return;
    }

    try {
      setSending(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.messages.send(conversationId, {
        content: messageContent.trim(),
      }, token);

      setMessageContent('');
      
      // 重新載入訊息
      await loadMessages();
      await loadConversation();
      
      // 重新載入對話列表（通知父頁面）
      router.refresh();
    } catch (error) {
      notifications.show({
        title: '發送失敗',
        message: error instanceof Error ? error.message : '無法發送訊息',
        color: 'red',
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMyMessage = (message: Message) => {
    return message.sender_id === currentUser?.id;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SidebarLayout>
          <Center style={{ minHeight: '60vh' }}>
            <Loader size="xl" />
          </Center>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="md" py="xl" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
          <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
            {/* 標題欄 */}
            <Group justify="space-between">
              <Group>
                <ActionIcon variant="subtle" onClick={() => router.push('/messages')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                {conversation && (
                  <Group gap="sm">
                    <Avatar
                      src={conversation.other_user_avatar}
                      size={40}
                      radius="md"
                      color="blue"
                    >
                      {conversation.other_user_name.charAt(0)}
                    </Avatar>
                    <div>
                      <Text fw={500}>{conversation.other_user_name}</Text>
                      {conversation.unread_count > 0 && (
                        <Badge size="sm" color="blue" variant="filled">
                          {conversation.unread_count} 則未讀
                        </Badge>
                      )}
                    </div>
                  </Group>
                )}
              </Group>
            </Group>

            {/* 訊息列表 */}
            <Paper
              shadow="sm"
              radius="md"
              withBorder
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              <ScrollArea
                ref={scrollAreaRef}
                style={{ flex: 1 }}
                scrollbarSize={8}
              >
                <Stack gap="md" p="md" style={{ minHeight: '100%' }}>
                  {messages.length === 0 ? (
                    <Center style={{ minHeight: '200px' }}>
                      <Stack align="center" gap="md">
                        <IconUser size={48} color="gray" />
                        <Text c="dimmed">還沒有訊息</Text>
                        <Text size="sm" c="dimmed">開始對話吧！</Text>
                      </Stack>
                    </Center>
                  ) : (
                    messages.map((message) => {
                      const isMine = isMyMessage(message);
                      return (
                        <Group
                          key={message.id}
                          justify={isMine ? 'flex-end' : 'flex-start'}
                          align="flex-start"
                          gap="xs"
                        >
                          {!isMine && (
                            <Avatar
                              size={32}
                              radius="md"
                              color="blue"
                            >
                              {message.sender_name.charAt(0)}
                            </Avatar>
                          )}
                          <Stack gap={4} style={{ maxWidth: '70%' }}>
                            {!isMine && (
                              <Text size="xs" c="dimmed" fw={500}>
                                {message.sender_name}
                              </Text>
                            )}
                            <Card
                              padding="sm"
                              radius="md"
                              style={{
                                backgroundColor: isMine
                                  ? 'var(--mantine-color-blue-6)'
                                  : 'var(--mantine-color-gray-1)',
                                color: isMine ? 'white' : 'inherit',
                              }}
                            >
                              <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {message.content}
                              </Text>
                            </Card>
                            <Group gap={4}>
                              <IconClock size={12} />
                              <Text size="xs" c="dimmed">
                                {formatTime(message.created_at)}
                              </Text>
                            </Group>
                          </Stack>
                          {isMine && (
                            <Avatar
                              size={32}
                              radius="md"
                              color="blue"
                            >
                              {currentUser?.profile?.display_name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                            </Avatar>
                          )}
                        </Group>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Stack>
              </ScrollArea>
            </Paper>

            {/* 輸入框 */}
            <Group gap="sm">
              <TextInput
                placeholder="輸入訊息..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ flex: 1 }}
                size="md"
              />
              <Button
                onClick={handleSendMessage}
                loading={sending}
                disabled={!messageContent.trim()}
                leftSection={<IconSend size={16} />}
                size="md"
              >
                發送
              </Button>
            </Group>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

