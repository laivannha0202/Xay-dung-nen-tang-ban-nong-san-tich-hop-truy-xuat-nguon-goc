import { Box, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { ReactNode } from 'react';

import { AgriContainer } from './agri-container';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions, meta }: PageHeaderProps) {
  return (
    <Box className="agri-page-header">
      <AgriContainer>
        <Group justify="space-between" align="flex-end" gap="xl" wrap="wrap">
          <Stack gap="sm" maw={760}>
            {eyebrow ? <Text className="agri-page-eyebrow">{eyebrow}</Text> : null}
            <Title order={1} className="agri-page-title">{title}</Title>
            {description ? <Text className="agri-page-description">{description}</Text> : null}
            {meta}
          </Stack>
          {actions ? <Group gap="sm">{actions}</Group> : null}
        </Group>
      </AgriContainer>
    </Box>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeading({ eyebrow, title, description, action }: SectionHeadingProps) {
  return (
    <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
      <Stack gap={5} maw={760}>
        {eyebrow ? <Text className="agri-page-eyebrow">{eyebrow}</Text> : null}
        <Title order={2} className="agri-section-title">{title}</Title>
        {description ? <Text c="dimmed" size="sm" lh={1.6}>{description}</Text> : null}
      </Stack>
      {action}
    </Group>
  );
}

type StatItem = {
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
};

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, lg: Math.min(4, Math.max(1, items.length)) }} spacing="md">
      {items.map((item) => (
        <Paper key={item.label} withBorder p="lg" className="agri-surface">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Stack gap={4} style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed" fw={700}>{item.label}</Text>
              <Text fz={26} fw={900} c="agrimarket.8" lh={1.1}>{item.value}</Text>
              {item.description ? <Text size="xs" c="dimmed" lh={1.5}>{item.description}</Text> : null}
            </Stack>
            {item.icon ? (
              <ThemeIcon size={40} radius="md" variant="light" color="agrimarket">
                {item.icon}
              </ThemeIcon>
            ) : null}
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

export function BusinessNote({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <Group className="agri-business-note" gap="sm" align="flex-start" wrap="nowrap">
      {icon}
      <Text size="sm" c="dimmed" lh={1.6}>{children}</Text>
    </Group>
  );
}
