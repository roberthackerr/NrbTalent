import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import SignUpForm from './SignUpForm'

interface Props {
  params: {
    lang: Locale
  }
  searchParams: {
    role?: string
  }
}

export default async function SignUpPage({ 
  params: { lang },
  searchParams 
}: Props) {
  const dict = await getDictionary(lang)
  const initialRole = searchParams.role === 'client' ? 'client' : 'freelance'
  
  return <SignUpForm dict={dict} lang={lang} initialRole={initialRole} />
}