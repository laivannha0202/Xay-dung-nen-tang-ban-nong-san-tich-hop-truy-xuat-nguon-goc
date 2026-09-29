'use client';

// AGRIMARKET_ARTICLE_LIST_BALANCED_V2
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
import { IconArrowRight, IconCalendar } from '@tabler/icons-react';
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

function NoiDungThe({ article }: { article: BaiVietCard }) {
  return (
    <>
      <Box pos="relative" h={{ base: 200, sm: 185, md: 190 }} style={{ overflow: 'hidden' }}>
        <Image
          src={article.anh}
          alt={article.title}
          h="100%"
          w="100%"
          fit="cover"
          loading="lazy"
        />
      </Box>

      <Stack gap={8} p="md" style={{ flex: 1, minWidth: 0 }}>
        <Badge
          size="sm"
          w="fit-content"
          radius="sm"
          variant="light"
          color="green"
          tt="uppercase"
          fw={800}
          styles={{ root: { letterSpacing: '0.02em' } }}
        >
          {article.tag}
        </Badge>

        <Text
          fw={800}
          fz={15}
          c="#173126"
          lineClamp={2}
          mih={42}
          lh={1.4}
        >
          {article.title}
        </Text>

        {article.moTa ? (
          <Text
            fz={12}
            c="dimmed"
            lineClamp={3}
            mih={50}
            lh={1.5}
          >
            {article.moTa}
          </Text>
        ) : null}

        <Group justify="space-between" align="center" mt="auto" pt={6}>
          {article.date ? (
            <Group gap={5} wrap="nowrap">
              <IconCalendar size={13} color="#94a3b8" />
              <Text fz={11} c="dimmed">
                {article.date}
              </Text>
            </Group>
          ) : (
            <span />
          )}

          {article.href ? (
            <Group gap={4} c="#087A4B" wrap="nowrap">
              <Text fz={11.5} fw={700} c="#087A4B">
                Đọc bài viết
              </Text>
              <IconArrowRight size={14} color="#087A4B" />
            </Group>
          ) : null}
        </Group>
      </Stack>
    </>
  );
}

function TheBaiViet({ article }: { article: BaiVietCard }) {
  const styleChung = {
    borderColor: '#DDE8DF',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 0,
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 4px 16px rgba(20, 56, 35, 0.05)',
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
  } as const;

  if (article.href && laLienKetNgoaiBaiViet(article.href)) {
    return (
      <Paper
        bg="white"
        withBorder
        radius="lg"
        h="100%"
        component="a"
        href={article.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...styleChung, cursor: 'pointer' }}
      >
        <NoiDungThe article={article} />
      </Paper>
    );
  }

  if (article.href) {
    return (
      <Paper
        bg="white"
        withBorder
        radius="lg"
        h="100%"
        component={Link}
        href={article.href}
        style={{ ...styleChung, cursor: 'pointer' }}
      >
        <NoiDungThe article={article} />
      </Paper>
    );
  }

  return (
    <Paper bg="white" withBorder radius="lg" h="100%" style={styleChung}>
      <NoiDungThe article={article} />
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
  const nhanLienKetCheo = cheDo === 'kien-thuc' ? 'Xem tin tức' : 'Xem kiến thức';

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

      <AgriContainer py={{ base: 26, md: 38 }}>
        <Stack gap="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap={7} wrap="wrap">
              {cauHinh.tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <Button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    size="sm"
                    h={34}
                    px={14}
                    radius="md"
                    color={active ? 'agrimarket' : 'gray'}
                    variant={active ? 'filled' : 'light'}
                    styles={{
                      root: {
                        fontSize: 12,
                        fontWeight: active ? 800 : 600,
                      },
                    }}
                  >
                    {t.label}
                  </Button>
                );
              })}
            </Group>

            <Button
              component={Link}
              href={lienKetCheo}
              variant="subtle"
              color="agrimarket"
              size="sm"
              rightSection={<IconArrowRight size={15} />}
            >
              {nhanLienKetCheo}
            </Button>
          </Group>

          {noiDungQuery.isPending ? (
            <AgriSkeleton soLuong={8} />
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
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 4 }}
              spacing={{ base: 'sm', md: 'md' }}
              verticalSpacing={{ base: 'sm', md: 'md' }}
              style={{ alignItems: 'stretch' }}
            >
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
