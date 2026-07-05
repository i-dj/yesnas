import {
  Boxes,
  CircuitBoard,
  HardDrive,
  LayoutDashboard,
  ListTodo,
  ScrollText,
  Share2,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface SubMenuItem {
  nameKey: string
  href: string
  icon: LucideIcon
}

export interface MenuGroup {
  nameKey: string
  sub: SubMenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    nameKey: 'MAIN',
    sub: [{ nameKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    nameKey: 'FILE',
    sub: [
      { nameKey: 'storage', href: '/storage', icon: HardDrive },
      { nameKey: 'fileSharing', href: '/file-sharing', icon: Share2 },
    ],
  },
  {
    nameKey: 'SYSTEM',
    sub: [
      { nameKey: 'docker', href: '/docker', icon: Boxes },
      { nameKey: 'hardware', href: '/hardware', icon: CircuitBoard },
      { nameKey: 'jobs', href: '/jobs', icon: ListTodo },
      { nameKey: 'users', href: '/users', icon: Users },
      { nameKey: 'logs', href: '/logs', icon: ScrollText },
    ],
  },
]
