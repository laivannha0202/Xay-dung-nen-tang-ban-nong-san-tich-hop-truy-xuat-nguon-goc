import Link from 'next/link'
import { authCookie } from '@/lib/session'
import { serverFetch, API_BASE } from '@/lib/api'
import { dateTimeVN, PUBLICATION, SAFETY } from '@/lib/format'
import { Act } from '@/components/admin-kit'
import { StatusBadge } from '@/components/ui'

interface Qr {
  id: string
  token: string
  status: string
  created_at: string
  batch_id: string
  batch_code: string
  publication_status: string
  safety_status: string
  product_name: string
  scan_count: number
  last_scan: string | null
}

export default async function AdminQrCodes() {
  const list = await serverFetch<Qr[]>('/admin/qr-codes', await authCookie())
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mã QR truy xuất</h1>
      <p className="text-sm text-leaf-700">
        Mỗi lô đã công khai có một tem QR. Tạo lại token sẽ làm tem cũ ngừng hoạt động — chỉ dùng khi tem bị lộ.
      </p>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th>Lô</th><th>Token</th><th>Lượt quét</th><th>Quét gần nhất</th><th>Công khai</th><th>An toàn</th><th></th></tr>
          </thead>
          <tbody>
            {(list ?? []).map((qr) => (
              <tr key={qr.id}>
                <td>
                  <Link href={`/admin/lo-hang/${qr.batch_id}`} className="font-medium hover:underline">{qr.batch_code}</Link>
                  <p className="text-xs text-leaf-600">{qr.product_name}</p>
                </td>
                <td className="max-w-40 truncate font-mono text-xs">{qr.token}</td>
                <td>{qr.scan_count}</td>
                <td className="text-xs">{qr.last_scan ? dateTimeVN(qr.last_scan) : '—'}</td>
                <td><StatusBadge map={PUBLICATION} value={qr.publication_status} /></td>
                <td><StatusBadge map={SAFETY} value={qr.safety_status} /></td>
                <td className="space-y-1">
                  <Link href={`/t/${qr.token}`} target="_blank" className="btn-ghost text-xs">Mở</Link>
                  <a href={`${API_BASE}/admin/batches/${qr.batch_id}/qr.png`} className="btn-ghost text-xs" download>PNG</a>
                  <Act
                    path={`/admin/qr-codes/${qr.id}/regenerate`}
                    label="Tạo lại"
                    className="btn-ghost text-xs"
                    confirmText="Tạo lại token? Tem cũ sẽ không còn truy xuất được."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
