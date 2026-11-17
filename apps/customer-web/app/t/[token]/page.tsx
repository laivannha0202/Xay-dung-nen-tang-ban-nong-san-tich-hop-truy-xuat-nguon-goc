import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverFetch, API_BASE } from '@/lib/api'
import { currentCustomer } from '@/lib/session'
import { dateVN, ACTIVITY_LABEL, QUALITY, SAFETY } from '@/lib/format'
import { mediaUrl } from '@/lib/config'
import { Icon, Badge, StatusPill, EmptyState } from '@agrimarket/ui'
import { ComplaintFromTrace } from '@/components/complaint-from-trace'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const trace = await serverFetch<Trace>(`/t/${encodeURIComponent(token)}`)
  if (!trace) return { title: 'Tem không hợp lệ' }
  return {
    title: `Lô ${trace.batch.code} · ${trace.product.name}`,
    description: `Hồ sơ truy xuất lô ${trace.batch.code}: nông trại ${trace.farm?.name ?? 'đối tác'}, nhật ký canh tác, kết quả kiểm nghiệm và hạn sử dụng.`,
  }
}

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

const ALERT_STYLE: Record<string, string> = {
  RECALL: 'border-rose-300 bg-rose-50 text-rose-900',
  HOLD: 'border-amber-300 bg-amber-50 text-amber-900',
  EXPIRED: 'border-ink-300 bg-ink-100 text-ink-900',
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
  const recalled = Boolean(trace.recall) || trace.alert?.level === 'RECALL'

  /* Eight-step passport journey. `done` is data-driven: no step is shown as complete
     unless the API returned the record that proves it. */
  const journey = [
    { label: 'Nông trại', done: Boolean(trace.farm), note: trace.farm?.name ?? 'Chưa gắn nông trại' },
    { label: 'Mùa vụ', done: Boolean(trace.season), note: trace.season?.code ?? 'Chưa có mùa vụ' },
    {
      label: 'Gieo trồng',
      done: Boolean(trace.season?.sown_at),
      note: trace.season?.sown_at ? dateVN(trace.season.sown_at) : '—',
    },
    {
      label: 'Chăm sóc',
      done: trace.timeline.length > 0,
      note: trace.timeline.length > 0 ? `${trace.timeline.length} nhật ký` : 'Chưa ghi nhận',
    },
    { label: 'Thu hoạch', done: Boolean(trace.batch.harvest_date), note: dateVN(trace.batch.harvest_date) },
    {
      label: 'Kiểm nghiệm',
      done: tests.length > 0,
      note: tests.length > 0 ? `${passed}/${tests.length} phiếu đạt` : 'Chưa có phiếu',
    },
    {
      label: 'Công bố lô',
      done: trace.batch.publication_status === 'PUBLISHED',
      note: trace.batch.publication_status === 'PUBLISHED' ? 'Đã công khai' : 'Chưa công khai',
    },
    {
      label: 'Phân phối',
      done: trace.batch.publication_status === 'PUBLISHED' && !recalled,
      note: recalled ? 'Đã dừng bán' : 'Đang bán tại AgriMarket',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Safety alert owns the top of the page: nothing overlaps or animates over it. */}
      {trace.alert && (
        <div
          className={`flex items-start gap-3 rounded-2xl border-2 p-4 ${ALERT_STYLE[trace.alert.level] ?? ALERT_STYLE.EXPIRED}`}
          role="alert"
          aria-live="assertive"
        >
          <Icon name={recalled ? 'recall' : 'alert'} className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold">{trace.alert.title}</p>
            <p className="mt-1 text-sm leading-relaxed">{trace.alert.message}</p>
            {trace.recall && (
              <p className="mt-2 text-xs font-medium">
                Lý do: {trace.recall.reason ?? '—'} · mức độ {trace.recall.severity ?? '—'} · bắt đầu{' '}
                {dateVN(trace.recall.started_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------- passport cover ---------- */}
      <header className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
        <div className="grid sm:grid-cols-[220px_1fr]">
          <div className="relative aspect-4/3 bg-brand-50 sm:aspect-auto">
            {image ? (
              <img src={image} alt={trace.product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-brand-300">
                <Icon name="leaf" className="h-10 w-10" />
              </span>
            )}
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-semibold text-brand-800">
              <Icon name="qr" className="h-3.5 w-3.5" /> Digital Product Passport
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-brand-700 uppercase">
              <Icon name="shield" className="h-4 w-4" /> Hồ sơ truy xuất nguồn gốc
            </p>
            <h1 className="mt-1 text-[26px] leading-tight font-bold tracking-tight text-ink-900">{trace.product.name}</h1>
            <p className="mt-1.5 font-mono text-[13px] text-ink-600">
              Lô {trace.batch.code} <span className="text-ink-300">·</span> SKU {trace.product.sku}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusPill value={trace.batch.safety_status} label={SAFETY[trace.batch.safety_status]} />
              <StatusPill value={trace.batch.quality_status} label={QUALITY[trace.batch.quality_status]} />
              {trace.batch.is_expired && <Badge tone="neutral">Đã hết hạn</Badge>}
              {trace.recall && <Badge tone="danger">Đã thu hồi</Badge>}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-ink-100 pt-4 sm:grid-cols-4">
              {[
                ['Thu hoạch', dateVN(trace.batch.harvest_date)],
                ['Hạn sử dụng', dateVN(trace.batch.expiry_date)],
                ['Khối lượng lô', `${trace.batch.harvested_qty} kg`],
                ['Đóng gói', trace.batch.pack_date ? dateVN(trace.batch.pack_date) : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10.5px] tracking-wide text-ink-500 uppercase">{label}</dt>
                  <dd className="text-[13px] font-semibold text-ink-900 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
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

        {/* ---------- journey ---------- */}
        <div className="border-t border-ink-100 bg-brand-50/40 px-4 py-4 sm:px-6">
          <ol className="grid grid-cols-4 gap-y-4 sm:grid-cols-8">
            {journey.map((step, i) => (
              <li key={step.label} className="relative flex flex-col items-center px-1 text-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={`absolute top-3 h-0.5 ${step.done ? 'bg-brand-300' : 'bg-ink-200'}`}
                    style={{ left: 'calc(-50% + 20px)', width: 'calc(100% - 24px)' }}
                  />
                )}
                <span
                  className={`relative z-10 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ring-2 ring-brand-50/40 ${
                    step.done ? 'bg-brand-600 text-white' : 'bg-white text-ink-400 ring-1 ring-ink-200'
                  }`}
                >
                  {step.done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`mt-1.5 text-[11.5px] font-semibold ${step.done ? 'text-ink-900' : 'text-ink-400'}`}>
                  {step.label}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10.5px] leading-tight text-ink-500">{step.note}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-pad">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <Icon name="pin" className="h-4 w-4 text-brand-600" /> Nông trại
          </h2>
          {trace.farm ? (
            <dl className="mt-3 space-y-2.5 text-sm">
              <div>
                <dt className="text-[11px] text-ink-500">Tên nông trại</dt>
                <dd className="font-semibold text-ink-900">{trace.farm.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-500">Địa chỉ</dt>
                <dd className="text-ink-800">{address || '—'}</dd>
              </div>
              {trace.supplier && (
                <div>
                  <dt className="text-[11px] text-ink-500">Nhà cung cấp</dt>
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
            <Icon name="season" className="h-4 w-4 text-brand-600" /> Mùa vụ & bảo quản
          </h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            {trace.season && (
              <>
                <div>
                  <dt className="text-[11px] text-ink-500">Mã mùa vụ</dt>
                  <dd className="font-semibold text-ink-900">
                    {trace.season.code}
                    {trace.season.variety ? ` · giống ${trace.season.variety}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ink-500">Gieo trồng</dt>
                  <dd className="text-ink-800">
                    {dateVN(trace.season.sown_at)}
                    {trace.season.area_ha ? ` · ${trace.season.area_ha} ha` : ''}
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-[11px] text-ink-500">Điều kiện bảo quản</dt>
              <dd className="text-ink-800">{trace.batch.storage_condition || trace.product.storage || '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-500">Đơn vị bán</dt>
              <dd className="text-ink-800">{trace.product.unit}</dd>
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
                  <p className="text-sm font-semibold text-ink-900">{ACTIVITY_LABEL[log.activity] ?? log.activity}</p>
                  <p className="text-xs text-ink-500 tabular-nums">{dateVN(log.activity_at)}</p>
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
            <div className="mt-3 space-y-3">
              {tests.map((t) => {
                const metrics = metricsOf(t.metrics)
                return (
                  <div key={t.id} className="rounded-xl border border-ink-200 p-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-ink-900">{t.laboratory ?? 'Phòng kiểm nghiệm'}</span>
                      <StatusPill value={t.overall_result} label={t.overall_result === 'PASS' ? 'Đạt' : 'Không đạt'} />
                      <span className="ml-auto text-xs text-ink-500 tabular-nums">
                        Lấy mẫu {dateVN(t.sampled_at)}
                        {t.resulted_at ? ` · có kết quả ${dateVN(t.resulted_at)}` : ''}
                      </span>
                    </div>
                    {metrics.length > 0 && (
                      <div className="mt-2 overflow-x-auto rounded-lg border border-ink-100">
                        <table className="table-base">
                          <thead>
                            <tr><th>Chỉ tiêu</th><th>Kết quả</th><th>Giới hạn cho phép</th><th>Đánh giá</th></tr>
                          </thead>
                          <tbody>
                            {metrics.map((m) => (
                              <tr key={m.metric}>
                                <td className="text-ink-800">{m.metric}</td>
                                <td className="tabular-nums">{m.measured_value} {m.unit}</td>
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
              <li key={c.number} className="flex flex-wrap items-center gap-2 py-2.5">
                <span className="font-semibold text-ink-900">{c.type}</span>
                <span className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11.5px] text-ink-600">{c.number}</span>
                <span className="text-ink-600">{c.issuer ?? '—'}</span>
                <span className="ml-auto text-xs text-ink-500 tabular-nums">
                  {dateVN(c.valid_from)} → {c.valid_until ? dateVN(c.valid_until) : 'không thời hạn'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trace.recall && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon name="recall" className="h-5 w-5" /> Lô hàng đã bị thu hồi
          </h2>
          <p className="mt-1 text-sm">{trace.recall.reason}</p>
          <p className="mt-1 text-xs tabular-nums">
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
