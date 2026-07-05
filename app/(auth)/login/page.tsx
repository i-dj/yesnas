'use client'

import { AuthCard } from '../components/auth-card'
import { AuthInput } from '../components/auth-input'
import { AuthShell } from '../components/auth-shell'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [remember, setRemember] = useState(false)

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Welcome back! Please enter your details."
        title="Welcome back"
        description="Welcome back! Please enter your details."
      >
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            router.push('/storage')
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#343844]">Email</span>
            <AuthInput type="text" name="account" autoComplete="username" placeholder="Enter your email" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-[#343844]">Password</span>
            <AuthInput type="password" name="password" autoComplete="current-password" placeholder="••••••••" />
          </label>

          <div className="flex items-center justify-between gap-4 text-base">
            <label className="flex cursor-pointer items-center gap-2 text-[#343844]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="peer sr-only"
              />
              <span className="peer-checked:border-theme peer-checked:bg-theme grid size-4 place-items-center rounded border border-[#cfd3dc] bg-white text-white transition">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span>Remember for 30 days</span>
            </label>
            <Link href="/forgot-password" className="text-theme hover:text-theme/80 font-semibold">
              Forgot password
            </Link>
          </div>

          <button
            type="submit"
            className="bg-theme hover:bg-theme/90 h-14 w-full rounded-lg text-lg font-semibold text-white transition active:scale-[0.99]"
          >
            Sign in
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
