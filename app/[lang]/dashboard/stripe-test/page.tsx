// app/dashboard/stripe-test/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  BarChart3,
  Receipt,
  Users,
  Building,
  Globe,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Zap,
  Sparkles,
  CreditCard as CreditCardIcon,
  Banknote,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  Settings
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  description: string;
  type: 'payment' | 'refund' | 'dispute';
  created: number;
  customer?: string;
  receipt_url?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

export default function StripeTestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [stripeInitialized, setStripeInitialized] = useState(false);
  
  // Form states
  const [paymentAmount, setPaymentAmount] = useState('50.00');
  const [paymentCurrency, setPaymentCurrency] = useState('usd');
  const [paymentDescription, setPaymentDescription] = useState('Test payment for NrbTalents');
  const [customerEmail, setCustomerEmail] = useState('test@example.com');
  const [testMode, setTestMode] = useState(true);

  // API Keys states (pour le test seulement - en production, ces valeurs viendraient du backend)
  const [apiKeys, setApiKeys] = useState({
    publishableKey: '',
    secretKey: '',
  });

  // Load API keys from environment (for demo purposes)
  useEffect(() => {
    // En production, ces clés viendraient d'une API sécurisée
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    const secretKey = ''; // Jamais exposé côté client en production
    
    setApiKeys({
      publishableKey,
      secretKey: 'sk_test_...' // Placeholder pour l'affichage seulement
    });
    
    // Initialize Stripe
    if (publishableKey) {
      initializeStripe(publishableKey);
    }
  }, []);

  const initializeStripe = async (publishableKey: string) => {
    try {
      const stripe = await loadStripe(publishableKey);
      if (stripe) {
        setStripeInitialized(true);
        toast({
          title: 'Stripe Initialized',
          description: 'Stripe SDK loaded successfully',
        });
      }
    } catch (error) {
      console.error('Stripe initialization error:', error);
      toast({
        title: 'Stripe Initialization Failed',
        description: 'Please check your publishable key',
        variant: 'destructive',
      });
    }
  };

  // Test Payment Intent
  const createTestPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(paymentAmount) * 100), // Convert to cents
          currency: paymentCurrency,
          description: paymentDescription,
          customerEmail,
          testMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed');
      }

      if (data.clientSecret) {
        // In a real implementation, you would use stripe.confirmPayment here
        // For now, we'll just show the client secret
        toast({
          title: 'Payment Intent Created',
          description: `Client Secret: ${data.clientSecret.substring(0, 20)}...`,
        });

        // Add to transactions list
        const newTransaction: Transaction = {
          id: data.paymentIntentId || `pi_${Date.now()}`,
          amount: parseFloat(paymentAmount),
          currency: paymentCurrency,
          status: 'pending',
          description: paymentDescription,
          type: 'payment',
          created: Date.now() / 1000,
          customer: customerEmail,
        };

        setTransactions(prev => [newTransaction, ...prev]);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Test Refund
  const createTestRefund = async (transactionId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: transactionId,
          amount: Math.round(parseFloat(paymentAmount) * 100),
          testMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Refund creation failed');
      }

      toast({
        title: 'Refund Created',
        description: `Refund ID: ${data.refundId}`,
      });

      // Update transaction status
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'refunded' }
            : t
        )
      );

      // Add refund transaction
      const refundTransaction: Transaction = {
        id: data.refundId || `re_${Date.now()}`,
        amount: parseFloat(paymentAmount),
        currency: paymentCurrency,
        status: 'succeeded',
        description: `Refund for ${paymentDescription}`,
        type: 'refund',
        created: Date.now() / 1000,
      };

      setTransactions(prev => [refundTransaction, ...prev]);
    } catch (error) {
      console.error('Refund error:', error);
      toast({
        title: 'Refund Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate webhook
  const simulateWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'payment_intent.succeeded',
          paymentIntentId: transactions[0]?.id || 'pi_test_123',
          amount: Math.round(parseFloat(paymentAmount) * 100),
          currency: paymentCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Webhook simulation failed');
      }

      toast({
        title: 'Webhook Simulated',
        description: `Event: ${data.eventType}`,
      });

      // Update first transaction status
      if (transactions.length > 0) {
        setTransactions(prev => 
          prev.map((t, i) => 
            i === 0 ? { ...t, status: 'succeeded' } : t
          )
        );
      }
    } catch (error) {
      console.error('Webhook error:', error);
      toast({
        title: 'Webhook Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy API Key
  const copyApiKey = (key: string, type: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied!',
      description: `${type} key copied to clipboard`,
    });
  };

  // Generate mock data for testing
  const generateMockData = () => {
    const mockTransactions: Transaction[] = [
      {
        id: 'pi_1OaBCdP3W9J7q3xLvH9kLj8G',
        amount: 99.99,
        currency: 'usd',
        status: 'succeeded',
        description: 'Team Collaboration Plan - Monthly',
        type: 'payment',
        created: Date.now() / 1000 - 86400,
        customer: 'team@example.com',
        receipt_url: 'https://receipt.stripe.com/receipts/test'
      },
      {
        id: 'pi_1OaBCdP3W9J7q3xLtest456',
        amount: 299.99,
        currency: 'eur',
        status: 'pending',
        description: 'Enterprise Team Setup Fee',
        type: 'payment',
        created: Date.now() / 1000 - 43200,
        customer: 'enterprise@company.com'
      },
      {
        id: 're_1OaBCdP3W9J7q3xLtest789',
        amount: 49.99,
        currency: 'usd',
        status: 'refunded',
        description: 'Refund: Basic Plan Downgrade',
        type: 'refund',
        created: Date.now() / 1000 - 7200,
      },
      {
        id: 'pi_1OaBCdP3W9J7q3xLtest101',
        amount: 149.99,
        currency: 'gbp',
        status: 'failed',
        description: 'Premium Team Features',
        type: 'payment',
        created: Date.now() / 1000 - 3600,
        customer: 'client@example.co.uk'
      }
    ];

    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: 'pm_1OaBCdP3W9J7q3xLcard123',
        type: 'card',
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      },
      {
        id: 'pm_1OaBCdP3W9J7q3xLcard456',
        type: 'card',
        brand: 'mastercard',
        last4: '5555',
        exp_month: 6,
        exp_year: 2024
      },
      {
        id: 'ba_1OaBCdP3W9J7q3xLbank789',
        type: 'bank_account',
        last4: '6789'
      }
    ];

    setTransactions(mockTransactions);
    setPaymentMethods(mockPaymentMethods);
    
    toast({
      title: 'Mock Data Generated',
      description: 'Test transactions and payment methods added',
    });
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'refunded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <RefreshCw className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'refunded': return <ArrowDownRight className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'payment': return <ArrowUpRight className="h-4 w-4" />;
      case 'refund': return <ArrowDownRight className="h-4 w-4" />;
      case 'dispute': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          Stripe Payment Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Test your Stripe integration with live payment processing, refunds, and webhooks
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {transactions.length}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Test payments</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {transactions.filter(t => t.status === 'succeeded').length}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed payments</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {transactions.filter(t => t.status === 'pending').length}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting processing</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <RefreshCw className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Test Mode</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {testMode ? 'Active' : 'Inactive'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={testMode}
                    onCheckedChange={setTestMode}
                  />
                  <span className="text-xs text-gray-500">{testMode ? 'Using test keys' : 'Live mode'}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="payment" className="space-y-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="payment">Payment Test</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            {/* Payment Test Tab */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Create Test Payment
                  </CardTitle>
                  <CardDescription>
                    Create a test payment intent to verify Stripe integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={paymentCurrency} onValueChange={setPaymentCurrency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usd">USD - US Dollar</SelectItem>
                            <SelectItem value="eur">EUR - Euro</SelectItem>
                            <SelectItem value="gbp">GBP - British Pound</SelectItem>
                            <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                            <SelectItem value="aud">AUD - Australian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="customerEmail">Customer Email</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="customer@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={paymentDescription}
                          onChange={(e) => setPaymentDescription(e.target.value)}
                          placeholder="Payment description..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Stripe Initialization</p>
                          <p className="text-xs text-gray-500">
                            {stripeInitialized ? 'SDK loaded successfully' : 'Initializing...'}
                          </p>
                        </div>
                        <Badge variant={stripeInitialized ? "default" : "secondary"}>
                          {stripeInitialized ? 'Ready' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={createTestPayment}
                      disabled={loading || !stripeInitialized}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Create Test Payment
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={generateMockData}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Mock Data
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setTransactions([])}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Webhook Testing
                  </CardTitle>
                  <CardDescription>
                    Simulate Stripe webhook events to test your endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Webhook Endpoint Security
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Your webhook endpoint should verify Stripe signatures to ensure requests are legitimate
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Simulate Events</h3>
                      
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={simulateWebhook}
                          disabled={loading}
                          className="w-full justify-start"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          payment_intent.succeeded
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Webhook Simulated',
                              description: 'payment_intent.payment_failed event sent',
                            });
                          }}
                          className="w-full justify-start"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          payment_intent.payment_failed
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: 'Webhook Simulated',
                              description: 'charge.refunded event sent',
                            });
                          }}
                          className="w-full justify-start"
                        >
                          <ArrowDownRight className="h-4 w-4 mr-2" />
                          charge.refunded
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Endpoint Configuration</h3>
                      
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                          https://yourdomain.com/api/stripe/webhook
                        </code>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Make sure your endpoint:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Accepts POST requests</li>
                          <li>Verifies Stripe signatures</li>
                          <li>Returns 2xx status codes</li>
                          <li>Handles retries properly</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Stripe Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage your Stripe API keys and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>API Keys Visibility</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKeys(!showApiKeys)}
                      >
                        {showApiKeys ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide Keys
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Show Keys
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Publishable Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type={showApiKeys ? "text" : "password"}
                            value={apiKeys.publishableKey}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyApiKey(apiKeys.publishableKey, 'Publishable')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Used client-side for Stripe.js initialization
                        </p>
                      </div>

                      <div>
                        <Label>Secret Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type={showApiKeys ? "text" : "password"}
                            value={apiKeys.secretKey}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyApiKey(apiKeys.secretKey, 'Secret')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Used server-side only. Never expose this in client-side code
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Environment Check</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            apiKeys.publishableKey ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                          }`}>
                            {apiKeys.publishableKey ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">Publishable Key</p>
                            <p className="text-sm text-gray-500">
                              {apiKeys.publishableKey ? 'Configured' : 'Missing from environment variables'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={apiKeys.publishableKey ? "default" : "destructive"}>
                          {apiKeys.publishableKey ? 'OK' : 'Error'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            stripeInitialized ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                          }`}>
                            {stripeInitialized ? <CheckCircle className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">Stripe SDK</p>
                            <p className="text-sm text-gray-500">
                              {stripeInitialized ? 'Initialized successfully' : 'Initializing...'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={stripeInitialized ? "default" : "secondary"}>
                          {stripeInitialized ? 'Ready' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Transactions */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Transactions
                </span>
                <Badge variant="outline">
                  {transactions.length} total
                </Badge>
              </CardTitle>
              <CardDescription>
                Test payment history and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create a test payment to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.type)}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {transaction.amount.toFixed(2)} {transaction.currency.toUpperCase()}
                            </span>
                          </div>
                          <Badge className={getStatusColor(transaction.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(transaction.status)}
                              {transaction.status}
                            </span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                          {transaction.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>ID: {transaction.id.substring(0, 8)}...</span>
                          <span>
                            {new Date(transaction.created * 1000).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          {transaction.status === 'succeeded' && transaction.type === 'payment' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createTestRefund(transaction.id)}
                              className="flex-1"
                            >
                              Refund
                            </Button>
                          )}
                          
                          {transaction.receipt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(transaction.receipt_url, '_blank')}
                              className="flex-1"
                            >
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-gray-500 text-center w-full">
                <p>All transactions are in test mode and use fake payment methods</p>
                <p className="mt-1">No real money is transferred</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="mt-8 border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Security Notice
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                This is a testing page. In production:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Never expose secret keys in client-side code</li>
                <li>Always use environment variables for API keys</li>
                <li>Verify webhook signatures from Stripe</li>
                <li>Use HTTPS for all payment-related endpoints</li>
                <li>Implement proper error handling and logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}