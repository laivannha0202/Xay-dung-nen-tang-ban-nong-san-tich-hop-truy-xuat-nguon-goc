export default function TraceSearchPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Tra cứu tem QR</h1>
        <p className="mt-1 text-sm text-leaf-700">
          Nhập mã tem in trên bao bì hoặc dán đường dẫn QR để xem hồ sơ lô hàng.
        </p>
      </header>
      <form action="/t" className="card space-y-3 p-5">
        <label className="label" htmlFor="q">Mã tem hoặc đường dẫn QR</label>
        <input id="q" name="q" className="input" required placeholder="demo-ca-chua-lo-0001" autoComplete="off" />
        <button className="btn-primary w-full">Tra cứu</button>
      </form>
      <div className="card space-y-2 p-5 text-sm text-leaf-800">
        <p className="font-medium">Mã tem dùng thử</p>
        <ul className="space-y-1">
          {['demo-ca-chua-lo-0001', 'demo-ca-chua-lo-0002', 'demo-xoai-lo-0005', 'demo-ca-chua-het-han'].map((t) => (
            <li key={t}>
              <a className="underline" href={`/t/${t}`}>{t}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
