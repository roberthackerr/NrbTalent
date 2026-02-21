export interface Currency {
  code: string
  name: string
  symbol: string
  locale: string
  country: string
  flag: string
  decimalDigits: number
  rounding: number
  enabled: boolean
  popular: boolean
  isDefault?: boolean
}


export const CURRENCIES: Currency[] = [
  // 🇲🇬 DEVISE MALGACHE - PRIORITAIRE !
  {
    code: 'MGA',
    name: 'Ariary Malgache',
    symbol: 'Ar',
    locale: 'mg-MG',
    country: 'Madagascar',
    flag: '🇲🇬',
    decimalDigits: 0,
    rounding: 1,
    enabled: true,
    popular: true,
    isDefault: true // Nouvelle propriété pour devise par défaut
  },
  
  // Devises principales (Afrique)
  {
    code: 'XOF',
    name: 'Franc CFA Ouest Africain',
    symbol: 'CFA',
    locale: 'fr-XOF',
    country: 'Afrique de l\'Ouest',
    flag: '🌍',
    decimalDigits: 0,
    rounding: 1,
    enabled: true,
    popular: true
  },
  {
    code: 'XAF',
    name: 'Franc CFA Centrafricain',
    symbol: 'FCFA',
    locale: 'fr-XAF',
    country: 'Afrique Centrale',
    flag: '🌍',
    decimalDigits: 0,
    rounding: 1,
    enabled: true,
    popular: true
  },
  {
    code: 'MAD',
    name: 'Dirham Marocain',
    symbol: 'MAD',
    locale: 'ar-MA',
    country: 'Maroc',
    flag: '🇲🇦',
    decimalDigits: 2,
    rounding: 0.05,
    enabled: true,
    popular: true
  },
  {
    code: 'DZD',
    name: 'Dinar Algérien',
    symbol: 'DA',
    locale: 'ar-DZ',
    country: 'Algérie',
    flag: '🇩🇿',
    decimalDigits: 2,
    rounding: 1,
    enabled: true,
    popular: true
  },
  {
    code: 'TND',
    name: 'Dinar Tunisien',
    symbol: 'DT',
    locale: 'ar-TN',
    country: 'Tunisie',
    flag: '🇹🇳',
    decimalDigits: 3,
    rounding: 0.001,
    enabled: true,
    popular: true
  },
  
  // Devises internationales
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'fr-FR',
    country: 'Union Européenne',
    flag: '🇪🇺',
    decimalDigits: 2,
    rounding: 0.01,
    enabled: true,
    popular: true
  },
  {
    code: 'USD',
    name: 'Dollar US',
    symbol: '$',
    locale: 'en-US',
    country: 'États-Unis',
    flag: '🇺🇸',
    decimalDigits: 2,
    rounding: 0.01,
    enabled: true,
    popular: true
  },
  {
    code: 'GBP',
    name: 'Livre Sterling',
    symbol: '£',
    locale: 'en-GB',
    country: 'Royaume-Uni',
    flag: '🇬🇧',
    decimalDigits: 2,
    rounding: 0.01,
    enabled: true,
    popular: true
  },
  
  // Ajout des autres devises...
]

// Configuration spécifique pour Madagascar
export const MADAGASCAR_CONFIG = {
  defaultCurrency: 'MGA',
  defaultLanguage: 'mg',
  defaultLocale: 'mg-MG',
  timezone: 'Indian/Antananarivo',
  taxRate: 0.20, // TVA Madagascar
  phoneCode: '+261',
  dateFormat: 'DD/MM/YYYY',
  firstDayOfWeek: 1, // Lundi
  numberFormat: {
    decimalSeparator: ',',
    thousandSeparator: ' ',
    currencyPosition: 'after' // "1 000 Ar"
  }
}

// Devises populaires pour Madagascar
export const POPULAR_CURRENCIES_MG = [
  getCurrencyByCode('MGA')!,
  getCurrencyByCode('EUR')!,
  getCurrencyByCode('USD')!,
  getCurrencyByCode('XOF')!,
  getCurrencyByCode('XAF')!
]

// Fonction de formatage spécial pour l'Ariary
export function formatAriary(amount: number, options?: Intl.NumberFormatOptions): string {
  // Format malgache : "1 000 Ar" (séparateur d'espace, symbole après)
  const formatter = new Intl.NumberFormat('mg-MG', {
    style: 'currency',
    currency: 'MGA',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  })
  
  return formatter.format(amount)
}
// Devises populaires pour sélecteur rapide
export const POPULAR_CURRENCIES = CURRENCIES.filter(c => c.popular)

// Devises par région
export const CURRENCIES_BY_REGION = {
  africa: CURRENCIES.filter(c => 
    ['XOF', 'XAF', 'MAD', 'DZD', 'TND', 'NGN', 'GHS', 'EGP', 'ZAR'].includes(c.code)
  ),
  europe: CURRENCIES.filter(c => 
    ['EUR', 'GBP', 'CHF'].includes(c.code)
  ),
  americas: CURRENCIES.filter(c => 
    ['USD', 'CAD'].includes(c.code)
  ),
  asia: CURRENCIES.filter(c => 
    ['CNY', 'JPY', 'INR'].includes(c.code)
  )
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code.toUpperCase())
}

export function formatCurrency(amount: number, currencyCode: string, options?: Intl.NumberFormatOptions): string {
  const currency = getCurrencyByCode(currencyCode)
  if (!currency) return `${amount} ${currencyCode}`

  const formatter = new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimalDigits,
    maximumFractionDigits: currency.decimalDigits,
    ...options
  })

  return formatter.format(amount)
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode)
  return currency?.symbol || currencyCode
}
// Taux de change statiques pour Madagascar (à remplacer par API)
export const MGA_EXCHANGE_RATES = {
  EUR: 4500,    // 1 EUR ≈ 4 500 MGA
  USD: 4200,    // 1 USD ≈ 4 200 MGA
  XOF: 6.85,    // 1 XOF ≈ 6.85 MGA (via EUR)
  XAF: 6.85,    // 1 XAF ≈ 6.85 MGA (via EUR)
  GBP: 5200,    // 1 GBP ≈ 5 200 MGA
  CNY: 580,     // 1 CNY ≈ 580 MGA
  date: new Date().toISOString()
}