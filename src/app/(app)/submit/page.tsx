import { SubmitForm } from '@/components/mural/SubmitForm'

export const metadata = { title: 'Submit a mural — Murales PDC' }

export default function SubmitPage() {
  return (
    <main className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-ink">Submit a mural</h1>
      <p className="text-[13px] text-ink-2 mt-1 mb-5">
        Spotted street art in Playa del Carmen? Tell us where. We review every submission before it appears.
      </p>
      <SubmitForm />
    </main>
  )
}
