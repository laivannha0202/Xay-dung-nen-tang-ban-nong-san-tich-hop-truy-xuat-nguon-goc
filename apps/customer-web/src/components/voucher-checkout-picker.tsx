'use client';

import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconChevronRight, IconTicket } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { VOUCHER_CUA_TOI_QUERY_KEY, layVoucherCuaToi } from '@/lib/api-voucher';

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

export function VoucherCheckoutPicker({
  selectedCode,
  disabled,
  onSelect,
}: {
  selectedCode: string;
  disabled?: boolean;
  onSelect: (ma: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [manual, setManual] = useState('');

  const query = useQuery({
    queryKey: VOUCHER_CUA_TOI_QUERY_KEY,
    queryFn: layVoucherCuaToi,
    staleTime: 15_000,
    retry: 0,
  });

  const available = (query.data?.items ?? []).filter(
    (item) => item.trangThaiVoucher === 'KHA_DUNG',
  );
  const selected = available.find((item) => item.ma === selectedCode);

  return (
    <>
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon variant="light" color="agrimarket" radius="xl">
              <IconTicket size={18} />
            </ThemeIcon>
            <Stack gap={1} style={{ minWidth: 0 }}>
              <Text fw={850}>Voucher AgriMarket</Text>
              {selected ? (
                <Text size="sm" c="green.8" fw={750} lineClamp={1}>
                  {selected.ma} · giảm {tien(selected.giaTriGiam)}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  {available.length > 0
                    ? `${available.length} voucher đã lưu có thể chọn`
                    : 'Chưa có voucher khả dụng trong kho'}
                </Text>
              )}
            </Stack>
          </Group>
          <Button
            variant="subtle"
            color="agrimarket"
            rightSection={<IconChevronRight size={16} />}
            disabled={disabled}
            onClick={() => setOpened(true)}
          >
            {selected ? 'Đổi' : 'Chọn'}
          </Button>
        </Group>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Chọn voucher"
        centered
        size="lg"
      >
        <Stack gap="md">
          {query.isPending ? (
            <Text size="sm" c="dimmed">
              Đang tải kho voucher…
            </Text>
          ) : available.length === 0 ? (
            <Paper withBorder p="md">
              <Text fw={800}>Chưa có voucher đã lưu</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Vào trang Khuyến mãi để lưu voucher trước, hoặc nhập mã khác bên dưới.
              </Text>
            </Paper>
          ) : (
            available.map((item) => (
              <Paper key={item.khuyenMaiId} withBorder p="md" radius="md">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Group gap="xs">
                      <Badge color="agrimarket" variant="light">
                        Giảm {tien(item.giaTriGiam)}
                      </Badge>
                      <Text size="xs" fw={800} c="dimmed">
                        {item.ma}
                      </Text>
                    </Group>
                    <Text fw={850} lineClamp={1}>
                      {item.ten}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Đơn từ {tien(item.donHangToiThieu)} · Backend kiểm tra lại điều kiện theo giỏ
                      hàng.
                    </Text>
                  </Stack>
                  <Button
                    color="agrimarket"
                    variant={selectedCode === item.ma ? 'light' : 'filled'}
                    leftSection={selectedCode === item.ma ? <IconCheck size={15} /> : undefined}
                    onClick={() => {
                      onSelect(item.ma);
                      setOpened(false);
                    }}
                  >
                    {selectedCode === item.ma ? 'Đang dùng' : 'Dùng'}
                  </Button>
                </Group>
              </Paper>
            ))
          )}

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text fw={800} size="sm">
                Có mã voucher khác?
              </Text>
              <Group align="flex-end">
                <TextInput
                  style={{ flex: 1 }}
                  label="Nhập mã"
                  placeholder="Ví dụ FRESH50"
                  value={manual}
                  onChange={(event) => setManual(event.currentTarget.value.toUpperCase())}
                />
                <Button
                  color="agrimarket"
                  disabled={!manual.trim()}
                  onClick={() => {
                    onSelect(manual.trim().toUpperCase());
                    setOpened(false);
                  }}
                >
                  Áp dụng
                </Button>
              </Group>
            </Stack>
          </Paper>

          {selectedCode ? (
            <Button
              variant="subtle"
              color="red"
              onClick={() => {
                onSelect('');
                setOpened(false);
              }}
            >
              Bỏ voucher đang chọn
            </Button>
          ) : null}
        </Stack>
      </Modal>
    </>
  );
}
