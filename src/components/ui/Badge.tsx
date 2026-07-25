import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-(--color-surface-sunken) text-(--color-ink-muted)',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-500',
  info: 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-500',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  )
}

export function DotBadge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </span>
  )
}
