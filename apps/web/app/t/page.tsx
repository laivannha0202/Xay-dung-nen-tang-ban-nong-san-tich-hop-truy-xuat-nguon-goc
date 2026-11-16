import { redirect } from 'next/navigation'

/** Accepts a pasted QR URL or bare token and forwards to the trace page. */
export default async function TraceLookup({ searchParams }: { searchParams: Promise<{ token?: string; q?: string }> }) {
  const sp = await searchParams
  const raw = (sp.token ?? sp.q ?? '').trim()
  if (!raw) redirect('/tim-kiem')
  const token = raw.includes('/t/') ? raw.split('/t/').pop()!.split(/[?#]/)[0] : raw
  redirect(`/t/${encodeURIComponent(token)}`)
}
