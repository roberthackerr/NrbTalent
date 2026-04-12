// components/payments/PayPalButton.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PayPalButtonProps {
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalButton({ 
  planId, 
  planName, 
  amount, 
  currency = 'EUR',
  onSuccess,
  onError 
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const createOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, planName, amount, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Impossible de créer la commande');
      onError?.('Failed to create order');
      setIsProcessing(false);
      throw error;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      const response = await fetch('/api/payments/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Paiement effectué avec succès !');
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast.error('Erreur lors du traitement du paiement');
      onError?.('Payment capture failed');
    } finally {
      setIsProcessing(false);
    }
  };



  const renderPayPalButtons = () => {
    if (!buttonsContainerRef.current || !window.paypal) return;

    buttonsContainerRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
        height: 45,
      },
      createOrder,
      onApprove,
      onError,
      onCancel: () => {
        toast.info('Paiement annulé');
        setIsProcessing(false);
      },
    }).render(buttonsContainerRef.current);
  };

  useEffect(() => {
    if (sdkLoaded && buttonsContainerRef.current) {
      renderPayPalButtons();
      setIsLoading(false);
    }
  }, [sdkLoaded]);

  if (!CLIENT_ID) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-600 dark:text-red-400 text-center">
        Configuration PayPal manquante
      </div>
    );
  }

  return (
    <div className="w-full">
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=${currency}&intent=capture`}
        strategy="lazyOnload"
        onLoad={() => {
          setSdkLoaded(true);
        }}
        onError={() => {
          console.error('Failed to load PayPal SDK');
          toast.error('Impossible de charger PayPal');
          setIsLoading(false);
        }}
      />

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement de PayPal...</span>
        </div>
      )}

      <div 
        ref={buttonsContainerRef} 
        className={`w-full transition-opacity ${isLoading ? 'opacity-0 h-0' : 'opacity-100'}`}
      />

      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Traitement en cours...</span>
        </div>
      )}
    </div>
  );
}