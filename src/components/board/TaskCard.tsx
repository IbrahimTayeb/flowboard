import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, Clock, MessageSquare, SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import clsx from 'clsx'
import type { Label, Task, TeamMember } from '@/lib/types'
import { getDueUrgency, formatDueDate } from '@/lib/dueDate'
import { AvatarStack } from '@/components/ui/Avatar'
import { DotBadge } from '@/components/ui/Badge'

interface TaskCardProps {
  task: Task
  members: TeamMember[]
  labels: Label[]
  onClick: () => void
  overlay?: boolean
}

const PRIORITY_ICON = {
  low: SignalLow,
  normal: SignalMedium,
  high: SignalHigh,
}

export function TaskCard({ task, members, labels, onClick, overlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const assignees = task.assignee_ids
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is TeamMember => Boolean(m))

  const taskLabels = task.label_ids
    .map((id) => labels.find((l) => l.id === id))
    .filter((l): l is Label => Boolean(l))

  const urgency = getDueUrgency(task.due_date, task.status)
  const PriorityIcon = PRIORITY_ICON[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        'group cursor-pointer select-none rounded-xl border border-(--color-border) bg-(--color-surface) p-3.5 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover)',
        isDragging && 'opacity-40',
        overlay && 'rotate-2 shadow-(--shadow-pop)',
      )}
    >
      {taskLabels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {taskLabels.map((label) => (
            <DotBadge key={label.id} color={label.color}>
              {label.name}
            </DotBadge>
          ))}
        </div>
      )}

      <p className="text-[13.5px] font-medium leading-snug text-(--color-ink)">{task.title}</p>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-(--color-ink-muted)">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityIcon
            size={14}
            className={clsx(
              task.priority === 'high' && 'text-danger-500',
              task.priority === 'normal' && 'text-info-500',
              task.priority === 'low' && 'text-(--color-ink-faint)',
            )}
          />

          {task.due_date && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                urgency === 'overdue' && 'bg-danger-50 text-danger-600 dark:bg-danger-500/15',
                urgency === 'soon' && 'bg-warning-50 text-warning-600 dark:bg-warning-500/15',
                urgency === 'normal' && 'text-(--color-ink-faint)',
              )}
            >
              {urgency === 'overdue' ? <AlertCircle size={11} /> : <Clock size={11} />}
              {formatDueDate(task.due_date)}
            </span>
          )}

          {Boolean(task.comment_count) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-(--color-ink-faint)">
              <MessageSquare size={11} />
              {task.comment_count}
            </span>
          )}
        </div>

        <AvatarStack people={assignees} size={20} />
      </div>
    </div>
  )
}
