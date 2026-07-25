import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

const fieldBase =
  'w-full rounded-lg border border-(--color-border-strong) bg-(--color-surface) px-3 py-2 text-sm text-(--color-ink) placeholder:text-(--color-ink-faint) outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/40'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-(--color-ink-muted)">{children}</label>
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldBase, className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldBase, 'resize-none', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(fieldBase, 'appearance-none bg-no-repeat', className)} {...props}>
      {children}
    </select>
  )
}
