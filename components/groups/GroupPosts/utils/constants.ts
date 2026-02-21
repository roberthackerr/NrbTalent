import { ThumbsUp, Smile, Lightbulb, HelpCircle, PartyPopper } from 'lucide-react'
import { ReactionType } from './types'

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  insightful: '💡',
  helpful: '🤝',
  celebrate: '🎉'
}

export const REACTION_ICONS = {
  like: ThumbsUp,
  love: Smile,
  insightful: Lightbulb,
  helpful: HelpCircle,
  celebrate: PartyPopper
}

export const REACTION_COLORS: Record<ReactionType, string> = {
  like: 'text-blue-600',
  love: 'text-red-500',
  insightful: 'text-yellow-600',
  helpful: 'text-green-600',
  celebrate: 'text-purple-600'
}

export const REACTION_LABELS: Record<ReactionType, string> = {
  like: "J'aime",
  love: "J'adore",
  insightful: 'Intéressant',
  helpful: 'Utile',
  celebrate: 'Célébrer'
}

export const POST_TYPES = {
  discussion: { icon: '💬', label: 'Discussion', color: 'bg-gray-50 text-gray-800 border-gray-200' },
  question: { icon: '❓', label: 'Question', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  event: { icon: '📅', label: 'Événement', color: 'bg-green-50 text-green-800 border-green-200' },
  job: { icon: '💼', label: 'Offre', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  announcement: { icon: '📢', label: 'Annonce', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  poll: { icon: '📊', label: 'Sondage', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
}

export const ROLE_CONFIG = {
  owner: { label: '👑 Propriétaire', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  admin: { label: '⚡ Admin', color: 'bg-red-50 text-red-800 border-red-200' },
  moderator: { label: '🛡️ Modérateur', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  member: { label: '👤 Membre', color: 'bg-gray-50 text-gray-800 border-gray-200' }
}