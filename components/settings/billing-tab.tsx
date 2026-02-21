
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Plus, CheckCircle2 } from "lucide-react"

export function BillingTab() {
  const paymentMethods = [
    { id: 1, type: "Carte de crédit", last4: "4242", expiry: "12/24", default: true },
    { id: 2, type: "PayPal", email: "user@example.com", default: false },
  ]

  const invoices = [
    { id: "INV-1234", date: "15 Jan 2024", amount: "$299.00", status: "Payé" },
    { id: "INV-1233", date: "15 Déc 2023", amount: "$299.00", status: "Payé" },
    { id: "INV-1232", date: "15 Nov 2023", amount: "$299.00", status: "Payé" },
  ]

  return (
    <div className="space-y-6">
      {/* Méthodes de paiement */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Méthodes de Paiement
          </CardTitle>
          <CardDescription>
            Gérez vos méthodes de paiement et vos informations de facturation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <CreditCard className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {method.type} •••• {method.last4}
                      </p>
                      {method.default && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Par défaut
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {method.expiry || method.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.default && (
                    <Button variant="outline" size="sm">
                      Définir par défaut
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full bg-transparent border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une méthode de paiement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique de facturation */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Historique de Facturation</CardTitle>
          <CardDescription>
            Consultez et téléchargez vos factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {invoice.id}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {invoice.date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {invoice.amount}
                  </p>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}