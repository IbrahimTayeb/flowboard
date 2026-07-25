import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { ActivityEntry, Comment } from '@/lib/types'

export function useTaskDetail(taskId: string | null, userId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!taskId) return
    const [{ data: commentData }, { data: activityData }] = await Promise.all([
      supabase.from('comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true }),
      supabase.from('activity_log').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
    ])
    setComments((commentData as Comment[]) ?? [])
    setActivity((activityData as ActivityEntry[]) ?? [])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    fetchAll()

    const channel = supabase
      .channel(`task-detail-${taskId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log', filter: `task_id=eq.${taskId}` }, fetchAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, fetchAll])

  const addComment = useCallback(
    async (body: string, authorName: string) => {
      if (!taskId || !userId || !body.trim()) return
      await supabase.from('comments').insert({ task_id: taskId, user_id: userId, body: body.trim(), author_name: authorName })
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: userId,
        type: 'comment_added',
        detail: `${authorName} left a comment`,
      })
      await fetchAll()
    },
    [taskId, userId, fetchAll],
  )

  return { comments, activity, loading, addComment }
}
