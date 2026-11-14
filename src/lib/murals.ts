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

export async function addComment(
  muralId: string,
  body: string,
  authorName: string | null,
  statusVote: StatusVote | null
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('comments').insert({
    mural_id: muralId,
    body,
    author_name: authorName,
    status_vote: statusVote,
  })
  if (error) throw error

  // bump the vote counter
  if (statusVote) {
    const col = statusVote === 'still_here' ? 'still_here_count'
              : statusVote === 'removed'    ? 'removed_count'
              : 'unsure_count'
    await supabase.rpc('increment_vote', { mural_id: muralId, col })
  }
}

export async function submitMural(submission: Omit<Submission, 'id' | 'status' | 'created_at'>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('submissions').insert({
    ...submission,
    status: 'pending',
  })
  if (error) throw error
}
