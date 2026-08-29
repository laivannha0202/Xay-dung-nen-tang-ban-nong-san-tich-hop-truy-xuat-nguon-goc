import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function TrangDangNhap() {
  return (
    <ScrollView className="flex-1 bg-background-0">
      <Box className="min-h-screen justify-center gap-4 p-6">
        <Heading size="2xl">Đăng nhập AgriMarket</Heading>
        <Text className="text-typography-500">
          Đây là placeholder. Auth/JWT/RBAC thật chưa thuộc PHIEN-009.
        </Text>
        <Button isDisabled>
          <ButtonText>Đăng nhập</ButtonText>
        </Button>
      </Box>
    </ScrollView>
  );
}
