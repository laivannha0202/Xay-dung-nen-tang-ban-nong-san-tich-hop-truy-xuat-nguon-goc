import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch, API_BASE } from '@/lib/api'
import { currentUser } from '@/lib/session'
import { dateVN, ACTIVITY_LABEL, QUALITY } from '@/lib/format'
import { StatusBadge } from '@/components/ui'
import { ComplaintFromTrace } from '@/components/complaint-from-trace'

interface Trace {
  batch: {
    id: string
    code: string; harvest_date: string; pack_date: string | null; expiry_date: string
    harvested_qty: number; quality_status: string; safety_status: string
    storage_condition: string; is_expired: boolean
  }
  product: { name: string; sku: string; unit: string; description: string; storage: string; origin_note: string; image: string | null }
  farm: { name: string; province: string; district: string; commune: string; latitude: number | null; longitude: number | null }
  supplier: { name: string; business_type: string }
  season: { code: string; variety: string; sown_at: string; expected_harvest_at: string; area_ha: number }
  timeline: Array<{ activity: string; activity_at: string; performer: string; materials: string; pesticide_name: string | null; isolation_days: number | null; note: string }>
  lab_tests: Array<{ laboratory: string; sampled_at: string; resulted_at: string; overall_result: string; metrics: Array<{ metric: string; measured_value: string; unit: string; reference_limit: string; result: string }> }>
  certificates: Array<{ type: string; number: string; issuer: string; valid_from: string; valid_until: string | null }>
  alert: { level: 'RECALL' | 'HOLD' | 'EXPIRED'; title: string; message: string } | null
  recall: { reason: string | null; severity: string | null; started_at: string | null } | null
}

const ALERT_STYLE: Record<string, string> = {
  RECALL: 'border-red-300 bg-red-50 text-red-900',
  HOLD: 'border-amber-300 bg-amber-50 text-amber-900',
  EXPIRED: 'border-slate-300 bg-slate-100 text-slate-800',
}

export default async function TracePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [trace, user] = await Promise.all([
    serverFetch<Trace>(`/t/${encodeURIComponent(token)}`),
    currentUser(),
  ])
  if (!trace) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {trace.alert && (
        <div className={`rounded-xl border p-4 ${ALERT_STYLE[trace.alert.level]}`} role="alert">
          <p className="font-semibold">{trace.alert.title}</p>
          <p className="mt-1 text-sm">{trace.alert.message}</p>
        </div>
      )}

      <header className="card p-5">
        <p className="text-xs uppercase tracking-wide text-leaf-600">Hồ sơ truy xuất nguồn gốc</p>
        <h1 className="mt-1 text-xl font-semibold">{trace.product.name}</h1>
        <p className="text-sm text-leaf-700">Lô {trace.batch.code} · SKU {trace.product.sku}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge map={QUALITY} value={trace.batch.quality_status} />
          {trace.batch.is_expired && <span className="badge bg-slate-200 text-slate-800">Hết hạn</span>}
          <a className="btn-secondary ml-auto" href={`${API_BASE}/t/${token}/pdf`}>Tải phiếu PDF</a>
        </div>
      </header>

      <section className="card divide-y divide-leaf-50 p-5">
        <h2 className="pb-2 font-semibold">Thông tin lô</h2>
        <dl className="grid gap-2 py-3 text-sm sm:grid-cols-2">
          {[
            ['Ngày thu hoạch', dateVN(trace.batch.harvest_date)],
            ['Ngày đóng gói', dateVN(trace.batch.pack_date)],
            ['Hạn sử dụng', dateVN(trace.batch.expiry_date)],
            ['Khối lượng lô', `${trace.batch.harvested_qty} kg`],
            ['Bảo quản', trace.batch.storage_condition || trace.product.storage],
            ['Đơn vị bán', trace.product.unit],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-dashed border-leaf-50 pb-1.5">
              <dt className="text-leaf-600">{k}</dt>
              <dd className="text-right font-medium">{v || '—'}</dd>
            </div>
          ))}
        </dl>
        {trace.product.origin_note && <p className="pt-3 text-sm text-leaf-800">{trace.product.origin_note}</p>}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Nông trại & nhà cung cấp</h2>
        <p className="mt-2 text-sm"><span className="text-leaf-600">Nông trại: </span>{trace.farm.name}</p>
        <p className="text-sm">
          <span className="text-leaf-600">Địa chỉ: </span>
          {[trace.farm.commune, trace.farm.district, trace.farm.province].filter(Boolean).join(', ')}
        </p>
        <p className="text-sm"><span className="text-leaf-600">Nhà cung cấp: </span>{trace.supplier.name} ({trace.supplier.business_type})</p>
        <p className="text-sm">
          <span className="text-leaf-600">Mùa vụ: </span>{trace.season.code}
          {trace.season.variety ? ` · giống ${trace.season.variety}` : ''} · gieo {dateVN(trace.season.sown_at)}
        </p>
        {trace.farm.latitude !== null && trace.farm.longitude !== null && (
          <a
            className="btn-secondary mt-3"
            href={`https://www.openstreetmap.org/?mlat=${trace.farm.latitude}&mlon=${trace.farm.longitude}#map=14/${trace.farm.latitude}/${trace.farm.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Xem vị trí nông trại
          </a>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Nhật ký canh tác</h2>
        <ol className="mt-3 space-y-3">
          {trace.timeline.map((log, i) => (
            <li key={`${log.activity_at}-${i}`} className="relative border-l-2 border-leaf-200 pl-4">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-leaf-500" aria-hidden />
              <p className="text-sm font-medium">
                {ACTIVITY_LABEL[log.activity] ?? log.activity}
                <span className="ml-2 text-xs font-normal text-leaf-600">{dateVN(log.activity_at)}</span>
              </p>
              <p className="text-xs text-leaf-700">
                {[log.performer, log.materials, log.pesticide_name].filter(Boolean).join(' · ')}
                {log.isolation_days !== null ? ` · cách ly ${log.isolation_days} ngày` : ''}
              </p>
              {log.note && <p className="text-xs text-leaf-600">{log.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Kết quả kiểm nghiệm</h2>
        {trace.lab_tests.length === 0 ? (
          <p className="mt-2 text-sm text-leaf-700">Chưa có phiếu kiểm nghiệm được xác nhận.</p>
        ) : (
          trace.lab_tests.map((t, idx) => (
            <div key={idx} className="mt-3">
              <p className="text-sm">
                <span className="font-medium">{t.laboratory}</span> · lấy mẫu {dateVN(t.sampled_at)} · kết quả {dateVN(t.resulted_at)}
              </p>
              <p className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${t.overall_result === 'PASS' ? 'bg-leaf-100 text-leaf-800' : 'bg-red-100 text-red-800'}`}>
                {t.overall_result === 'PASS' ? 'Đạt' : 'Không đạt'}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr><th>Chỉ tiêu</th><th>Giá trị</th><th>Giới hạn</th><th>Kết quả</th></tr>
                  </thead>
                  <tbody>
                    {t.metrics.map((m) => (
                      <tr key={m.metric}>
                        <td>{m.metric}</td>
                        <td>{m.measured_value} {m.unit}</td>
                        <td>{m.reference_limit}</td>
                        <td className={m.result === 'PASS' ? 'text-leaf-700' : 'text-red-700'}>
                          {m.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>

      {trace.certificates.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold">Chứng nhận</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {trace.certificates.map((c) => (
              <li key={c.number}>
                <span className="font-medium">{c.type}</span> — số {c.number}, {c.issuer}
                <span className="text-leaf-600"> · {dateVN(c.valid_from)} → {dateVN(c.valid_until)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trace.recall && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <h2 className="font-semibold">Lô hàng đã bị thu hồi</h2>
          <p className="mt-1 text-sm">{trace.recall.reason}</p>
          <p className="mt-1 text-xs">Bắt đầu {dateVN(trace.recall.started_at)} · mức độ {trace.recall.severity}</p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-center text-sm font-medium text-leaf-800">Có vấn đề với lô này?</h2>
        {user ? (
          <ComplaintFromTrace batchId={trace.batch.id} batchCode={trace.batch.code} />
        ) : (
          <div className="card p-4 text-center text-sm text-leaf-700">
            <p>Đăng nhập để gửi khiếu nại gắn trực tiếp với lô {trace.batch.code}.</p>
            <Link href={`/dang-nhap?next=/t/${encodeURIComponent(token)}`} className="btn-primary mt-3">Đăng nhập</Link>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-leaf-600">
        Thông tin công khai, không bao gồm dữ liệu liên hệ cá nhân.
      </p>
    </div>
  )
}
