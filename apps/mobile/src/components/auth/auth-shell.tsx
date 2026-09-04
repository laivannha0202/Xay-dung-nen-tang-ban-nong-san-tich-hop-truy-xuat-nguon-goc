import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

type AuthShellProps = { title: string; description: string; children: ReactNode };
type AuthButtonProps = { label: string; busy?: boolean; disabled?: boolean; onPress: () => void };

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-5 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-xl gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">{title}</Text>
            <Text className="text-base leading-6 text-muted-foreground">{description}</Text>
          </View>
          <View className="gap-4 rounded-2xl border border-border bg-card p-5">{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthButton({ label, busy = false, disabled = false, onPress }: AuthButtonProps) {
  const isDisabled = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={[
        'min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3',
        isDisabled ? 'opacity-50' : 'active:opacity-80',
      ].join(' ')}
    >
      {busy ? (
        <ActivityIndicator />
      ) : (
        <Text className="text-base font-semibold text-primary-foreground">{label}</Text>
      )}
    </Pressable>
  );
}
