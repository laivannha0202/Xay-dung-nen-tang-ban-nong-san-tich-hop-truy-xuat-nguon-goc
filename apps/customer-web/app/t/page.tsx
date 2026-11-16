import { redirect } from 'next/navigation'

/** Accepts a pasted QR URL, bare token, or a batch code pasted from a product page. */
export default async function TraceLookup({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; q?: string; batch?: string }>
}) {
  const sp = await searchParams
  const raw = (sp.token ?? sp.q ?? sp.batch ?? '').trim()
  if (!raw) redirect('/tim-kiem')
  const token = raw.includes('/t/') ? raw.split('/t/').pop()!.split(/[?#]/)[0] : raw
  redirect(`/t/${encodeURIComponent(token)}`)
}
