import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'
import { STATUS_LABEL } from '@/lib/types'

interface RawTaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  task_assignees: { member_id: string }[] | null
  task_labels: { label_id: string }[] | null
  comments: { count: number }[] | null
}

function mapRow(row: RawTaskRow): Task {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date,
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_ids: (row.task_assignees ?? []).map((a) => a.member_id),
    label_ids: (row.task_labels ?? []).map((l) => l.label_id),
    comment_count: row.comments?.[0]?.count ?? 0,
  }
}

const SELECT = '*, task_assignees(member_id), task_labels(label_id), comments(count)'

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select(SELECT)
      .order('position', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setTasks((data as unknown as RawTaskRow[]).map(mapRow))
    setError(null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchTasks()

    const scheduleRefetch = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current)
      refetchTimer.current = setTimeout(fetchTasks, 150)
    }

    const channel = supabase
      .channel(`tasks-realtime-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_labels' }, scheduleRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, scheduleRefetch)
      .subscribe()

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current)
      supabase.removeChannel(channel)
    }
  }, [userId, fetchTasks])

  const createTask = useCallback(
    async (input: {
      title: string
      description?: string
      priority?: TaskPriority
      due_date?: string | null
      status?: TaskStatus
      assignee_ids?: string[]
      label_ids?: string[]
    }) => {
      if (!userId) throw new Error('Not signed in')

      const columnTasks = tasks.filter((t) => t.status === (input.status ?? 'todo'))
      const maxPosition = columnTasks.reduce((max, t) => Math.max(max, t.position), 0)

      const { data: created, error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: input.title,
          description: input.description || null,
          priority: input.priority ?? 'normal',
          due_date: input.due_date || null,
          status: input.status ?? 'todo',
          position: maxPosition + 1,
        })
        .select()
        .single()

      if (insertError || !created) throw new Error(insertError?.message ?? 'Failed to create task')

      if (input.assignee_ids?.length) {
        await supabase
          .from('task_assignees')
          .insert(input.assignee_ids.map((member_id) => ({ task_id: created.id, member_id })))
      }
      if (input.label_ids?.length) {
        await supabase
          .from('task_labels')
          .insert(input.label_ids.map((label_id) => ({ task_id: created.id, label_id })))
      }

      await supabase.from('activity_log').insert({
        task_id: created.id,
        user_id: userId,
        type: 'created',
        detail: 'Created this task',
      })

      await fetchTasks()
      return created.id as string
    },
    [userId, tasks, fetchTasks],
  )

  const moveLocal = useCallback((taskId: string, status: TaskStatus, position: number) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, position } : t)))
  }, [])

  const updateStatus = useCallback(
    async (taskId: string, status: TaskStatus, newPosition: number) => {
      if (!userId) return
      const previous = tasks.find((t) => t.id === taskId)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, position: newPosition } : t)))

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status, position: newPosition })
        .eq('id', taskId)

      if (updateError) {
        setError(updateError.message)
        await fetchTasks()
        return
      }

      if (previous && previous.status !== status) {
        await supabase.from('activity_log').insert({
          task_id: taskId,
          user_id: userId,
          type: 'status_change',
          detail: `Moved from ${STATUS_LABEL[previous.status]} → ${STATUS_LABEL[status]}`,
        })
      }
    },
    [userId, tasks, fetchTasks],
  )

  const updateTask = useCallback(
    async (
      taskId: string,
      patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>>,
    ) => {
      if (!userId) return
      const { error: updateError } = await supabase.from('tasks').update(patch).eq('id', taskId)
      if (updateError) {
        setError(updateError.message)
        return
      }
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: userId,
        type: 'edited',
        detail: 'Updated task details',
      })
      await fetchTasks()
    },
    [userId, fetchTasks],
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId)
      if (deleteError) {
        setError(deleteError.message)
        return
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    },
    [],
  )

  const setAssignees = useCallback(
    async (taskId: string, memberIds: string[]) => {
      if (!userId) return
      await supabase.from('task_assignees').delete().eq('task_id', taskId)
      if (memberIds.length) {
        await supabase.from('task_assignees').insert(memberIds.map((member_id) => ({ task_id: taskId, member_id })))
      }
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: userId,
        type: 'assigned',
        detail: memberIds.length ? 'Updated assignees' : 'Cleared assignees',
      })
      await fetchTasks()
    },
    [userId, fetchTasks],
  )

  const setLabels = useCallback(
    async (taskId: string, labelIds: string[]) => {
      if (!userId) return
      await supabase.from('task_labels').delete().eq('task_id', taskId)
      if (labelIds.length) {
        await supabase.from('task_labels').insert(labelIds.map((label_id) => ({ task_id: taskId, label_id })))
      }
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: userId,
        type: 'label_added',
        detail: 'Updated labels',
      })
      await fetchTasks()
    },
    [userId, fetchTasks],
  )

  return { tasks, loading, error, createTask, updateStatus, updateTask, deleteTask, setAssignees, setLabels, moveLocal, refetch: fetchTasks }
}
