import { LegalPage } from '@/components/legal/LegalPage'
import { privacy } from '@/lib/legal/content'
import { getLocale } from '@/lib/i18n/server'

export const metadata = { title: 'Privacy · Murales PDC' }

export default function PrivacyPage() {
  return <LegalPage doc={privacy(getLocale())} />
}
