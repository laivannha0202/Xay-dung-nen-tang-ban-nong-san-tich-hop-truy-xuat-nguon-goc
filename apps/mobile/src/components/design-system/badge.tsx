import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  brand: 'bg-secondary',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  danger: 'bg-danger/15',
  info: 'bg-info/15',
  neutral: 'bg-muted',
};

const textClass: Record<BadgeVariant, string> = {
  brand: 'text-secondary-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-muted-foreground',
};

export function Badge({ children, variant = 'neutral', size = 'md', className }: BadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View
      accessibilityRole="text"
      className={`self-start rounded-full ${padding} ${variantClass[variant]} ${className ?? ''}`}
    >
      <Text className={`${textSize} font-semibold ${textClass[variant]}`}>{children}</Text>
    </View>
  );
}

export type { BadgeProps, BadgeSize, BadgeVariant };
