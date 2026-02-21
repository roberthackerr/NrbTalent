import { CURRENCIES, MGA_EXCHANGE_RATES } from './currencies'

export interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdated: Date
  source: 'ecb' | 'fixer' | 'openexchangerates' | 'static_mg'
}

export class CurrencyConverter {
  private static instance: CurrencyConverter
  private rates: Map<string, ExchangeRate> = new Map()
  private cacheDuration = 24 * 60 * 60 * 1000 // 24 heures

  private constructor() {
    this.initializeStaticRates()
  }

  static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter()
    }
    return CurrencyConverter.instance
  }

  private initializeStaticRates() {
    // Taux statiques pour Madagascar
    const baseDate = new Date(MGA_EXCHANGE_RATES.date)
    
    // Conversion depuis MGA
    Object.entries(MGA_EXCHANGE_RATES).forEach(([currency, rate]) => {
      if (typeof rate === 'number') {
        this.rates.set(`MGA_${currency}`, {
          from: 'MGA',
          to: currency,
          rate: 1 / rate, // Inversé : MGA vers autre
          lastUpdated: baseDate,
          source: 'static_mg'
        })
        
        this.rates.set(`${currency}_MGA`, {
          from: currency,
          to: 'MGA',
          rate: rate, // Autre vers MGA
          lastUpdated: baseDate,
          source: 'static_mg'
        })
      }
    })

    // Conversion entre autres devises (basé sur EUR)
    const eurRates = {
      USD: 1.08,
      GBP: 0.85,
      XOF: 655.957,
      XAF: 655.957,
      CNY: 7.85
    }

    Object.entries(eurRates).forEach(([currency, rate]) => {
      this.rates.set(`EUR_${currency}`, {
        from: 'EUR',
        to: currency,
        rate,
        lastUpdated: baseDate,
        source: 'static_mg'
      })
      
      this.rates.set(`${currency}_EUR`, {
        from: currency,
        to: 'EUR',
        rate: 1 / rate,
        lastUpdated: baseDate,
        source: 'static_mg'
      })
    })
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number; timestamp: Date }> {
    
    // Même devise
    if (fromCurrency === toCurrency) {
      return {
        amount,
        rate: 1,
        timestamp: new Date()
      }
    }

    // Chercher le taux direct
    const directKey = `${fromCurrency}_${toCurrency}`
    if (this.rates.has(directKey)) {
      const rate = this.rates.get(directKey)!
      return {
        amount: amount * rate.rate,
        rate: rate.rate,
        timestamp: rate.lastUpdated
      }
    }

    // Chercher via EUR (devise pivot)
    const viaEUR = await this.convertViaEUR(amount, fromCurrency, toCurrency)
    if (viaEUR) return viaEUR

    // Fallback : taux approximatif
    console.warn(`⚠️ Taux ${fromCurrency}->${toCurrency} non trouvé, estimation via USD`)
    return this.estimateConversion(amount, fromCurrency, toCurrency)
  }

  private async convertViaEUR(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number; timestamp: Date } | null> {
    
    const toEUR = this.rates.get(`${fromCurrency}_EUR`)
    const fromEUR = this.rates.get(`EUR_${toCurrency}`)
    
    if (toEUR && fromEUR) {
      const rate = toEUR.rate * fromEUR.rate
      return {
        amount: amount * rate,
        rate,
        timestamp: new Date(Math.max(toEUR.lastUpdated.getTime(), fromEUR.lastUpdated.getTime()))
      }
    }
    
    return null
  }

  private estimateConversion(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): { amount: number; rate: number; timestamp: Date } {
    
    // Estimation basique (à remplacer par vraie API)
    const estimatedRates: Record<string, number> = {
      // Basé sur USD
      'USD_EUR': 0.92,
      'USD_GBP': 0.79,
      'USD_XOF': 600,
      'USD_XAF': 600,
      'USD_CNY': 7.25,
      'USD_MGA': MGA_EXCHANGE_RATES.USD,
      
      // Inverses
      'EUR_USD': 1.08,
      'GBP_USD': 1.27,
      'XOF_USD': 0.00167,
      'XAF_USD': 0.00167,
      'CNY_USD': 0.14,
      'MGA_USD': 1 / MGA_EXCHANGE_RATES.USD
    }

    const rate = estimatedRates[`${fromCurrency}_${toCurrency}`] || 1
    return {
      amount: amount * rate,
      rate,
      timestamp: new Date()
    }
  }

  async getLiveRates(baseCurrency: string = 'MGA'): Promise<Record<string, number>> {
    // Pour Madagascar, prioriser MGA comme base
    const rates: Record<string, number> = {}
    
    const targetCurrencies = ['EUR', 'USD', 'XOF', 'XAF', 'GBP', 'CNY']
    
    for (const target of targetCurrencies) {
      if (target === baseCurrency) continue
      
      const conversion = await this.convert(1, baseCurrency, target)
      rates[target] = conversion.rate
    }
    
    return rates
  }

  formatForDisplay(
    amount: number,
    currency: string,
    showSymbol: boolean = true
  ): string {
    // Défensive: gérer les valeurs non numériques ou infinies
    if (typeof amount !== 'number' || !isFinite(amount) || Number.isNaN(amount)) {
      return showSymbol ? `- ${currency}` : `-`
    }

    const currencyObj = CURRENCIES.find(c => c.code === currency)
    
    if (!currencyObj) {
      return `${amount.toFixed(2)} ${currency}`
    }

    // Format spécial pour l'Ariary
    if (currency === 'MGA') {
      if (showSymbol) {
        // Format malgache : "1 000 Ar"
        return new Intl.NumberFormat('mg-MG', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount) + ' Ar'
      } else {
        return new Intl.NumberFormat('mg-MG', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount)
      }
    }

    // Format standard pour autres devises
    return new Intl.NumberFormat(currencyObj.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: currencyObj.decimalDigits,
      maximumFractionDigits: currencyObj.decimalDigits
    }).format(amount)
  }

  // Méthode pour arrondir selon les règles de la devise
  roundToCurrency(amount: number, currencyCode: string): number {
    const currency = CURRENCIES.find(c => c.code === currencyCode)
    if (!currency) return Math.round(amount * 100) / 100

    const rounding = currency.rounding
    if (rounding === 0) return amount
    
    return Math.round(amount / rounding) * rounding
  }
}

// Singleton export
export const currencyConverter = CurrencyConverter.getInstance()