import {
  Files,
  HardDrive,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
} from 'lucide-react'

export interface SubMenuItem {
  nameKey: string
  href: string
  icon: LucideIcon
}

export interface MenuGroup {
  nameKey: 'data'
  sub: SubMenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    nameKey: 'data',
    sub: [
      { nameKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
      { nameKey: 'storage', href: '/storage', icon: HardDrive },
      { nameKey: 'file', href: '/file', icon: Files },
      { nameKey: 'jobs', href: '/jobs', icon: ListTodo },
    ],
  },
]
