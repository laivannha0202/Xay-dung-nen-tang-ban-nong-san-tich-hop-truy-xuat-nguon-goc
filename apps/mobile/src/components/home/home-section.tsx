import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Badge } from '@/components/design-system';

type HomeSectionProps = {
  label?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function HomeSection({ label, title, description, children }: HomeSectionProps) {
  return (
    <View className="gap-4">
      <View className="gap-2">
        {label ? (
          <View className="self-start">
            <Badge size="sm" variant="success">
              {label}
            </Badge>
          </View>
        ) : null}
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        <Text className="text-sm leading-5 text-muted-foreground">{description}</Text>
      </View>
      {children}
    </View>
  );
}

export type { HomeSectionProps };
