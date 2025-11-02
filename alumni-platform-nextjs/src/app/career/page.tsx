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
  Badge,
  Modal,
  TextInput,
  Textarea,
  Select,
  Loader,
  Center,
  Tabs,
  ActionIcon,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBriefcase,
  IconSchool,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconMapPin,
  IconTag,
} from '@tabler/icons-react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface WorkExperience {
  id: number;
  company?: string;  // API 返回的欄位
  company_name?: string;  // 模型欄位
  position: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  location?: string;
}

interface Education {
  id: number;
  school?: string;  // API 返回的欄位
  school_name?: string;  // 模型欄位
  degree: string;
  major?: string;
  start_date?: string;  // API 返回的日期格式
  start_year?: number;  // 模型欄位
  end_date?: string;  // API 返回的日期格式
  end_year?: number;  // 模型欄位
  is_current: boolean;
  gpa?: number;
}

interface Skill {
  id: number;
  name: string;
  category?: string;
}

interface MySkill {
  id: number;
  skill_id: number;
  skill_name: string;
  skill_category?: string;
}

export default function CareerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [mySkills, setMySkills] = useState<MySkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('work');

  // Work Experience Modal
  const [workModalOpened, { open: openWorkModal, close: closeWorkModal }] = useDisclosure(false);
  const [editingWork, setEditingWork] = useState<WorkExperience | null>(null);

  // Education Modal
  const [eduModalOpened, { open: openEduModal, close: closeEduModal }] = useDisclosure(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);

  // Skill Modal
  const [skillModalOpened, { open: openSkillModal, close: closeSkillModal }] = useDisclosure(false);

  const workForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      location: '',
    },
    validate: {
      company: (value) => (value.length > 0 ? null : '公司名稱不能為空'),
      position: (value) => (value.length > 0 ? null : '職位不能為空'),
      start_date: (value) => (value ? null : '開始日期不能為空'),
    },
  });

  const eduForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      school: '',
      degree: '',
      major: '',
      start_date: '',
      end_date: '',
      is_current: false,
      gpa: '',
    },
    validate: {
      school: (value) => (value.length > 0 ? null : '學校名稱不能為空'),
      degree: (value) => (value.length > 0 ? null : '學位不能為空'),
      start_date: (value) => (value ? null : '開始日期不能為空'),
    },
  });

  const skillForm = useForm({
    mode: 'uncontrolled',
    initialValues: {
      skill_id: '',
    },
    validate: {
      skill_id: (value) => (value ? null : '請選擇技能'),
    },
  });

  useEffect(() => {
    loadCareerData();
    loadAllSkills();
  }, []);

  const loadCareerData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const [workRes, eduRes, skillsRes] = await Promise.all([
        api.career.getWorkExperiences(token),
        api.career.getEducations(token),
        api.career.getMySkills(token),
      ]);

      setWorkExperiences(workRes.work_experiences || []);
      setEducations(eduRes.educations || []);
      setMySkills(skillsRes.skills || []);
    } catch (error) {
      notifications.show({
        title: '載入失敗',
        message: error instanceof Error ? error.message : '無法載入職涯資料',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllSkills = async () => {
    try {
      const token = getToken();
      const response = await api.career.getSkills(token);
      setAllSkills(response.skills || response || []);
    } catch (error) {
      // 靜默失敗
    }
  };

  const handleAddWork = () => {
    setEditingWork(null);
    workForm.reset();
    openWorkModal();
  };

  const handleEditWork = (work: WorkExperience) => {
    setEditingWork(work);
    workForm.setValues({
      company: work.company || work.company_name || '',  // 兼容兩種欄位名稱
      position: work.position || '',
      start_date: work.start_date || '',
      end_date: work.end_date || '',
      is_current: work.is_current || false,
      description: work.description || '',
      location: work.location || '',
    });
    openWorkModal();
  };

  const handleSaveWork = async (values: typeof workForm.values) => {
    try {
      const token = getToken();
      if (!token) return;

      const payload = {
        company: values.company,  // 使用 company 而不是 company_name
        position: values.position,
        start_date: values.start_date,
        end_date: values.end_date || null,
        is_current: values.is_current,
        description: values.description || null,
        location: values.location || null,
      };

      if (editingWork) {
        await api.career.updateWorkExperience(editingWork.id, payload, token);
        notifications.show({
          title: '更新成功',
          message: '工作經歷已更新',
          color: 'green',
        });
      } else {
        await api.career.addWorkExperience(payload, token);
        notifications.show({
          title: '新增成功',
          message: '工作經歷已新增',
          color: 'green',
        });
      }

      closeWorkModal();
      loadCareerData();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const handleDeleteWork = async (id: number) => {
    if (!confirm('確定要刪除此工作經歷嗎?')) return;

    try {
      const token = getToken();
      if (!token) return;

      await api.career.deleteWorkExperience(id, token);
      notifications.show({
        title: '刪除成功',
        message: '工作經歷已刪除',
        color: 'green',
      });
      loadCareerData();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const handleAddEdu = () => {
    setEditingEdu(null);
    eduForm.reset();
    openEduModal();
  };

  const handleEditEdu = (edu: Education) => {
    setEditingEdu(edu);
    eduForm.setValues({
      school: edu.school || edu.school_name || '',  // 兼容兩種欄位名稱
      degree: edu.degree || '',
      major: edu.major || '',
      start_date: edu.start_date || (edu.start_year ? `${edu.start_year}-01-01` : ''),  // 從年份轉換為日期
      end_date: edu.end_date || (edu.end_year ? `${edu.end_year}-01-01` : ''),  // 從年份轉換為日期
      is_current: edu.is_current || false,
      gpa: edu.gpa?.toString() || '',
    });
    openEduModal();
  };

  const handleSaveEdu = async (values: typeof eduForm.values) => {
    try {
      const token = getToken();
      if (!token) return;

      const payload = {
        school: values.school,
        degree: values.degree,
        major: values.major || null,
        start_date: values.start_date,
        end_date: values.end_date || null,
        is_current: values.is_current,
        gpa: values.gpa ? parseFloat(values.gpa) : null,
      };

      if (editingEdu) {
        await api.career.updateEducation(editingEdu.id, payload, token);
        notifications.show({
          title: '更新成功',
          message: '教育背景已更新',
          color: 'green',
        });
      } else {
        await api.career.addEducation(payload, token);
        notifications.show({
          title: '新增成功',
          message: '教育背景已新增',
          color: 'green',
        });
      }

      closeEduModal();
      loadCareerData();
    } catch (error) {
      notifications.show({
        title: '操作失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const handleDeleteEdu = async (id: number) => {
    if (!confirm('確定要刪除此教育背景嗎?')) return;

    try {
      const token = getToken();
      if (!token) return;

      await api.career.deleteEducation(id, token);
      notifications.show({
        title: '刪除成功',
        message: '教育背景已刪除',
        color: 'green',
      });
      loadCareerData();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const handleAddSkill = async (values: typeof skillForm.values) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.career.addSkill(parseInt(values.skill_id), token);
      notifications.show({
        title: '新增成功',
        message: '技能已新增',
        color: 'green',
      });
      closeSkillModal();
      skillForm.reset();
      loadCareerData();
    } catch (error) {
      notifications.show({
        title: '新增失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      const token = getToken();
      if (!token) return;

      await api.career.deleteSkill(id, token);
      notifications.show({
        title: '刪除成功',
        message: '技能已刪除',
        color: 'green',
      });
      loadCareerData();
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
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
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                職涯管理
              </Title>
              <Text c="dimmed">管理您的工作經歷、教育背景和技能</Text>
            </div>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="work" leftSection={<IconBriefcase size={16} />}>
                  工作經歷
                </Tabs.Tab>
                <Tabs.Tab value="education" leftSection={<IconSchool size={16} />}>
                  教育背景
                </Tabs.Tab>
                <Tabs.Tab value="skills" leftSection={<IconTag size={16} />}>
                  技能
                </Tabs.Tab>
              </Tabs.List>

              {/* 工作經歷 Tab */}
              <Tabs.Panel value="work" pt="xl">
                <Group justify="space-between" mb="md">
                  <Text fw={500}>工作經歷</Text>
                  <Button leftSection={<IconPlus size={16} />} onClick={handleAddWork}>
                    新增工作經歷
                  </Button>
                </Group>

                {workExperiences.length === 0 ? (
                  <Card shadow="sm" padding="xl" radius="md" withBorder>
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <IconBriefcase size={48} color="gray" />
                        <Text c="dimmed">還沒有工作經歷</Text>
                        <Button onClick={handleAddWork}>新增第一筆工作經歷</Button>
                      </Stack>
                    </Center>
                  </Card>
                ) : (
                  <Stack gap="md">
                    {workExperiences.map((work) => (
                      <Card key={work.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="sm">
                              <Text fw={600} size="lg">
                                {work.position}
                              </Text>
                              {work.is_current && (
                                <Badge color="green" variant="light">
                                  目前在職
                                </Badge>
                              )}
                            </Group>
                            <Group gap="sm">
                              <Text fw={500}>{work.company || work.company_name || '未知公司'}</Text>
                              {work.location && (
                                <>
                                  <Text c="dimmed">•</Text>
                                  <Group gap={4}>
                                    <IconMapPin size={14} />
                                    <Text size="sm" c="dimmed">
                                      {work.location}
                                    </Text>
                                  </Group>
                                </>
                              )}
                            </Group>
                            <Group gap="sm">
                              <IconCalendar size={14} />
                              <Text size="sm" c="dimmed">
                                {formatDate(work.start_date)}
                                {work.end_date && !work.is_current
                                  ? ` - ${formatDate(work.end_date)}`
                                  : work.is_current
                                  ? ' - 至今'
                                  : ''}
                              </Text>
                            </Group>
                            {work.description && (
                              <Text size="sm" c="dimmed" mt="xs">
                                {work.description}
                              </Text>
                            )}
                          </Stack>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditWork(work)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteWork(work.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              {/* 教育背景 Tab */}
              <Tabs.Panel value="education" pt="xl">
                <Group justify="space-between" mb="md">
                  <Text fw={500}>教育背景</Text>
                  <Button leftSection={<IconPlus size={16} />} onClick={handleAddEdu}>
                    新增教育背景
                  </Button>
                </Group>

                {educations.length === 0 ? (
                  <Card shadow="sm" padding="xl" radius="md" withBorder>
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <IconSchool size={48} color="gray" />
                        <Text c="dimmed">還沒有教育背景</Text>
                        <Button onClick={handleAddEdu}>新增第一筆教育背景</Button>
                      </Stack>
                    </Center>
                  </Card>
                ) : (
                  <Stack gap="md">
                    {educations.map((edu) => (
                      <Card key={edu.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <Stack gap="xs" style={{ flex: 1 }}>
                            <Group gap="sm">
                              <Text fw={600} size="lg">
                                {edu.degree}
                              </Text>
                              {edu.major && (
                                <>
                                  <Text c="dimmed">•</Text>
                                  <Text>{edu.major}</Text>
                                </>
                              )}
                              {edu.is_current && (
                                <Badge color="green" variant="light">
                                  就讀中
                                </Badge>
                              )}
                            </Group>
                            <Text fw={500}>{edu.school || edu.school_name || '未知學校'}</Text>
                            <Group gap="sm">
                              <IconCalendar size={14} />
                              <Text size="sm" c="dimmed">
                                {formatDate(edu.start_date)}
                                {edu.end_date && !edu.is_current
                                  ? ` - ${formatDate(edu.end_date)}`
                                  : edu.is_current
                                  ? ' - 至今'
                                  : ''}
                              </Text>
                              {edu.gpa && (
                                <>
                                  <Text c="dimmed">•</Text>
                                  <Text size="sm" c="dimmed">
                                    GPA: {edu.gpa}
                                  </Text>
                                </>
                              )}
                            </Group>
                          </Stack>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleEditEdu(edu)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleDeleteEdu(edu.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              {/* 技能 Tab */}
              <Tabs.Panel value="skills" pt="xl">
                <Group justify="space-between" mb="md">
                  <Text fw={500}>我的技能</Text>
                  <Button leftSection={<IconPlus size={16} />} onClick={openSkillModal}>
                    新增技能
                  </Button>
                </Group>

                {mySkills.length === 0 ? (
                  <Card shadow="sm" padding="xl" radius="md" withBorder>
                    <Center py="xl">
                      <Stack align="center" gap="md">
                        <IconTag size={48} color="gray" />
                        <Text c="dimmed">還沒有技能</Text>
                        <Button onClick={openSkillModal}>新增第一項技能</Button>
                      </Stack>
                    </Center>
                  </Card>
                ) : (
                  <Group gap="md">
                    {mySkills.map((skill) => (
                      <Badge
                        key={skill.id}
                        size="lg"
                        variant="light"
                        color="blue"
                        rightSection={
                          <ActionIcon
                            size="xs"
                            color="blue"
                            radius="xl"
                            variant="transparent"
                            onClick={() => handleDeleteSkill(skill.id)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        }
                      >
                        {skill.skill_name || skill.skill_category}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* 工作經歷 Modal */}
        <Modal
          opened={workModalOpened}
          onClose={closeWorkModal}
          title={editingWork ? '編輯工作經歷' : '新增工作經歷'}
          size="lg"
          centered
        >
          <form onSubmit={workForm.onSubmit(handleSaveWork)}>
            <Stack gap="md">
              <TextInput
                label="公司名稱"
                placeholder="例如：台積電"
                required
                {...workForm.getInputProps('company')}
                key={workForm.key('company')}
              />
              <TextInput
                label="職位"
                placeholder="例如：前端工程師"
                required
                {...workForm.getInputProps('position')}
                key={workForm.key('position')}
              />
              <Group grow>
                <TextInput
                  type="date"
                  label="開始日期"
                  placeholder="選擇開始日期"
                  required
                  {...workForm.getInputProps('start_date')}
                  key={workForm.key('start_date')}
                />
                <TextInput
                  type="date"
                  label="結束日期"
                  placeholder="選擇結束日期"
                  disabled={workForm.getValues().is_current}
                  {...workForm.getInputProps('end_date')}
                  key={workForm.key('end_date')}
                />
              </Group>
              <Select
                label="目前狀態"
                data={[
                  { value: 'false', label: '已離職' },
                  { value: 'true', label: '目前在職' },
                ]}
                value={workForm.getValues().is_current ? 'true' : 'false'}
                onChange={(value) =>
                  workForm.setFieldValue('is_current', value === 'true')
                }
                key={workForm.key('is_current')}
              />
              <TextInput
                label="地點"
                placeholder="例如：新竹"
                {...workForm.getInputProps('location')}
                key={workForm.key('location')}
              />
              <Textarea
                label="工作描述"
                placeholder="描述您的工作內容和成就..."
                minRows={4}
                {...workForm.getInputProps('description')}
                key={workForm.key('description')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeWorkModal}>
                  取消
                </Button>
                <Button type="submit">儲存</Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* 教育背景 Modal */}
        <Modal
          opened={eduModalOpened}
          onClose={closeEduModal}
          title={editingEdu ? '編輯教育背景' : '新增教育背景'}
          size="lg"
          centered
        >
          <form onSubmit={eduForm.onSubmit(handleSaveEdu)}>
            <Stack gap="md">
              <TextInput
                label="學校名稱"
                placeholder="例如：國立清華大學"
                required
                {...eduForm.getInputProps('school')}
                key={eduForm.key('school')}
              />
              <Select
                label="學位"
                placeholder="選擇學位"
                data={[
                  { value: '學士', label: '學士' },
                  { value: '碩士', label: '碩士' },
                  { value: '博士', label: '博士' },
                  { value: '其他', label: '其他' },
                ]}
                required
                {...eduForm.getInputProps('degree')}
                key={eduForm.key('degree')}
              />
              <TextInput
                label="主修"
                placeholder="例如：光電工程"
                {...eduForm.getInputProps('major')}
                key={eduForm.key('major')}
              />
              <Group grow>
                <TextInput
                  type="date"
                  label="開始日期"
                  placeholder="選擇開始日期"
                  required
                  {...eduForm.getInputProps('start_date')}
                  key={eduForm.key('start_date')}
                />
                <TextInput
                  type="date"
                  label="結束日期"
                  placeholder="選擇結束日期"
                  disabled={eduForm.getValues().is_current}
                  {...eduForm.getInputProps('end_date')}
                  key={eduForm.key('end_date')}
                />
              </Group>
              <Select
                label="目前狀態"
                data={[
                  { value: 'false', label: '已畢業' },
                  { value: 'true', label: '就讀中' },
                ]}
                value={eduForm.getValues().is_current ? 'true' : 'false'}
                onChange={(value) =>
                  eduForm.setFieldValue('is_current', value === 'true')
                }
                key={eduForm.key('is_current')}
              />
              <TextInput
                label="GPA"
                placeholder="例如：3.5"
                type="number"
                step="0.1"
                {...eduForm.getInputProps('gpa')}
                key={eduForm.key('gpa')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeEduModal}>
                  取消
                </Button>
                <Button type="submit">儲存</Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* 技能 Modal */}
        <Modal
          opened={skillModalOpened}
          onClose={closeSkillModal}
          title="新增技能"
          centered
        >
          <form onSubmit={skillForm.onSubmit(handleAddSkill)}>
            <Stack gap="md">
              <Select
                label="選擇技能"
                placeholder="選擇一項技能"
                data={allSkills
                  .filter(
                    (skill) => !mySkills.some((mySkill) => mySkill.skill_id === skill.id)
                  )
                  .map((skill) => ({
                    value: skill.id.toString(),
                    label: skill.name,
                  }))}
                searchable
                required
                {...skillForm.getInputProps('skill_id')}
                key={skillForm.key('skill_id')}
              />
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={closeSkillModal}>
                  取消
                </Button>
                <Button type="submit">新增</Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </SidebarLayout>
    </ProtectedRoute>
  );
}

