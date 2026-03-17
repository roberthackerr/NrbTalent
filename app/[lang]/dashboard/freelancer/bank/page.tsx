// app/dashboard/freelancer/bank/page.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Building,
  User
} from "lucide-react"

export default function BankAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    iban: '',
    bic: '',
    accountHolder: '',
    bankName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Valider l'IBAN
      if (!formData.iban.match(/^FR[0-9A-Z]{23}$/)) {
        toast.error("IBAN français invalide. Format: FR76 XXXX XXXX XXXX XXXX XXXX XXX")
        return
      }

      // Valider le BIC
      if (!formData.bic.match(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)) {
        toast.error("BIC/SWIFT invalide")
        return
      }

      const response = await fetch('/api/freelancer/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      toast.success("✅ Compte bancaire enregistré avec succès !")
      router.push('/dashboard/freelancer/payments')
      
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let formattedValue = value.toUpperCase()
    
    // Formater l'IBAN (espaces tous les 4 caractères)
    if (name === 'iban') {
      formattedValue = value.replace(/\s/g, '').toUpperCase()
      if (formattedValue.length > 2 && !formattedValue.startsWith('FR')) {
        formattedValue = 'FR' + formattedValue
      }
      // Ajouter des espaces pour la lisibilité
      formattedValue = formattedValue.replace(/(.{4})/g, '$1 ').trim()
    }
    
    // Formater le BIC
    if (name === 'bic') {
      formattedValue = value.replace(/\s/g, '').toUpperCase()
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuration bancaire</h1>
        <p className="text-gray-600">
          Configurez votre compte bancaire pour recevoir vos paiements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations bancaires
          </CardTitle>
          <CardDescription>
            Ces informations sont nécessaires pour vous verser vos revenus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations du titulaire */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolder">Nom du titulaire du compte</Label>
                <Input
                  id="accountHolder"
                  name="accountHolder"
                  placeholder="Ex: JEAN DUPONT"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-gray-500">
                  Doit correspondre exactement au nom sur votre compte bancaire
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  name="iban"
                  placeholder="FR76 1234 5123 4512 3456 7890 123"
                  value={formData.iban}
                  onChange={handleChange}
                  required
                  maxLength={34}
                />
                <p className="text-sm text-gray-500">
                  Votre IBAN français (27 caractères)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bic">BIC/SWIFT</Label>
                <Input
                  id="bic"
                  name="bic"
                  placeholder="EXMPFRPP"
                  value={formData.bic}
                  onChange={handleChange}
                  required
                  maxLength={11}
                />
                <p className="text-sm text-gray-500">
                  Code BIC de votre banque (8 ou 11 caractères)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName">Nom de la banque</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  placeholder="Ex: BNP Paribas"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Sécurité */}
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Vos informations bancaires sont chiffrées et stockées de manière sécurisée.
                Seuls les virements vers votre compte seront autorisés.
              </AlertDescription>
            </Alert>

            {/* Validation */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Un micro-virement de vérification (moins de 1€) sera effectué pour valider votre compte.
                Vous devrez confirmer le montant reçu.
              </AlertDescription>
            </Alert>

            {/* Bouton de soumission */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Validation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enregistrer mon compte bancaire
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Questions fréquentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Quand serai-je payé ?</h3>
            <p className="text-sm text-gray-600">
              Les paiements sont effectués tous les vendredis pour les projets terminés et validés.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Y a-t-il des frais ?</h3>
            <p className="text-sm text-gray-600">
              Non, les virements SEPA vers votre compte bancaire français sont gratuits.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Quel est le minimum de retrait ?</h3>
            <p className="text-sm text-gray-600">
              Aucun minimum. Vous pouvez retirer même de petits montants.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}