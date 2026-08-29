import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

type ManHinhPlaceholderProps = {
  tieuDe: string;
  moTa: string;
};

export function ManHinhPlaceholder({ tieuDe, moTa }: ManHinhPlaceholderProps) {
  return (
    <ScrollView className="flex-1 bg-background-0">
      <Box className="gap-3 p-6 pt-14">
        <Heading size="xl">{tieuDe}</Heading>
        <Text className="text-typography-500">{moTa}</Text>
        <Box className="mt-4 rounded-2xl border border-outline-200 bg-background-50 p-5">
          <Text className="font-medium text-typography-700">Foundation PHIEN-009</Text>
          <Text className="mt-2 text-typography-500">
            Dữ liệu thật sẽ được kết nối qua generated API client ở PHIEN-010.
          </Text>
        </Box>
      </Box>
    </ScrollView>
  );
}
