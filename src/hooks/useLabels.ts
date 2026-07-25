import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Label } from '@/lib/types'

const PALETTE = ['#f04438', '#f79009', '#12b76a', '#2e90fa', '#7a5af8', '#dd2590', '#0e9384', '#6e4bfa']

export function useLabels(userId: string | null) {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLabels = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('labels').select('*').order('created_at', { ascending: true })
    setLabels((data as Label[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchLabels()
    const channel = supabase
      .channel(`labels-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labels', filter: `user_id=eq.${userId}` }, fetchLabels)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchLabels])

  const addLabel = useCallback(
    async (name: string, color?: string) => {
      if (!userId) return
      await supabase.from('labels').insert({ user_id: userId, name, color: color ?? PALETTE[labels.length % PALETTE.length] })
      await fetchLabels()
    },
    [userId, labels.length, fetchLabels],
  )

  const removeLabel = useCallback(async (id: string) => {
    await supabase.from('labels').delete().eq('id', id)
    setLabels((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return { labels, loading, addLabel, removeLabel }
}
