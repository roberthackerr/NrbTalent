// lib/contract-helpers.ts
export function generateDefaultTerms(): string {
  return `
# Termes et Conditions Généraux

## 1. Engagement des Parties
Le Client et le Freelancer s'engagent à respecter les termes suivants.

## 2. Portée du Travail
Le travail à effectuer est décrit dans la section "Livrables" ci-dessus.

## 3. Paiement
Le paiement sera effectué selon le calendrier défini dans le contrat.

## 4. Propriété Intellectuelle
Tous les droits de propriété intellectuelle seront transférés au Client après paiement complet.

## 5. Confidentialité
Les deux parties s'engagent à garder confidentiels les détails du projet.

## 6. Résolution des Conflits
En cas de litige, les parties s'engagent à chercher une résolution amiable avant toute action légale.

## 7. Loi Applicable
Ce contrat est régi par les lois en vigueur.
  `.trim()
}

export function validateContractData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.title || data.title.length < 5) {
    errors.push("Le titre doit contenir au moins 5 caractères")
  }

  if (!data.amount || data.amount <= 0) {
    errors.push("Le montant doit être supérieur à 0")
  }

  if (!data.startDate || new Date(data.startDate) < new Date()) {
    errors.push("La date de début doit être dans le futur")
  }

  if (!data.deliverables || data.deliverables.length === 0) {
    errors.push("Au moins un livrable doit être spécifié")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function calculateContractDuration(startDate: Date, endDate?: Date): number {
  if (!endDate) return 0
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}