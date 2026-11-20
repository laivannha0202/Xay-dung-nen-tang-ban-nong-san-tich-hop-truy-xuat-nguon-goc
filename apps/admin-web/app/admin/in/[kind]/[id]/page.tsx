import Link from 'next/link'
import { notFound } from 'next/navigation'
import { authCookie, requireAdmin } from '@/lib/session'
import { serverFetch } from '@/lib/api'
import { vnd, qty, dateVN, dateTimeVN, STATUS_LABEL, PAYMENT_METHOD, discountSplit } from '@/lib/format'
import { PrintButton } from '@/components/quick-tools'
import { PrintDoc, DocSection, DocFields, DocTable } from '@/components/print-doc'
import { Alert } from '@agrimarket/ui'

interface Allocation {
  batch_code: string
  reserved_qty: string
  shipped_qty: string
  expiry_date: string
  safety_status: string
}
interface Order {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  subtotal_vnd: number
  discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  placed_at: string
  note: string
  customer_email: string
  customer_name: string | null
  customer_phone: string | null
  address_snapshot: Record<string, string>
  promotion_snapshot: { code?: string; name?: string; discount_vnd?: number } | null
  is_demo: boolean
  lines: Array<{
    id: string
    product_name: string
    unit: string
    quantity: string
    unit_price_vnd: number
    total_vnd: number
    allocations: Allocation[] | null
  }>
  payment: { paid_vnd: number; is_paid: boolean; method: string | null; reference: string | null; paid_at: string | null } | null
  shipment: { carrier: string | null; tracking_code: string | null; courier_name: string | null; status: string } | null
}
interface Refund {
  id: string
  order_id: string
  order_code: string
  amount_vnd: number
  reason: string
  status: string
  note: string
  created_at: string
  completed_at: string | null
  customer_email: string
  doc_code: string
}
interface Movement {
  id: string
  type: string
  quantity: string
  on_hand_after: string
  reason: string
  occurred_at: string
  batch_code: string
  warehouse_name: string
  actor_email: string | null
  order_code: string | null
  doc_code: string
  product_name: string
  unit: string
}
interface Recall {
  id: string
  batch_code: string
  product_name: string
  reason: string
  severity: string
  status: string
  started_at: string
  closed_at: string | null
  summary: string
  contacts: Array<{ order_code: string; customer_name: string | null; customer_phone: string | null; affected_qty: string; contact_status: string }>
}
interface Revenue {
  data: Array<{ bucket: string; gross: number; refunded: number; net: number }>
  summary: { gross: number; refunded: number; net: number }
  range: { from: string; to: string }
}
interface Inv {
  warehouse_name: string
  batch_code: string
  product_name: string
  unit: string
  expiry_date: string
  quality_status: string
  safety_status: string
  on_hand_qty: string
  reserved_qty: string
  available_qty: string
}

const KINDS = ['ban-hang', 'giao-hang', 'dong-goi', 'thanh-toan', 'hoan-tien', 'nhap-kho', 'xuat-kho', 'dieu-chinh', 'thu-hoi', 'doanh-thu', 'ton-kho'] as const
type Kind = (typeof KINDS)[number]

const TITLES: Record<Kind, string> = {
  'ban-hang': 'PHIẾU BÁN HÀNG',
  'giao-hang': 'PHIẾU GIAO HÀNG',
  'dong-goi': 'PHIẾU ĐÓNG GÓI',
  'thanh-toan': 'PHIẾU XÁC NHẬN THANH TOÁN',
  'hoan-tien': 'PHIẾU HOÀN TIỀN',
  'nhap-kho': 'PHIẾU NHẬP KHO',
  'xuat-kho': 'PHIẾU XUẤT KHO',
  'dieu-chinh': 'PHIẾU ĐIỀU CHỈNH TỒN',
  'thu-hoi': 'BIÊN BẢN THU HỒI LÔ HÀNG',
  'doanh-thu': 'BÁO CÁO DOANH THU',
  'ton-kho': 'BÁO CÁO TỒN KHO',
}

const PAYMENT_STATUS: Record<string, string> = { UNPAID: 'Chưa thanh toán', PAID: 'Đã thanh toán' }
const MOVEMENT_LABEL: Record<string, string> = { IN: 'Nhập kho', OUT: 'Xuất kho', ADJUST: 'Điều chỉnh' }
const SEVERITY: Record<string, string> = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }
const CONTACT_STATUS: Record<string, string> = { PENDING: 'Chờ liên hệ', CONTACTED: 'Đã liên hệ', RESOLVED: 'Đã xử lý', REFUNDED: 'Đã hoàn tiền' }
const REFUND_STATUS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt, chờ chuyển tiền',
  COMPLETED: 'Đã chuyển tiền',
  REJECTED: 'Từ chối',
}

/** Address snapshot is frozen at checkout, so the document shows what the customer actually entered. */
function addressLine(a: Record<string, string>): string {
  return [a.street_detail, a.ward, a.district, a.province].filter(Boolean).join(', ')
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; id: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { kind, id } = await params
  const sp = await searchParams
  if (!KINDS.includes(kind as Kind)) notFound()
  const user = await requireAdmin()
  const cookie = await authCookie()
  const k = kind as Kind
  const back = (href: string, label: string) => (
    <Link href={href} className="btn-ghost btn-sm no-print">
      ← {label}
    </Link>
  )
  const frame = (props: { code: string; issuedAt?: string; subtitle?: string; demo?: boolean; signoffs?: Array<{ label: string; note?: string }>; children: React.ReactNode; bars: React.ReactNode }) => (
    <div className="bg-white p-4 sm:p-6">
      <div className="mx-auto mb-3 flex max-w-[186mm] flex-wrap items-center gap-2 no-print">
        {props.bars}
        <PrintButton label="In / Lưu PDF" />
        <span className="ml-auto text-xs text-ink-500">Người lập: {user.email}</span>
      </div>
      <PrintDoc
        title={TITLES[k]}
        code={props.code}
        issuedAt={props.issuedAt}
        subtitle={props.subtitle}
        demo={props.demo}
        signoffs={props.signoffs}
      >
        {props.children}
      </PrintDoc>
    </div>
  )

  // ---------- order-based documents ----------
  if (['ban-hang', 'giao-hang', 'dong-goi', 'thanh-toan'].includes(k)) {
    const o = await serverFetch<Order>(`/admin/orders/${id}`, cookie)
    if (!o) notFound()
    const addr = o.address_snapshot
    const split = discountSplit(o)
    const amountRows = (
      <>
        <div className="row">
          <span>Tiền hàng (giá gốc)</span>
          <span>{vnd(o.subtotal_vnd)}</span>
        </div>
        {split.lot_vnd > 0 && (
          <div className="row">
            <span>Giảm giá theo lô</span>
            <span>−{vnd(split.lot_vnd)}</span>
          </div>
        )}
        {split.voucher_vnd > 0 && (
          <div className="row">
            <span>Voucher {o.promotion_snapshot?.code ?? ''}</span>
            <span>−{vnd(split.voucher_vnd)}</span>
          </div>
        )}
        <div className="row">
          <span>Phí giao hàng</span>
          <span>{vnd(o.ship_fee_vnd)}</span>
        </div>
        <div className="row total">
          <span>Tổng cộng</span>
          <span>{vnd(o.total_vnd)}</span>
        </div>
      </>
    )
    const lines = (withPrice: boolean) =>
      o.lines.map((l, i) => [
        `${i + 1}. ${l.product_name}`,
        `${qty(l.quantity)} ${l.unit}`,
        ...(withPrice ? [vnd(l.unit_price_vnd), vnd(l.total_vnd)] : []),
      ])
    const codes = { code: o.code, issuedAt: o.placed_at, demo: o.is_demo, bars: back(`/admin/don-hang/${o.id}`, 'Chi tiết đơn') }
    const customerFields: Array<[string, string]> = [
      ['Khách hàng', o.customer_name ?? o.customer_email],
      ['Điện thoại', o.customer_phone ?? ''],
      ['Email', o.customer_email],
      ['Địa chỉ giao', addressLine(addr)],
      ['Người nhận', addr.recipient_name ?? ''],
      ['Trạng thái đơn', STATUS_LABEL[o.status] ?? o.status],
    ]

    if (k === 'ban-hang') {
      return frame({
        ...codes,
        subtitle: `Đơn đặt lúc ${dateTimeVN(o.placed_at)}`,
        signoffs: [{ label: 'Người mua' }, { label: 'Người lập phiếu' }],
        bars: codes.bars,
        children: (
          <>
            <DocSection title="Khách hàng">
              <DocFields rows={customerFields} />
            </DocSection>
            <DocSection title="Hàng hoá" note="Giá tại thời điểm đặt hàng">
              <DocTable head={['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']} rows={lines(true)} />
            </DocSection>
            <div className="doc-amounts">{amountRows}</div>
            <DocSection title="Thanh toán">
              <DocFields
                rows={[
                  ['Hình thức', PAYMENT_METHOD[o.payment_method] ?? o.payment_method],
                  ['Trạng thái', PAYMENT_STATUS[o.payment_status] ?? o.payment_status],
                  ['Lô xuất', (o.lines.flatMap((l) => (l.allocations ?? []).map((a) => a.batch_code))).join(', ')],
                  ['Ghi chú', o.note],
                ]}
              />
            </DocSection>
            <p className="mt-3 text-[11px] text-ink-500">
              Đây là phiếu bán hàng nội bộ, không phải hoá đơn điện tử hay hoá đơn GTGT.
            </p>
          </>
        ),
      })
    }

    if (k === 'giao-hang') {
      // COD is only collected when the order is still deliverable and money is actually owed:
      // a paid order (or a cancelled/failed one) must never print a second collection.
      const collectable = o.payment_method === 'COD' && !['CANCELLED', 'DELIVERY_FAILED'].includes(o.status)
      const cod = collectable ? Math.max(0, o.total_vnd - (o.payment?.paid_vnd ?? 0)) : 0
      return frame({
        ...codes,
        subtitle: o.shipment ? `Vận chuyển: ${o.shipment.carrier || '—'} · ${o.shipment.tracking_code || 'chưa có mã'}` : 'Chưa tạo vận đơn',
        signoffs: [{ label: 'Người giao hàng' }, { label: 'Người nhận hàng', note: 'Ký và ghi rõ họ tên khi nhận đủ hàng' }],
        bars: codes.bars,
        children: (
          <>
            <DocSection title="Người nhận">
              <DocFields
                rows={[
                  ['Họ tên', addr.recipient_name ?? o.customer_name ?? ''],
                  ['Điện thoại', addr.phone ?? o.customer_phone ?? ''],
                  ['Địa chỉ', addressLine(addr)],
                  ['Người giao', o.shipment?.courier_name ?? ''],
                  ['Ghi chú giao', o.note],
                ]}
              />
            </DocSection>
            <DocSection title="Hàng giao" note="Đối chiếu số lượng trước khi ký nhận">
              <DocTable head={['Sản phẩm', 'Số lượng']} rows={lines(false)} />
            </DocSection>
            <DocSection title="Thu tiền khi nhận (COD)">
              <DocFields
                rows={[
                  ['Số tiền phải thu', cod > 0 ? vnd(cod) : 'Đã thanh toán trước — không thu tiền'],
                  ['Tổng giá trị đơn', vnd(o.total_vnd)],
                  ['Trạng thái thanh toán', PAYMENT_STATUS[o.payment_status] ?? o.payment_status],
                ]}
              />
            </DocSection>
          </>
        ),
      })
    }

    if (k === 'dong-goi') {
      return frame({
        ...codes,
        subtitle: `${o.lines.length} dòng hàng · ${o.lines.reduce((s, l) => s + Number(l.quantity), 0).toString()} đơn vị`,
        signoffs: [{ label: 'Người đóng gói' }, { label: 'Người kiểm hàng' }],
        bars: codes.bars,
        children: (
          <>
            <DocSection title="Danh sách đóng gói" note="Đã đủ = đã cho vào kiện">
              <DocTable
                head={['Sản phẩm', 'SL cần', 'Lô lấy hàng', 'HSD lô', 'Đã đủ']}
                rows={o.lines.map((l, i) => [
                  `${i + 1}. ${l.product_name}`,
                  `${qty(l.quantity)} ${l.unit}`,
                  (l.allocations ?? []).map((a) => a.batch_code).join(', ') || 'Chưa phân bổ',
                  (l.allocations ?? []).map((a) => dateVN(a.expiry_date)).join(', '),
                  '☐',
                ])}
              />
            </DocSection>
            <DocSection title="Kiểm tra trước khi niêm phong">
              <ul className="mt-1 list-disc pl-5 text-[11.5px]">
                <li>Đúng sản phẩm, đúng số lượng, đúng lô đã in trên phiếu.</li>
                <li>Lô còn hạn dùng và không bị tạm giữ/thu hồi.</li>
                <li>Kèm tem QR truy xuất nguồn gốc trên kiện hàng.</li>
              </ul>
            </DocSection>
          </>
        ),
      })
    }

    const paid = o.payment?.is_paid === true
    return frame({
      ...codes,
      issuedAt: (paid && o.payment?.paid_at) || o.placed_at,
      subtitle: paid && o.payment?.reference ? `Mã tham chiếu: ${o.payment.reference}` : undefined,
      demo: o.is_demo,
      bars: codes.bars,
      signoffs: [{ label: 'Người thu tiền' }, { label: 'Kế toán xác nhận' }],
      children: (
        <>
          <DocSection title="Khách hàng">
            <DocFields rows={customerFields} />
          </DocSection>
          <DocSection title="Nội dung thanh toán">
            <DocFields
              rows={[
                ['Số tiền đơn hàng', vnd(o.total_vnd)],
                ['Hình thức', PAYMENT_METHOD[o.payment_method] ?? o.payment_method],
                ['Thời điểm ghi nhận', paid && o.payment?.paid_at ? dateTimeVN(o.payment.paid_at) : 'Chưa ghi nhận'],
                ['Trạng thái', paid ? 'Đã thanh toán đủ' : (PAYMENT_STATUS[o.payment_status] ?? o.payment_status)],
              ]}
            />
          </DocSection>
          <div className="doc-amounts">{amountRows}</div>
          <p className="mt-3 text-[11px] text-ink-500">
            Phiếu ghi nhận công nợ nội bộ. Không thay thế chứng từ của ngân hàng hoặc hoá đơn GTGT.
          </p>
        </>
      ),
    })
  }

  // ---------- refund ----------
  if (k === 'hoan-tien') {
    const refunds = await serverFetch<Refund[]>('/admin/refunds', cookie)
    const r = (refunds ?? []).find((x) => x.id === id)
    if (!r) notFound()
    return frame({
      code: r.doc_code,
      issuedAt: r.created_at,
      subtitle: `Đơn ${r.order_code}`,
      bars: back(`/admin/don-hang/${r.order_id}`, 'Chi tiết đơn'),
      signoffs: [{ label: 'Người đề nghị hoàn' }, { label: 'Người duyệt chi' }, { label: 'Khách nhận tiền' }],
      children: (
        <>
          <DocSection title="Thông tin hoàn tiền">
            <DocFields
              rows={[
                ['Khách hàng', r.customer_email],
                ['Đơn hàng', r.order_code],
                ['Số tiền hoàn', vnd(r.amount_vnd)],
                ['Lý do', r.reason],
                ['Trạng thái', REFUND_STATUS[r.status] ?? r.status],
                ['Thời điểm chuyển tiền', r.completed_at ? dateTimeVN(r.completed_at) : 'Chưa chuyển'],
                ['Ghi chú xử lý', r.note],
              ]}
            />
          </DocSection>
        </>
      ),
    })
  }

  // ---------- stock movements ----------
  if (k === 'nhap-kho' || k === 'xuat-kho' || k === 'dieu-chinh') {
    const m = await serverFetch<Movement>(`/admin/stock/movements/${id}`, cookie)
    if (!m) notFound()
    const expect = { 'nhap-kho': 'IN', 'xuat-kho': 'OUT', 'dieu-chinh': 'ADJUST' }[k]
    if (m.type !== expect) notFound()
    const delta = Number(m.quantity)
    return frame({
      code: m.doc_code,
      issuedAt: m.occurred_at,
      subtitle: `${MOVEMENT_LABEL[m.type]} · ${m.batch_code}`,
      bars: back('/admin/kho', 'Kho & tồn'),
      signoffs:
        m.type === 'IN'
          ? [{ label: 'Người giao hàng' }, { label: 'Thủ kho' }]
          : m.type === 'OUT'
            ? [{ label: 'Thủ kho' }, { label: 'Người nhận hàng' }]
            : [{ label: 'Người kiểm kê' }, { label: 'Quản lý kho' }],
      children: (
        <>
          <DocSection title="Thông tin lô hàng">
            <DocFields
              rows={[
                ['Sản phẩm', m.product_name],
                ['Mã lô', m.batch_code],
                ['Kho', m.warehouse_name],
                ['Thời điểm ghi nhận', dateTimeVN(m.occurred_at)],
                ['Người thực hiện', m.actor_email ?? '—'],
                ['Đơn liên quan', m.order_code ?? ''],
              ]}
            />
          </DocSection>
          <DocSection title={m.type === 'ADJUST' ? 'Chênh lệch điều chỉnh' : 'Số lượng'}>
            <DocFields
              rows={[
                ['Số lượng', m.type === 'ADJUST' ? `${delta > 0 ? '+' : ''}${qty(m.quantity)} ${m.unit}` : `${qty(m.quantity)} ${m.unit}`],
                ['Tồn sau khi ghi nhận', `${qty(m.on_hand_after)} ${m.unit}`],
                ['Lý do', m.reason],
              ]}
            />
          </DocSection>
          {m.type === 'ADJUST' && (
            <p className="mt-3 text-[11px] text-ink-500">
              Điều chỉnh chỉ dùng cho hao hụt bảo quản hoặc chênh lệch kiểm kê; không dùng để che giấu xuất bán.
            </p>
          )}
        </>
      ),
    })
  }

  // ---------- recall record ----------
  if (k === 'thu-hoi') {
    const r = await serverFetch<Recall>(`/admin/recalls/${id}`, cookie)
    if (!r) notFound()
    const affected = r.contacts.reduce((s, c) => s + Number(c.affected_qty), 0)
    return frame({
      code: `TH-${r.batch_code}`,
      issuedAt: r.started_at,
      subtitle: `${r.product_name} · ${STATUS_LABEL[r.status] ?? r.status}`,
      bars: back(`/admin/thu-hoi/${r.id}`, 'Chi tiết thu hồi'),
      signoffs: [{ label: 'Người lập biên bản' }, { label: 'Quản lý cửa hàng' }],
      children: (
        <>
          <DocSection title="Nội dung thu hồi">
            <DocFields
              rows={[
                ['Lô hàng', r.batch_code],
                ['Sản phẩm', r.product_name],
                ['Lý do thu hồi', r.reason],
                ['Mức độ', SEVERITY[r.severity] ?? r.severity],
                ['Bắt đầu', dateTimeVN(r.started_at)],
                ['Kết thúc', r.closed_at ? dateTimeVN(r.closed_at) : 'Đang xử lý'],
                ['Tổng lượng ảnh hưởng', qty(affected)],
                ['Kết luận', r.summary],
              ]}
            />
          </DocSection>
          <DocSection title={`Khách đã nhận lô (${r.contacts.length})`}>
            {r.contacts.length === 0 ? (
              <p className="text-[11.5px] text-ink-500">Chưa có khách nào nhận lô này.</p>
            ) : (
              <DocTable
                head={['Đơn', 'Khách hàng', 'Số lượng', 'Xử lý']}
                rows={r.contacts.map((c) => [
                  c.order_code,
                  c.customer_name ?? '—',
                  qty(c.affected_qty),
                  CONTACT_STATUS[c.contact_status] ?? c.contact_status,
                ])}
              />
            )}
          </DocSection>
        </>
      ),
    })
  }

  // ---------- reports ----------
  if (k === 'doanh-thu') {
    const qs = new URLSearchParams()
    if (sp.from) qs.set('from', sp.from)
    if (sp.to) qs.set('to', sp.to)
    const rev = await serverFetch<Revenue>(`/admin/reports/revenue?${qs}`, cookie)
    if (!rev) notFound()
    return frame({
      code: `BC-DT-${rev.range.from}—${rev.range.to}`,
      subtitle: `Kỳ ${dateVN(rev.range.from)} → ${dateVN(rev.range.to)}`,
      bars: back('/admin/bao-cao', 'Báo cáo'),
      signoffs: [{ label: 'Người lập báo cáo' }, { label: 'Quản lý cửa hàng' }],
      children: (
        <>
          <DocSection title="Tổng hợp" note="Đã trừ hoàn tiền hoàn tất">
            <DocFields
              rows={[
                ['Doanh thu ghi nhận', vnd(rev.summary.gross)],
                ['Đã hoàn tiền', vnd(rev.summary.refunded)],
                ['Doanh thu thuần', vnd(rev.summary.net)],
              ]}
            />
          </DocSection>
          <DocSection title="Theo kỳ">
            {rev.data.length === 0 ? (
              <p className="text-[11.5px] text-ink-500">Không phát sinh doanh thu trong kỳ.</p>
            ) : (
              <DocTable
                head={['Kỳ', 'Doanh thu', 'Hoàn tiền', 'Thuần']}
                rows={rev.data.map((d) => [dateVN(d.bucket), vnd(d.gross), vnd(d.refunded), vnd(d.net)])}
              />
            )}
          </DocSection>
        </>
      ),
    })
  }

  const inv = await serverFetch<Inv[]>('/admin/inventory', cookie)
  const rows = inv ?? []
  const totalAvailable = rows.reduce((s, i) => s + Number(i.available_qty), 0)
  return frame({
    code: `BC-TK-${new Date().toISOString().slice(0, 10)}`,
    subtitle: `${rows.length} dòng tồn kho đang bán`,
    bars: back('/admin/bao-cao', 'Báo cáo'),
    signoffs: [{ label: 'Thủ kho' }, { label: 'Quản lý cửa hàng' }],
    children: (
      <>
        <DocSection title="Tổng hợp">
          <DocFields
            rows={[
              ['Số dòng tồn', String(rows.length)],
              ['Tổng lượng khả dụng', qty(totalAvailable)],
            ]}
          />
        </DocSection>
        <DocSection title="Chi tiết theo lô">
          <DocTable
            head={['Lô / sản phẩm', 'Kho', 'HSD', 'Tồn', 'Giữ chỗ', 'Khả dụng']}
            rows={rows.map((i) => [
              `${i.batch_code} — ${i.product_name}`,
              i.warehouse_name,
              dateVN(i.expiry_date),
              qty(i.on_hand_qty),
              qty(i.reserved_qty),
              qty(i.available_qty),
            ])}
          />
        </DocSection>
        <p className="mt-3 text-[11px] text-ink-500">
          Tồn khả dụng = tồn thực tế − giữ chỗ. Lô hết hạn, tạm giữ hoặc thu hồi không bán được dù còn hàng.
        </p>
      </>
    ),
  })
}

export const dynamic = 'force-dynamic'
