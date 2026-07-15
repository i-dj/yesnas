'use client'

import { AuthCard } from '../components/auth-card'
import { AuthInput } from '../components/auth-input'
import { AuthShell } from '../components/auth-shell'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const t = useTranslations('Common.forgotPassword')
  const [submitted, setSubmitted] = useState(false)

  return (
    <AuthShell>
      <AuthCard
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(true)
          }}
        >
          <label className="flex flex-col gap-2.5">
            <span className="text-sm font-semibold text-white/75">{t('email')}</span>
            <AuthInput type="email" name="email" autoComplete="email" placeholder={t('emailPlaceholder')} />
          </label>

          {submitted ? (
            <div className="border-theme/20 bg-theme/5 rounded-md border px-3 py-2.5 text-xs leading-5 text-white/70">
              {t('submitted')}
            </div>
          ) : null}

          <button
            type="submit"
            className="h-12 w-full rounded-lg bg-theme text-lg font-semibold text-white transition hover:bg-theme/90 active:scale-[0.99]"
          >
            {t('send')}
          </button>

          <div className="text-center text-xs text-white/45">
            {t('rememberPassword')}{' '}
            <Link href="/login" className="font-medium text-theme underline-offset-2 hover:underline">
              {t('backToSignIn')}
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
