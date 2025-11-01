/**
 * 統計卡片組件
 * 用於首頁顯示各種統計數據
 */

'use client';

import { Card, Group, Text, ThemeIcon, Stack } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
}

export function StatCard({ title, value, icon, color, trend, onClick }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="hover-translate-y glass-effect"
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <ThemeIcon size={48} radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
        {trend && (
          <Group gap={4}>
            {isPositive ? (
              <IconTrendingUp size={16} color="green" />
            ) : (
              <IconTrendingDown size={16} color="red" />
            )}
            <Text
              size="sm"
              c={isPositive ? 'green' : 'red'}
              fw={500}
            >
              {isPositive ? '+' : ''}{trend.value}%
            </Text>
          </Group>
        )}
      </Group>

      <Stack gap={4}>
        <Text size="xl" fw={700} style={{
          background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, 30)} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {value}
        </Text>
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        {trend && (
          <Text size="xs" c="dimmed">
            {trend.label}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

// 顏色調整輔助函數
function adjustColor(color: string, percent: number): string {
  // 簡單的顏色調整,實際使用可以用更複雜的算法
  const colorMap: Record<string, string> = {
    'blue': '#4ECDC4',
    'green': '#95E1D3',
    'orange': '#FFB88C',
    'violet': '#C7CEEA',
  };
  return colorMap[color] || color;
}


