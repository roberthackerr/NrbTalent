import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import SignInForm from './SignInForm'

interface Props {
  params: {
    lang: Locale
  }
}

export default async function SignInPage({ params: { lang } }: Props) {
  const dict = await getDictionary(lang)
  
  return <SignInForm dict={dict} lang={lang} />
}