// utils/helpers.ts
import { fr, enUS } from 'date-fns/locale'
import { formatDistanceToNow, format } from 'date-fns'
import { Post, ReactionType } from './types'
import { REACTION_EMOJIS } from './constants'

// Locales personnalisées
const customMgLocale = {
  code: 'mg',
  formatDistance: (token: string, count: number) => {
    const translations: Record<string, string> = {
      xSeconds: '{{count}} segondra',
      halfAMinute: 'antsasakadro',
      xMinutes: '{{count}} minitra',
      xHours: '{{count}} ora',
      xDays: '{{count}} andro',
      xWeeks: '{{count}} herinandro',
      xMonths: '{{count}} volana',
      xYears: '{{count}} taona',
      lessThanXSeconds: 'latsaky ny {{count}} segondra',
      aboutXSeconds: 'tokony ho {{count}} segondra',
      overXYears: 'mihoatra ny {{count}} taona',
      almostXYears: 'saika {{count}} taona'
    }
    return translations[token]?.replace('{{count}}', count.toString()) || token
  }
}

// Mapping des locales
const locales: Record<string, any> = {
  fr: fr,
  en: enUS,
  mg: customMgLocale
}

// Formatage de date avec support multilingue
export const formatDate = (dateString: string, lang: string = 'fr') => {
  const date = new Date(dateString)
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    const errorMessages = {
      fr: 'Date invalide',
      en: 'Invalid date',
      mg: 'Daty tsy mety'
    }
    return errorMessages[lang as keyof typeof errorMessages] || errorMessages.fr
  }
  
  const locale = locales[lang] || fr
  
  return formatDistanceToNow(date, { 
    addSuffix: true,
    locale
  })
}

// Formatage de date complète
export const formatFullDate = (dateString: string, lang: string = 'fr') => {
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    const errorMessages = {
      fr: 'Date invalide',
      en: 'Invalid date',
      mg: 'Daty tsy mety'
    }
    return errorMessages[lang as keyof typeof errorMessages] || errorMessages.fr
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return date.toLocaleDateString(lang === 'mg' ? 'fr' : lang, options)
}

// Formatage de date courte
export const formatShortDate = (dateString: string, lang: string = 'fr') => {
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    const errorMessages = {
      fr: 'Date invalide',
      en: 'Invalid date',
      mg: 'Daty tsy mety'
    }
    return errorMessages[lang as keyof typeof errorMessages] || errorMessages.fr
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  return date.toLocaleDateString(lang === 'mg' ? 'fr' : lang, options)
}

// Formatage de l'heure
export const formatTime = (dateString: string, lang: string = 'fr') => {
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return '--:--'
  }
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  }
  
  return date.toLocaleTimeString(lang === 'mg' ? 'fr' : lang, options)
}

// Formatage de date relative avec différents niveaux de détail
export const formatRelativeDate = (dateString: string, lang: string = 'fr') => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  const messages = {
    fr: {
      justNow: 'à l\'instant',
      minuteAgo: 'il y a 1 minute',
      minutesAgo: `il y a ${diffInMinutes} minutes`,
      hourAgo: 'il y a 1 heure',
      hoursAgo: `il y a ${diffInHours} heures`,
      yesterday: 'hier',
      daysAgo: `il y a ${diffInDays} jours`
    },
    en: {
      justNow: 'just now',
      minuteAgo: '1 minute ago',
      minutesAgo: `${diffInMinutes} minutes ago`,
      hourAgo: '1 hour ago',
      hoursAgo: `${diffInHours} hours ago`,
      yesterday: 'yesterday',
      daysAgo: `${diffInDays} days ago`
    },
    mg: {
      justNow: 'izao fotoana izao',
      minuteAgo: '1 minitra lasa izay',
      minutesAgo: `${diffInMinutes} minitra lasa izay`,
      hourAgo: '1 ora lasa izay',
      hoursAgo: `${diffInHours} ora lasa izay`,
      yesterday: 'omaly',
      daysAgo: `${diffInDays} andro lasa izay`
    }
  }
  
  const t = messages[lang as keyof typeof messages] || messages.fr
  
  if (diffInSeconds < 60) return t.justNow
  if (diffInMinutes < 60) return diffInMinutes === 1 ? t.minuteAgo : t.minutesAgo
  if (diffInHours < 24) return diffInHours === 1 ? t.hourAgo : t.hoursAgo
  if (diffInDays === 1) return t.yesterday
  if (diffInDays < 7) return t.daysAgo
  
  return formatDate(dateString, lang)
}

// Obtenir les 3 réactions les plus utilisées
export const getTopReactions = (post: Post) => {
  const reactions = Object.entries(post.reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  return reactions.map(([type]) => REACTION_EMOJIS[type as ReactionType]).join(' ')
}

// Obtenir le nombre total de réactions
export const getTotalReactions = (post: Post): number => {
  return Object.values(post.reactionCounts).reduce((a, b) => a + b, 0)
}

// Obtenir la réaction la plus populaire
export const getMostPopularReaction = (post: Post): ReactionType | null => {
  const entries = Object.entries(post.reactionCounts)
  if (entries.length === 0) return null
  
  const [topReaction] = entries.sort((a, b) => b[1] - a[1])
  return topReaction[0] as ReactionType
}

// Formatage de la taille des fichiers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Obtenir l'icône du fichier selon son type
export const getFileIcon = (type: string): string => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('sheet') || type.includes('excel') || type.includes('spreadsheet')) return '📊'
  if (type.includes('presentation') || type.includes('powerpoint') || type.includes('slides')) return '📽️'
  if (type.includes('zip') || type.includes('rar') || type.includes('compressed') || type.includes('7z')) return '📦'
  if (type.includes('image') || type.includes('photo') || type.includes('picture')) return '🖼️'
  if (type.includes('audio') || type.includes('music') || type.includes('sound')) return '🎵'
  if (type.includes('video') || type.includes('movie')) return '🎬'
  if (type.includes('text') || type.includes('txt')) return '📃'
  if (type.includes('code') || type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css')) return '💻'
  return '📎'
}

// Obtenir la couleur du fichier selon son type (pour l'affichage)
export const getFileColor = (type: string): string => {
  if (type.includes('pdf')) return 'text-red-500'
  if (type.includes('word') || type.includes('document')) return 'text-blue-500'
  if (type.includes('sheet') || type.includes('excel')) return 'text-green-500'
  if (type.includes('presentation') || type.includes('powerpoint')) return 'text-orange-500'
  if (type.includes('zip') || type.includes('compressed')) return 'text-yellow-500'
  if (type.includes('image')) return 'text-purple-500'
  if (type.includes('audio')) return 'text-pink-500'
  if (type.includes('video')) return 'text-indigo-500'
  return 'text-gray-500'
}

// Tronquer le texte avec gestion de la langue
export const truncateText = (text: string, maxLength: number = 150, lang: string = 'fr'): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  const messages = {
    fr: '... lire la suite',
    en: '... read more',
    mg: '... vakio bebe kokoa'
  }
  
  const moreText = messages[lang as keyof typeof messages] || messages.fr
  
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + moreText
}

// Extraire les mentions d'un texte
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g
  const mentions = text.match(mentionRegex)
  return mentions ? mentions.map(m => m.substring(1)) : []
}

// Extraire les hashtags d'un texte
export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g
  const hashtags = text.match(hashtagRegex)
  return hashtags ? hashtags.map(h => h.substring(1)) : []
}

// Valider une URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Obtenir le nom de domaine d'une URL
export const getDomainFromUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname.replace('www.', '')
  } catch {
    return url
  }
}