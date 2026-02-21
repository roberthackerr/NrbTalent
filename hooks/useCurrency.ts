// /hooks/useCurrency.ts
import { useState, useEffect } from 'react'
import { CURRENCIES, getCurrencyByCode } from '@/lib/currency/currencies'
import { currencyConverter } from '@/lib/currency/converter'

export function useCurrency() {
  const [userCurrency, setUserCurrency] = useState('MGA') // Default Madagascar
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  // Récupérer la devise de l'utilisateur
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferred_currency')
    const browserLocale = navigator.language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Détection automatique pour Madagascar
    if (timezone.includes('Antananarivo') || browserLocale.includes('MG')) {
      setUserCurrency('MGA')
    } else if (savedCurrency) {
      setUserCurrency(savedCurrency)
    } else if (browserLocale.includes('FR') || browserLocale.includes('EU')) {
      setUserCurrency('EUR')
    } else if (browserLocale.includes('US') || browserLocale.includes('EN')) {
      setUserCurrency('USD')
    }
  }, [])

  // Charger les taux
  const loadRates = async (baseCurrency: string = userCurrency) => {
    setLoading(true)
    try {
      const newRates = await currencyConverter.getLiveRates(baseCurrency)
      setRates(newRates)
    } catch (error) {
      console.error('Erreur chargement taux:', error)
    } finally {
      setLoading(false)
    }
  }

  // Convertir un montant
  const convert = async (amount: number, fromCurrency: string, toCurrency?: string) => {
    const targetCurrency = toCurrency || userCurrency
    // Défensive: si `amount` n'est pas un nombre valide, retourner 0 évite les NaN/Infinity
    if (typeof amount !== 'number' || Number.isNaN(amount) || !isFinite(amount)) {
      return 0
    }

    if (fromCurrency === targetCurrency) return amount

    const result = await currencyConverter.convert(amount, fromCurrency, targetCurrency)
    return result.amount
  }

  // Formater pour affichage
  const format = (amount: number, currencyCode: string, options?: any) => {
    return currencyConverter.formatForDisplay(amount, currencyCode)
  }

  // Sauvegarder la préférence
  const savePreference = (currencyCode: string) => {
    setUserCurrency(currencyCode)
    localStorage.setItem('preferred_currency', currencyCode)
  }

  return {
    userCurrency,
    setUserCurrency: savePreference,
    rates,
    loading,
    convert,
    format,
    loadRates,
    getCurrencyByCode,
    allCurrencies: CURRENCIES
  }
}