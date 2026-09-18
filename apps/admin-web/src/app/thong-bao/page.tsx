'use client';

import { PageContainer, ProForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Alert, App, Card, Descriptions } from 'antd';
import { useState } from 'react';

import { guiThongBao } from '@/lib/api-thong-bao-quan-tri';

type KetQua = { soThietBi: number; daGui: number; soLoi: number };

export default function TrangThongBao() {
  const { message } = App.useApp();
  const [ketQua, setKetQua] = useState<KetQua | null>(null);

  return (
    <PageContainer
      title="Thông báo Push"
      subTitle="Gửi thực tới thiết bị Mobile đã đăng ký ExpoPushToken."
    >
      <Card style={{ maxWidth: 760 }}>
        <Alert
          type="info"
          showIcon
          message="Chỉ thiết bị đã cài app và cấp quyền thông báo mới nhận được Push."
          style={{ marginBottom: 20 }}
        />
        <ProForm<{ tieuDe: string; noiDung: string; deepLink?: string }>
          submitter={{ searchConfig: { submitText: 'Gửi thông báo' } }}
          onFinish={async (v) => {
            const r = await guiThongBao({
              tieuDe: v.tieuDe.trim(),
              noiDung: v.noiDung.trim(),
              deepLink: v.deepLink?.trim() || undefined,
            });
            setKetQua(r);
            message.success(`Đã gửi ${r.daGui}/${r.soThietBi} thiết bị.`);
            return true;
          }}
        >
          <ProFormText
            name="tieuDe"
            label="Tiêu đề"
            fieldProps={{ maxLength: 100, showCount: true }}
            rules={[{ required: true, whitespace: true }]}
          />
          <ProFormTextArea
            name="noiDung"
            label="Nội dung"
            fieldProps={{ maxLength: 500, showCount: true, rows: 5 }}
            rules={[{ required: true, whitespace: true }]}
          />
          <ProFormText name="deepLink" label="Deep-link Mobile" placeholder="/khuyen-mai" />
        </ProForm>

        {ketQua ? (
          <Descriptions
            bordered
            column={1}
            items={[
              { key: 'all', label: 'Thiết bị', children: ketQua.soThietBi },
              { key: 'sent', label: 'Đã gửi', children: ketQua.daGui },
              { key: 'error', label: 'Lỗi', children: ketQua.soLoi },
            ]}
          />
        ) : null}
      </Card>
    </PageContainer>
  );
}
