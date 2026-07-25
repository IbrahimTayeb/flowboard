import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import type { Label as LabelType, Task, TaskPriority, TaskStatus, TeamMember } from '@/lib/types'
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/types'
import { useTaskDetail } from '@/hooks/useTaskDetail'
import { Avatar } from '@/components/ui/Avatar'
import { DotBadge } from '@/components/ui/Badge'
import { IconButton, Button } from '@/components/ui/Button'
import { Input, Label as FieldLabel, Select, Textarea } from '@/components/ui/Field'

interface TaskDetailPanelProps {
  task: Task | null
  members: TeamMember[]
  labels: LabelType[]
  userId: string | null
  onClose: () => void
  onUpdate: (taskId: string, patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>>) => Promise<void>
  onStatusChange: (taskId: string, status: TaskStatus, position: number) => Promise<void>
  onAssigneesChange: (taskId: string, ids: string[]) => Promise<void>
  onLabelsChange: (taskId: string, ids: string[]) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

const ACTIVITY_TONE: Record<string, string> = {
  created: 'bg-brand-500',
  status_change: 'bg-info-500',
  edited: 'bg-(--color-ink-faint)',
  assigned: 'bg-success-500',
  unassigned: 'bg-(--color-ink-faint)',
  label_added: 'bg-warning-500',
  label_removed: 'bg-(--color-ink-faint)',
  comment_added: 'bg-brand-400',
}

export function TaskDetailPanel({
  task,
  members,
  labels,
  userId,
  onClose,
  onUpdate,
  onStatusChange,
  onAssigneesChange,
  onLabelsChange,
  onDelete,
}: TaskDetailPanelProps) {
  const { comments, activity, loading, addComment } = useTaskDetail(task?.id ?? null, userId)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
  }, [task?.id])

  if (!task) return null

  async function handlePostComment() {
    if (!commentBody.trim()) return
    setPosting(true)
    await addComment(commentBody, 'You')
    setCommentBody('')
    setPosting(false)
  }


  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 animate-fade-in" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-(--color-border) bg-(--color-surface) shadow-(--shadow-pop)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-(--color-border) px-5 py-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--color-ink-faint)">Task details</span>
          <div className="flex items-center gap-1">
            <IconButton onClick={() => onDelete(task.id).then(onClose)} aria-label="Delete task">
              <Trash2 size={15} />
            </IconButton>
            <IconButton onClick={onClose} aria-label="Close">
              <X size={16} />
            </IconButton>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && onUpdate(task.id, { title: title.trim() })}
            rows={1}
            className="resize-none border-none bg-transparent font-display text-lg font-semibold text-(--color-ink) outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select value={task.status} onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus, task.position)}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <Select value={task.priority} onChange={(e) => onUpdate(task.id, { priority: e.target.value as TaskPriority })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Due date</FieldLabel>
              <Input type="date" value={task.due_date ?? ''} onChange={(e) => onUpdate(task.id, { due_date: e.target.value || null })} />
            </div>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              rows={4}
              placeholder="Add more detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (task.description ?? '') && onUpdate(task.id, { description: description || undefined })}
            />
          </div>

          {members.length > 0 && (
            <div>
              <FieldLabel>Assignees</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const active = task.assignee_ids.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        onAssigneesChange(task.id, active ? task.assignee_ids.filter((id) => id !== m.id) : [...task.assignee_ids, m.id])
                      }
                      className={clsx(
                        'flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                          : 'border-(--color-border-strong) text-(--color-ink-muted) hover:bg-(--color-surface-sunken)',
                      )}
                    >
                      <Avatar name={m.name} color={m.color} size={16} ring={false} />
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {labels.length > 0 && (
            <div>
              <FieldLabel>Labels</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => {
                  const active = task.label_ids.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      onClick={() => onLabelsChange(task.id, active ? task.label_ids.filter((id) => id !== l.id) : [...task.label_ids, l.id])}
                      className={clsx('rounded-full transition-opacity', active ? 'opacity-100' : 'opacity-45 hover:opacity-80')}
                    >
                      <DotBadge color={l.color}>{l.name}</DotBadge>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="border-t border-(--color-border) pt-4">
            <h3 className="mb-3 text-sm font-semibold text-(--color-ink)">Comments</h3>
            <div className="flex flex-col gap-3">
              {loading && <p className="text-xs text-(--color-ink-faint)">Loading…</p>}
              {!loading && comments.length === 0 && <p className="text-xs text-(--color-ink-faint)">No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-(--color-surface-sunken) p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-(--color-ink)">{c.author_name}</span>
                    <span className="text-[11px] text-(--color-ink-faint)">{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-(--color-ink-muted)">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Write a comment…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              />
              <Button variant="primary" onClick={handlePostComment} disabled={posting || !commentBody.trim()}>
                Post
              </Button>
            </div>
          </div>

          <div className="border-t border-(--color-border) pt-4">
            <h3 className="mb-3 text-sm font-semibold text-(--color-ink)">Activity</h3>
            <div className="flex flex-col gap-3">
              {activity.map((a) => (
                <div key={a.id} className="flex gap-2.5 text-sm">
                  <div className="mt-1.5 flex flex-col items-center">
                    <span className={clsx('h-2 w-2 rounded-full', ACTIVITY_TONE[a.type] ?? 'bg-(--color-ink-faint)')} />
                  </div>
                  <div>
                    <p className="text-(--color-ink)">{a.detail}</p>
                    <p className="text-[11px] text-(--color-ink-faint)">
                      {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })} · {format(parseISO(a.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
