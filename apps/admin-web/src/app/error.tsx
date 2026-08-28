'use client';

import { Button, Result } from 'antd';
import { useEffect } from 'react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // TODO PHIEN monitoring: gửi lỗi tới hệ thống quan sát khi được tích hợp.
    void error;
  }, [error]);

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
