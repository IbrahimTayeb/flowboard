import type { TaskPriority } from './types'

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; tone: 'neutral' | 'info' | 'danger' }> = {
  low: { label: 'Low', color: '#5f6470', tone: 'neutral' },
  normal: { label: 'Normal', color: '#2e90fa', tone: 'info' },
  high: { label: 'High', color: '#f04438', tone: 'danger' },
}
