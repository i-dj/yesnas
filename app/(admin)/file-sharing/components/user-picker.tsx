import { Checkbox } from '@/components/ui'
import type { User } from '@/types'

interface UserPickerProps {
  user: User
  checkedIds: User['id'][]
  onChange: (userId: User['id'], checked: boolean) => void
}

export const UserPicker = ({ user, checkedIds, onChange }: UserPickerProps) => {
  const isChecked = checkedIds.includes(user.id)

  return (
    <Checkbox
      variant="card"
      label={user.displayName}
      description={user.username}
      checked={isChecked}
      onChange={(checked) => onChange(user.id, checked)}
      leading={
        <span className="border-app-border bg-app-hover inline-flex size-10 overflow-hidden rounded-full border">
          <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
        </span>
      }
    />
  )
}
