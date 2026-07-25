import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { TaskStatus } from './types'

export type DueUrgency = 'overdue' | 'soon' | 'normal' | null

export function getDueUrgency(dueDate: string | null, status: TaskStatus): DueUrgency {
  if (!dueDate || status === 'done') return null
  const days = differenceInCalendarDays(parseISO(dueDate), new Date())
  if (days < 0) return 'overdue'
  if (days <= 2) return 'soon'
  return 'normal'
}

export function formatDueDate(dueDate: string): string {
  const days = differenceInCalendarDays(parseISO(dueDate), new Date())
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return format(parseISO(dueDate), 'MMM d')
}
