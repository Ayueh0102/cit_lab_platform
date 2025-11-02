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
  Menu,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useParams } from 'next/navigation';
import {
  IconSend,
  IconArrowLeft,
  IconUser,
  IconClock,
  IconCheck,
  IconTrash,
  IconSearch,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { useWebSocket } from '@/hooks/use-websocket';

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
  const [richContent, setRichContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpened, setSearchModalOpened] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用 WebSocket 即時接收訊息
  const { subscribeToConversation } = useWebSocket({
    onNewMessage: (messageData) => {
      if (messageData.conversation_id === conversationId) {
        setMessages((prev) => {
          // 避免重複添加
          if (prev.some((m) => m.id === messageData.id)) {
            return prev;
          }
          return [...prev, messageData];
        });
        loadConversation(); // 更新對話信息
      }
    },
    onConversationUpdate: (conversationData) => {
      if (conversationData.id === conversationId) {
        setConversation(conversationData);
      }
    },
  });

  useEffect(() => {
    loadConversation();
    loadMessages();
    
    // 標記對話為已讀
    markAsRead();
    
    // 訂閱當前對話的訊息更新
    if (conversationId) {
      subscribeToConversation(conversationId);
    }
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

  const markAsRead = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      await api.messages.markAsRead(conversationId, token);
      await loadConversation();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDeleteConversation = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await api.messages.deleteConversation(conversationId, token);
      
      notifications.show({
        title: '對話已刪除',
        message: '對話已成功刪除',
        color: 'green',
      });
      
      setDeleteModalOpened(false);
      router.push('/messages');
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '無法刪除對話',
        color: 'red',
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await api.messages.search({
        q: searchQuery,
        conversation_id: conversationId,
      }, token);

      setSearchResults(response.messages || []);
    } catch (error) {
      notifications.show({
        title: '搜尋失敗',
        message: error instanceof Error ? error.message : '無法搜尋訊息',
        color: 'red',
      });
    } finally {
      setSearching(false);
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
    const contentToSend = richContent || messageContent.trim();
    if (!contentToSend) {
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
        content: contentToSend,
      }, token);

      setMessageContent('');
      setRichContent('');
      
      // 重新載入訊息
      await loadMessages();
      await loadConversation();
      
      // 標記為已讀
      await markAsRead();
      
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
              <Group gap="xs">
                <ActionIcon variant="subtle" onClick={() => setSearchModalOpened(true)}>
                  <IconSearch size={18} />
                </ActionIcon>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle">
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => setDeleteModalOpened(true)}
                    >
                      刪除對話
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
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
                                <div
                                  style={{
                                    fontSize: 'var(--mantine-font-size-sm)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                  dangerouslySetInnerHTML={{ __html: message.content }}
                                />
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
            <Stack gap="sm">
              <RichTextEditor
                content={richContent}
                onChange={setRichContent}
                placeholder="輸入訊息...（支援富文本格式）"
              />
              <Group gap="sm">
                <TextInput
                  placeholder="或輸入純文字訊息..."
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
                  disabled={!messageContent.trim() && !richContent.trim()}
                  leftSection={<IconSend size={16} />}
                  size="md"
                >
                  發送
                </Button>
              </Group>
            </Stack>
          </Stack>
          
          {/* 搜尋對話框 */}
          <Modal
            opened={searchModalOpened}
            onClose={() => {
              setSearchModalOpened(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            title="搜尋訊息"
            size="lg"
          >
            <Stack gap="md">
              <Group>
                <TextInput
                  placeholder="輸入關鍵字..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleSearch} loading={searching}>
                  搜尋
                </Button>
              </Group>
              
              {searchResults.length > 0 && (
                <ScrollArea style={{ height: 300 }}>
                  <Stack gap="sm">
                    {searchResults.map((message) => (
                      <Card key={message.id} padding="sm" withBorder>
                        <Text size="sm" fw={500}>
                          {message.sender_name}
                        </Text>
                        <Text size="sm" mt="xs">
                          {message.content}
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          {formatTime(message.created_at)}
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              )}
              
              {searchQuery && searchResults.length === 0 && !searching && (
                <Center py="xl">
                  <Text c="dimmed">沒有找到相關訊息</Text>
                </Center>
              )}
            </Stack>
          </Modal>
          
          {/* 刪除確認對話框 */}
          <Modal
            opened={deleteModalOpened}
            onClose={() => setDeleteModalOpened(false)}
            title="確認刪除"
            centered
          >
            <Stack gap="md">
              <Text>您確定要刪除此對話嗎？此操作無法復原。</Text>
              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => setDeleteModalOpened(false)}>
                  取消
                </Button>
                <Button color="red" onClick={handleDeleteConversation}>
                  刪除
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

