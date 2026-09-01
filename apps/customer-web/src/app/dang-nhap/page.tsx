'use client';

import { dangNhap } from '@agrimarket/api-client';
import { Alert, Button, PasswordInput, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { luuPhienKhachHang } from '@/lib/phien-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

function duongDanNoiBo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/gio-hang';
  }
  return value;
}

function DangNhapKhachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDangGui(true);
    setLoi(null);

    try {
      const response = await dangNhap(
        {
          email: email.trim(),
          matKhau,
          nenTang: 'WEB',
        },
        {
          credentials: 'include',
        },
      );

      const login = duLieu(response) as {
        accessToken: string;
        nguoiDung: {
          id: string;
          email: string;
          hoTen: string;
        };
      };

      luuPhienKhachHang({
        accessToken: login.accessToken,
        nguoiDung: login.nguoiDung,
      });

      router.replace(duongDanNoiBo(searchParams.get('next')));
    } catch {
      setLoi('Đăng nhập thất bại. Hãy kiểm tra email và mật khẩu.');
    } finally {
      setDangGui(false);
    }
  };

  return (
    <AgriContainer py={{ base: 48, md: 72 }}>
      <Paper withBorder radius="xl" p={{ base: 'lg', md: 'xl' }} maw={480} mx="auto">
        <form onSubmit={submit}>
          <Stack gap="lg">
            <Stack gap={6}>
              <Title order={1}>Đăng nhập khách hàng</Title>
              <Text c="dimmed">Đăng nhập để đồng bộ giỏ hàng Backend trên các lần truy cập.</Text>
            </Stack>

            {loi ? (
              <Alert color="red" title="Không thể đăng nhập">
                {loi}
              </Alert>
            ) : null}

            <TextInput
              required
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />

            <PasswordInput
              required
              label="Mật khẩu"
              value={matKhau}
              onChange={(event) => setMatKhau(event.currentTarget.value)}
            />

            <Button type="submit" loading={dangGui} disabled={!email.trim() || !matKhau}>
              Đăng nhập
            </Button>
          </Stack>
        </form>
      </Paper>
    </AgriContainer>
  );
}

export default function TrangDangNhapKhach() {
  return (
    <Suspense
      fallback={
        <AgriContainer py={{ base: 48, md: 72 }}>
          <AgriSkeleton soLuong={2} />
        </AgriContainer>
      }
    >
      <DangNhapKhachContent />
    </Suspense>
  );
}
