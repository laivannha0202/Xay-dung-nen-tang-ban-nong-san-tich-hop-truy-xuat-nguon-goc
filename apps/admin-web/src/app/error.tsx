'use client';

import { Button, Result } from 'antd';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <Result
      status="500"
      title="Có lỗi xảy ra"
      subTitle="AgriMarket Admin chưa thể hiển thị nội dung này."
      extra={
        <Button type="primary" onClick={reset}>
          Thử lại
        </Button>
      }
    />
  );
}
