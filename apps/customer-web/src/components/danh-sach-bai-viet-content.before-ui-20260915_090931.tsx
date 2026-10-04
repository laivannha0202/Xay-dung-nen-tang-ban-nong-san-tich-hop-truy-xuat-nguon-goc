'use client';

import { useLayNoiDungTrangChuCongKhai } from '@agrimarket/api-client';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  gopBaiVietKienThuc,
  gopBaiVietTinTuc,
  laLienKetNgoaiBaiViet,
  locBaiVietTheoTab,
  type BaiVietCard,
} from '@/lib/bai-viet';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { PageHeader } from './web-page';

export type CheDoBaiViet = 'kien-thuc' | 'tin-tuc';

const TAB_KIEN_THUC = [
  { id: 'tat-ca', label: 'Tất cả' },
  { id: 'ky-thuat', label: 'Kỹ thuật trồng trọt' },
  { id: 'dinh-duong', label: 'Dinh dưỡng' },
  { id: 'meo-chon', label: 'Mẹo chọn mua' },
  { id: 'cau-chuyen', label: 'Câu chuyện nông dân' },
] as const;

const TAB_TIN_TUC = [
  { id: 'tin-tuc', label: 'Tin tức' },
  { id: 'cau-chuyen', label: 'Câu chuyện trang trại' },
  { id: 'tat-ca', label: 'Tất cả' },
] as const;

const CAU_HINH: Record<
  CheDoBaiViet,
  {
    eyebrow: string;
    title: string;
    description: string;
    breadcrumb: string;
    tabs: readonly { id: string; label: string }[];
    tabMacDinh: string;
  }
> = {
  'kien-thuc': {
    eyebrow: 'Cẩm nang AgriMarket',
    title: 'Kiến thức',
    description: 'Kỹ thuật trồng trọt, dinh dưỡng, mẹo chọn mua và câu chuyện nông dân.',
    breadcrumb: 'Kiến thức',
    tabs: TAB_KIEN_THUC,
    tabMacDinh: 'tat-ca',
  },
  'tin-tuc': {
    eyebrow: 'Cập nhật AgriMarket',
    title: 'Tin tức',
    description: 'Tin tức nông sản và câu chuyện từ các trang trại trên AgriMarket.',
    breadcrumb: 'Tin tức',
    tabs: TAB_TIN_TUC,
    tabMacDinh: 'tin-tuc',
  },
};

function TheBaiViet({ article }: { article: BaiVietCard }) {
  const noiDung = (
    <>
      <Image src={article.anh} alt={article.title} h={150} w="100%" fit="cover" />
      <Stack gap={4} p={10} style={{ flex: 1, minWidth: 0 }}>
        <Badge size="xs" w="fit-content" radius={4} bg="#EBF5EE" c="#0B7A48" fw={700}>
          {article.tag}
        </Badge>
        <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.3}>
          {article.title}
        </Text>
        {article.moTa ? (
          <Text size="11px" c="dimmed" lineClamp={2} mih={30} lh={1.4}>
            {article.moTa}
          </Text>
        ) : null}
        {article.date ? (
          <Group justify="flex-start" align="center" mt="auto" pt={4}>
            <Text size="10px" c="dimmed">
              {article.date}
            </Text>
          </Group>
        ) : null}
      </Stack>
    </>
  );

  const styleChung = {
    borderColor: '#DDE8DF',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 0,
    textDecoration: 'none',
  } as const;

  if (article.href && laLienKetNgoaiBaiViet(article.href)) {
    return (
      <Paper
        bg="white"
        withBorder
        radius="sm"
        h="100%"
        component="a"
        href={article.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...styleChung, cursor: 'pointer' }}
      >
        {noiDung}
      </Paper>
    );
  }

  if (article.href) {
    return (
      <Paper
        bg="white"
        withBorder
        radius="sm"
        h="100%"
        component={Link}
        href={article.href}
        style={{ ...styleChung, cursor: 'pointer' }}
      >
        {noiDung}
      </Paper>
    );
  }

  return (
    <Paper bg="white" withBorder radius="sm" h="100%" style={styleChung}>
      {noiDung}
    </Paper>
  );
}

export function DanhSachBaiVietContent({ cheDo }: { cheDo: CheDoBaiViet }) {
  const cauHinh = CAU_HINH[cheDo];
  const [tab, setTab] = useState(cauHinh.tabMacDinh);
  const noiDungQuery = useLayNoiDungTrangChuCongKhai();

  const tatCa = useMemo(() => {
    const kienThuc = noiDungQuery.data?.data?.kienThuc ?? [];
    if (cheDo === 'tin-tuc') {
      const cauChuyen = noiDungQuery.data?.data?.cauChuyenTrangTrai ?? [];
      return gopBaiVietTinTuc(kienThuc, cauChuyen);
    }
    return gopBaiVietKienThuc(kienThuc);
  }, [noiDungQuery.data, cheDo]);

  const hienThi = useMemo(() => locBaiVietTheoTab(tatCa, tab), [tatCa, tab]);

  const lienKetCheo = cheDo === 'kien-thuc' ? '/tin-tuc' : '/kien-thuc';
  const nhanLienKetCheo = cheDo === 'kien-thuc' ? 'Xem tin tức →' : 'Xem kiến thức →';

  return (
    <Box className="agri-page">
      <PageHeader
        eyebrow={cauHinh.eyebrow}
        title={cauHinh.title}
        description={cauHinh.description}
        meta={
          <Breadcrumbs fz="sm" mt="sm" aria-label={`Điều hướng trang ${cauHinh.breadcrumb}`}>
            <Anchor component={Link} href="/" c="dimmed">
              Trang chủ
            </Anchor>
            <Text c="dark.8" fw={700}>
              {cauHinh.breadcrumb}
            </Text>
          </Breadcrumbs>
        }
      />

      <AgriContainer py={{ base: 28, md: 42 }}>
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap={4} wrap="wrap">
              {cauHinh.tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <Button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    size="xs"
                    h={26}
                    px={10}
                    radius="xl"
                    bg={active ? '#06633C' : '#EEF5F0'}
                    c={active ? 'white' : '#455E51'}
                    variant="filled"
                    styles={{ root: { fontSize: 11, fontWeight: active ? 700 : 500 } }}
                  >
                    {t.label}
                  </Button>
                );
              })}
            </Group>
            <Anchor component={Link} href={lienKetCheo} fz={13} fw={600} c="#0B7A48">
              {nhanLienKetCheo}
            </Anchor>
          </Group>

          {noiDungQuery.isPending ? (
            <AgriSkeleton soLuong={6} />
          ) : noiDungQuery.isError ? (
            <ErrorState
              tieuDe={`Không tải được ${cauHinh.breadcrumb.toLowerCase()}`}
              moTa="Nội dung đang tạm thời không khả dụng."
              onThuLai={() => void noiDungQuery.refetch()}
            />
          ) : hienThi.length === 0 ? (
            <EmptyState
              tieuDe="Chưa có bài viết phù hợp"
              moTa={
                tatCa.length === 0
                  ? cheDo === 'tin-tuc'
                    ? 'Hiện chưa có tin tức nào. Hãy xem kiến thức nông sản trong lúc chờ cập nhật.'
                    : 'Hiện chưa có bài viết nào. Hãy quay lại sau.'
                  : 'Hiện chưa có bài viết cho mục đã chọn. Hãy thử mục khác.'
              }
              hanhDong={
                tatCa.length === 0 ? (
                  cheDo === 'tin-tuc' ? (
                    <Button component={Link} href="/kien-thuc" variant="light" color="agrimarket">
                      Xem kiến thức nông sản
                    </Button>
                  ) : undefined
                ) : (
                  <Button variant="light" color="agrimarket" onClick={() => setTab('tat-ca')}>
                    Xem tất cả
                  </Button>
                )
              }
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={12} style={{ alignItems: 'stretch' }}>
              {hienThi.map((article) => (
                <TheBaiViet key={article.id} article={article} />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </AgriContainer>
    </Box>
  );
}
