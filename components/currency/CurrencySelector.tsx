'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Globe, Check, RefreshCw } from 'lucide-react'
import { CURRENCIES, POPULAR_CURRENCIES_MG, getCurrencyByCode } from '@/lib/currency/currencies'
import { currencyConverter } from '@/lib/currency/converter'

interface CurrencySelectorProps {
  value: string
  onChange: (currencyCode: string) => void
  showFlag?: boolean
  showName?: boolean
  className?: string
  compact?: boolean
}

export function CurrencySelector({
  value,
  onChange,
  showFlag = true,
  showName = true,
  className = '',
  compact = false
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [liveRates, setLiveRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const selectedCurrency = getCurrencyByCode(value) || getCurrencyByCode('MGA')!

  // Charger les taux de change
  useEffect(() => {
    loadLiveRates()
  }, [value])

  const loadLiveRates = async () => {
    setLoading(true)
    try {
      const rates = await currencyConverter.getLiveRates('MGA')
      setLiveRates(rates)
    } catch (error) {
      console.error('Erreur chargement taux:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrage des devises
  const filteredCurrencies = CURRENCIES.filter(currency => {
    if (!currency.enabled) return false
    if (!search.trim()) return true
    
    const searchLower = search.toLowerCase()
    return (
      currency.code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower) ||
      currency.country.toLowerCase().includes(searchLower)
    )
  })

  // Groupes de devises
  const currencyGroups = {
    '🇲🇬 Madagascar': filteredCurrencies.filter(c => c.code === 'MGA'),
    '🌟 Populaires': POPULAR_CURRENCIES_MG.filter(c => 
      filteredCurrencies.some(fc => fc.code === c.code) && c.code !== 'MGA'
    ),
    '🌍 Afrique': filteredCurrencies.filter(c => 
      ['XOF', 'XAF', 'MAD', 'DZD', 'TND', 'NGN', 'GHS', 'EGP', 'ZAR'].includes(c.code)
    ),
    '🌎 International': filteredCurrencies.filter(c => 
      ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'CNY', 'JPY', 'INR'].includes(c.code)
    )
  }

  const handleCurrencySelect = (currencyCode: string) => {
    onChange(currencyCode)
    setIsOpen(false)
    setSearch('')
  }

  const formatRate = (rate: number) => {
    if (rate < 0.01) return rate.toFixed(4)
    if (rate < 1) return rate.toFixed(3)
    if (rate < 10) return rate.toFixed(2)
    return Math.round(rate)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bouton sélecteur */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
          compact ? 'h-10' : 'h-12'
        } ${isOpen ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-300 dark:border-slate-600'}`}
      >
        <div className="flex items-center gap-2">
          {showFlag && (
            <span className="text-lg">{selectedCurrency.flag}</span>
          )}
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedCurrency.code}
              </span>
              {showName && !compact && (
                <>
                  <span className="text-slate-500 dark:text-slate-400">•</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedCurrency.symbol}
                  </span>
                </>
              )}
            </div>
            {showName && !compact && (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                {selectedCurrency.name}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute z-50 mt-1 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[400px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sélectionnez une devise
                </h3>
                <button
                  onClick={loadLiveRates}
                  disabled={loading}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {/* Barre de recherche */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une devise..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500"
              />
            </div>

            {/* Liste des devises */}
            <div className="overflow-y-auto max-h-[300px]">
              {Object.entries(currencyGroups).map(([groupName, currencies]) => {
                if (currencies.length === 0) return null
                
                return (
                  <div key={groupName} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50">
                      <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        {groupName}
                      </h4>
                    </div>
                    
                    {currencies.map((currency) => {
                      const isSelected = currency.code === value
                      const rate = liveRates[currency.code]
                      
                      return (
                        <button
                          key={currency.code}
                          onClick={() => handleCurrencySelect(currency.code)}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                            isSelected ? 'bg-sky-50 dark:bg-sky-900/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{currency.flag}</div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {currency.code}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                )}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {currency.name}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {currency.symbol}
                            </div>
                            {rate && currency.code !== 'MGA' && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                1 {currency.code} = {formatRate(1/rate)} MGA
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Footer avec info taux */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
              <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
                <span className="font-medium">💡 Conseil :</span> Fixez vos prix en {selectedCurrency.code} pour éviter les fluctuations
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}