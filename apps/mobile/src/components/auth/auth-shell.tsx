import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthShellProps = { title: string; description: string; children: ReactNode };
type AuthButtonProps = { label: string; busy?: boolean; disabled?: boolean; onPress: () => void };

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-5 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-auto w-full max-w-xl gap-6">
            <View className="items-center gap-3 pb-1">
              <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-[#E0F5E9]">
                <Ionicons name="leaf" size={34} color={THUONG_HIEU_AGRIMARKET.primary} />
              </View>
              <View className="items-center">
                <Text className="text-[25px] font-extrabold tracking-[-0.4px] text-[#06663F]">
                  {THUONG_HIEU_AGRIMARKET.ten}
                </Text>
                <Text className="mt-1 text-[12px] font-medium text-muted-foreground">
                  {THUONG_HIEU_AGRIMARKET.slogan}
                </Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-[28px] font-extrabold tracking-[-0.4px] text-foreground">{title}</Text>
              <Text className="text-[15px] leading-6 text-muted-foreground">{description}</Text>
            </View>

            <View className="gap-4 rounded-[20px] border border-border bg-card p-5 shadow-sm">
              {children}
            </View>

            <View className="flex-row items-center justify-center gap-2">
              <Ionicons name="shield-checkmark-outline" size={15} color={THUONG_HIEU_AGRIMARKET.primary} />
              <Text className="text-center text-[11px] text-muted-foreground">
                Tài khoản được bảo vệ trong hệ sinh thái AgriMarket
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
        'min-h-13 items-center justify-center rounded-[14px] bg-primary px-4 py-3.5',
        isDisabled ? 'opacity-50' : 'active:opacity-80',
      ].join(' ')}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-[15px] font-bold text-primary-foreground">{label}</Text>
      )}
    </Pressable>
  );
}
