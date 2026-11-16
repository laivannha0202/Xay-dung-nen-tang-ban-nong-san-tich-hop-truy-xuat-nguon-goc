import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { config } from '../config.js'


/** Shape returned by the public trace endpoint — deliberately free of contact PII. */
export interface TracePayload {
  batch: {
    id: string
    code: string
    harvest_date: string
    pack_date: string | null
    expiry_date: string
    harvested_qty: number
    quality_status: string
    safety_status: string
    publication_status: string
    storage_condition: string
    is_expired: boolean
  }
  product: {
    name: string; sku: string; slug: string; unit: string
    description: string; storage: string; origin_note: string; image: string | null
  }
  farm: {
    name: string; province: string; district: string; commune: string
    latitude: number | null; longitude: number | null
  }
  supplier: { name: string; business_type: string }
  season: { code: string; variety: string; sown_at: string; expected_harvest_at: string; area_ha: number }
  timeline: {
    activity: string
    activity_at: string
    performer: string
    materials: string
    pesticide_name: string | null
    isolation_days: number | null
    note: string
  }[]
  lab_tests: {
    laboratory: string
    sampled_at: string
    resulted_at: string
    overall_result: string
    metrics: { metric: string; measured_value: string; unit: string; reference_limit: string; result: string }[]
  }[]
  certificates: { type: string; number: string; issuer: string; valid_from: string; valid_until: string | null }[]
  alert: { level: string; title: string; message: string } | null
  recall: { reason: string | null; severity: string | null; started_at: string | null } | null
}

const ACTIVITY_LABEL: Record<string, string> = {
  TILLING: 'Làm đất',
  SOWING: 'Gieo trồng',
  FERTILIZING: 'Bón phân',
  PESTICIDE: 'Phun thuốc BVTV',
  IRRIGATION: 'Tưới nước',
  PRUNING: 'Tỉa cành',
  HARVEST: 'Thu hoạch',
  OTHER: 'Khác',
}

const FONT = 'assets/Roboto-Regular.ttf'
const dmy = (v: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—')

/**
 * Per-batch trace report as PDF. Text-based (not a screenshot) so it stays searchable
 * and contains exactly the public trace data — no supplier/farm contact details.
 */
export async function renderTracePdf(trace: TracePayload): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 42, info: { Title: `Truy xuất nguồn gốc ${trace.batch.code}` } })
  doc.registerFont('noto', FONT)
  doc.font('noto')

  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const { promise: done, resolve: finish } = Promise.withResolvers<Buffer>()
  doc.on('end', () => finish(Buffer.concat(chunks)))

  const line = (label: string, value: string) =>
    doc.fontSize(9).fillColor('#555').text(`${label}: `, { continued: true }).fillColor('#000').text(value || '—')

  doc.fontSize(16).fillColor('#1f5c3f').text('PHIẾU TRUY XUẤT NGUỒN GỐC NÔNG SẢN')
  doc.moveDown(0.2)
  doc.fontSize(9).fillColor('#666').text('AgriMarket — thông tin công khai theo mã tem QR')
  doc.moveDown(0.8)

  if (trace.alert) {
    doc.fillColor('#b00020').fontSize(11).text(`${trace.alert.title}`)
    doc.fontSize(9).fillColor('#b00020').text(trace.alert.message)
    doc.fillColor('#000').moveDown(0.6)
  }

  doc.fontSize(11).fillColor('#000').text(`Lô ${trace.batch.code} — ${trace.product.name}`)
  doc.moveDown(0.4)
  line('Mã sản phẩm (SKU)', trace.product.sku)
  line('Đơn vị tính', trace.product.unit)
  line('Ngày thu hoạch', dmy(trace.batch.harvest_date))
  line('Ngày đóng gói', dmy(trace.batch.pack_date))
  line('Hạn sử dụng', dmy(trace.batch.expiry_date))
  line('Bảo quản', trace.batch.storage_condition)
  line('Kết quả kiểm nghiệm', trace.batch.quality_status === 'PASS' ? 'Đạt' : trace.batch.quality_status)
  if (trace.product.origin_note) line('Xuất xứ', trace.product.origin_note)

  doc.moveDown(0.8).fontSize(11).text('Nông trại & nhà cung cấp')
  doc.moveDown(0.3)
  line('Nông trại', trace.farm.name)
  line('Địa chỉ', [trace.farm.commune, trace.farm.district, trace.farm.province].filter(Boolean).join(', '))
  line('Nhà cung cấp', `${trace.supplier.name} (${trace.supplier.business_type})`)
  line('Mùa vụ', `${trace.season.code}${trace.season.variety ? ` — giống ${trace.season.variety}` : ''}`)
  line('Gieo trồng', dmy(trace.season.sown_at))
  line('Dự kiến thu hoạch', dmy(trace.season.expected_harvest_at))

  doc.moveDown(0.8).fontSize(11).text('Nhật ký canh tác')
  doc.moveDown(0.3)
  for (const log of trace.timeline) {
    const isolation = log.isolation_days !== null ? ` (cách ly ${log.isolation_days} ngày)` : ''
    doc.fontSize(9).fillColor('#000').text(`• ${dmy(log.activity_at)} — ${ACTIVITY_LABEL[log.activity] ?? log.activity}`, { continued: true })
    doc.fillColor('#444').text(`${log.performer ? ` · ${log.performer}` : ''}${log.pesticide_name ? ` · ${log.pesticide_name}` : ''}${isolation}`, { continued: false })
    if (log.note) doc.fillColor('#666').text(`   ${log.note}`)
  }

  doc.moveDown(0.8).fontSize(11).fillColor('#000').text('Kiểm nghiệm')
  doc.moveDown(0.3)
  if (trace.lab_tests.length === 0) {
    doc.fontSize(9).text('Chưa có phiếu kiểm nghiệm được xác nhận.')
  }
  for (const test of trace.lab_tests) {
    doc.fontSize(9).text(`${test.laboratory} — lấy mẫu ${dmy(test.sampled_at)}, kết quả ${dmy(test.resulted_at)}: ${test.overall_result === 'PASS' ? 'ĐẠT' : 'KHÔNG ĐẠT'}`)
    for (const m of test.metrics) {
      doc.fontSize(8).fillColor('#444').text(`   - ${m.metric}: ${m.measured_value} ${m.unit} (giới hạn ${m.reference_limit}) — ${m.result === 'PASS' ? 'đạt' : 'không đạt'}`)
    }
    doc.fillColor('#000')
  }

  if (trace.certificates.length > 0) {
    doc.moveDown(0.8).fontSize(11).text('Chứng nhận')
    doc.moveDown(0.3)
    for (const c of trace.certificates) {
      doc.fontSize(9).text(`• ${c.type} — số ${c.number}, ${c.issuer}, hiệu lực ${dmy(c.valid_from)} → ${dmy(c.valid_until)}`)
    }
  }

  const qr = await QRCode.toBuffer(`${config.publicWebUrl}/t/${trace.batch.code}`, { width: 240, margin: 1 })
  const y = doc.y + 16
  doc.image(qr, doc.page.width - 42 - 90, y, { width: 90 })
  doc.fontSize(8).fillColor('#666').text(
    `Xuất ngày ${dmy(new Date().toISOString())}. Tra cứu trực tuyến tại ${config.publicWebUrl}/t/<mã tem>.`,
    42, y + 20, { width: doc.page.width - 42 - 130 },
  )

  doc.end()
  return done
}
