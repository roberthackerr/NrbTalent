import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import SignUpForm from './SignUpForm'

interface Props {
  params: Promise<{ lang: Locale }> // Note: Promise
  searchParams: Promise<{ role?: string }> // Note: Promise aussi !
}

export default async function SignUpPage({ params, searchParams }: Props) {
  // ✅ Attendre les deux promesses
  const { lang } = await params
  const { role } = await searchParams
  
  const dict = await getDictionary(lang)
  const initialRole = role === 'client' ? 'client' : 'freelance'
  
  return <SignUpForm dict={dict} lang={lang} initialRole={initialRole} />
}