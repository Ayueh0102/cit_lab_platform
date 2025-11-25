'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Grid,
  Select,
  NumberInput,
  Checkbox,
  Switch,
  Paper,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IconX } from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FileUpload } from '@/components/ui/file-upload';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface EventCategory {
  id: number;
  name: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [creating, setCreating] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      start_time: new Date(),
      end_time: new Date(Date.now() + 3600000), // 1 hour later
      location: '',
      location_detail: '',
      is_online: false,
      online_url: '',
      max_participants: 0,
      category_id: 0,
      event_type: 'other',
      registration_start: null as Date | null,
      registration_end: null as Date | null,
      allow_waitlist: true,
      require_approval: false,
      fee: 0,
      is_free: true,
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : '活動標題不能為空'),
      description: (value) => (value.trim().length > 0 ? null : '活動描述不能為空'),
      start_time: (value) => (value ? null : '開始時間不能為空'),
      end_time: (value, values) => {
        if (!value) return '結束時間不能為空';
        if (value <= values.start_time) return '結束時間必須晚於開始時間';
        return null;
      },
      online_url: (value, values) => {
        if (values.is_online && !value.trim()) {
          return '線上活動必須提供會議連結';
        }
        return null;
      },
      location: (value, values) => {
        if (!values.is_online && !value.trim()) {
          return '實體活動必須提供地點';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = getToken();
      const data = await api.events.getCategories(token || undefined);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setCreating(true);
      const token = getToken();
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能建立活動',
          color: 'orange',
        });
        router.push('/auth/login');
        return;
      }

      const eventData: any = {
        title: values.title.trim(),
        description: values.description.trim(),
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        location: values.is_online ? '' : values.location.trim(),
        location_detail: values.location_detail.trim() || undefined,
        is_online: values.is_online,
        online_url: values.online_url.trim() || undefined,
        max_participants: values.max_participants || undefined,
        category_id: values.category_id || undefined,
        event_type: values.event_type,
        registration_start: values.registration_start?.toISOString() || undefined,
        registration_end: values.registration_end?.toISOString() || undefined,
        allow_waitlist: values.allow_waitlist,
        require_approval: values.require_approval,
        fee: values.is_free ? 0 : values.fee,
        is_free: values.is_free,
        fee_currency: 'TWD',
        cover_image_url: coverImageUrl || undefined,
      };

      const result = await api.events.create(eventData, token);

      notifications.show({
        title: '建立成功',
        message: '活動已成功建立',
        color: 'green',
      });

      const eventId = result?.event?.id || result?.id;
      if (eventId) {
        router.push(`/events/${eventId}`);
      } else {
        router.push('/events/my');
      }
    } catch (error) {
      notifications.show({
        title: '建立失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const eventTypes = [
    { value: 'seminar', label: '講座／研討會' },
    { value: 'networking', label: '系友交流' },
    { value: 'workshop', label: '工作坊' },
    { value: 'career', label: '職涯活動' },
    { value: 'social', label: '社交活動' },
    { value: 'academic', label: '學術活動' },
    { value: 'other', label: '其他活動' },
  ];

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                建立新活動
              </Title>
              <Text c="dimmed">填寫以下資訊以建立新的活動</Text>
            </div>

            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                  <div>
                    <Title order={3} mb="md">
                      基本資訊
                    </Title>
                    <Grid>
                      <Grid.Col span={12}>
                        <TextInput
                          label="活動標題"
                          placeholder="例如：校友年會 2024"
                          required
                          {...form.getInputProps('title')}
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Textarea
                          label="活動描述"
                          placeholder="詳細描述活動內容..."
                          minRows={4}
                          required
                          {...form.getInputProps('description')}
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Paper shadow="xs" p="md" radius="md" withBorder>
                          <Stack gap="md">
                            <Title order={4}>封面圖片（選填）</Title>
                            {coverImageUrl ? (
                              <div style={{ position: 'relative', width: '100%', height: 200 }}>
                                <img
                                  src={coverImageUrl}
                                  alt="活動封面"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--mantine-radius-md)'
                                  }}
                                />
                                <Button
                                  color="red"
                                  variant="filled"
                                  size="xs"
                                  style={{ position: 'absolute', top: 8, right: 8 }}
                                  onClick={() => setCoverImageUrl('')}
                                >
                                  <IconX size={16} />
                                </Button>
                              </div>
                            ) : (
                              <FileUpload
                                label="上傳封面圖片"
                                accept="image/*"
                                onUploadComplete={(url) => setCoverImageUrl(url)}
                                relatedType="event_cover"
                              />
                            )}
                            <Text size="xs" c="dimmed">
                              建議尺寸：1200x600px。如果不上傳封面圖片，活動將不顯示封面。
                            </Text>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="活動類型"
                          placeholder="選擇活動類型"
                          data={eventTypes}
                          {...form.getInputProps('event_type')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="活動分類"
                          placeholder="選擇分類（選填）"
                          data={categories.map(c => ({ value: c.id.toString(), label: c.name }))}
                          {...form.getInputProps('category_id')}
                          onChange={(value) => form.setFieldValue('category_id', value ? parseInt(value) : 0)}
                          clearable
                        />
                      </Grid.Col>
                    </Grid>
                  </div>

                  <div>
                    <Title order={3} mb="md">
                      時間與地點
                    </Title>
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <DateTimePicker
                          label="開始時間"
                          placeholder="選擇開始時間"
                          required
                          {...form.getInputProps('start_time')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <DateTimePicker
                          label="結束時間"
                          placeholder="選擇結束時間"
                          required
                          {...form.getInputProps('end_time')}
                        />
                      </Grid.Col>
                      <Grid.Col span={12}>
                        <Switch
                          label="線上活動"
                          description="如果是線上活動，請勾選此項"
                          {...form.getInputProps('is_online', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                      {form.values.is_online ? (
                        <Grid.Col span={12}>
                          <TextInput
                            label="線上會議連結"
                            placeholder="https://meet.google.com/xxx"
                            required={form.values.is_online}
                            {...form.getInputProps('online_url')}
                          />
                        </Grid.Col>
                      ) : (
                        <>
                          <Grid.Col span={12}>
                            <TextInput
                              label="活動地點"
                              placeholder="例如：台北市大安區..."
                              required={!form.values.is_online}
                              {...form.getInputProps('location')}
                            />
                          </Grid.Col>
                          <Grid.Col span={12}>
                            <Textarea
                              label="地點詳細資訊"
                              placeholder="交通方式、停車資訊等..."
                              minRows={2}
                              {...form.getInputProps('location_detail')}
                            />
                          </Grid.Col>
                        </>
                      )}
                    </Grid>
                  </div>

                  <div>
                    <Title order={3} mb="md">
                      報名設定
                    </Title>
                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="人數上限"
                          placeholder="0 表示無限制"
                          description="留空或輸入 0 表示不限制人數"
                          min={0}
                          {...form.getInputProps('max_participants')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <DateTimePicker
                          label="報名截止時間"
                          placeholder="選擇報名截止時間（選填）"
                          {...form.getInputProps('registration_end')}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Checkbox
                          label="允許候補"
                          description="名額滿時允許參加者加入候補名單"
                          {...form.getInputProps('allow_waitlist', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Checkbox
                          label="需要審核"
                          description="報名後需要主辦方審核才能參加"
                          {...form.getInputProps('require_approval', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                    </Grid>
                  </div>

                  <div>
                    <Title order={3} mb="md">
                      費用設定
                    </Title>
                    <Grid>
                      <Grid.Col span={12}>
                        <Checkbox
                          label="免費活動"
                          {...form.getInputProps('is_free', { type: 'checkbox' })}
                        />
                      </Grid.Col>
                      {!form.values.is_free && (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <NumberInput
                            label="報名費用 (TWD)"
                            placeholder="0"
                            min={0}
                            required={!form.values.is_free}
                            {...form.getInputProps('fee')}
                          />
                        </Grid.Col>
                      )}
                    </Grid>
                  </div>

                  <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={() => router.back()}>
                      取消
                    </Button>
                    <Button type="submit" loading={creating}>
                      建立活動
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Card>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

