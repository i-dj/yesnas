'use client'

import { AuthCard } from '../components/auth-card'
import { AuthInput } from '../components/auth-input'
import { AuthShell } from '../components/auth-shell'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/layout/auth-context'
import { Checkbox } from '@/components/ui'
import { toast } from '@/store/use-toast-store'

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const t = useTranslations('Auth.login')
  const [remember, setRemember] = useState(false)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = account.trim()
    if (!username || !password) {
      toast.error(t('validation.required'), 8000)
      return
    }

    try {
      setSubmitting(true)
      await auth.login({ username, password }, remember)
      const nextPath = new URLSearchParams(window.location.search).get('next')
      router.replace(nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      toast.error(
        isInvalidCredentials(message) ? t('validation.invalidCredentials') : message || t('validation.failed'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <AuthCard eyebrow={t('description')} title={t('title')} description={t('description')}>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-white/75">{t('username')}</span>
            <AuthInput
              type="text"
              name="account"
              autoComplete="username"
              placeholder={t('usernamePlaceholder')}
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-white/75">{t('password')}</span>
            <AuthInput
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="flex items-center justify-between gap-4 text-sm">
            <Checkbox
              label={t('remember')}
              checked={remember}
              onChange={setRemember}
              className="px-0 text-white/65"
              markClassName="border-white/25 bg-transparent text-white"
            />
            <Link href="/forgot-password" className="text-theme hover:text-theme/80 font-semibold">
              {t('forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-theme hover:bg-theme/90 h-12 w-full rounded-lg text-lg font-semibold text-white transition active:scale-[0.99]"
          >
            {submitting ? t('signingIn') : t('signIn')}
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}

function isInvalidCredentials(message: string) {
  return /invalid\s+(?:username|user name)\s+or\s+password/i.test(message)
}
