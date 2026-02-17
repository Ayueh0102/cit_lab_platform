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
  Modal,
  Divider,
  Timeline,
  Skeleton,
  Textarea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
  IconBuilding,
  IconCalendar,
  IconCertificate,
  IconUsers,
  IconUserPlus,
  IconCheck,
  IconX,
  IconClock,
  IconMessage,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
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
    class_year?: number;
    major?: string;
    degree?: string;
    student_id?: string;
    thesis_title?: string;
    advisor_1?: string;
    advisor_2?: string;
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

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  department?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

interface Education {
  id: number;
  school: string;
  degree: string;
  major?: string;
  start_year: number;
  end_year?: number;
  is_current: boolean;
  description?: string;
  advisor_1?: string;
  advisor_2?: string;
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
  
  // 詳細資料 Modal
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [selectedUser, setSelectedUser] = useState<AlumniUser | null>(null);
  const [userWorkExperiences, setUserWorkExperiences] = useState<WorkExperience[]>([]);
  const [userEducations, setUserEducations] = useState<Education[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // 聯絡申請相關 state
  const [contactStatus, setContactStatus] = useState<string>('none'); // none/pending_sent/pending_received/accepted/rejected
  const [contactRequestId, setContactRequestId] = useState<number | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

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

  // 監聽頁面可見性變化，當頁面重新可見時重新載入數據
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUsers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  // 載入用戶詳細資料（職涯經歷和教育背景）
  const loadUserDetails = async (user: AlumniUser) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setContactStatus('none');
    setContactRequestId(null);
    setContactMessage('');
    openDetailModal();

    try {
      const token = getToken();
      // 獲取該用戶的職涯經歷、教育背景和聯絡狀態
      const currentUser = getUser();
      let statusRes: any = { status: 'self', contact_request: null };

      const [workRes, eduRes] = await Promise.all([
        api.career.getUserWorkExperiences(user.id, token || undefined),
        api.career.getUserEducations(user.id, token || undefined),
      ]);

      if (currentUser && user.id !== currentUser.id && token) {
        try {
          statusRes = await api.contactRequests.getStatus(user.id, token);
        } catch {
          statusRes = { status: 'none', contact_request: null };
        }
      }

      setUserWorkExperiences((workRes.work_experiences || []).slice(0, 3));
      setUserEducations((eduRes.educations || []).slice(0, 3));
      setContactStatus(statusRes.status);
      setContactRequestId(statusRes.contact_request?.id || null);
    } catch (error) {
      console.error('Failed to load user details:', error);
      setUserWorkExperiences([]);
      setUserEducations([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendContactRequest = async () => {
    try {
      setSendingRequest(true);
      const token = getToken();
      if (!token) return;

      await api.contactRequests.create({
        target_id: selectedUser!.id,
        message: contactMessage.trim() || undefined,
      }, token);

      setContactStatus('pending_sent');
      setContactMessage('');
      notifications.show({
        title: '申請已送出',
        message: '聯絡申請已送出，等待對方回覆',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '發送失敗',
        message: error instanceof Error ? error.message : '無法發送聯絡申請',
        color: 'red',
      });
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAcceptContactRequest = async () => {
    if (!contactRequestId) return;
    try {
      const token = getToken();
      if (!token) return;
      await api.contactRequests.accept(contactRequestId, token);
      setContactStatus('accepted');
      notifications.show({
        title: '已接受',
        message: '您已接受此聯絡申請',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '操作失敗',
        color: 'red',
      });
    }
  };

  const handleRejectContactRequest = async () => {
    if (!contactRequestId) return;
    try {
      const token = getToken();
      if (!token) return;
      await api.contactRequests.reject(contactRequestId, token);
      setContactStatus('rejected');
      notifications.show({
        title: '已拒絕',
        message: '您已拒絕此聯絡申請',
        color: 'orange',
      });
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '操作失敗',
        color: 'red',
      });
    }
  };

  // 格式化學位顯示
  const formatDegree = (degree?: string) => {
    const degreeMap: { [key: string]: string } = {
      'bachelor': '學士',
      'master': '碩士',
      'phd': '博士',
      'high_school': '高中',
    };
    return degree ? degreeMap[degree] || degree : '';
  };

  // 計算工作年資（從最早開始日期到最後結束日期的總月數）
  const calculateTotalWorkMonths = (workExperiences: WorkExperience[]) => {
    if (workExperiences.length === 0) return 0;

    // 找出最早的開始日期
    const earliestStart = workExperiences.reduce((earliest, work) => {
      const startDate = new Date(work.start_date);
      return startDate < earliest ? startDate : earliest;
    }, new Date(workExperiences[0].start_date));

    // 找出最後的結束日期（如果有任何一個是 is_current，則用現在日期）
    const hasCurrentJob = workExperiences.some(work => work.is_current);
    let latestEnd: Date;
    
    if (hasCurrentJob) {
      latestEnd = new Date();
    } else {
      latestEnd = workExperiences.reduce((latest, work) => {
        const endDate = work.end_date ? new Date(work.end_date) : new Date(work.start_date);
        return endDate > latest ? endDate : latest;
      }, new Date(workExperiences[0].end_date || workExperiences[0].start_date));
    }

    // 計算總月數
    const totalMonths = (latestEnd.getFullYear() - earliestStart.getFullYear()) * 12 
      + (latestEnd.getMonth() - earliestStart.getMonth());
    
    return Math.max(0, totalMonths);
  };

  // 格式化年資顯示
  const formatWorkYears = (totalMonths: number) => {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) {
      return `${months} 個月`;
    } else if (months === 0) {
      return `${years} 年`;
    } else {
      return `${years} 年 ${months} 個月`;
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
          <Container size="lg" py="xl">
            <Stack gap="xl">
              {/* 標題骨架 */}
              <div>
                <Skeleton height={32} width={200} radius="md" mb="xs" />
                <Skeleton height={18} width={280} radius="md" />
              </div>

              {/* 搜尋/篩選骨架 */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Skeleton height={42} radius="md" />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Skeleton height={42} radius="md" />
                </Grid.Col>
              </Grid>

              {/* 系友卡片列表骨架 */}
              <Stack gap="md">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} shadow="sm" padding="lg" radius="md" className="glass-card-soft">
                    <Group align="flex-start" wrap="nowrap">
                      <Skeleton height={80} width={80} radius="md" />
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Skeleton height={20} width="35%" radius="md" />
                        <Skeleton height={14} width="25%" radius="md" />
                        <Skeleton height={14} width="45%" radius="md" />
                        <Skeleton height={14} width="20%" radius="md" />
                        <Group gap="xs">
                          <Skeleton height={14} width={70} radius="md" />
                          <Skeleton height={14} width={60} radius="md" />
                        </Group>
                        <Skeleton height={14} width="80%" radius="md" />
                      </Stack>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Container>
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
              <Card shadow="sm" padding="xl" radius="md" className="glass-card-soft" style={{ border: 'none' }}>
                <Stack align="center" gap="md" py="xl">
                  <IconUsers size={56} color="var(--mantine-color-indigo-3)" stroke={1.5} />
                  <Text size="lg" fw={600} c="dimmed">找不到符合條件的系友</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={360}>
                    {debouncedSearchTerm || filterYear
                      ? '試試調整搜尋條件或篩選條件'
                      : '目前尚無系友資料'}
                  </Text>
                </Stack>
              </Card>
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
                      style={{ cursor: 'pointer' }}
                      tabIndex={0}
                      role="button"
                      onClick={() => loadUserDetails(user)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadUserDetails(user); } }}
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

                          {/* 社交連結 - 顯示在主要資訊區域 */}
                          {(user.profile?.linkedin_url || user.profile?.github_url || user.profile?.personal_website) && (
                            <Group gap="xs" mt="xs">
                            {user.profile?.linkedin_url && (
                                <Anchor
                                  href={user.profile.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  c="blue"
                                >
                                  <Group gap={4}>
                                    <IconBrandLinkedin size={16} />
                                    <Text size="sm">LinkedIn</Text>
                                  </Group>
                                </Anchor>
                            )}
                            {user.profile?.github_url && (
                                <Anchor
                                  href={user.profile.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  c="gray"
                                >
                                  <Group gap={4}>
                                    <IconBrandGithub size={16} />
                                    <Text size="sm">GitHub</Text>
                                  </Group>
                                </Anchor>
                            )}
                            {user.profile?.personal_website && (
                                <Anchor
                                  href={user.profile.personal_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  c="teal"
                                >
                                  <Group gap={4}>
                                    <IconWorld size={16} />
                                    <Text size="sm">網站</Text>
                                  </Group>
                                </Anchor>
                              )}
                            </Group>
                          )}

                          {user.profile?.bio && (
                            <Text size="sm" lineClamp={2} c="dimmed">
                              {user.profile.bio}
                            </Text>
                          )}

                          {/* 聯絡方式 */}
                          {user.profile?.show_email && user.email && (
                            <Group gap="md" mt="sm">
                              <Group gap={4}>
                                <IconMail size={14} />
                                <Anchor href={`mailto:${user.email}`} size="sm">
                                  聯絡
                                </Anchor>
                              </Group>
                              </Group>
                            )}
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

        {/* 詳細資料 Modal */}
        <Modal 
          opened={detailModalOpened} 
          onClose={closeDetailModal} 
          title={selectedUser?.profile?.display_name || selectedUser?.profile?.full_name || '系友資料'}
          size="lg"
        >
          {loadingDetails ? (
            <Center py="xl">
              <Loader size="md" />
            </Center>
          ) : selectedUser && (
            <Stack gap="lg">
              {/* 基本資料 */}
              <div>
                <Group align="flex-start" gap="md">
                  <Avatar
                    src={selectedUser.profile?.avatar_url}
                    size={80}
                    radius="md"
                    color="blue"
                  >
                    {(selectedUser.profile?.display_name || selectedUser.profile?.full_name || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text fw={600} size="xl">
                      {selectedUser.profile?.display_name || selectedUser.profile?.full_name}
                    </Text>
                    {selectedUser.profile?.current_position && selectedUser.profile?.current_company && (
                      <Group gap="xs">
                        <IconBriefcase size={16} />
                        <Text size="sm">
                          {selectedUser.profile.current_position} @ {selectedUser.profile.current_company}
                        </Text>
                      </Group>
                    )}
                    {selectedUser.profile?.location && (
                      <Group gap="xs">
                        <IconMapPin size={16} />
                        <Text size="sm" c="dimmed">{selectedUser.profile.location}</Text>
                      </Group>
                    )}
                  </Stack>
                </Group>
                
                {selectedUser.profile?.bio && (
                  <Text size="sm" mt="md" c="dimmed">
                    {selectedUser.profile.bio}
                  </Text>
                )}
              </div>

              {/* 學籍資料 */}
              <div>
                <Divider label="學籍資料" labelPosition="left" mb="md" />
                <Stack gap="xs">
                  <Text size="sm">
                    {[
                      selectedUser.profile?.class_year ? `第 ${selectedUser.profile.class_year} 屆` : null,
                      selectedUser.profile?.graduation_year ? `${selectedUser.profile.graduation_year} 年畢業` : null,
                      selectedUser.profile?.degree ? formatDegree(selectedUser.profile.degree) : null,
                      selectedUser.profile?.major || null,
                    ].filter(Boolean).join(' · ')}
                  </Text>
                  {selectedUser.profile?.thesis_title && (
                    <div>
                      <Text size="sm" c="dimmed">論文題目</Text>
                      <Text size="sm" fw={500}>{selectedUser.profile.thesis_title}</Text>
                    </div>
                  )}
                  {(selectedUser.profile?.advisor_1 || selectedUser.profile?.advisor_2) && (
                    <div>
                      <Text size="sm" c="dimmed">指導教授</Text>
                      <Text size="sm" fw={500}>
                        {[selectedUser.profile?.advisor_1, selectedUser.profile?.advisor_2].filter(Boolean).join('、')}
                      </Text>
                    </div>
                  )}
                </Stack>
              </div>

              {/* 職涯經歷 */}
              {userWorkExperiences.length > 0 && (
                <div>
                  <Group justify="space-between" align="center" mb="md">
                    <Text size="sm" fw={500} c="dimmed">職涯經歷</Text>
                    {userWorkExperiences.length > 0 && (
                      <Badge size="sm" variant="light" color="blue">
                        總年資：{formatWorkYears(calculateTotalWorkMonths(userWorkExperiences))}
                      </Badge>
                    )}
                  </Group>
                  <Timeline active={0} bulletSize={24} lineWidth={2}>
                    {userWorkExperiences.map((work, index) => (
                      <Timeline.Item
                        key={work.id}
                        bullet={<IconBriefcase size={12} />}
                        title={
                          <Group gap="xs">
                            <Text fw={600}>{work.position}</Text>
                            {work.is_current && <Badge size="xs" color="green">目前</Badge>}
                          </Group>
                        }
                      >
                        <Text size="sm" c="dimmed">{work.company}</Text>
                        <Text size="xs" c="dimmed">
                          {work.start_date?.substring(0, 7)} - {work.is_current ? '至今' : work.end_date?.substring(0, 7)}
                          {work.location && ` · ${work.location}`}
                        </Text>
                        {work.description && (
                          <Text size="sm" mt="xs">{work.description}</Text>
                        )}
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              )}

              {/* 教育背景 */}
              {userEducations.length > 0 && (
                <div>
                  <Divider label="教育背景" labelPosition="left" mb="md" />
                  <Timeline active={0} bulletSize={24} lineWidth={2}>
                    {userEducations.map((edu) => (
                      <Timeline.Item
                        key={edu.id}
                        bullet={<IconSchool size={12} />}
                        title={
                          <Group gap="xs">
                            <Text fw={600}>{edu.school}</Text>
                            {edu.is_current && <Badge size="xs" color="blue">在學中</Badge>}
                          </Group>
                        }
                      >
                        <Text size="sm" c="dimmed">
                          {formatDegree(edu.degree)}
                          {edu.major && ` · ${edu.major}`}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {edu.start_year} - {edu.is_current ? '至今' : edu.end_year}
                        </Text>
                        {(edu.advisor_1 || edu.advisor_2) && (
                          <Text size="xs" c="dimmed">
                            指導教授：{[edu.advisor_1, edu.advisor_2].filter(Boolean).join('、')}
                          </Text>
                        )}
                        {edu.description && (
                          <Text size="sm" mt="xs">{edu.description}</Text>
                        )}
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              )}

              {/* 社交連結 */}
              {(selectedUser.profile?.linkedin_url || selectedUser.profile?.github_url || selectedUser.profile?.personal_website) && (
                <div>
                  <Divider label="社交連結" labelPosition="left" mb="md" />
                  <Group gap="md">
                    {selectedUser.profile?.linkedin_url && (
                      <Anchor
                        href={selectedUser.profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="light" leftSection={<IconBrandLinkedin size={16} />} size="sm">
                          LinkedIn
                        </Button>
                      </Anchor>
                    )}
                    {selectedUser.profile?.github_url && (
                      <Anchor
                        href={selectedUser.profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="light" color="gray" leftSection={<IconBrandGithub size={16} />} size="sm">
                          GitHub
                        </Button>
                      </Anchor>
                    )}
                    {selectedUser.profile?.personal_website && (
                      <Anchor
                        href={selectedUser.profile.personal_website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="light" color="teal" leftSection={<IconWorld size={16} />} size="sm">
                          個人網站
                        </Button>
                      </Anchor>
                    )}
                  </Group>
                </div>
              )}

              {/* 聯絡申請互動區塊 */}
              {contactStatus !== 'self' && (
                <div>
                  <Divider label="聯絡申請" labelPosition="left" mb="md" />

                  {contactStatus === 'none' || contactStatus === 'rejected' ? (
                    <Stack gap="sm">
                      <Textarea
                        placeholder="（選填）簡述您希望聯絡的原因..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.currentTarget.value)}
                        minRows={2}
                        maxRows={4}
                      />
                      <Button
                        leftSection={<IconUserPlus size={16} />}
                        onClick={handleSendContactRequest}
                        loading={sendingRequest}
                        variant="light"
                        color="indigo"
                        radius="xl"
                      >
                        申請聯絡
                      </Button>
                    </Stack>
                  ) : contactStatus === 'pending_sent' ? (
                    <Group gap="xs">
                      <IconClock size={18} color="var(--mantine-color-yellow-6)" />
                      <Text size="sm" c="dimmed">聯絡申請已送出，等待對方回覆</Text>
                    </Group>
                  ) : contactStatus === 'pending_received' ? (
                    <Stack gap="sm">
                      <Text size="sm" c="dimmed">對方向您發送了聯絡申請</Text>
                      <Group gap="sm">
                        <Button
                          color="green"
                          leftSection={<IconCheck size={16} />}
                          onClick={handleAcceptContactRequest}
                          size="sm"
                        >
                          接受
                        </Button>
                        <Button
                          color="red"
                          variant="light"
                          leftSection={<IconX size={16} />}
                          onClick={handleRejectContactRequest}
                          size="sm"
                        >
                          拒絕
                        </Button>
                      </Group>
                    </Stack>
                  ) : contactStatus === 'accepted' ? (
                    <Stack gap="sm">
                      <Group gap="xs">
                        <IconCheck size={18} color="var(--mantine-color-green-6)" />
                        <Text size="sm" c="green" fw={500}>已建立聯絡</Text>
                      </Group>
                      {/* 聯絡人可以看到的額外資訊 */}
                      <Group gap="md">
                        {selectedUser?.email && (
                          <Group gap={4}>
                            <IconMail size={16} />
                            <Anchor href={`mailto:${selectedUser.email}`} size="sm">
                              {selectedUser.email}
                            </Anchor>
                          </Group>
                        )}
                        {selectedUser?.profile?.phone && (
                          <Group gap={4}>
                            <IconPhone size={16} />
                            <Text size="sm">{selectedUser.profile.phone}</Text>
                          </Group>
                        )}
                      </Group>
                      <Button
                        variant="light"
                        color="blue"
                        leftSection={<IconMessage size={16} />}
                        onClick={() => {
                          closeDetailModal();
                          router.push('/messages');
                        }}
                        size="sm"
                        radius="xl"
                      >
                        發送訊息
                      </Button>
                    </Stack>
                  ) : null}
                </div>
              )}
            </Stack>
          )}
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
