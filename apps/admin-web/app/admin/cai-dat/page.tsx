import { PageHeader, SectionHeader, Badge } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { PatchForm, Field } from '@/components/admin-kit'
import { ServiceAreaConsole } from '@/components/service-area-console'

interface Setting { key: string; value: string }

export default async function AdminSettings() {
  const settings = await serverFetch<Setting[]>('/admin/settings', await authCookie())
  const rows = settings ?? []
  const strategy = rows.find((s) => s.key === 'allocation_strategy')?.value ?? 'FIFO'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cài đặt vận hành"
        breadcrumb="Hệ thống / Cài đặt"
        description="Chính sách áp cho đơn tạo mới. Thay đổi không hồi tố các đơn đã chốt."
        actions={
          <div className="flex gap-2">
            <Badge tone="neutral">{rows.length} khoá</Badge>
            <Badge tone="brand">{strategy}</Badge>
          </div>
        }
      />

      <section className="card-pad space-y-3">
        <SectionHeader
          title="Chiến lược phân bổ lô"
          hint="Thay đổi áp dụng cho đơn tạo mới, không ảnh hưởng đơn đã phân bổ."
        />
        <p className="text-sm text-ink-600">
          <strong className="text-ink-900">FIFO</strong> (mặc định): lấy lô nhập kho trước.{' '}
          <strong className="text-ink-900">FEFO</strong>: lấy lô hết hạn sớm nhất — phù hợp nông sản tươi để giảm hàng cận hạn.
        </p>
        <PatchForm
          path="/admin/settings"
          submitLabel="Lưu chiến lược"
          fields={
            <>
              <input type="hidden" name="key" value="allocation_strategy" />
              <Field
                label="Chiến lược"
                name="value"
                defaultValue={strategy}
                options={[
                  { value: 'FIFO', label: 'FIFO — nhập trước xuất trước' },
                  { value: 'FEFO', label: 'FEFO — hết hạn trước xuất trước' },
                ]}
              />
            </>
          }
        />
      </section>

      <ServiceAreaConsole />

      <section className="card overflow-x-auto">
        <div className="border-b border-ink-100 px-4 py-3">
          <SectionHeader title="Bảng cài đặt" hint="Toàn bộ khoá đang lưu trên hệ thống." />
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Khoá</th>
              <th>Giá trị</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.key}>
                <td className="font-mono text-xs text-ink-900">{s.key}</td>
                <td className="text-ink-700">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
