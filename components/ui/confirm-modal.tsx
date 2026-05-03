'use client'

import { AlertDialog, Button, Flex, Inset } from '@radix-ui/themes'
import React from 'react'
import { useTranslations } from 'next-intl'

interface ConfirmModalProps {
  trigger: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  loading?: boolean
  isDestructive?: boolean
}

export const ConfirmModal = ({
  trigger,
  title,
  description,
  children,
  onConfirm,
  confirmText,
  cancelText,
  loading = false,
  isDestructive = true,
}: ConfirmModalProps) => {
  const t = useTranslations('Common.actions')

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>{trigger}</AlertDialog.Trigger>

      <AlertDialog.Content maxWidth="450px">
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
            <Button variant="soft" color="gray">
              {cancelText ?? t('cancel')}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color={isDestructive ? 'red' : 'indigo'}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmText ?? t('confirm')}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  )
}
