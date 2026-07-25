import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select, Textarea } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { DotBadge } from '@/components/ui/Badge'
import type { Label as LabelType, TaskPriority, TaskStatus, TeamMember } from '@/lib/types'
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/types'
import clsx from 'clsx'

interface CreateTaskModalProps {
  open: boolean
  defaultStatus: TaskStatus
  members: TeamMember[]
  labels: LabelType[]
  onClose: () => void
  onCreate: (input: {
    title: string
    description?: string
    priority: TaskPriority
    due_date?: string | null
    status: TaskStatus
    assignee_ids: string[]
    label_ids: string[]
  }) => Promise<void>
}

export function CreateTaskModal({ open, defaultStatus, members, labels, onClose, onCreate }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle('')
    setDescription('')
    setPriority('normal')
    setStatus(defaultStatus)
    setDueDate('')
    setAssigneeIds([])
    setLabelIds([])
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give the task a title.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || null,
        status,
        assignee_ids: assigneeIds,
        label_ids: labelIds,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong creating the task.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New task" width={520}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label>Title</Label>
          <Input autoFocus placeholder="e.g. Redesign the onboarding flow" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea rows={3} placeholder="Optional details…" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div>
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {members.length > 0 && (
          <div>
            <Label>Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const active = assigneeIds.includes(m.id)
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() =>
                      setAssigneeIds((prev) => (active ? prev.filter((id) => id !== m.id) : [...prev, m.id]))
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
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {labels.map((l) => {
                const active = labelIds.includes(l.id)
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setLabelIds((prev) => (active ? prev.filter((id) => id !== l.id) : [...prev, l.id]))}
                    className={clsx('rounded-full transition-opacity', active ? 'opacity-100' : 'opacity-45 hover:opacity-80')}
                  >
                    <DotBadge color={l.color}>{l.name}</DotBadge>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-danger-500">{error}</p>}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
