// lib/contract-utils.ts
import { teamContractDictionary } from './dictionaries/team-contract-dictionary'

export const getTypeText = (type: string, language: string = 'en') => {
  const dict = teamContractDictionary[language as keyof typeof teamContractDictionary]
  
  switch (type) {
    case 'fixedPrice': return dict.fixedPrice
    case 'hourlyRate': return dict.hourlyRate
    case 'milestoneBased': return dict.milestoneBased
    case 'retainer': return dict.retainer
    default: return type
  }
}

export const getStatusText = (status: string, language: string = 'en') => {
  const dict = teamContractDictionary[language as keyof typeof teamContractDictionary]
  
  switch (status) {
    case 'active': return dict.active
    case 'pending': return dict.pending
    case 'draft': return dict.draft
    case 'completed': return dict.completed
    case 'cancelled': return dict.cancelled
    default: return status
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-gradient-to-r from-emerald-500 to-green-600'
    case 'pending': return 'bg-gradient-to-r from-amber-500 to-orange-600'
    case 'draft': return 'bg-gradient-to-r from-slate-500 to-gray-600'
    case 'completed': return 'bg-gradient-to-r from-purple-500 to-indigo-600'
    case 'cancelled': return 'bg-gradient-to-r from-red-500 to-rose-600'
    default: return 'bg-gradient-to-r from-blue-500 to-cyan-600'
  }
}

export const formatCurrency = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}