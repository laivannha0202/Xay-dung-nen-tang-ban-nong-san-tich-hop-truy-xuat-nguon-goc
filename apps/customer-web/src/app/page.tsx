import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

const diemNoiBat = [
  {
    kyHieu: 'QR',
    tieuDe: 'Truy xuất nguồn gốc',
    moTa: 'Theo dõi thông tin lô nông sản và hành trình minh bạch từ nguồn cung.',
  },
  {
    kyHieu: 'FE',
    tieuDe: 'Ưu tiên độ tươi',
    moTa: 'Nền tảng được thiết kế để Backend quản lý tồn kho và FEFO nhất quán.',
  },
  {
    kyHieu: '3N',
    tieuDe: 'Đa nền tảng',
    moTa: 'Customer Web, ứng dụng di động và hệ thống quản trị dùng chung một Backend.',
  },
];

export default function TrangChu() {
  return (
    <Container size="xl" py={{ base: 'xl', md: 64 }}>
      <Stack gap={48}>
        <Stack gap="lg" maw={760}>
          <Badge variant="light" size="lg">
            AgriMarket Customer Web
          </Badge>

          <Title order={1} fz={{ base: 40, sm: 56 }} lh={1.08}>
            Nông sản rõ nguồn gốc, trải nghiệm mua sắm hiện đại
          </Title>

          <Text size="lg" c="dimmed" maw={680}>
            Customer Web foundation dùng Next.js, Mantine, TanStack Query và Zustand, sẵn sàng cho
            các phiên tích hợp API và nghiệp vụ tiếp theo.
          </Text>

          <Group>
            <Button component="a" href="#nen-tang" size="md">
              Khám phá nền tảng
            </Button>
            <Button variant="default" size="md">
              Quét mã truy xuất
            </Button>
          </Group>
        </Stack>

        <SimpleGrid id="nen-tang" cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {diemNoiBat.map((item) => (
            <Card key={item.tieuDe} withBorder radius="lg" padding="xl">
              <Stack gap="md">
                <ThemeIcon variant="light" size={48} radius="md" aria-hidden="true">
                  {item.kyHieu}
                </ThemeIcon>
                <Title order={3}>{item.tieuDe}</Title>
                <Text c="dimmed">{item.moTa}</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
