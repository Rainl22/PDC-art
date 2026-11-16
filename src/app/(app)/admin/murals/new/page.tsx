import { MuralEditor } from '@/components/admin/MuralEditor'

export default function NewMural() {
  return (
    <div className="space-y-3">
      <h1 className="font-display font-bold text-card">Add a mural</h1>
      <MuralEditor />
    </div>
  )
}
