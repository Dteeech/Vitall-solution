import { getNavigationItems } from '@/lib/module-registry'
import { requireAuth } from '@/lib/auth'
import { AppShell } from '@/components/ui/app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const navigation = await getNavigationItems()

  return (
    <AppShell navigation={navigation} user={user}>
      {children}
    </AppShell>
  )
}