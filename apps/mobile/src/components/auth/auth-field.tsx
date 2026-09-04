import type { ComponentProps } from 'react';
import { Text, TextInput, View } from 'react-native';

type AuthFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

export function AuthField({ label, error, className, ...props }: AuthFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        className={[
          'rounded-xl border bg-card px-4 py-3 text-base text-foreground',
          error ? 'border-danger' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        placeholderTextColor="#718078"
        {...props}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
