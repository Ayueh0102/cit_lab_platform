'use client';

import {
  Container,
  Stack,
  Group,
  Skeleton,
  Card,
  Grid,
  Paper,
} from '@mantine/core';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export function AdminLoadingSkeleton() {
  return (
    <ProtectedRoute>
      <SidebarLayout>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            <Group justify="space-between">
              <div>
                <Group gap="xs" mb="xs">
                  <Skeleton height={32} width={32} circle />
                  <Skeleton height={32} width={200} radius="xl" />
                </Group>
                <Skeleton height={16} width={160} radius="xl" />
              </div>
              <Group>
                <Skeleton height={36} width={120} radius="xl" />
                <Skeleton height={36} width={120} radius="xl" />
              </Group>
            </Group>
            <Skeleton height={42} radius="md" />
            <Grid>
              {[1, 2, 3, 4].map((i) => (
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={i}>
                  <Card className="glass-card-soft" padding="lg" radius="lg">
                    <Group justify="space-between" mb="xs">
                      <Skeleton height={16} width="40%" radius="xl" />
                      <Skeleton height={20} width={20} circle />
                    </Group>
                    <Skeleton height={32} width="30%" radius="xl" mt="sm" />
                    <Skeleton height={12} width="70%" radius="xl" mt="md" />
                    <Skeleton height={6} radius="xl" mt="sm" />
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
            <Paper className="glass-card-soft" p="xl" radius="lg" mt="xl">
              <Skeleton height={24} width="20%" radius="xl" mb="md" />
              <Grid>
                {[1, 2, 3, 4].map((i) => (
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }} key={i}>
                    <Skeleton height={36} radius="xl" />
                  </Grid.Col>
                ))}
              </Grid>
            </Paper>
          </Stack>
        </Container>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
