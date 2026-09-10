'use client';

import {
  Alert,
  Button,
  FileInput,
  Group,
  List,
  Paper,
  Select,
  Stack,
  Stepper,
  Text,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconCheck,
  IconFileDescription,
  IconPackage,
  IconPhoto,
  IconSend,
} from '@tabler/icons-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  LY_DO_KHIEU_NAI,
  layDieuKienKhieuNaiKhach,
  taiBangChungKhieuNaiKhach,
  taoKhieuNaiKhach,
  type LyDoKhieuNaiKhach,
} from '@/lib/api-khieu-nai';
import { layPhienKhachHang } from '@/lib/phien-khach-hang';

import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

const SO_TEP_TOI_DA = 5;

export function TaoKhieuNaiContent({ mucDonHangId }: { mucDonHangId: string }) {
  const daDangNhap = layPhienKhachHang() !== null;
  const [buoc, setBuoc] = useState(0);
  const [lyDo, setLyDo] = useState<LyDoKhieuNaiKhach | null>(null);
  const [moTa, setMoTa] = useState('');
  const [tep, setTep] = useState<File[]>([]);
  const [loiTep, setLoiTep] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['khieu-nai-khach', 'dieu-kien', mucDonHangId],
    queryFn: () => layDieuKienKhieuNaiKhach(mucDonHangId),
    enabled: daDangNhap && Boolean(mucDonHangId),
    staleTime: 10_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lyDo || moTa.trim().length < 10 || !query.data?.coTheKhieuNai) {
        throw new Error('Vui lòng kiểm tra lại lý do và nội dung yêu cầu.');
      }
      const uploaded = await Promise.all(tep.map((file) => taiBangChungKhieuNaiKhach(file)));
      return taoKhieuNaiKhach({
        mucDonHangId,
        lyDo,
        moTa: moTa.trim(),
        ...(uploaded.length > 0 ? { tepTinIds: uploaded.map((item) => item.id) } : {}),
      });
    },
  });

  const nhanLyDo = useMemo(
    () => LY_DO_KHIEU_NAI.find((item) => item.value === lyDo)?.label ?? 'Chưa chọn',
    [lyDo],
  );

  if (!mucDonHangId) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Chưa chọn sản phẩm cần hỗ trợ"
          moTa="Hãy mở một sản phẩm trong chi tiết đơn hàng để gửi yêu cầu."
          hanhDong={
            <Button component={Link} href="/don-hang">
              Xem đơn hàng
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (!daDangNhap) {
    const next = `/khieu-nai/tao?mucDonHangId=${encodeURIComponent(mucDonHangId)}`;
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <EmptyState
          tieuDe="Đăng nhập để gửi yêu cầu hỗ trợ"
          moTa="AgriMarket sẽ kiểm tra sản phẩm thuộc đúng tài khoản và đã được giao."
          hanhDong={
            <Button component={Link} href={`/dang-nhap?next=${encodeURIComponent(next)}`}>
              Đăng nhập
            </Button>
          }
        />
      </AgriContainer>
    );
  }

  if (query.isPending) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <AgriSkeleton soLuong={5} />
      </AgriContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <ErrorState
          tieuDe="Không kiểm tra được điều kiện hỗ trợ"
          moTa="Sản phẩm không tồn tại, không thuộc tài khoản hoặc hệ thống đang tạm thời không phản hồi."
          onThuLai={() => void query.refetch()}
        />
      </AgriContainer>
    );
  }

  const dieuKien = query.data;

  if (mutation.data) {
    return (
      <AgriContainer py={{ base: 40, md: 64 }}>
        <Stack gap="lg" maw={760} mx="auto">
          <Paper withBorder radius="xl" p={{ base: 'lg', md: 'xl' }}>
            <Stack align="center" ta="center" gap="md">
              <ThemeIcon size={64} radius="xl" color="agrimarket" variant="light">
                <IconCheck size={34} />
              </ThemeIcon>
              <Title order={2}>Yêu cầu đã được gửi</Title>
              <Text c="dimmed" maw={520}>
                AgriMarket đã ghi nhận yêu cầu về {mutation.data.mucDonHang.tenSanPham} cùng{' '}
                {mutation.data.bangChung.length} ảnh bằng chứng.
              </Text>
              <Group justify="center">
                <Button component={Link} href={`/don-hang/${mutation.data.donHang.id}`}>
                  Về chi tiết đơn hàng
                </Button>
                <Button component={Link} href="/khieu-nai" variant="default">
                  Xem yêu cầu hỗ trợ
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </AgriContainer>
    );
  }

  const chonTep = (files: File[]) => {
    const hopLe = files.filter((file) => file.type.startsWith('image/'));
    if (hopLe.length !== files.length) {
      setLoiTep('Chỉ chọn ảnh JPEG, PNG hoặc WebP làm bằng chứng.');
    } else if (hopLe.length > SO_TEP_TOI_DA) {
      setLoiTep(`Tối đa ${SO_TEP_TOI_DA} ảnh bằng chứng.`);
    } else {
      setLoiTep(null);
    }
    setTep(hopLe.slice(0, SO_TEP_TOI_DA));
  };

  const coTheTiep =
    (buoc === 0 && dieuKien.coTheKhieuNai) ||
    (buoc === 1 && lyDo !== null) ||
    (buoc === 2 && moTa.trim().length >= 10) ||
    (buoc === 3 && loiTep === null);

  return (
    <AgriContainer py={{ base: 32, md: 56 }}>
      <Stack gap="xl" maw={900} mx="auto">
        <Stack gap={5}>
          <Button component={Link} href="/don-hang" variant="subtle" px={0} w="fit-content">
            ← Quay lại đơn hàng
          </Button>
          <Title order={1}>Yêu cầu hỗ trợ đơn hàng</Title>
          <Text c="dimmed" maw={720}>
            Chọn vấn đề, mô tả tình trạng và thêm ảnh nếu cần. Thông tin đơn hàng được kiểm tra
            trước khi yêu cầu được ghi nhận.
          </Text>
        </Stack>

        <Stepper active={buoc} allowNextStepsSelect={false} color="agrimarket">
          <Stepper.Step label="Sản phẩm" description="Kiểm tra điều kiện" icon={<IconPackage size={18} />}>
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Stack gap="sm">
                <Text fw={800} fz="lg">{dieuKien.tenSanPham}</Text>
                <Text size="sm" c="dimmed">SKU {dieuKien.sku}</Text>
                {dieuKien.coTheKhieuNai ? (
                  <Alert color="green" title="Có thể gửi yêu cầu">
                    Sản phẩm đã được giao và đang trong thời hạn hỗ trợ.
                  </Alert>
                ) : (
                  <Alert color="orange" title="Chưa thể gửi yêu cầu">
                    {dieuKien.lyDo ?? 'Sản phẩm chưa đủ điều kiện gửi yêu cầu.'}
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Lý do" description="Chọn vấn đề">
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Select
                label="Vấn đề bạn gặp phải"
                placeholder="Chọn một lý do"
                data={LY_DO_KHIEU_NAI.map((item) => ({ value: item.value, label: item.label }))}
                value={lyDo}
                onChange={(value) => setLyDo(value as LyDoKhieuNaiKhach | null)}
                searchable={false}
              />
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Mô tả" description="Thông tin chi tiết" icon={<IconFileDescription size={18} />}>
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Textarea
                label="Mô tả tình trạng"
                description="Tối thiểu 10, tối đa 2000 ký tự."
                placeholder="Ví dụ: sản phẩm bị dập nhiều khi mở hộp..."
                value={moTa}
                onChange={(event) => setMoTa(event.currentTarget.value)}
                minLength={10}
                maxLength={2000}
                autosize
                minRows={5}
                maxRows={10}
              />
              <Text size="xs" c={moTa.trim().length >= 10 ? 'dimmed' : 'orange'} mt="xs">
                {moTa.trim().length}/2000 ký tự
              </Text>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Bằng chứng" description="Ảnh đính kèm" icon={<IconPhoto size={18} />}>
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Stack gap="sm">
                <FileInput
                  label="Ảnh bằng chứng (không bắt buộc)"
                  description={`Tối đa ${SO_TEP_TOI_DA} ảnh JPEG, PNG hoặc WebP; mỗi ảnh tối đa 5 MiB.`}
                  placeholder="Chọn ảnh"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  clearable
                  value={tep}
                  onChange={chonTep}
                  error={loiTep}
                />
                {tep.length > 0 ? (
                  <List size="sm">
                    {tep.map((file) => (
                      <List.Item key={`${file.name}-${file.size}-${file.lastModified}`}>
                        {file.name}
                      </List.Item>
                    ))}
                  </List>
                ) : (
                  <Text size="sm" c="dimmed">Chưa có ảnh bằng chứng.</Text>
                )}
              </Stack>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Xác nhận" description="Gửi yêu cầu" icon={<IconSend size={18} />}>
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Stack gap="sm">
                <Text fw={800}>Kiểm tra trước khi gửi</Text>
                <Text>Sản phẩm: {dieuKien.tenSanPham}</Text>
                <Text>Lý do: {nhanLyDo}</Text>
                <Text>Mô tả: {moTa.trim()}</Text>
                <Text>Ảnh bằng chứng: {tep.length}</Text>
                <Text size="xs" c="dimmed">
                  AgriMarket sẽ lưu ảnh đính kèm cùng yêu cầu để hỗ trợ quá trình xác minh.
                </Text>
              </Stack>
            </Paper>
          </Stepper.Step>
        </Stepper>

        {mutation.isError ? (
          <Alert color="red" title="Không gửi được yêu cầu">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Yêu cầu chưa thể gửi lúc này. Vui lòng thử lại.'}
          </Alert>
        ) : null}

        <Group justify="space-between">
          <Button
            variant="default"
            disabled={buoc === 0 || mutation.isPending}
            onClick={() => setBuoc((value) => Math.max(0, value - 1))}
          >
            Quay lại
          </Button>
          {buoc < 4 ? (
            <Button
              disabled={!coTheTiep || mutation.isPending}
              onClick={() => setBuoc((value) => Math.min(4, value + 1))}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button
              leftSection={<IconSend size={17} />}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Gửi yêu cầu
            </Button>
          )}
        </Group>
      </Stack>
    </AgriContainer>
  );
}
