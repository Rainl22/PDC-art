import { requireAdmin } from '@/lib/auth/requireAdmin'
import { TeamManager, type Member } from '@/components/admin/TeamManager'

export default async function TeamPage() {
  const { supabase, user } = await requireAdmin()
  const [{ data: members }, { data: role }] = await Promise.all([supabase.rpc('list_team'), supabase.rpc('my_role')])
  return (
    <div className="space-y-4">
      <h1 className="font-bold text-16">Team</h1>
      <TeamManager members={(members ?? []) as Member[]} myEmail={user.email ?? ''} myRole={(role as string) ?? 'moderator'} />
    </div>
  )
}
