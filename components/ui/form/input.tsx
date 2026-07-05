'use client'

import { cn } from '@/lib/utils'
import { CircleAlert, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
  errorMessage?: ReactNode
  wrapperClassName?: string
  variant?: 'filled' | 'outline' | 'search'
  clearable?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error = false,
      errorMessage,
      wrapperClassName,
      variant = 'filled',
      clearable = true,
      type = 'text',
      value,
      defaultValue,
      disabled,
      readOnly,
      onChange,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const t = useTranslations('Common')
    const errorId = useId()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
    const invalid = error || Boolean(errorMessage)
    const currentValue = value ?? uncontrolledValue
    const supportsClear = ![
      'button',
      'checkbox',
      'color',
      'file',
      'hidden',
      'image',
      'radio',
      'range',
      'reset',
      'submit',
    ].includes(type)
    const showClear = clearable && supportsClear && !disabled && !readOnly && String(currentValue).length > 0

    const setInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setUncontrolledValue(event.target.value)
      onChange?.(event)
    }

    const clear = () => {
      const input = inputRef.current
      if (!input) return

      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      valueSetter?.call(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.focus()
    }

    const input = (
      <input
        ref={setInputRef}
        type={type}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        className={cn(
          'text-app-text placeholder:text-app-text-muted/70 h-8 w-full px-3 text-sm outline-none',
          'transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'filled' &&
            'bg-app-active/50 hover:bg-app-active/65 focus:bg-app-active/70 rounded-lg border border-transparent',
          variant === 'outline' &&
            'bg-app-bg border-app-border-strong/40 hover:border-app-border-strong focus:border-app-border-strong rounded-lg border',
          variant === 'search' &&
            'bg-app-active/50 hover:bg-app-active/65 focus:bg-app-active/70 appearance-none rounded-full border-none pr-4 pl-10 [&::-webkit-search-cancel-button]:hidden',
          showClear && 'pr-9',
          invalid && 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
          invalid && showClear ? 'pr-16' : invalid && 'pr-9',
          className,
        )}
        aria-invalid={invalid || undefined}
        aria-describedby={errorMessage ? errorId : ariaDescribedBy}
        {...props}
      />
    )

    return (
      <div className={cn('w-full min-w-0', wrapperClassName)}>
        <div className="relative">
          {input}
          {showClear ? (
            <button
              type="button"
              className={cn(
                'text-app-text-muted hover:text-app-text hover:bg-app-hover absolute top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full transition-colors',
                invalid ? 'right-8' : 'right-2',
              )}
              aria-label={t('actions.clearInput')}
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          {invalid ? (
            <CircleAlert
              className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-red-400"
              aria-hidden="true"
            />
          ) : null}
        </div>
        {errorMessage ? (
          <p id={errorId} className="mt-1.5 text-sm text-red-400">
            {errorMessage}
          </p>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'
