import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type StateMessageProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type StateKind = 'empty' | 'error';

function StateMessage({
  kind,
  title,
  description,
  actionLabel,
  onAction,
}: StateMessageProps & { kind: StateKind }) {
  const isError = kind === 'error';

  return (
    <View className="items-center gap-3 rounded-2xl border border-border bg-card px-5 py-8">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${isError ? 'bg-danger/15' : 'bg-secondary'}`}
      >
        <Text className={`text-xl font-bold ${isError ? 'text-danger' : 'text-primary'}`}>
          {isError ? '!' : '—'}
        </Text>
      </View>
      <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm leading-5 text-muted-foreground">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          className="mt-1 rounded-xl bg-primary px-4 py-2.5 active:opacity-80"
        >
          <Text className="font-semibold text-primary-foreground">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState(props: StateMessageProps) {
  return <StateMessage kind="empty" {...props} />;
}

export function ErrorState(props: StateMessageProps) {
  return <StateMessage kind="error" {...props} />;
}

export type { StateMessageProps };
