// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Crown, Sparkles, Shield, Rocket } from "lucide-react";
import { PayPalButton } from "@/components/payments/PayPalButton";
import Link from "next/link";

const plans = [
  {
    id: 'free',
    name: "Free",
    price: 0,
    currency: "EUR",
    description: "Parfait pour commencer",
    icon: Shield,
    features: [
      "Consulter tous les projets",
      "Postuler à 5 projets/mois",
      "Profil basique",
      "Support communautaire",
      "10% de commission",
    ],
  },
  {
    id: 'pro',
    name: "Pro",
    price: 1,
    currency: "USD",
    description: "Pour les freelances sérieux",
    icon: Rocket,
    features: [
      "Tout ce qui est inclus dans Free",
      "Candidatures illimitées",
      "Profil en vedette",
      "Support prioritaire",
      "5% de commission",
      "Analytiques avancées",
      "Badge vérifié",
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: "Enterprise",
    price: 99,
    currency: "EUR",
    description: "Pour les agences et équipes",
    icon: Crown,
    features: [
      "Tout ce qui est inclus dans Pro",
      "Gestion d'équipe",
      "Contrats personnalisés",
      "Account manager dédié",
      "3% de commission",
      "Options white-label",
      "Accès API",
    ],
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const handleGetStarted = (plan: typeof plans[0]) => {
    if (!session) {
      window.location.href = '/auth/signup';
      return;
    }

    if (plan.price === 0) {
      // Handle free plan
      window.location.href = '/dashboard';
      return;
    }

    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    window.location.href = '/payment/success';
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Pricing transparent</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent sm:text-5xl lg:text-6xl">
              Des tarifs simples et transparents
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Choisissez le plan qui vous convient le mieux. Tous les plans incluent l'accès à notre plateforme et à notre communauté.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    plan.popular 
                      ? "border-purple-500 shadow-xl shadow-purple-500/20 dark:border-purple-500" 
                      : "border-gray-200 dark:border-gray-800"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                        Populaire
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        plan.popular 
                          ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30" 
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          plan.popular ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"
                        }`} />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? 'Gratuit' : `${plan.price} €`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/{plan.id === 'enterprise' ? 'mois' : 'mois'}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-5 w-5 shrink-0 text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="mt-6 w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleGetStarted(plan)}
                    >
                      {plan.price === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Section pour les clients */}
          <div className="mt-16 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pour les Clients</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Publiez des projets gratuitement. Payez uniquement lorsque vous engagez un freelance.
            </p>
            <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600" asChild>
              <Link href="/auth/signup">Publier un projet</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finaliser votre abonnement</DialogTitle>
            <DialogDescription>
              Vous allez souscrire au plan {selectedPlan?.name} à {selectedPlan?.price}€/mois
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Plan {selectedPlan?.name}</span>
                <span className="font-semibold">{selectedPlan?.price}€</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{selectedPlan?.price}€</span>
              </div>
            </div>

            {selectedPlan && (
              <PayPalButton
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                amount={selectedPlan.price}
                currency={selectedPlan.currency}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}