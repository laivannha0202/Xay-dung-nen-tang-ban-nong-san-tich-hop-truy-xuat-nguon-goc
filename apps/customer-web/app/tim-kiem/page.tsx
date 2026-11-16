import Link from 'next/link'
import { Icon } from '@agrimarket/ui'

export const metadata = { title: 'Tra cứu tem QR' }

const DEMO_TOKENS = ['demo-ca-chua-lo-0001', 'demo-ca-chua-lo-0002', 'demo-xoai-lo-0005', 'demo-ca-chua-het-han']

export default function TraceSearchPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5 py-4">
      <header className="text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon name="qr" className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">Tra cứu tem QR</h1>
        <p className="mt-1 text-sm text-ink-600">
          Nhập mã tem in trên bao bì, quét mã QR, hoặc dán đường dẫn tem để xem hồ sơ lô hàng.
        </p>
      </header>

      <form action="/t" className="card-pad space-y-3">
        <label className="label" htmlFor="q">Mã tem hoặc đường dẫn QR</label>
        <input
          id="q"
          name="q"
          className="input"
          required
          placeholder="demo-ca-chua-lo-0001"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className="btn-primary w-full">
          <Icon name="search" className="h-4 w-4" /> Tra cứu
        </button>
      </form>

      <section className="card-pad">
        <h2 className="text-sm font-semibold text-ink-900">Mã tem dùng thử</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {DEMO_TOKENS.map((t) => (
            <li key={t}>
              <Link href={`/t/${t}`} className="flex items-center gap-1 font-mono text-xs text-brand-700 hover:underline">
                <Icon name="chevronRight" className="h-3 w-3" /> {t}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-500">
          Tem QR gắn với một lô cụ thể. Nếu lô đã thu hồi hoặc hết hạn, hồ sơ sẽ hiển thị cảnh báo tương ứng.
        </p>
      </section>
    </div>
  )
}
