// app/payment/success/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ArrowLeft,
  Download,
  Share2,
  Calendar,
  DollarSign,
  CreditCard,
  User,
  Clock,
  Package,
  TrendingUp,
  Shield,
  Sparkles,
  Crown,
  Medal,
  Award,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  FileText,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

interface Transaction {
  _id: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  paypalOrderId: string;
  paypalCaptureId: string;
  payerEmail: string;
  createdAt: string;
  completedAt: string;
  metadata?: any;
}

interface Subscription {
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  platformFee: number;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, subscriptionRes] = await Promise.all([
        fetch('/api/payments/transactions'),
        fetch('/api/payments/subscription')
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (subscriptionRes.ok) {
        const data = await subscriptionRes.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Transaction ID copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadInvoice = (transaction: Transaction) => {
    // Générer un reçu PDF (simulé pour l'instant)
    toast.success('Facture en cours de téléchargement...');
  };

  const getPlanIcon = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'pro':
        return <Crown className="h-5 w-5 text-purple-500" />;
      case 'enterprise':
        return <Medal className="h-5 w-5 text-amber-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'pro':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Pro</Badge>;
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">Enterprise</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const latestTransaction = transactions[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de vos informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                Paiement réussi !
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Votre abonnement a été activé avec succès
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-green-200 dark:border-green-800 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 shadow-lg shadow-green-500/30">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
                      Merci pour votre confiance !
                    </h2>
                    <p className="text-green-700 dark:text-green-400">
                      Votre paiement a été traité avec succès. Vous avez maintenant accès à toutes les fonctionnalités de votre abonnement.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Dernière Transaction */}
            {latestTransaction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-purple-200 dark:border-gray-700 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Receipt className="h-5 w-5" />
                      Détails de la transaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Montant</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {latestTransaction.amount} {latestTransaction.currency}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</div>
                        <div className="flex items-center gap-2">
                          {getPlanIcon(latestTransaction.planName)}
                          <span className="font-semibold text-gray-900 dark:text-white capitalize">
                            {latestTransaction.planName}
                          </span>
                          {getPlanBadge(latestTransaction.planName)}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {format(new Date(latestTransaction.createdAt), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Statut</div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {latestTransaction.status}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="bg-purple-200 dark:bg-gray-700" />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">ID Transaction PayPal</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {latestTransaction.paypalCaptureId?.slice(-12) || latestTransaction.paypalOrderId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(latestTransaction.paypalCaptureId || latestTransaction.paypalOrderId)}
                          >
                            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Email du payeur</span>
                        <span className="text-sm text-gray-900 dark:text-white">{latestTransaction.payerEmail}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400"
                        onClick={() => downloadInvoice(latestTransaction)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger la facture
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Abonnement Actuel */}
            {subscription && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-purple-200 dark:border-gray-700 shadow-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Package className="h-5 w-5" />
                      Votre abonnement actuel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</div>
                        <div className="flex items-center gap-2">
                          {getPlanIcon(subscription.planName)}
                          <span className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                            {subscription.planName}
                          </span>
                          {getPlanBadge(subscription.planName)}
                        </div>
                      </div>
                      <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Commission</div>
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {subscription.platformFee}%
                        </div>
                      </div>
                      <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date de début</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {format(new Date(subscription.startDate), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date d'expiration</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {format(new Date(subscription.endDate), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Sparkles className="h-5 w-5" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600" asChild>
                    <Link href="/dashboard">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Accéder au tableau de bord
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full border-purple-300 dark:border-purple-700" asChild>
                    <Link href="/projects">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Explorer les projets
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full border-purple-300 dark:border-purple-700" asChild>
                    <Link href="/gigs">
                      <Package className="h-4 w-4 mr-2" />
                      Découvrir les services
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Prochaines étapes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-purple-200 dark:border-gray-700 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Award className="h-5 w-5" />
                    Prochaines étapes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Complétez votre profil</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez vos compétences et expériences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Postulez à des projets</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Trouvez des missions qui correspondent à vos compétences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Créez vos services</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Proposez vos prestations aux clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Historique des transactions */}
        {transactions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="border-purple-200 dark:border-gray-700 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Clock className="h-5 w-5" />
                  Historique des transactions
                </CardTitle>
                <CardDescription>Retrouvez l'historique de tous vos paiements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(1).map((transaction, index) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {getPlanIcon(transaction.planName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            Abonnement {transaction.planName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(transaction.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {transaction.amount} {transaction.currency}
                        </p>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Une question ? <Link href="/support" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">Contactez notre support</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Composant Briefcase manquant
function Briefcase(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}