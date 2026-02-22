export const locales = ['fr', 'en', 'mg'] as const
export const defaultLocale = 'fr'

export type Locale = typeof locales[number]

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  mg: 'Malagasy'
}

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  mg: '🇲🇬'
}