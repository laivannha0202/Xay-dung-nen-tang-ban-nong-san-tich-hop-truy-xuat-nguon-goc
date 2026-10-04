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

import { SafeAreaScreen } from '@/components/layout/safe-area-screen';

type AuthShellProps = { title: string; description?: string; children: ReactNode };
type AuthButtonProps = { label: string; busy?: boolean; disabled?: boolean; onPress: () => void };

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <SafeAreaScreen className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-auto w-full max-w-[400px] gap-5">
            <View className="gap-1.5">
              <Text className="text-[28px] font-extrabold leading-9 text-[#0F172A]">{title}</Text>
              {description ? (
                <Text className="text-[13px] leading-5 text-[#64748B]">{description}</Text>
              ) : null}
            </View>

            <View className="gap-4 bg-white">{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaScreen>
  );
}

export function AuthButton({ label, busy = false, disabled = false, onPress }: AuthButtonProps) {
  const isDisabled = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      className={[
        'min-h-[46px] items-center justify-center rounded-[8px] bg-[#1B7A42] px-4',
        isDisabled ? 'opacity-50' : 'active:opacity-85',
      ].join(' ')}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-[15px] font-bold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
