'use client'

import { ErrorScreen } from '@/components/errors/error-screen'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} />
}
