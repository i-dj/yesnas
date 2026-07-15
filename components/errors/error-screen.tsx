'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    const theme = localStorage.getItem('theme')
    const useDark = theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', useDark)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950 dark:bg-[#16171a] dark:text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-[#202226] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">页面加载失败</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/55">
          系统遇到了一点问题，请刷新后重试。如果问题持续出现，请记录下面的错误信息。
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/8 dark:bg-black/15">
          <p className="break-words text-sm leading-6 text-slate-700 dark:text-white/75">
            {error.message || '未知错误'}
          </p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-slate-400 dark:text-white/35">错误编号：{error.digest}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#058def] px-5 text-sm font-semibold text-white transition hover:bg-[#007bd8] active:scale-[0.98]"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          刷新重试
        </button>
      </section>
    </main>
  )
}
