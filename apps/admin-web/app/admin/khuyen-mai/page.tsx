import { authCookie } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, dateVN } from '@/lib/format'
import { CreateForm, Field, Act } from '@/components/admin-kit'

interface Promotion {
  id: string
  code: string
  name: string
  type: string
  value: number
  start_at: string
  end_at: string
  usage_limit: number | null
  used_count: number
  min_subtotal_vnd: number
  status: string
}

export default async function AdminPromotions() {
  const list = await serverFetch<Promotion[]>('/admin/promotions', await authCookie())
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Khuyến mãi</h1>
      <CreateForm
        path="/admin/promotions"
        title="Thêm mã khuyến mãi"
        fields={
          <>
            <Field label="Mã" name="code" required placeholder="VD: MUAHE20" />
            <Field label="Tên chương trình" name="name" required />
            <Field label="Loại" name="type" required options={[{ value: 'PERCENT', label: 'Giảm theo %' }, { value: 'AMOUNT', label: 'Giảm số tiền' }]} />
            <Field label="Giá trị" name="value" type="number" required placeholder="20 (%) hoặc 50000 (VNĐ)" />
            <Field label="Bắt đầu" name="start_at" type="date" required />
            <Field label="Kết thúc" name="end_at" type="date" required />
            <Field label="Giới hạn lượt dùng" name="usage_limit" type="number" />
            <Field label="Đơn tối thiểu (VNĐ)" name="min_subtotal_vnd" type="number" defaultValue={0} />
          </>
        }
      />
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Mã</th><th>Chương trình</th><th>Giá trị</th><th>Thời gian</th><th>Lượt dùng</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {(list ?? []).map((p) => (
              <tr key={p.id}>
                <td className="font-mono font-medium">{p.code}</td>
                <td>{p.name}</td>
                <td>{p.type === 'PERCENT' ? `−${p.value}%` : `−${vnd(p.value)}`}</td>
                <td className="text-xs">{dateVN(p.start_at)} → {dateVN(p.end_at)}</td>
                <td>{p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ''}</td>
                <td>
                  <span className={`badge ${p.status === 'ACTIVE' ? 'bg-leaf-100 text-leaf-800' : 'bg-slate-100 text-slate-700'}`}>
                    {p.status === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'}
                  </span>
                </td>
                <td>
                  <Act
                    path={`/admin/promotions/${p.id}`}
                    method="PATCH"
                    body={{ status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }}
                    label={p.status === 'ACTIVE' ? 'Tạm dừng' : 'Bật lại'}
                    className="btn-ghost text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-leaf-600">Đơn tối thiểu áp trên tiền hàng trước giảm giá. Mã hết hạn hoặc hết lượt sẽ bị từ chối khi đặt hàng.</p>
    </div>
  )
}

export const dynamic = 'force-dynamic'
