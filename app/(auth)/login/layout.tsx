import { getRequestAuthToken } from '@/lib/server/request-context'
import { redirect } from 'next/navigation'

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const token = await getRequestAuthToken()
  if (token) redirect('/dashboard')

  return children
}
