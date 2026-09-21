import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export const MARKET = {
  green: '#087A4B',
  greenDark: '#06633C',
  greenSoft: '#EAF7EF',
  background: '#F7FAF8',
  surface: '#FFFFFF',
  text: '#17251C',
  muted: '#6E7D74',
  border: '#DCE7DF',
  danger: '#C0392B',
  warning: '#E67E22',
} as const;

export function PageHeader({
  title,
  subtitle,
  back = true,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <View className="border-b border-[#DCE7DF] bg-white px-4 pb-4 pt-3">
      <View className="flex-row items-center gap-3">
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-xl border border-[#DCE7DF] bg-[#F7FAF8] active:opacity-70"
          >
            <Ionicons name="arrow-back" size={21} color={MARKET.text} />
          </Pressable>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-[22px] font-black tracking-[-0.4px] text-[#17251C]">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[12px] leading-4 text-[#6E7D74]">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-end justify-between gap-3">
      <View className="min-w-0 flex-1">
        <Text className="text-[19px] font-black tracking-[-0.25px] text-[#17251C]">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[12px] leading-4 text-[#748078]">{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="flex-row items-center gap-1 active:opacity-65">
          <Text className="text-[12px] font-extrabold text-[#087A4B]">{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={MARKET.green} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SoftCard({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-[18px] border border-[#DCE7DF] bg-white p-4">
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-[14px] bg-[#087A4B] px-4 active:opacity-80 ${disabled ? 'opacity-45' : ''}`}
    >
      {icon ? <Ionicons name={icon} size={18} color="#FFFFFF" /> : null}
      <Text className="text-[14px] font-extrabold text-white">{label}</Text>
    </Pressable>
  );
}

export function Notice({
  title,
  description,
  tone = 'neutral',
}: {
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const palette =
    tone === 'success'
      ? { bg: '#EAF7EF', border: '#BFE4CC', text: '#087A4B' }
      : tone === 'danger'
        ? { bg: '#FFF1F0', border: '#F0C9C5', text: '#B23A2E' }
        : { bg: '#F5F8F6', border: '#DCE7DF', text: '#44534B' };
  return (
    <View style={{ backgroundColor: palette.bg, borderColor: palette.border }} className="rounded-[14px] border p-3">
      <Text style={{ color: palette.text }} className="text-[13px] font-extrabold">{title}</Text>
      {description ? <Text className="mt-1 text-[12px] leading-5 text-[#66736B]">{description}</Text> : null}
    </View>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
