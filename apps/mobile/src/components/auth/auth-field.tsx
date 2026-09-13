import type { ComponentProps, ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

type AuthFieldProps = ComponentProps<typeof TextInput> & {
 label: string;
 error?: string;
 required?: boolean;
 left?: ReactNode;
 right?: ReactNode;
};

export function AuthField({ label, error, required, left, right, className, ...props }: AuthFieldProps) {
 return (
 <View className="gap-1.5">
 <Text className="text-[13.5px] font-semibold text-[#1E293B]">
 {label}
 {required ? <Text className="font-bold text-[#DC2626]"> *</Text> : null}
 </Text>
 <View
 className={[
 'min-h-[46px] flex-row items-center gap-2.5 rounded-[8px] border border-[#E2E8F0] bg-white px-3.5',
 error ? 'border-[#DC2626]' : '',
 ]
 .filter(Boolean)
 .join(' ')}
 >
 {left}
 <TextInput
 className={['min-h-[46px] flex-1 py-3 text-[14px] text-[#0F172A]', className].filter(Boolean).join(' ')}
 placeholderTextColor="#94A3B8"
 {...props}
 />
 {right}
 </View>
 {error ? <Text className="text-[13px] text-[#DC2626]">{error}</Text> : null}
 </View>
 );
}
