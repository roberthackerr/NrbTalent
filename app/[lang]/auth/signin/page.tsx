import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import SignInForm from './SignInForm'

interface Props {
  params: Promise<{ lang: Locale }> // Note: Promise
}

export default async function SignInPage({ params }: Props) {
  // ✅ Attendre params avant de l'utiliser
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return <SignInForm dict={dict} lang={lang} />
}