'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Button,
  TextInput,
  Select,
  Grid,
  Loader,
  Center,
  Avatar,
  Pagination,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconMapPin,
  IconBriefcase,
  IconSchool,
  IconBrandLinkedin,
  IconBrandGithub,
  IconWorld,
  IconMail,
  IconPhone,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface AlumniUser {
  id: number;
  email: string;
  profile?: {
    full_name?: string;
    display_name?: string;
    avatar_url?: string;
    graduation_year?: number;
    major?: string;
    degree?: string;
    current_company?: string;
    current_position?: string;
    location?: string;
    bio?: string;
    linkedin_url?: string;
    github_url?: string;
    personal_website?: string;
    phone?: string;
    show_email?: boolean;
    show_phone?: boolean;
  };
}

export default function DirectoryPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AlumniUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 防抖處理搜索詞
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 當搜索條件改變時,重新載入數據
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filterYear, currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params: any = {
        page: currentPage,
        per_page: 20,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (filterYear) {
        params.graduation_year = parseInt(filterYear);
      }

      const response = await api.profile.getUsers(token || undefined, params);
      setUsers(response.users || []);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 1);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入系友列表',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // 生成畢業年份選項
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 50 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: `${year} 年` };
  });

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
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                系友通訊錄
              </Title>
              <Text c="dimmed">探索並聯繫校友網絡</Text>
            </div>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  placeholder="搜尋姓名、公司或職位..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  size="md"
                  leftSection={<IconSearch size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  placeholder="畢業年份"
                  data={graduationYears}
                  value={filterYear}
                  onChange={(value) => {
                    setFilterYear(value);
                    setCurrentPage(1);
                  }}
                  clearable
                  size="md"
                  searchable
                />
              </Grid.Col>
            </Grid>

            {users.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">找不到符合條件的系友</Text>
              </Center>
            ) : (
              <Stack gap="md">
                {total > 0 && (
                  <Text size="sm" c="dimmed">
                    找到 {total} 位系友
                  </Text>
                )}
                {users.map((user) => {
                  const displayName = user.profile?.display_name || user.profile?.full_name || user.email.split('@')[0];
                  const initials = displayName.charAt(0).toUpperCase();

                  return (
                    <Card
                      key={user.id}
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      className="hover-translate-y"
                    >
                      <Group align="flex-start" wrap="nowrap">
                        <Avatar
                          src={user.profile?.avatar_url}
                          size={80}
                          radius="md"
                          color="blue"
                        >
                          {initials}
                        </Avatar>

                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Group justify="space-between">
                            <div>
                              <Text fw={600} size="lg">
                                {displayName}
                              </Text>
                              {user.profile?.graduation_year && (
                                <Group gap={4} mt={4}>
                                  <IconSchool size={14} />
                                  <Text size="sm" c="dimmed">
                                    {user.profile.graduation_year} 年畢業
                                  </Text>
                                  {user.profile?.major && (
                                    <>
                                      <Text size="sm" c="dimmed">
                                        •
                                      </Text>
                                      <Text size="sm" c="dimmed">
                                        {user.profile.major}
                                      </Text>
                                    </>
                                  )}
                                </Group>
                              )}
                            </div>
                          </Group>

                          {user.profile?.current_company && (
                            <Group gap={4}>
                              <IconBriefcase size={14} />
                              <Text size="sm">
                                {user.profile.current_position && `${user.profile.current_position} @ `}
                                {user.profile.current_company}
                              </Text>
                            </Group>
                          )}

                          {user.profile?.location && (
                            <Group gap={4}>
                              <IconMapPin size={14} />
                              <Text size="sm" c="dimmed">
                                {user.profile.location}
                              </Text>
                            </Group>
                          )}

                          {user.profile?.bio && (
                            <Text size="sm" lineClamp={2} c="dimmed">
                              {user.profile.bio}
                            </Text>
                          )}

                          <Group gap="md" mt="sm">
                            {user.profile?.show_email && user.email && (
                              <Group gap={4}>
                                <IconMail size={14} />
                                <Anchor href={`mailto:${user.email}`} size="sm">
                                  聯絡
                                </Anchor>
                              </Group>
                            )}
                            {user.profile?.linkedin_url && (
                              <Group gap={4}>
                                <IconBrandLinkedin size={14} />
                                <Anchor
                                  href={user.profile.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                >
                                  LinkedIn
                                </Anchor>
                              </Group>
                            )}
                            {user.profile?.github_url && (
                              <Group gap={4}>
                                <IconBrandGithub size={14} />
                                <Anchor
                                  href={user.profile.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                >
                                  GitHub
                                </Anchor>
                              </Group>
                            )}
                            {user.profile?.personal_website && (
                              <Group gap={4}>
                                <IconWorld size={14} />
                                <Anchor
                                  href={user.profile.personal_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                >
                                  網站
                                </Anchor>
                              </Group>
                            )}
                          </Group>
                        </Stack>
                      </Group>
                    </Card>
                  );
                })}
                {totalPages > 1 && (
                  <Center mt="md">
                    <Pagination
                      total={totalPages}
                      value={currentPage}
                      onChange={setCurrentPage}
                    />
                  </Center>
                )}
              </Stack>
            )}
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
