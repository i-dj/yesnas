import { IconType } from 'react-icons'
import { BsListTask } from 'react-icons/bs'
import { LuDatabase } from 'react-icons/lu'
import { TfiFiles } from 'react-icons/tfi'

export interface SubMenuItem {
  nameKey: 'dashboard' | 'file' | 'task'
  href: string
  icon: IconType
}

export interface MenuGroup {
  nameKey: 'data'
  sub: SubMenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    nameKey: 'data',
    sub: [
      { nameKey: 'dashboard', href: '/dashboard', icon: LuDatabase },
      { nameKey: 'file', href: '/file', icon: TfiFiles },
      { nameKey: 'task', href: '/task', icon: BsListTask },
    ],
  },
]
