

// Types pour les dictionnaires
export type Dictionary = {

  portfolio: {
    title: string
    description: string
    addProject: string
    // ... etc
    categories: {
      website: string
      mobile: string
      design: string
      ecommerce: string
      api: string
      tool: string
      game: string
      other: string
    }
    success: { removed: string; updated: string; added?: string }
    errors: { remove: string; update: string; missingFields?: string; imageRequired?: string; upload?: string; save?: string; invalidImage?: string; fileTooLarge?: string }
    // ... all other portfolio keys
  }
  experience: { /* ... */ }
   onboardingPage:any
  signin: any
  common: {
    loading: string
    error: string
    save: string
    cancel: string
    delete: string
    edit: string
    back: string
    next: string
    skip: string
  }
  navigation: {
    home: string
    dashboard: string
    profile: string
    projects: string
    messages: string
    settings: string
    signin: string
    signup: string
    signout: string
  }
  auth: {
    welcome: string
    subtitle: string
    email: string
    password: string
    confirmPassword: string
    name: string
    login: string
    register: string
    google: string
    noAccount: string
    hasAccount: string
    forgotPassword: string
    or: string
    errors: {
      emailRequired: string
      emailInvalid: string
      passwordRequired: string
      passwordMin: string
      passwordsNotMatch: string
      nameRequired: string
      userExists: string
      invalidCredentials: string
      googleAccount: string
    }
    success: {
      signup: string
      login: string
    }
  }
  onboarding: {
    title: string
    subtitle: string
    benefits:any
    role: {
      title: string
      freelance: string
      client: string
      benefits: {
        freelance: string[]
        client: string[]
      }
    }
    skills: string
    hourlyRate: string
    location: string
    languages: string
    bio: string
    complete: string
  }
  dashboard: {
    welcome: string
    stats: {
      projects: string
      earnings: string
      rating: string
      responseTime: string
    }
  }
  footer: {
    rights: string
    terms: string
    privacy: string
  }
}

// Import dynamique des dictionnaires
const dictionaries = {
  fr: () => import('./locales/fr.json').then(module => module.default as Dictionary),
  en: () => import('./locales/en.json').then(module => module.default as Dictionary),
  mg: () => import('./locales/mg.json').then(module => module.default as Dictionary),
}

// Récupérer le dictionnaire pour une langue (côté serveur)
export const getDictionary = async (locale: string): Promise<Dictionary> => {
  if (locale === 'fr' || locale === 'en' || locale === 'mg') {
    return dictionaries[locale]()
  }
  return dictionaries.fr()
}

// Version avec fallback
export const getDictionarySafe = async (locale?: string): Promise<Dictionary> => {
  if (locale && (locale === 'fr' || locale === 'en' || locale === 'mg')) {
    return dictionaries[locale]()
  }
  return dictionaries.fr()
}