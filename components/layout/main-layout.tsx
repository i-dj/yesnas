'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FiUser } from 'react-icons/fi'
import { menuGroups } from './menu'
import Image from 'next/image'
import { ChevronDown, ChevronLeft, KeyRound, LogOut, MessageCircleMore, Upload, UserRound } from 'lucide-react'
import { ActionMenu, Button, SearchInput, SideDrawer, ThemeToggle } from '../ui'
import { GlobalUpload } from './global-upload'
import { useUploadStore } from '@/store/use-upload-store'
import { useAuth } from './auth-context'
import { PasswordDrawer, ProfileDrawer } from './account-drawers'

const MainLayout = ({ children }: { children: ReactNode }) => {
  const tLayout = useTranslations('Layout')
  const tCommon = useTranslations('Common')
  const pathname = usePathname()
  const usePageScroll =
    pathname === '/logs' ||
    pathname.startsWith('/logs/') ||
    pathname === '/storage' ||
    pathname.startsWith('/storage/') ||
    pathname === '/file' ||
    pathname.startsWith('/file/') ||
    pathname === '/docker' ||
    pathname.startsWith('/docker/')
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [uploadDrawer, setUploadDrawer] = useState<boolean>(false)
  const [profileDrawer, setProfileDrawer] = useState(false)
  const [passwordDrawer, setPasswordDrawer] = useState(false)
  const auth = useAuth()
  const uploadFiles = useUploadStore((state) => state.files)
  const clearCompletedUploads = useUploadStore((state) => state.clearCompleted)
  const uploadFileList = Object.values(uploadFiles)
  const hasUploadingFiles = uploadFileList.some((file) => file.status === 'uploading')
  const activePathname = pathname === '/file' || pathname.startsWith('/file/') ? '/storage' : pathname
  const pageTitle =
    menuGroups
      .flatMap((group) => group.sub)
      .find((item) => activePathname === item.href || activePathname.startsWith(item.href + '/'))?.nameKey ?? null

  // Shared active-route matcher
  const isActive = (href: string) => activePathname === href || activePathname.startsWith(href + '/')

  const userMenuItems = [
    {
      render: () => (
        <div className="flex items-center justify-between gap-4 px-1 py-1">
          <span className="text-app-text text-sm">{tCommon('theme.label')}</span>
          <ThemeToggle />
        </div>
      ),
    },
    {
      label: tCommon('profile.editProfile'),
      action: 'edit-profile',
      icon: UserRound,
    },
    {
      label: tCommon('actions.changePassword'),
      action: 'change-password',
      icon: KeyRound,
    },
    // {
    //   label: tCommon('actions.feedback'),
    //   action: 'feedback',
    //   icon: MessageCircleMore,
    //   separator: true,
    // },
    {
      label: tCommon('actions.logout'),
      action: 'logout',
      icon: LogOut,
      isDelete: true,
    },
  ] as const

  const handleUserAction = (action: string) => {
    switch (action) {
      case 'edit-profile':
        setProfileDrawer(true)
        break
      case 'change-password':
        setPasswordDrawer(true)
        break
      case 'feedback':
        window.open('mailto:feedback@yesnas.com?subject=YesNAS%20Feedback')
        break
      case 'logout':
        void auth.logout().finally(() => {
          router.replace('/login')
          router.refresh()
        })
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
                <div className="text-app-text-muted/50 px-4 text-[11px] uppercase">{group.nameKey}</div>
              )}
              <ul className="mt-1.5 mr-3 ml-3 flex flex-col gap-0.5">
                {group.sub.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const itemLabel = tLayout(`nav.${item.nameKey}`)

                  return (
                    <li key={item.nameKey}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group relative flex cursor-pointer items-center rounded-lg py-2 text-[15px] font-normal transition-all duration-200',
                          sidebarCollapsed ? 'justify-center px-2' : 'px-4',
                          active
                            ? 'text-app-text bg-blue-500/8 font-semibold hover:bg-blue-500/12'
                            : 'text-app-text/70 hover:bg-app-active hover:text-app-text',
                        )}
                        title={sidebarCollapsed ? itemLabel : undefined}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            'shrink-0 transition-colors',
                            sidebarCollapsed ? 'mr-0' : 'mr-5',
                            active ? 'text-blue-500' : 'text-app-text-muted group-hover:text-app-text',
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
            <SearchInput wrapperClassName="ml-4 max-w-md flex-1" placeholder={tCommon('searchPlaceholder')} />
            <div className="flex flex-col items-center">
              <Button
                icon={Upload}
                variant="ghost"
                iconClassName={hasUploadingFiles ? 'animate-pulse' : undefined}
                onClick={() => setUploadDrawer(true)}
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
                    <UserMenuAvatar user={auth.user} />
                    {auth.loading ? (
                      <span className="bg-app-active hidden h-4 w-20 animate-pulse rounded sm:block" />
                    ) : (
                      <span className="hidden max-w-36 truncate text-sm sm:block">
                        {auth.user?.displayName || auth.user?.username || '-'}
                      </span>
                    )}
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
        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col px-8',
            usePageScroll ? 'overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]' : 'overflow-hidden',
          )}
        >
          {children}
        </main>
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
          }
          setUploadDrawer(open)
        }}
        title="Upload"
      >
        <GlobalUpload isOpen={uploadDrawer} />
      </SideDrawer>

      <ProfileDrawer
        open={profileDrawer}
        user={auth.user}
        onOpenChange={setProfileDrawer}
        onSaved={(user) => auth.updateUser(user)}
      />
      <PasswordDrawer open={passwordDrawer} onOpenChange={setPasswordDrawer} />
    </div>
  )
}

function UserMenuAvatar({ user }: { user: { username: string; displayName: string; avatar: string } | null }) {
  const label = (user?.displayName || user?.username || '').trim().slice(0, 1).toUpperCase()

  if (user?.avatar) {
    return (
      <span className="bg-app-active flex size-6 shrink-0 overflow-hidden rounded-full">
        <img src={user.avatar} alt="" className="size-full object-cover" />
      </span>
    )
  }

  return (
    <span className="bg-app-active flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
      {label || <UserRound className="size-3.5" />}
    </span>
  )
}

export default MainLayout
