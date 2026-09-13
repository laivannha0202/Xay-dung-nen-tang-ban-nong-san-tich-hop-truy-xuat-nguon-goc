import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text } from 'react-native';

type StateMessageProps = {
 title: string;
 description?: string;
 actionLabel?: string;
 onAction?: () => void;
 secondaryActionLabel?: string;
 onSecondaryAction?: () => void;
 icon?: React.ComponentProps<typeof Ionicons>['name'];
 bare?: boolean;
};

type StateKind = 'empty' | 'error';

const PRIMARY = '#087A4B';

function StateMessage({
 kind,
 title,
 description,
 actionLabel,
 onAction,
 secondaryActionLabel,
 onSecondaryAction,
 icon,
 bare,
}: StateMessageProps & { kind: StateKind }) {
 const isError = kind === 'error';
 const iconName = icon ?? (isError ? 'alert-circle-outline' : 'cart-outline');
 const hasPrimary = Boolean(actionLabel && onAction);
 const hasSecondary = Boolean(secondaryActionLabel && onSecondaryAction);

 return (
 <View className={bare ? 'items-center gap-4 bg-transparent px-6 py-8' : 'items-center gap-4 rounded-[16px] border border-[#E2EDE6] bg-white px-6 py-8'}>
 <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-[#E6F4EC]">
 <Ionicons name={iconName} size={30} color={isError ? '#C0392B' : PRIMARY} />
 </View>
 <View className="items-center gap-2">
 <Text className="text-center text-[19px] font-extrabold leading-6 text-[#16211A]">{title}</Text>
 {description ? (
 <Text className="max-w-[320px] text-center text-[13.5px] leading-5 text-[#6F7B74]">{description}</Text>
 ) : null}
 </View>
 {hasPrimary || hasSecondary ? (
 <View className="mt-1 flex-row flex-wrap items-center justify-center gap-2.5">
 {hasPrimary ? (
 <Pressable
 accessibilityRole="button"
 accessibilityLabel={actionLabel}
 onPress={onAction}
 className="min-h-[48px] items-center justify-center rounded-[10px] bg-[#087A4B] px-5 active:opacity-85"
 >
 <Text className="text-[15px] font-bold text-white">{actionLabel}</Text>
 </Pressable>
 ) : null}
 {hasSecondary ? (
 <Pressable
 accessibilityRole="button"
 accessibilityLabel={secondaryActionLabel}
 onPress={onSecondaryAction}
 className="min-h-[48px] items-center justify-center rounded-[10px] border border-[#D5DFD8] bg-white px-5 active:opacity-75"
 >
 <Text className="text-[15px] font-bold text-[#24312A]">{secondaryActionLabel}</Text>
 </Pressable>
 ) : null}
 </View>
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
