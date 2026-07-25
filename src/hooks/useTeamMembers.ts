import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { TeamMember } from '@/lib/types'

const PALETTE = ['#6e4bfa', '#2e90fa', '#12b76a', '#f79009', '#f04438', '#0e9384', '#dd2590', '#7a5af8']

export function useTeamMembers(userId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase.from('team_members').select('*').order('created_at', { ascending: true })
    setMembers((data as TeamMember[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchMembers()
    const channel = supabase
      .channel(`team-members-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `user_id=eq.${userId}` }, fetchMembers)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchMembers])

  const addMember = useCallback(
    async (name: string) => {
      if (!userId) return
      const color = PALETTE[members.length % PALETTE.length]
      await supabase.from('team_members').insert({ user_id: userId, name, color })
      await fetchMembers()
    },
    [userId, members.length, fetchMembers],
  )

  const removeMember = useCallback(async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return { members, loading, addMember, removeMember }
}
