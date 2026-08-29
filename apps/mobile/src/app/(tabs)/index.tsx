import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useUngDungStore } from '@/stores/ung-dung.store';

export default function TrangChu() {
  const daXemGioiThieu = useUngDungStore((state) => state.daXemGioiThieu);
  const danhDauDaXemGioiThieu = useUngDungStore((state) => state.danhDauDaXemGioiThieu);

  return (
    <ScrollView className="flex-1 bg-background-0">
      <Box className="gap-5 p-6 pt-14">
        <Box className="gap-2">
          <Text className="font-medium text-success-600">AgriMarket Mobile</Text>
          <Heading size="2xl">Nông sản minh bạch trên thiết bị di động</Heading>
          <Text className="text-typography-500">
            Expo Router + gluestack-ui v5 + UniWind + TanStack Query + Zustand.
          </Text>
        </Box>

        <Card className="gap-2">
          <Heading size="md">Truy xuất nguồn gốc</Heading>
          <Text className="text-typography-500">
            Tab Quét QR đã có foundation để tích hợp nghiệp vụ sau.
          </Text>
        </Card>

        <Button isDisabled={daXemGioiThieu} onPress={danhDauDaXemGioiThieu}>
          <ButtonText>{daXemGioiThieu ? 'Đã xem foundation' : 'Đánh dấu đã xem'}</ButtonText>
        </Button>
      </Box>
    </ScrollView>
  );
}
