import { useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/types'
import type { Label, Task, TaskStatus, TeamMember } from '@/lib/types'
import { Column } from './Column'
import { TaskCard } from './TaskCard'

interface BoardProps {
  tasks: Task[]
  members: TeamMember[]
  labels: Label[]
  onTaskClick: (id: string) => void
  onAddTask: (status: TaskStatus) => void
  onMoveLocal: (taskId: string, status: TaskStatus, position: number) => void
  onMoveCommit: (taskId: string, status: TaskStatus, position: number, previousStatus?: TaskStatus) => void
  hasActiveFilters: boolean
}

function computeInsertPosition(columnTasks: Task[], activeId: string, overIndex: number): number {
  const withoutActive = columnTasks.filter((t) => t.id !== activeId)
  const before = withoutActive[overIndex - 1]?.position
  const after = withoutActive[overIndex]?.position

  if (before === undefined && after === undefined) return 1000
  if (before === undefined) return after! - 1000
  if (after === undefined) return before + 1000
  return (before + after) / 2
}

export function Board({ tasks, members, labels, onTaskClick, onAddTask, onMoveLocal, onMoveCommit, hasActiveFilters }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const dragOriginStatus = useRef<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const byStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] }
    for (const task of tasks) grouped[task.status].push(task)
    for (const status of STATUS_ORDER) grouped[status].sort((a, b) => a.position - b.position)
    return grouped
  }, [tasks])

  function findColumnOf(id: string): TaskStatus | null {
    for (const status of STATUS_ORDER) {
      if (byStatus[status].some((t) => t.id === id)) return status
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
    dragOriginStatus.current = task?.status ?? null
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeStatus = findColumnOf(active.id as string)
    const overData = over.data.current as { type?: string; status?: TaskStatus } | undefined
    const overStatus = overData?.type === 'column' ? overData.status! : findColumnOf(over.id as string)

    if (!activeStatus || !overStatus || activeStatus === overStatus) return

    const targetTasks = byStatus[overStatus]
    const overIndex = overData?.type === 'column' ? targetTasks.length : targetTasks.findIndex((t) => t.id === over.id)
    const newPosition = computeInsertPosition(targetTasks, active.id as string, overIndex === -1 ? targetTasks.length : overIndex)

    onMoveLocal(active.id as string, overStatus, newPosition)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const finalStatus = findColumnOf(active.id as string)
    if (!finalStatus) return

    const columnTasks = byStatus[finalStatus]
    const activeIndex = columnTasks.findIndex((t) => t.id === active.id)

    const overData = over.data.current as { type?: string; status?: TaskStatus } | undefined
    let overIndex: number
    if (overData?.type === 'column') {
      overIndex = columnTasks.length - 1
    } else {
      overIndex = columnTasks.findIndex((t) => t.id === over.id)
    }
    if (overIndex === -1) overIndex = columnTasks.length - 1

    const reordered = arrayMove(columnTasks, activeIndex, overIndex)
    const newIndex = reordered.findIndex((t) => t.id === active.id)
    const newPosition = computeInsertPosition(reordered, active.id as string, newIndex)

    onMoveCommit(active.id as string, finalStatus, newPosition, dragOriginStatus.current ?? undefined)
    dragOriginStatus.current = null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex h-full gap-5 overflow-x-auto px-6 pb-6 pt-1">
        {STATUS_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            title={STATUS_LABEL[status]}
            tasks={byStatus[status]}
            members={members}
            labels={labels}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(status)}
            hasAnyTasksAtAll={tasks.length > 0}
            hasActiveFilters={hasActiveFilters}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} members={members} labels={labels} onClick={() => {}} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
