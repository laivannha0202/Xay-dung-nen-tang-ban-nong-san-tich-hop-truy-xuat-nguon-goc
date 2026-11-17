import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch, API_BASE } from '@/lib/api'
import { currentCustomer } from '@/lib/session'
import { dateVN, ACTIVITY_LABEL, QUALITY, SAFETY } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon, Badge, StatusPill, EmptyState } from '@agrimarket/ui'
import { ComplaintFromTrace } from '@/components/complaint-from-trace'

interface Trace {
  batch: {
    id: string
    code: string
    harvest_date: string
    pack_date: string | null
    expiry_date: string
    harvested_qty: number
    quality_status: string
    publication_status: string
    safety_status: string
    storage_condition: string | null
    is_expired: boolean
  }
  product: {
    name: string
    sku: string
    slug: string
    unit: string
    description: string | null
    storage: string | null
    origin_note: string | null
    image: string | null
  }
  farm: { name: string; province: string; district: string | null; commune: string | null; latitude?: number | null; longitude?: number | null } | null
  supplier: { name: string; business_type: string | null } | null
  season: { code: string; variety: string | null; sown_at: string | null; expected_harvest_at: string | null; area_ha: number | null } | null
  timeline: Array<{
    activity: string
    activity_at: string
    performer: string | null
    materials: string | null
    pesticide_name: string | null
    isolation_days: number | null
    note: string | null
  }>
  lab_tests: Array<{
    id: string
    laboratory: string | null
    sampled_at: string
    resulted_at: string | null
    overall_result: string
    metrics: unknown
    notes: string | null
    is_effective: boolean
  }>
  certificates: Array<{ type: string; number: string; issuer: string | null; valid_from: string; valid_until: string | null; scope: string | null }>
  alert: { level: 'RECALL' | 'HOLD' | 'EXPIRED'; title: string; message: string } | null
  recall: { reason: string | null; severity: string | null; started_at: string | null } | null
}

interface Metric {
  metric: string
  measured_value: string
  unit: string
  reference_limit: string
  result: string
}

interface LabTest {
  id: string
  laboratory: string | null
  sampled_at: string
  resulted_at: string | null
  overall_result: string
  metrics: Metric[]
  notes: string | null
}

function metricsOf(raw: unknown): Metric[] {
  return Array.isArray(raw) ? (raw as Metric[]) : []
}

const ALERT_CLASS: Record<string, string> = {
  RECALL: 'border-rose-300 bg-rose-50 text-rose-900',
  HOLD: 'border-amber-300 bg-amber-50 text-amber-900',
  EXPIRED: 'border-ink-300 bg-ink-100 text-ink-800',
}

export default async function TracePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [trace, user] = await Promise.all([
    serverFetch<Trace>(`/t/${encodeURIComponent(token)}`),
    currentCustomer(),
  ])
  if (!trace) notFound()

  const tests = trace.lab_tests as unknown as LabTest[]
  const passed = tests.filter((t) => t.overall_result === 'PASS').length
  const image = mediaUrl(trace.product.image)
  const address = [trace.farm?.commune, trace.farm?.district, trace.farm?.province].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {trace.alert && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${ALERT_CLASS[trace.alert.level]}`} role="alert">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">{trace.alert.title}</p>
            <p className="mt-1 text-sm">{trace.alert.message}</p>
          </div>
        </div>
      )}

      <header className="overflow-hidden rounded-[var(--radius-card)] border border-ink-100 bg-white">
        <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
          <div className="relative aspect-4/3 bg-brand-50/60 sm:aspect-auto sm:h-full">
            {image ? (
              <img src={image} alt={trace.product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-brand-300">
                <Icon name="leaf" className="h-10 w-10" />
              </span>
            )}
          </div>
          <div className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-brand-700 uppercase">
              <Icon name="shield" className="h-4 w-4" /> Hồ sơ truy xuất nguồn gốc
            </p>
            <h1 className="mt-1 text-xl font-semibold text-ink-900 sm:text-2xl">{trace.product.name}</h1>
            <p className="mt-1 font-mono text-sm text-ink-600">
              Lô {trace.batch.code} · SKU {trace.product.sku}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusPill value={trace.batch.safety_status} label={SAFETY[trace.batch.safety_status]} />
              <StatusPill value={trace.batch.quality_status} label={QUALITY[trace.batch.quality_status]} />
              {trace.batch.is_expired && <Badge tone="neutral">Đã hết hạn</Badge>}
              {trace.recall && <Badge tone="danger">Đã thu hồi</Badge>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="btn-secondary btn-sm" href={`${API_BASE}/t/${encodeURIComponent(token)}/pdf`}>
                <Icon name="download" className="h-4 w-4" /> Tải phiếu PDF
              </a>
              <Link className="btn-ghost btn-sm" href={`/san-pham/${trace.product.slug}`}>
                <Icon name="products" className="h-4 w-4" /> Xem sản phẩm
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: 'clock' as const, label: 'Thu hoạch', value: dateVN(trace.batch.harvest_date) },
          { icon: 'clock' as const, label: 'Hạn sử dụng', value: dateVN(trace.batch.expiry_date) },
          { icon: 'warehouse' as const, label: 'Khối lượng lô', value: `${trace.batch.harvested_qty} kg` },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-ink-500">{s.label}</span>
              <span className="font-medium text-ink-900">{s.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-pad">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <Icon name="pin" className="h-4 w-4 text-brand-700" /> Nông trại
          </h2>
          {trace.farm ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-ink-500">Tên nông trại</dt>
                <dd className="font-medium text-ink-900">{trace.farm.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Địa chỉ</dt>
                <dd className="text-ink-800">{address || '—'}</dd>
              </div>
              {trace.supplier && (
                <div>
                  <dt className="text-xs text-ink-500">Nhà cung cấp</dt>
                  <dd className="text-ink-800">{trace.supplier.name}{trace.supplier.business_type ? ` · ${trace.supplier.business_type}` : ''}</dd>
                </div>
              )}
              {trace.farm.latitude != null && trace.farm.longitude != null && (
                <a
                  className="btn-secondary btn-sm mt-1 inline-flex"
                  href={`https://www.openstreetmap.org/?mlat=${trace.farm.latitude}&mlon=${trace.farm.longitude}#map=14/${trace.farm.latitude}/${trace.farm.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Xem vị trí trên bản đồ
                </a>
              )}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-ink-500">Lô này chưa gắn nông trại.</p>
          )}
        </section>

        <section className="card-pad">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <Icon name="season" className="h-4 w-4 text-brand-700" /> Mùa vụ & bảo quản
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            {trace.season && (
              <>
                <div>
                  <dt className="text-xs text-ink-500">Mã mùa vụ</dt>
                  <dd className="font-medium text-ink-900">
                    {trace.season.code}
                    {trace.season.variety ? ` · giống ${trace.season.variety}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Gieo trồng</dt>
                  <dd className="text-ink-800">
                    {dateVN(trace.season.sown_at)}
                    {trace.season.area_ha ? ` · ${trace.season.area_ha} ha` : ''}
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-xs text-ink-500">Điều kiện bảo quản</dt>
              <dd className="text-ink-800">{trace.batch.storage_condition || trace.product.storage || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Đóng gói</dt>
              <dd className="text-ink-800">{dateVN(trace.batch.pack_date)} · đơn vị {trace.product.unit}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="card-pad">
        <h2 className="font-semibold text-ink-900">Nhật ký canh tác</h2>
        {trace.timeline.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">Chưa ghi nhận hoạt động nào cho mùa vụ này.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {trace.timeline.map((log, i) => (
              <li key={`${log.activity_at}-${i}`} className="relative border-l-2 border-brand-100 pl-4">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-medium text-ink-900">{ACTIVITY_LABEL[log.activity] ?? log.activity}</p>
                  <p className="text-xs text-ink-500">{dateVN(log.activity_at)}</p>
                </div>
                <p className="text-xs text-ink-600">
                  {[log.performer, log.materials, log.pesticide_name].filter(Boolean).join(' · ') || '—'}
                  {log.isolation_days != null ? ` · cách ly ${log.isolation_days} ngày` : ''}
                </p>
                {log.note && <p className="mt-0.5 text-xs text-ink-500">{log.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card-pad">
        <h2 className="font-semibold text-ink-900">Kết quả kiểm nghiệm</h2>
        {tests.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Chưa có phiếu kiểm nghiệm được xác nhận" hint="Lô chỉ được công khai khi có phiếu đạt." icon="shield" />
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-500">
              {passed}/{tests.length} phiếu đạt. Chỉ số dưới đây là bản ghi do phòng kiểm nghiệm cung cấp.
            </p>
            <div className="mt-3 space-y-4">
              {tests.map((t) => {
                const metrics = metricsOf(t.metrics)
                return (
                  <div key={t.id} className="rounded-lg border border-ink-100 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-ink-900">{t.laboratory ?? 'Phòng kiểm nghiệm'}</span>
                      <StatusPill value={t.overall_result} label={t.overall_result === 'PASS' ? 'Đạt' : 'Không đạt'} />
                      <span className="ml-auto text-xs text-ink-500">
                        Lấy mẫu {dateVN(t.sampled_at)}
                        {t.resulted_at ? ` · có kết quả ${dateVN(t.resulted_at)}` : ''}
                      </span>
                    </div>
                    {metrics.length > 0 && (
                      <div className="mt-2 overflow-x-auto">
                        <table className="table-base">
                          <thead>
                            <tr><th>Chỉ tiêu</th><th>Kết quả</th><th>Giới hạn cho phép</th><th>Đánh giá</th></tr>
                          </thead>
                          <tbody>
                            {metrics.map((m) => (
                              <tr key={m.metric}>
                                <td className="text-ink-800">{m.metric}</td>
                                <td>{m.measured_value} {m.unit}</td>
                                <td className="text-ink-500">{m.reference_limit}</td>
                                <td>
                                  <Badge tone={m.result === 'PASS' ? 'success' : 'danger'}>
                                    {m.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {t.notes && <p className="mt-2 text-xs text-ink-500">{t.notes}</p>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      {trace.certificates.length > 0 && (
        <section className="card-pad">
          <h2 className="font-semibold text-ink-900">Chứng nhận</h2>
          <ul className="mt-3 divide-y divide-ink-100 text-sm">
            {trace.certificates.map((c) => (
              <li key={c.number} className="flex flex-wrap items-center gap-2 py-2">
                <span className="font-medium text-ink-900">{c.type}</span>
                <span className="font-mono text-xs text-ink-600">{c.number}</span>
                <span className="text-ink-600">{c.issuer ?? '—'}</span>
                <span className="ml-auto text-xs text-ink-500">
                  {dateVN(c.valid_from)} → {c.valid_until ? dateVN(c.valid_until) : 'không thời hạn'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trace.recall && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon name="recall" className="h-5 w-5" /> Lô hàng đã bị thu hồi
          </h2>
          <p className="mt-1 text-sm">{trace.recall.reason}</p>
          <p className="mt-1 text-xs">
            Bắt đầu {dateVN(trace.recall.started_at)} · mức độ {trace.recall.severity ?? '—'}
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-center text-sm font-medium text-ink-800">Có vấn đề với lô này?</h2>
        {user ? (
          <ComplaintFromTrace batchId={trace.batch.id} batchCode={trace.batch.code} />
        ) : (
          <div className="card-pad text-center text-sm text-ink-600">
            <p>Đăng nhập để gửi khiếu nại gắn trực tiếp với lô {trace.batch.code}.</p>
            <Link href={`/dang-nhap?next=/t/${encodeURIComponent(token)}`} className="btn-primary mt-3">Đăng nhập</Link>
          </div>
        )}
      </section>

      <p className="pb-4 text-center text-xs text-ink-500">
        Thông tin công khai theo lô, không bao gồm dữ liệu liên hệ cá nhân của khách mua.
      </p>
    </div>
  )
}
