'use client'

import { AuthCard } from '../components/auth-card'
import { AuthInput } from '../components/auth-input'
import { AuthShell } from '../components/auth-shell'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Password recovery"
        title="Reset your password"
        description="Enter your account email and we will send reset instructions if the account exists."
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmitted(true)
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#343844]">Email</span>
            <AuthInput type="email" name="email" autoComplete="email" placeholder="Enter your email" />
          </label>

          {submitted ? (
            <div className="rounded-md border border-theme/20 bg-theme/5 px-3 py-2.5 text-xs leading-5 text-[#343844]">
              If this email exists, reset instructions have been sent.
            </div>
          ) : null}

          <button
            type="submit"
            className="h-14 w-full rounded-lg bg-theme text-lg font-semibold text-white transition hover:bg-theme/90 active:scale-[0.99]"
          >
            Send reset link
          </button>

          <div className="text-center text-xs text-[#8b8f9b]">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-theme underline-offset-2 hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
