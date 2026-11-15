import { createClient } from './supabase/client'
import type { Mural, Comment, Submission, StatusVote } from '@/types/mural'

export async function getMurals(): Promise<Mural[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('murals')
    .select('*')
    .neq('confidence', 'removed')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getMural(slug: string): Promise<Mural | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('murals')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getComments(muralId: string): Promise<Comment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('mural_id', muralId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type SpamCode = 'rate_limited' | 'too_many_links' | 'too_long' | 'already_voted'

/** The database raises these codes (see migration 006). */
export function spamCode(e: unknown): SpamCode | null {
  const m = (e as { message?: string })?.message ?? String(e)
  for (const c of ['rate_limited', 'too_many_links', 'too_long', 'already_voted'] as const) if (m.includes(c)) return c
  return null
}

export async function addComment(muralId: string, body: string, authorName: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('comments').insert({ mural_id: muralId, body, author_name: authorName })
  if (error) throw error
}

/** "Still here / removed / unsure" — counted server-side, one per visitor per mural per day. */
export async function addVote(muralId: string, vote: StatusVote): Promise<void> {
  const supabase = createClient()
  const col = vote === 'still_here' ? 'still_here_count' : vote === 'removed' ? 'removed_count' : 'unsure_count'
  const { error } = await supabase.rpc('increment_vote', { mural_id: muralId, col })
  if (error) throw error
}

export async function submitMural(submission: Omit<Submission, 'id' | 'status' | 'created_at'>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('submissions').insert({
    ...submission,
    status: 'pending',
  })
  if (error) throw error
}
