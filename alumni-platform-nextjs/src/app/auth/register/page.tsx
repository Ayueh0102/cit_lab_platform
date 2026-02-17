'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Box,
  Stepper,
  Group,
  Select,
  NumberInput,
  Divider,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IconMail,
  IconLock,
  IconUser,
  IconSchool,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import classes from '../login/login.module.css';

const LOGIN_BACKGROUNDS = [
  '/1pUKi5OAcIzv.jpg',
  '/qkeRU7UuJgUz.jpg',
  '/V5NuOmCGmG2t.jpg',
  '/sRO91qLdH1e7.jpg',
];

// 指導教授選項
const ADVISORS = [
  '陳鴻興',
  '孫沛立',
  '黃慶賢',
  '陳秀美',
  '李明山',
  '林宗賢',
  '其他',
];

// 學位選項
const DEGREES = [
  { value: 'master', label: '碩士' },
  { value: 'phd', label: '博士' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [active, setActive] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    if (LOGIN_BACKGROUNDS.length <= 1) {
      return;
    }

    const slideshow = setInterval(() => {
      setActiveSlide((index) => (index + 1) % LOGIN_BACKGROUNDS.length);
    }, 7000);

    return () => clearInterval(slideshow);
  }, []);

  const form = useForm({
    initialValues: {
      // 帳號資訊
      email: '',
      password: '',
      confirmPassword: '',
      // 基本資料
      full_name: '',
      display_name: '',
      phone: '',
      // 學籍資料
      graduation_year: new Date().getFullYear(),
      class_year: undefined as number | undefined,
      degree: 'master',
      student_id: '',
      thesis_title: '',
      advisor_1: '',
      advisor_2: '',
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : '請輸入有效的電子郵件地址',
      password: (value) =>
        value.length >= 6 ? null : '密碼至少需要 6 個字符',
      confirmPassword: (value, values) =>
        value === values.password ? null : '兩次輸入的密碼不一致',
      full_name: (value) =>
        value.trim().length >= 2 ? null : '請輸入您的姓名',
      graduation_year: (value) =>
        value && value >= 1990 && value <= new Date().getFullYear() + 5
          ? null
          : '請輸入有效的畢業年份',
      advisor_1: (value) =>
        value ? null : '請選擇您的指導教授',
    },
  });

  const nextStep = () => {
    // 驗證當前步驟的欄位
    if (active === 0) {
      const errors = form.validateField('email');
      if (errors.hasError) return;
      const pwdErrors = form.validateField('password');
      if (pwdErrors.hasError) return;
      const confirmErrors = form.validateField('confirmPassword');
      if (confirmErrors.hasError) return;
    } else if (active === 1) {
      const nameErrors = form.validateField('full_name');
      if (nameErrors.hasError) return;
    } else if (active === 2) {
      const yearErrors = form.validateField('graduation_year');
      if (yearErrors.hasError) return;
      const advisorErrors = form.validateField('advisor_1');
      if (advisorErrors.hasError) return;
    }
    
    setActive((current) => (current < 3 ? current + 1 : current));
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async () => {
    // 最終驗證
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: '請檢查表單',
        message: '請確認所有必填欄位都已正確填寫',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      const values = form.values;
      
      const response = await api.auth.register({
        email: values.email,
        password: values.password,
        name: values.full_name,
        display_name: values.display_name || values.full_name,
        phone: values.phone,
        graduation_year: values.graduation_year,
        class_year: values.class_year,
        degree: values.degree,
        major: '色彩與照明科技研究所', // 固定為色彩所
        student_id: values.student_id,
        thesis_title: values.thesis_title,
        advisor_1: values.advisor_1,
        advisor_2: values.advisor_2,
      });

      // 顯示等待審核訊息
      setRegistrationComplete(true);
      
    } catch (error) {
      notifications.show({
        title: '註冊失敗',
        message: error instanceof Error ? error.message : '註冊過程中發生錯誤，請稍後再試',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // 產生畢業年份選項
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 30 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: `${currentYear - i} 年`,
  }));

  // 註冊完成畫面
  if (registrationComplete) {
    return (
      <ProtectedRoute requireAuth={false}>
        <div className={classes.loginContainer}>
          <div className={classes.loginBackground}>
            {LOGIN_BACKGROUNDS.map((src, index) => (
              <div
                key={src}
                className={`${classes.loginSlide} ${index === activeSlide ? classes.isActive : ''}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  style={{ objectFit: 'cover' }}
                  priority={index === 0}
                  unoptimized
                />
              </div>
            ))}
            <div className={classes.loginOverlay} />
          </div>

          <div className={classes.loginContent}>
            <Container size={480}>
              <Paper className={classes.loginCard} shadow="xl" p={40} radius="xl">
                <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <IconCheck size={80} color="var(--mantine-color-green-6)" />
                </Box>
                <Title ta="center" fw={700} mb="md">
                  註冊申請已送出！
                </Title>
                <Text c="dimmed" ta="center" mb="xl">
                  感謝您申請加入色彩與照明科技研究所系友會。
                  <br />
                  我們已收到您的申請，系統將會通知管理員進行審核。
                </Text>
                
                <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="xl">
                  審核通過後，您將會收到電子郵件通知。
                  在此之前，您暫時無法登入系統。
                </Alert>

                <Button
                  fullWidth
                  size="md"
                  onClick={() => router.push('/auth/login')}
                  className={classes.loginBtn}
                >
                  返回登入頁面
                </Button>
              </Paper>
            </Container>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className={classes.loginContainer}>
        {/* 背景輪播 */}
        <div className={classes.loginBackground}>
          {LOGIN_BACKGROUNDS.map((src, index) => (
            <div
              key={src}
              className={`${classes.loginSlide} ${index === activeSlide ? classes.isActive : ''}`}
            >
              <Image
                src={src}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
                priority={index === 0}
                unoptimized
              />
            </div>
          ))}
          <div className={classes.loginOverlay} />
        </div>

        {/* 註冊內容 */}
        <div className={classes.loginContent}>
          <Container size={520}>
            <Paper className={classes.loginCard} shadow="xl" p={40} radius="xl">
              {/* Logo */}
              <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <Image
                  src="/logo-cit.png"
                  alt="NTUST-CIT Alumni Association"
                  width={140}
                  height={60}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Box>
              <Title
                ta="center"
                fw={700}
                size="h3"
                mb="xs"
                className={classes.loginTitle}
              >
                系友會會員註冊
              </Title>
              <Text c="dimmed" size="sm" ta="center" mb="xl">
                加入色彩與照明科技研究所系友會
              </Text>

              {/* 步驟指示器 */}
              <Stepper active={active} size="sm" mb="xl">
                <Stepper.Step label="帳號" icon={<IconMail size={18} />} />
                <Stepper.Step label="基本資料" icon={<IconUser size={18} />} />
                <Stepper.Step label="學籍資料" icon={<IconSchool size={18} />} />
              </Stepper>

              <form onSubmit={(e) => { e.preventDefault(); }}>
                {/* Step 1: 帳號資訊 */}
                {active === 0 && (
                  <Stack gap="md">
                    <TextInput
                      label="電子郵件"
                      placeholder="請輸入您的電子郵件"
                      required
                      leftSection={<IconMail size={16} />}
                      {...form.getInputProps('email')}
                    />
                    <PasswordInput
                      label="密碼"
                      placeholder="至少 6 個字符"
                      required
                      leftSection={<IconLock size={16} />}
                      {...form.getInputProps('password')}
                    />
                    <PasswordInput
                      label="確認密碼"
                      placeholder="請再次輸入密碼"
                      required
                      leftSection={<IconLock size={16} />}
                      {...form.getInputProps('confirmPassword')}
                    />
                  </Stack>
                )}

                {/* Step 2: 基本資料 */}
                {active === 1 && (
                  <Stack gap="md">
                    <TextInput
                      label="姓名"
                      placeholder="請輸入您的真實姓名"
                      required
                      {...form.getInputProps('full_name')}
                    />
                    <TextInput
                      label="顯示名稱"
                      placeholder="系統中顯示的名稱（選填）"
                      description="留空則使用真實姓名"
                      {...form.getInputProps('display_name')}
                    />
                    <TextInput
                      label="聯絡電話"
                      placeholder="手機號碼（選填）"
                      {...form.getInputProps('phone')}
                    />
                  </Stack>
                )}

                {/* Step 3: 學籍資料 */}
                {active === 2 && (
                  <Stack gap="md">
                    <Alert icon={<IconSchool size={16} />} color="blue" mb="xs">
                      本系友會僅限色彩與照明科技研究所畢業系友加入
                    </Alert>
                    
                    <Group grow>
                      <Select
                        label="畢業年份"
                        placeholder="選擇年份"
                        required
                        data={graduationYears}
                        value={form.values.graduation_year?.toString()}
                        onChange={(value) => form.setFieldValue('graduation_year', value ? parseInt(value) : new Date().getFullYear())}
                      />
                      <NumberInput
                        label="屆數"
                        placeholder="例如：110"
                        description="第幾屆畢業生"
                        min={1}
                        max={200}
                        {...form.getInputProps('class_year')}
                      />
                    </Group>

                    <Group grow>
                      <Select
                        label="學位"
                        placeholder="選擇學位"
                        required
                        data={DEGREES}
                        {...form.getInputProps('degree')}
                      />
                      <TextInput
                        label="學號"
                        placeholder="例如：M11012345"
                        {...form.getInputProps('student_id')}
                      />
                    </Group>

                    <Divider label="指導教授" labelPosition="center" />

                    <Group grow>
                      <Select
                        label="指導教授（一）"
                        placeholder="選擇指導教授"
                        required
                        data={ADVISORS.map(a => ({ value: a, label: a }))}
                        searchable
                        {...form.getInputProps('advisor_1')}
                      />
                      <Select
                        label="指導教授（二）"
                        placeholder="共同指導（選填）"
                        data={ADVISORS.map(a => ({ value: a, label: a }))}
                        searchable
                        clearable
                        {...form.getInputProps('advisor_2')}
                      />
                    </Group>

                    <TextInput
                      label="論文題目"
                      placeholder="您的碩/博士論文題目（選填）"
                      {...form.getInputProps('thesis_title')}
                    />
                  </Stack>
                )}

                {/* 導航按鈕 */}
                <Group justify="space-between" mt="xl">
                  {active > 0 ? (
                    <Button variant="light" onClick={prevStep}>
                      上一步
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {active < 2 ? (
                    <Button onClick={nextStep}>
                      下一步
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      loading={loading}
                      className={classes.loginBtn}
                    >
                      🎓 提交註冊申請
                    </Button>
                  )}
                </Group>

                <Text c="dimmed" size="sm" ta="center" mt="xl">
                  已有帳號？{' '}
                  <Anchor
                    size="sm"
                    component="button"
                    type="button"
                    onClick={() => router.push('/auth/login')}
                  >
                    立即登入
                  </Anchor>
                </Text>
              </form>
            </Paper>
          </Container>
        </div>
      </div>
    </ProtectedRoute>
  );
}
