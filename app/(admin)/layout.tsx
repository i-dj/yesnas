import MainLayout from '@/components/layout/main-layout'
import { RealtimeNetworkProvider } from '@/components/layout/realtime-network-context'
import { getRequestAuthToken } from '@/lib/server/request-context'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = await getRequestAuthToken()
  if (!token) redirect('/login')

  return (
    <RealtimeNetworkProvider>
      <MainLayout>{children}</MainLayout>
    </RealtimeNetworkProvider>
  )
}
