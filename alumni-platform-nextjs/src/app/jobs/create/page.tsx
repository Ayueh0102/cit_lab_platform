'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  NumberInput,
  Switch,
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      title: '',
      company: '',
      category_name: '',
      location: '',
      job_type: '',
      work_mode: '',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      salary_text: '',
      salary_min: '',
      salary_max: '',
      salary_negotiable: false,
      experience_required: '',
      education_required: '',
      company_website: '',
      company_logo_url: '',
      deadline: '',
    },
    validate: {
      title: (value) => (!value ? '請輸入職缺標題' : null),
      company: (value) => (!value ? '請輸入公司名稱' : null),
      category_name: (value) => (!value ? '請輸入職缺分類' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        notifications.show({
          title: '請先登入',
          message: '您需要登入才能發布職缺',
          color: 'orange',
        });
        router.push('/auth/login');
        return;
      }

      // 準備提交數據
      const jobData: any = {
        title: values.title,
        company: values.company,
        category_name: values.category_name,
        location: values.location || undefined,
        job_type: values.job_type || undefined,
        work_mode: values.work_mode || undefined,
        description: values.description || undefined,
        requirements: values.requirements || undefined,
        responsibilities: values.responsibilities || undefined,
        benefits: values.benefits || undefined,
        salary_text: values.salary_text || undefined,
        salary_min: values.salary_min ? parseFloat(values.salary_min as string) : undefined,
        salary_max: values.salary_max ? parseFloat(values.salary_max as string) : undefined,
        salary_negotiable: values.salary_negotiable,
        experience_required: values.experience_required || undefined,
        education_required: values.education_required || undefined,
        company_website: values.company_website || undefined,
        company_logo_url: values.company_logo_url || undefined,
        deadline: values.deadline || undefined,
      };

      const response = await api.jobs.create(jobData, token);

      notifications.show({
        title: '發布成功',
        message: '職缺已成功發布',
        color: 'green',
      });

      router.push(`/jobs/${response.job.id}`);
    } catch (error) {
      notifications.show({
        title: '發布失敗',
        message: error instanceof Error ? error.message : '請稍後再試',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const jobTypes = [
    { value: 'full_time', label: '全職' },
    { value: 'part_time', label: '兼職' },
    { value: 'contract', label: '約聘' },
    { value: 'internship', label: '實習' },
    { value: 'freelance', label: '自由接案' },
  ];

  const workModes = [
    { value: 'on_site', label: '辦公室' },
    { value: 'remote', label: '遠端' },
    { value: 'hybrid', label: '混合' },
  ];

  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="md" py="xl">
          <Stack gap="xl">
            <div>
              <Title order={1} mb="xs">
                發布職缺
              </Title>
              <Text c="dimmed">
                填寫職缺資訊，幫助系友找到理想的工作機會
              </Text>
            </div>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Stack gap="lg">
                  {/* 基本資訊 */}
                  <div>
                    <Title order={3} mb="md">
                      基本資訊
                    </Title>
                    <Stack gap="md">
                      <TextInput
                        label="職缺標題 *"
                        placeholder="例如：資深前端工程師"
                        required
                        {...form.getInputProps('title')}
                        key={form.key('title')}
                      />

                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="公司名稱 *"
                            placeholder="例如：台積電"
                            required
                            {...form.getInputProps('company')}
                            key={form.key('company')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="職缺分類 *"
                            placeholder="例如：光學工程、軟體開發、色彩科學"
                            required
                            {...form.getInputProps('category_name')}
                            key={form.key('category_name')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Grid>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Select
                            label="工作類型"
                            placeholder="選擇類型"
                            data={jobTypes}
                            {...form.getInputProps('job_type')}
                            key={form.key('job_type')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <Select
                            label="工作模式"
                            placeholder="選擇模式"
                            data={workModes}
                            {...form.getInputProps('work_mode')}
                            key={form.key('work_mode')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            label="工作地點"
                            placeholder="例如：台北市"
                            {...form.getInputProps('location')}
                            key={form.key('location')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="公司網站"
                            placeholder="https://..."
                            {...form.getInputProps('company_website')}
                            key={form.key('company_website')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <TextInput
                            label="公司 Logo URL"
                            placeholder="https://..."
                            {...form.getInputProps('company_logo_url')}
                            key={form.key('company_logo_url')}
                          />
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  </div>

                  {/* 職缺描述 */}
                  <div>
                    <Title order={3} mb="md">
                      職缺描述
                    </Title>
                    <Stack gap="md">
                      <Textarea
                        label="職缺描述"
                        placeholder="詳細描述這個職位的工作內容..."
                        minRows={4}
                        {...form.getInputProps('description')}
                        key={form.key('description')}
                      />

                      <Textarea
                        label="職缺要求"
                        placeholder="列出所需的技能、經驗、學歷等要求..."
                        minRows={4}
                        {...form.getInputProps('requirements')}
                        key={form.key('requirements')}
                      />

                      <Textarea
                        label="工作職責"
                        placeholder="列出主要的工作職責..."
                        minRows={4}
                        {...form.getInputProps('responsibilities')}
                        key={form.key('responsibilities')}
                      />

                      <Textarea
                        label="福利待遇"
                        placeholder="例如：員工健保、年終獎金、彈性工時..."
                        minRows={3}
                        {...form.getInputProps('benefits')}
                        key={form.key('benefits')}
                      />
                    </Stack>
                  </div>

                  {/* 薪資資訊 */}
                  <div>
                    <Title order={3} mb="md">
                      薪資資訊
                    </Title>
                    <Stack gap="md">
                      <TextInput
                        label="薪資範圍（文字描述）"
                        placeholder="例如：面議 或 月薪 50,000 - 80,000"
                        {...form.getInputProps('salary_text')}
                        key={form.key('salary_text')}
                      />

                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <NumberInput
                            label="最低薪資"
                            placeholder="例如：50000"
                            thousandSeparator=","
                            min={0}
                            {...form.getInputProps('salary_min')}
                            key={form.key('salary_min')}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <NumberInput
                            label="最高薪資"
                            placeholder="例如：80000"
                            thousandSeparator=","
                            min={0}
                            {...form.getInputProps('salary_max')}
                            key={form.key('salary_max')}
                          />
                        </Grid.Col>
                      </Grid>

                      <Switch
                        label="薪資可議"
                        {...form.getInputProps('salary_negotiable', { type: 'checkbox' })}
                        key={form.key('salary_negotiable')}
                      />
                    </Stack>
                  </div>

                  {/* 其他要求 */}
                  <div>
                    <Title order={3} mb="md">
                      其他要求
                    </Title>
                    <Stack gap="md">
                      <TextInput
                        label="經驗要求"
                        placeholder="例如：3年以上相關經驗"
                        {...form.getInputProps('experience_required')}
                        key={form.key('experience_required')}
                      />

                      <TextInput
                        label="學歷要求"
                        placeholder="例如：大學以上"
                        {...form.getInputProps('education_required')}
                        key={form.key('education_required')}
                      />

                      <TextInput
                        label="申請截止日期"
                        type="date"
                        {...form.getInputProps('deadline')}
                        key={form.key('deadline')}
                      />
                    </Stack>
                  </div>

                  <Group justify="flex-end" mt="xl">
                    <Button
                      variant="default"
                      onClick={() => router.back()}
                      disabled={loading}
                    >
                      取消
                    </Button>
                    <Button type="submit" loading={loading}>
                      發布職缺
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </form>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}


