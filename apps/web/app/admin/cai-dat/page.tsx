import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { PatchForm, Field } from '@/components/admin-kit'

interface Setting { key: string; value: string }

export default async function AdminSettings() {
  const settings = await serverFetch<Setting[]>('/admin/settings', await authCookie())
  const strategy = settings?.find((s) => s.key === 'allocation_strategy')?.value ?? 'FIFO'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Cài đặt vận hành</h1>
      <section className="card p-4 text-sm">
        <h2 className="font-semibold">Chiến lược phân bổ lô</h2>
        <p className="mt-1 text-leaf-700">
          <strong>FIFO</strong> (mặc định): lấy lô nhập kho trước. <strong>FEFO</strong>: lấy lô hết hạn sớm nhất —
          phù hợp nông sản tươi để giảm hàng cận hạn. Thay đổi áp dụng cho đơn tạo mới.
        </p>
        <div className="mt-3">
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
        </div>
      </section>
      <section className="card p-4 text-sm text-leaf-700">
        <h2 className="font-semibold text-leaf-900">Bảng cài đặt</h2>
        <table className="table-base mt-2">
          <thead><tr><th>Khoá</th><th>Giá trị</th></tr></thead>
          <tbody>
            {(settings ?? []).map((s) => (
              <tr key={s.key}><td className="font-mono text-xs">{s.key}</td><td>{s.value}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export const dynamic = 'force-dynamic'
