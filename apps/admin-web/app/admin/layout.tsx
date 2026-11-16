import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'
import { AdminShell } from '@/components/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/dang-nhap')
  // The API enforces role on every /admin/* call; this only keeps the console unrendered.
  if (user.role !== 'ADMIN') redirect('/khong-co-quyen')

  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>
}
