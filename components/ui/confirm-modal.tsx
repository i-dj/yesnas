'use client'

import { AlertDialog, Button, Flex, Inset } from '@radix-ui/themes'
import React, { useRef } from 'react'
import { useTranslations } from 'next-intl'

interface ConfirmModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: React.ReactNode
  children?: React.ReactNode
  onConfirm: () => void | Promise<void>
  confirmText?: string
  cancelText?: string
  loading?: boolean
  isDestructive?: boolean
  focusFirstInput?: boolean
}

export const ConfirmModal = ({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  confirmText,
  cancelText,
  loading = false,
  isDestructive = true,
  focusFirstInput = false,
}: ConfirmModalProps) => {
  const t = useTranslations('Common.actions')
  const contentRef = useRef<HTMLDivElement | null>(null)

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialog.Trigger>{trigger}</AlertDialog.Trigger> : null}

      <AlertDialog.Content
        ref={contentRef}
        maxWidth="450px"
        onOpenAutoFocus={(event) => {
          if (!focusFirstInput) return
          event.preventDefault()
          requestAnimationFrame(() => {
            const firstInput =
              contentRef.current?.querySelector<HTMLInputElement>(
                'input, textarea',
              )
            firstInput?.focus()
          })
        }}
      >
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {description}
        </AlertDialog.Description>

        {children && (
          <Inset side="x" my="5">
            {children}
          </Inset>
        )}

        <Flex gap="3" mt="5" justify="end">
          <AlertDialog.Cancel>
            <Button
              variant="soft"
              color="gray"
              type="button"
              className="outline-none focus:ring-0 focus:outline-none focus-visible:ring-0"
            >
              {cancelText ?? t('cancel')}
            </Button>
          </AlertDialog.Cancel>
          <Button
            type="button"
            variant="solid"
            color={isDestructive ? 'red' : 'indigo'}
            loading={loading}
            onClick={async (event) => {
              event.preventDefault()
              await onConfirm()
            }}
          >
            {confirmText ?? t('confirm')}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  )
}
