import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

export async function generateStaticParams() {
  return [{ lang: 'fr' }, { lang: 'en' }, { lang: 'mg' }]
}

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale }> // Note: Promise ici !
}

export default async function LangLayout({ children, params }: Props) {
  // ✅ Attendre params avant de l'utiliser
  const { lang } = await params
  
  return (
    <>
      {children}
    </>
  )
}