'use client'

import { Button, Input, SideDrawer } from '@/components/ui'
import { Field } from '@/components/ui/form'
import type { Group } from '@/types'
import { UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { createEmptyGroupForm, type GroupFormState } from '../types'

interface Props {
  open: boolean
  editingGroup: Group | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (form: GroupFormState) => void | Promise<void>
}

export function GroupFormDrawer({ open, editingGroup, submitting, onOpenChange, onSubmit }: Props) {
  const t = useTranslations('Users')
  const [form, setForm] = useState<GroupFormState>(createEmptyGroupForm)
  const [errors, setErrors] = useState<Partial<Record<'name', string>>>({})

  useEffect(() => {
    if (!open) return
    setForm(
      editingGroup
        ? {
            name: editingGroup.name,
            description: editingGroup.description ?? '',
          }
        : createEmptyGroupForm(),
    )
    setErrors({})
  }, [open, editingGroup])

  const update = <K extends keyof GroupFormState>(key: K, value: GroupFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (key === 'name') setErrors((current) => ({ ...current, name: undefined }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: t('messages.requiredField') })
      return
    }
    void onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
    })
  }

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editingGroup ? t('groups.editTitle') : t('groups.createTitle')}
      className="p-0 text-sm"
    >
      <form className="flex min-h-full flex-col" noValidate onSubmit={handleSubmit}>
        <div className="flex-1 space-y-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="bg-app-hover grid size-10 place-items-center rounded-lg">
              <UsersRound className="text-app-text-muted size-5" />
            </span>
            <p className="text-app-text-muted text-sm">{t('groups.formHint')}</p>
          </div>

          <Field label={t('groups.name')}>
            <Input
              value={form.name}
              required
              errorMessage={errors.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </Field>

          <Field label={t('groups.description')}>
            <Input value={form.description} onChange={(e) => update('description', e.target.value)} />
          </Field>
        </div>

        <div className="bg-app-bg/95 border-app-border sticky bottom-0 flex shrink-0 justify-end gap-2 border-t px-4 py-3 backdrop-blur">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" loading={submitting}>
            {editingGroup ? t('actions.save') : t('groups.create')}
          </Button>
        </div>
      </form>
    </SideDrawer>
  )
}
