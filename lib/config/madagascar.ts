// /lib/config/madagascar.ts
export const MADAGASCAR_CONFIG = {
  // Devise
  currency: {
    code: 'MGA',
    name: 'Ariary Malgache',
    symbol: 'Ar',
    decimalSeparator: ',',
    thousandSeparator: ' ',
    format: (amount: number) => {
      return new Intl.NumberFormat('mg-MG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount) + ' Ar'
    }
  },
  
  // Taxes
  taxes: {
    vat: 0.20, // TVA 20%
    withholding: 0.05, // Retenue à la source 5%
    formatTax: (amount: number) => amount * 0.20
  },
  
  // Réglementation
  regulations: {
    minHourlyRate: 5000, // 5 000 Ar/heure minimum
    contractRequired: true,
    disputeResolution: 'CNaPS', // Caisse Nationale de Prévoyance Sociale
    paymentMethods: ['mobile_money', 'bank_transfer', 'cash']
  },
  
  // Mobile Money (très populaire à Madagascar)
  mobileMoney: {
    providers: ['MVola', 'Airtel Money', 'Orange Money'],
    fees: {
      mvola: 0.01, // 1%
      airtel: 0.015, // 1.5%
      orange: 0.02 // 2%
    }
  }
}