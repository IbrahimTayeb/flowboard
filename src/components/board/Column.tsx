import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import clsx from 'clsx'
import type { Label, Task, TeamMember, TaskStatus } from '@/lib/types'
import { TaskCard } from './TaskCard'
import { IconButton } from '@/components/ui/Button'

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'bg-(--color-ink-faint)',
  in_progress: 'bg-info-500',
  in_review: 'bg-warning-500',
  done: 'bg-success-500',
}

interface ColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  members: TeamMember[]
  labels: Label[]
  onTaskClick: (id: string) => void
  onAddTask: () => void
  hasAnyTasksAtAll: boolean
  hasActiveFilters: boolean
}

export function Column({ status, title, tasks, members, labels, onTaskClick, onAddTask, hasAnyTasksAtAll, hasActiveFilters }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column', status } })

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col sm:w-[320px]">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={clsx('h-2 w-2 rounded-full', COLUMN_ACCENT[status])} />
          <h3 className="font-display text-sm font-semibold text-(--color-ink)">{title}</h3>
          <span className="rounded-full bg-(--color-surface-sunken) px-1.5 py-0.5 text-xs font-medium text-(--color-ink-muted)">
            {tasks.length}
          </span>
        </div>
        <IconButton onClick={onAddTask} aria-label={`Add task to ${title}`}>
          <Plus size={16} />
        </IconButton>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          'flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors',
          isOver ? 'border-brand-300 bg-brand-50/60 dark:bg-brand-900/10' : 'border-transparent',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              labels={labels}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && hasActiveFilters && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg py-8 text-center text-(--color-ink-faint)">
            <span className="text-xs font-medium">No matching tasks</span>
          </div>
        )}

        {tasks.length === 0 && !hasActiveFilters && (
          <button
            onClick={onAddTask}
            className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg py-8 text-center text-(--color-ink-faint) transition-colors hover:bg-(--color-surface-sunken) hover:text-(--color-ink-muted)"
          >
            <Plus size={18} />
            <span className="text-xs font-medium">
              {hasAnyTasksAtAll ? 'Drop a task here' : 'Add your first task'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
