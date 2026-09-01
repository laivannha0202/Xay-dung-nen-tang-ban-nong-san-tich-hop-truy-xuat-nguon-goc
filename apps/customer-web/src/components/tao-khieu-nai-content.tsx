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
  Title,
} from '@mantine/core';
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
        throw new Error('Dữ liệu wizard chưa hợp lệ.');
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
          tieuDe="Chưa chọn sản phẩm cần khiếu nại"
          moTa="Mở khiếu nại từ một sản phẩm trong chi tiết đơn hàng."
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
          tieuDe="Đăng nhập để gửi khiếu nại"
          moTa="Backend sẽ xác minh sản phẩm thuộc đúng tài khoản và đã được giao."
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
          tieuDe="Không kiểm tra được điều kiện khiếu nại"
          moTa="Order item không tồn tại, không thuộc tài khoản này hoặc API đang tạm lỗi."
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
          <Alert color="green" title="Đã gửi khiếu nại">
            Khiếu nại đã được Backend ghi nhận với {mutation.data.bangChung.length} bằng chứng.
          </Alert>
          <Paper withBorder radius="lg" p="lg">
            <Stack gap="xs">
              <Text fw={800}>{mutation.data.mucDonHang.tenSanPham}</Text>
              <Text size="sm">Đơn: {mutation.data.donHang.maDonHang}</Text>
              <Text size="sm">Lý do: {nhanLyDo}</Text>
              <Text size="sm">Mô tả: {mutation.data.moTa}</Text>
            </Stack>
          </Paper>
          <Group>
            <Button component={Link} href={`/don-hang/${mutation.data.donHang.id}`}>
              Về chi tiết đơn hàng
            </Button>
            <Button component={Link} href="/don-hang" variant="default">
              Danh sách đơn hàng
            </Button>
          </Group>
        </Stack>
      </AgriContainer>
    );
  }

  const chonTep = (files: File[]) => {
    const hopLe = files.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/'),
    );
    if (hopLe.length !== files.length) {
      setLoiTep('Chỉ chọn ảnh hoặc video làm bằng chứng.');
    } else if (hopLe.length > SO_TEP_TOI_DA) {
      setLoiTep(`Tối đa ${SO_TEP_TOI_DA} file bằng chứng.`);
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
      <Stack gap="xl" maw={880} mx="auto">
        <Stack gap={4}>
          <Button component={Link} href="/don-hang" variant="subtle" px={0} w="fit-content">
            ← Quay lại đơn hàng
          </Button>
          <Title order={1}>Gửi khiếu nại</Title>
          <Text c="dimmed">
            Điều kiện đã giao, quyền sở hữu item và bằng chứng đều được Backend PHIEN-067 xác minh.
          </Text>
        </Stack>

        <Stepper active={buoc} allowNextStepsSelect={false}>
          <Stepper.Step label="Sản phẩm" description="item">
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Stack gap="xs">
                <Text fw={800}>{dieuKien.tenSanPham}</Text>
                <Text size="sm" c="dimmed">
                  SKU {dieuKien.sku}
                </Text>
                {dieuKien.coTheKhieuNai ? (
                  <Alert color="green">Backend xác nhận order item đủ điều kiện khiếu nại.</Alert>
                ) : (
                  <Alert color="orange" title="Chưa đủ điều kiện">
                    {dieuKien.lyDo ?? 'Backend chưa cho phép khiếu nại item này.'}
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Lý do" description="reason">
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Select
                label="Lý do khiếu nại"
                placeholder="Chọn một lý do"
                data={LY_DO_KHIEU_NAI.map((item) => ({ value: item.value, label: item.label }))}
                value={lyDo}
                onChange={(value) => setLyDo(value as LyDoKhieuNaiKhach | null)}
                searchable={false}
              />
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Mô tả" description="description">
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Textarea
                label="Mô tả vấn đề"
                description="Tối thiểu 10, tối đa 2000 ký tự."
                placeholder="Mô tả tình trạng sản phẩm và vấn đề bạn gặp phải"
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

          <Stepper.Step label="Bằng chứng" description="evidence">
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Stack gap="sm">
                <FileInput
                  label="Ảnh/video bằng chứng (không bắt buộc)"
                  description={`Tối đa ${SO_TEP_TOI_DA} file; file được upload qua API Tệp tin khi xác nhận.`}
                  placeholder="Chọn ảnh hoặc video"
                  accept="image/*,video/*"
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
                  <Text size="sm" c="dimmed">
                    Không có bằng chứng đính kèm.
                  </Text>
                )}
              </Stack>
            </Paper>
          </Stepper.Step>

          <Stepper.Step label="Xác nhận" description="confirm">
            <Paper withBorder radius="lg" p="lg" mt="lg">
              <Stack gap="sm">
                <Text fw={800}>Kiểm tra trước khi gửi</Text>
                <Text>Sản phẩm: {dieuKien.tenSanPham}</Text>
                <Text>Lý do: {nhanLyDo}</Text>
                <Text>Mô tả: {moTa.trim()}</Text>
                <Text>Bằng chứng: {tep.length} file</Text>
                <Text size="xs" c="dimmed">
                  Khi gửi, file được upload trước; Backend sau đó xác minh ownership, MIME và
                  Shipment DELIVERED trước khi tạo complaint.
                </Text>
              </Stack>
            </Paper>
          </Stepper.Step>
        </Stepper>

        {mutation.isError ? (
          <Alert color="red" title="Không gửi được khiếu nại">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Backend từ chối dữ liệu hoặc upload bằng chứng thất bại.'}
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
            <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Gửi khiếu nại
            </Button>
          )}
        </Group>
      </Stack>
    </AgriContainer>
  );
}
