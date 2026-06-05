'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FiSearch, FiUser } from 'react-icons/fi'
import { menuGroups } from './menu'
import Image from 'next/image'
import { ChevronDown, ChevronLeft, ImageUp, KeyRound, LogOut, MessageCircleMore, Upload } from 'lucide-react'
import { ActionMenu, Button, SideDrawer, ThemeToggle, ToastStack } from '../ui'
import { GlobalUpload } from './global-upload'
import { useUploadStore } from '@/store/use-upload-store'
import { useToastStore } from '@/store/use-toast-store'

const MainLayout = ({ children }: { children: ReactNode }) => {
  const locale = useLocale()
  const tLayout = useTranslations('Layout')
  const tCommon = useTranslations('Common')
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [uploadDrawer, setUploadDrawer] = useState<boolean>(false)
  const uploadFiles = useUploadStore((state) => state.files)
  const clearCompletedUploads = useUploadStore((state) => state.clearCompleted)
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.remove)
  const uploadFileList = Object.values(uploadFiles)
  const lastRefreshedBatchRef = useRef<string>('')

  const hasUploadingFiles = uploadFileList.some((file) => file.status === 'uploading')
  const allUploadsCompleted = uploadFileList.length > 0 && uploadFileList.every((file) => file.status === 'complete')

  useEffect(() => {
    if (!allUploadsCompleted) return
    const batchKey = uploadFileList
      .map((file) => file.id)
      .sort()
      .join('|')
    if (!batchKey || lastRefreshedBatchRef.current === batchKey) return
    lastRefreshedBatchRef.current = batchKey
    router.refresh()
  }, [allUploadsCompleted, router, uploadFileList])
  const pageTitle =
    menuGroups
      .flatMap((group) => group.sub)
      .find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))?.nameKey ?? null

  // Shared active-route matcher
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const userMenuItems = [
    {
      render: () => (
        <div className="flex items-center justify-between gap-4 px-1 py-1">
          <span className="text-app-text text-[13px]">{tCommon('theme.label')}</span>
          <ThemeToggle />
        </div>
      ),
    },
    {
      label: tCommon('actions.changeAvatar'),
      action: 'change-avatar',
      icon: ImageUp,
    },
    {
      label: tCommon('actions.changePassword'),
      action: 'change-password',
      icon: KeyRound,
    },
    {
      label: tCommon('actions.feedback'),
      action: 'feedback',
      icon: MessageCircleMore,
      separator: true,
    },
    {
      label: tCommon('actions.logout'),
      action: 'logout',
      icon: LogOut,
      isDelete: true,
    },
  ] as const

  const handleUserAction = (action: string) => {
    switch (action) {
      case 'change-avatar':
        console.info('change-avatar')
        break
      case 'change-password':
        console.info('change-password')
        break
      case 'feedback':
        window.open('mailto:feedback@yesnas.com?subject=YesNAS%20Feedback')
        break
      case 'logout':
        console.info('logout')
        break
      default:
        break
    }
  }

  return (
    <div className="flex h-screen w-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'bg-app-aside-bg border-app-border hidden shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex',
          sidebarCollapsed ? 'w-18' : 'w-60',
        )}
      >
        <div
          className={cn(
            'border-app-border flex h-12.5 w-full items-center border-b p-4',
            sidebarCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              sidebarCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100',
            )}
          >
            <Image
              src="/logo-yesnas-light.png"
              alt="YesNAS Logo"
              width={116}
              height={27}
              priority
              className="h-auto w-auto max-w-none dark:hidden"
            />
            <Image
              src="/logo-yesnas-dark.png"
              alt="YesNAS Logo"
              width={116}
              height={25}
              priority
              className="hidden h-auto w-auto max-w-none dark:block"
            />
          </div>
          <button
            type="button"
            aria-label={sidebarCollapsed ? tLayout('aria.expandSidebar') : tLayout('aria.collapseSidebar')}
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="text-app-text-muted hover:bg-app-hover hover:text-app-text flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 ease-out"
          >
            <ChevronLeft
              size={18}
              className={cn('transition-transform duration-200', sidebarCollapsed && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1">
          {menuGroups.map((group) => (
            <div key={group.nameKey} className="mt-6">
              {!sidebarCollapsed && (
                <div className="text-app-text-muted/50 px-4 text-xs uppercase">{group.nameKey}</div>
              )}
              <ul className="mt-1.5 mr-3 ml-3 flex flex-col gap-1">
                {group.sub.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const itemLabel = tLayout(`nav.${item.nameKey}`)

                  return (
                    <li key={item.nameKey}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group relative flex cursor-pointer items-center rounded-lg py-2 text-xs font-medium transition-all',
                          sidebarCollapsed ? 'justify-center px-2' : 'px-4',
                          active
                            ? 'bg-app-active/55 text-app-text'
                            : 'text-app-text-muted hover:bg-app-hover/55 hover:text-app-text',
                        )}
                        title={sidebarCollapsed ? itemLabel : undefined}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            'shrink-0 transition-colors',
                            sidebarCollapsed ? 'mr-0' : 'mr-4',
                            active ? 'text-app-text/90' : 'text-app-text-muted group-hover:text-app-text',
                          )}
                        />
                        {!sidebarCollapsed && <span>{itemLabel}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="bg-app-bg flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="border-app-border flex h-12.5 shrink-0 items-center justify-between border-b px-4">
          <div className="flex flex-row items-center gap-5 text-base font-semibold">
            {pageTitle ? tLayout(`nav.${pageTitle}`) : tCommon('brand')}
          </div>
          <div className="flex flex-row gap-5">
            <div className="relative ml-4 flex max-w-md flex-1 items-center">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                type="text"
                placeholder={tCommon('searchPlaceholder')}
                className="bg-app-active/50 text-app-text w-full rounded-full border border-none px-10 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <div className="flex flex-col items-center">
              <Button
                icon={Upload}
                variant="ghost"
                iconClassName={hasUploadingFiles ? 'animate-pulse' : undefined}
                onClick={() => setUploadDrawer(true)}
              />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <LanguageMenu currentLocale={locale} onChange={() => router.refresh()} />
              <ActionMenu
                mode="left-click"
                align="end"
                onAction={handleUserAction}
                items={[...userMenuItems]}
                iconPosition="right"
                itemJustify="between"
                trigger={
                  <button
                    type="button"
                    className="text-app-text-muted hover:bg-app-hover hover:text-app-text flex cursor-pointer items-center gap-3 rounded-full px-2 py-1.5 transition-colors duration-200 ease-out outline-none"
                  >
                    <div className="bg-app-active flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                      DJ
                    </div>
                    <span className="hidden text-sm sm:block">{tCommon('profile.name')}</span>
                    <ChevronDown size={16} className="-ml-1" />
                  </button>
                }
              />
              {/*<ThemeToggle />*/}
              {/*<NotificationBell />*/}
            </div>
          </div>
        </header>

        {/* Scrollable content area **/}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-8">{children}</main>
      </div>

      <SideDrawer
        open={uploadDrawer}
        onOpenChange={(open) => {
          if (!open) {
            const files = Object.values(uploadFiles)
            const hasFiles = files.length > 0
            const allCompleted = hasFiles && files.every((file) => file.status === 'complete')
            if (allCompleted) {
              clearCompletedUploads()
            }
            router.refresh()
          }
          setUploadDrawer(open)
        }}
        title="Upload"
      >
        <GlobalUpload />
      </SideDrawer>

      <ToastStack toasts={toasts} onClose={removeToast} />
    </div>
  )
}

const localeOptions = [
  { value: 'zh', label: '中', triggerLabel: '中文', name: '中文' },
  { value: 'ja', label: '日', triggerLabel: '日本語', name: '日本語' },
  { value: 'ko', label: '韩', triggerLabel: '한국어', name: '한국어' },
  { value: 'en', label: 'EN', triggerLabel: 'EN', name: 'English' },
] as const

function LanguageMenu({ currentLocale, onChange }: { currentLocale: string; onChange: () => void }) {
  const currentOption = localeOptions.find((option) => option.value === currentLocale) ?? localeOptions[0]

  const handleChange = (locale: (typeof localeOptions)[number]['value']) => {
    document.cookie = `yesnas-locale=${locale}; path=/; max-age=31536000; samesite=lax`
    onChange()
  }

  return (
    <ActionMenu
      mode="left-click"
      align="end"
      onAction={(action) => handleChange(action as (typeof localeOptions)[number]['value'])}
      items={localeOptions.map((option) => ({
        label: (
          <span className="flex items-center gap-2">
            <span className="text-app-text bg-app-active flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
              {option.label}
            </span>
            <span>{option.name}</span>
          </span>
        ),
        action: option.value,
        checked: currentLocale === option.value,
      }))}
      trigger={
        <button
          type="button"
          aria-label={currentOption.name}
          className="bg-app-active/70 text-app-text hover:bg-app-hover flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors duration-200 ease-out outline-none"
        >
          <span>{currentOption.triggerLabel}</span>
          <ChevronDown size={16} />
        </button>
      }
    />
  )
}

export default MainLayout
