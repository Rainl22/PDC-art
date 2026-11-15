import { LegalPage } from '@/components/legal/LegalPage'
import { terms } from '@/lib/legal/content'
import { getLocale } from '@/lib/i18n/server'

export const metadata = { title: 'Terms · Murales PDC' }

export default function TermsPage() {
  return <LegalPage doc={terms(getLocale())} />
}
