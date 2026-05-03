'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FiSearch, FiUser } from 'react-icons/fi'
import { menuGroups } from './menu'
import Image from 'next/image'
import {
  ChevronDown,
  ChevronLeft,
  ImageUp,
  KeyRound,
  LogOut,
  MessageCircleMore,
} from 'lucide-react'
import { ActionMenu, ThemeToggle } from '../ui'

const MainLayout = ({ children }: { children: ReactNode }) => {
  const tLayout = useTranslations('Layout')
  const tCommon = useTranslations('Common')
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pageTitle =
    menuGroups
      .flatMap((group) => group.sub)
      .find(
        (item) =>
          pathname === item.href || pathname.startsWith(item.href + '/'),
      )?.nameKey ?? null

  // Shared active-route matcher
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const userMenuItems = [
    {
      render: () => (
        <div className="flex items-center justify-between gap-4 px-1 py-1">
          <span className="text-app-text text-[13px]">
            {tCommon('theme.label')}
          </span>
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
          'bg-app-bg border-app-border hidden shrink-0 flex-col border-r transition-[width] duration-200 ease-out md:flex',
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
              src="/logo.png"
              alt="YesNAS Logo"
              width={90}
              height={60}
              priority
              className="max-w-none"
            />
          </div>
          <button
            type="button"
            aria-label={
              sidebarCollapsed
                ? tLayout('aria.expandSidebar')
                : tLayout('aria.collapseSidebar')
            }
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="text-app-text-muted hover:bg-app-hover hover:text-app-text flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 ease-out"
          >
            <ChevronLeft
              size={18}
              className={cn(
                'transition-transform duration-200',
                sidebarCollapsed && 'rotate-180',
              )}
            />
          </button>
        </div>

        <nav className="flex-1">
          {menuGroups.map((group) => (
            <div key={group.nameKey} className="mt-6">
              {/*<div className="px-4 text-sm text-neutral-500 uppercase">
                {group.name}
              </div>*/}
              <ul className="mt-3 mr-3 ml-3 flex flex-col gap-1">
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
                            ? 'bg-app-active text-app-text'
                            : 'text-app-text-muted hover:bg-app-hover hover:text-app-text',
                        )}
                        title={sidebarCollapsed ? itemLabel : undefined}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            'shrink-0 transition-colors',
                            sidebarCollapsed ? 'mr-0' : 'mr-4',
                            active
                              ? 'text-app-text'
                              : 'text-app-text-muted group-hover:text-app-text',
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
            <div className="ml-auto flex items-center gap-4">
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
                    <span className="hidden text-sm sm:block">
                      {tCommon('profile.name')}
                    </span>
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
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
