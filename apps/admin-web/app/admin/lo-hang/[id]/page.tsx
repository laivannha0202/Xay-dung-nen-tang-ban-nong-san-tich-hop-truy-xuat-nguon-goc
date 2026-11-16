import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, SectionHeader, Kpi, EmptyState, Alert } from '@agrimarket/ui'
import { authCookie } from '@/lib/session'
import { serverFetch, API_BASE } from '@/lib/api'
import { vnd, qty, dateVN, dateTimeVN, ORDER_STATUS, QUALITY, PUBLICATION, SAFETY } from '@/lib/format'
import { Act, Field, PatchForm, CreateForm } from '@/components/admin-kit'
import { LabTestForm } from '@/components/admin-lab-test'
import { StatusBadge } from '@/components/ui'

interface Batch {
  id: string
  code: string
  product_name: string
  sku: string
  unit: string
  base_price_vnd: number
  requires_trace: boolean
  season_id: string
  season_code: string
  variety: string
  sown_at: string
  farm_id: string
  farm_name: string
  province: string
  district: string
  commune: string
  latitude: string | null
  longitude: string | null
  supplier_name: string
  qr_token: string | null
  harvest_date: string
  pack_date: string
  expiry_date: string
  harvested_qty: string
  storage_condition: string
  notes: string
  quality_status: string
  publication_status: string
  safety_status: string
  on_hand: string
  reserved: string
  available: string
  scan_count: number
  events: Array<{ id: string; type: string; title: string; description: string; occurred_at: string }>
  logs: Array<{ id: string; activity: string; activity_at: string; performer: string; materials: string; pesticide_name: string | null; isolation_days: number | null }>
  lab_tests: Array<{
    id: string
    laboratory: string
    sampled_at: string
    resulted_at: string
    overall_result: string
    is_effective: boolean
    notes: string
    metrics: Array<{ id: string; metric: string; measured_value: string; unit: string; reference_limit: string; result: string }> | null
  }>
  certificates: Array<{ id: string; type: string; number: string; issuer: string; valid_from: string; valid_until: string | null }>
  allocations: Array<{ id: string; order_id: string; order_code: string; order_status: string; customer_email: string; reserved_qty: string; shipped_qty: string; status: string }>
  complaints: Array<{ id: string; code: string; type: string; status: string; created_at: string }>
  recall: { id: string; reason: string; status: string; started_at: string } | null
}

export default async function AdminBatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await serverFetch<Batch>(`/admin/batches/${id}`, await authCookie())
  if (!b) notFound()

  const publishable =
    b.quality_status === 'PASS' && b.safety_status === 'NORMAL' && b.publication_status !== 'PUBLISHED'

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Lô ${b.code}`}
        breadcrumb={
          <Link href="/admin/lo-hang" className="hover:underline">
            Lô hàng / {b.code}
          </Link>
        }
        description={
          <>
            <p>
              {b.product_name} ({b.sku}) · mùa vụ{' '}
              <Link href={`/admin/mua-vu/${b.season_id}`} className="underline">{b.season_code}</Link> · {b.farm_name}, {b.district}, {b.province}
            </p>
            <p>
              Thu hoạch {dateVN(b.harvest_date)} · đóng gói {dateVN(b.pack_date)} · hạn dùng {dateVN(b.expiry_date)}
            </p>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={QUALITY} value={b.quality_status} />
            <StatusBadge map={PUBLICATION} value={b.publication_status} />
            <StatusBadge map={SAFETY} value={b.safety_status} />
          </div>
        }
      />

      {!publishable && b.publication_status !== 'PUBLISHED' && (
        <Alert tone="warning">
          Chỉ công khai được khi: chất lượng Đạt, có phiếu kiểm nghiệm đạt được xác nhận, an toàn Bình thường
          {b.requires_trace ? ', và có nhật ký canh tác.' : '.'}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Tồn thực tế" value={`${qty(b.on_hand)} ${b.unit}`} icon="warehouse" tone="brand" />
        <Kpi label="Đang giữ chỗ" value={`${qty(b.reserved)} ${b.unit}`} icon="batch" tone="warning" />
        <Kpi label="Có thể bán" value={`${qty(b.available)} ${b.unit}`} icon="cart" tone="success" />
        <Kpi label="Lượt quét QR" value={b.scan_count} icon="qr" tone="info" />
      </div>

      <section className="card-pad">
        <SectionHeader title="Hành động" hint="Công khai hồ sơ, in tem QR, thu hồi lô" />
        <div className="flex flex-wrap items-center gap-2">
          {b.publication_status !== 'PUBLISHED' && (
            <Act
              path={`/admin/batches/${b.id}/publish`}
              label="Công khai hồ sơ + tạo QR"
              className="btn-primary"
              disabled={!publishable}
              confirmText="Công khai lô này? Hồ sơ truy xuất sẽ hiển thị công khai cho mọi người."
            />
          )}
          {b.publication_status === 'PUBLISHED' && b.qr_token && (
            <>
              <a href={`${API_BASE}/admin/batches/${b.id}/qr.png`} className="btn-secondary" download={`${b.code}.png`}>Tải tem QR</a>
              <Link href={`/t/${b.qr_token}`} className="btn-ghost" target="_blank">Xem trang công khai</Link>
              <a href={`${API_BASE}/t/${b.qr_token}/pdf`} className="btn-ghost" target="_blank">Tải PDF truy xuất</a>
            </>
          )}
          {b.safety_status !== 'RECALLED' && (
            <Act
              path={`/admin/batches/${b.id}/recalls`}
              label="Thu hồi lô"
              className="btn-danger"
              promptLabel="Lý do thu hồi (tối thiểu 5 ký tự):"
              confirmText="Thu hồi lô này? Toàn bộ đơn chưa xuất sẽ được giải phóng và đánh dấu cần đổi lô."
            />
          )}
          {b.recall && (
            <Link href={`/admin/thu-hoi/${b.recall.id}`} className="btn-ghost text-red-700">Xem đợt thu hồi</Link>
          )}
        </div>
      </section>

      <section className="card-pad">
        <SectionHeader title={`Phiếu kiểm nghiệm (${b.lab_tests.length})`} hint="Chỉ phiếu đạt được xác nhận mới mở khoá công khai" />
        {b.lab_tests.length === 0 ? (
          <EmptyState title="Chưa có phiếu kiểm nghiệm" hint="Thêm phiếu để chứng minh chỉ tiêu an toàn của lô." icon="shield" />
        ) : (
          <ul className="space-y-3">
            {b.lab_tests.map((t) => (
              <li key={t.id} className="rounded-lg border border-ink-200 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink-900">{t.laboratory}</span>
                  <span className={`badge ${t.overall_result === 'PASS' ? 'bg-brand-100 text-brand-800' : 'bg-red-100 text-red-800'}`}>
                    {t.overall_result === 'PASS' ? 'Đạt' : 'Không đạt'}
                  </span>
                  {t.is_effective && <span className="badge bg-sky-100 text-sky-800">Hiệu lực</span>}
                  <span className="ml-auto text-xs text-ink-500">Lấy mẫu {dateVN(t.sampled_at)} · KQ {dateVN(t.resulted_at)}</span>
                </div>
                {(t.metrics ?? []).length > 0 && (
                  <table className="table-base mt-2">
                    <thead><tr><th>Chỉ tiêu</th><th>Kết quả</th><th>Ngưỡng</th><th>Kết luận</th></tr></thead>
                    <tbody>
                      {(t.metrics ?? []).map((m) => (
                        <tr key={m.id}>
                          <td>{m.metric}</td>
                          <td>{m.measured_value} {m.unit}</td>
                          <td>{m.reference_limit || '—'}</td>
                          <td className={m.result === 'FAIL' ? 'text-red-700' : 'text-brand-800'}>{m.result === 'PASS' ? 'Đạt' : 'Không đạt'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!t.is_effective && (
                  <Act
                    path={`/admin/lab-tests/${t.id}/confirm`}
                    label="Xác nhận hiệu lực"
                    className="btn-secondary mt-2 text-xs"
                    promptLabel="Lý do xác nhận phiếu này (tối thiểu 5 ký tự):"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <LabTestForm batchId={b.id} />
        </div>
      </section>

      <section className="card-pad">
        <SectionHeader title="Lịch sử lô" hint={`${b.events.length} sự kiện`} />
        {b.events.length === 0 ? (
          <EmptyState title="Chưa có sự kiện" hint="Sự kiện phát sinh sẽ được ghi tự động vào đây." icon="clock" />
        ) : (
          <ul className="space-y-1.5 text-sm">
            {b.events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-2">
                <span className="text-xs text-ink-500 tabular-nums">{dateTimeVN(e.occurred_at)}</span>
                <span className="font-medium text-ink-900">{e.title}</span>
                <span className="text-ink-600">{e.description}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-pad">
        <SectionHeader title="Điều chỉnh dữ liệu công bố (lưu vết)" hint="Mọi thay đổi đều ghi lại lý do" />
        {b.publication_status === 'PUBLISHED' ? (
          <PatchForm
            path={`/admin/batches/${b.id}/corrections`}
            method="POST"
            submitLabel="Ghi điều chỉnh"
            fields={<CorrectionFields storage={b.storage_condition} notes={b.notes} />}
          />
        ) : (
          <p className="text-sm text-ink-600">Chỉ áp dụng cho lô đã công khai.</p>
        )}
      </section>

      <section className="card overflow-x-auto">
        <div className="p-4">
          <SectionHeader title="Đơn hàng dùng lô này" hint={`${b.allocations.length} phân bổ`} />
        </div>
        {b.allocations.length === 0 ? (
          <div className="px-4 pb-4">
            <EmptyState title="Chưa có đơn nào" hint="Đơn giữ chỗ lô này sẽ xuất hiện ở đây." icon="orders" />
          </div>
        ) : (
          <table className="table-base">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Giữ</th><th>Đã xuất</th><th>Trạng thái lô</th><th>Đơn</th></tr></thead>
            <tbody>
              {b.allocations.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/admin/don-hang/${a.order_id}`} className="font-medium hover:underline">{a.order_code}</Link></td>
                  <td className="text-xs text-ink-600">{a.customer_email}</td>
                  <td className="tabular-nums">{qty(a.reserved_qty)}</td>
                  <td className="tabular-nums">{qty(a.shipped_qty)}</td>
                  <td>{a.status}</td>
                  <td><StatusBadge map={ORDER_STATUS} value={a.order_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card-pad text-sm">
        <SectionHeader title="Nhật ký canh tác liên quan" hint={`${b.logs.length} bản ghi`} />
        {b.logs.length === 0 ? (
          <EmptyState title="Chưa có nhật ký" hint="Ghi hoạt động canh tác để hồ sơ truy xuất đầy đủ." icon="report" />
        ) : (
          <ul className="space-y-1 text-ink-800">
            {b.logs.map((l) => (
              <li key={l.id}>
                {dateVN(l.activity_at)} · {l.activity}
                {l.pesticide_name && ` (${l.pesticide_name}${l.isolation_days !== null ? `, cách ly ${l.isolation_days} ngày` : ''})`}
                {l.materials && ` · ${l.materials}`}
              </li>
            ))}
          </ul>
        )}

        <h3 className="mt-4 mb-1 font-medium text-ink-900">Chứng nhận ({b.certificates.length})</h3>
        {b.certificates.length > 0 ? (
          <ul className="text-ink-800">
            {b.certificates.map((c) => (
              <li key={c.id}>{c.type} — {c.number} ({c.issuer}), hiệu lực từ {dateVN(c.valid_from)}</li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-600">Chưa có chứng nhận gắn với lô này.</p>
        )}
        <div className="mt-3">
          <CreateForm
            path="/admin/certificates"
            title="Gắn chứng nhận cho lô này"
            preset={{ batch_id: b.id, farm_id: b.farm_id }}
            fields={
              <>
                <Field label="Loại" name="type" required placeholder="VD: VietGAP" />
                <Field label="Số" name="number" required />
                <Field label="Đơn vị cấp" name="issuer" required />
                <Field label="Hiệu lực từ" name="valid_from" type="date" required />
                <Field label="Hiệu lực đến" name="valid_until" type="date" />
                <Field label="Phạm vi" name="scope" />
                <Field label="Công khai trên trang truy xuất" name="is_public" defaultValue="true" options={[{ value: 'true', label: 'Có' }, { value: 'false', label: 'Không' }]} />
              </>
            }
          />
        </div>

        <h3 className="mt-4 mb-1 font-medium text-ink-900">Khiếu nại liên quan ({b.complaints.length})</h3>
        {b.complaints.length > 0 ? (
          <ul className="text-ink-800">
            {b.complaints.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/khieu-nai/${c.id}`} className="underline">{c.code}</Link> · {c.type} · {c.status} · {dateVN(c.created_at)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-600">Chưa có khiếu nại gắn với lô này.</p>
        )}
        <p className="mt-3 text-xs text-ink-500">
          Giá niêm yết {vnd(b.base_price_vnd)}/{b.unit} · sản lượng thu hoạch {qty(b.harvested_qty)} {b.unit} · lưu kho: {b.storage_condition || '—'}
        </p>
      </section>

      <Link href="/admin/lo-hang" className="btn-ghost">← Danh sách lô</Link>
    </div>
  )
}

function CorrectionFields({ storage, notes }: { storage: string; notes: string }) {
  return (
    <>
      <Field label="Trường điều chỉnh" name="field" options={[
        { value: 'storage_condition', label: 'Điều kiện bảo quản' },
        { value: 'notes', label: 'Ghi chú' },
        { value: 'harvest_date', label: 'Ngày thu hoạch' },
        { value: 'pack_date', label: 'Ngày đóng gói' },
        { value: 'expiry_date', label: 'Hạn dùng' },
      ]} />
      <Field label="Giá trị mới" name="value" required placeholder={storage || notes || 'Giá trị mới'} />
      <Field label="Lý do điều chỉnh" name="reason" required rows={2} />
    </>
  )
}

export const dynamic = 'force-dynamic'
