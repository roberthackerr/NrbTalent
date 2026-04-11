'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

// Proper TypeScript types for PayPal
declare global {
  interface Window {
    paypal?: {
      Buttons: (options: any) => {
        render: (container: HTMLElement) => void;
      };
    };
  }
}

// Define proper types
interface PayPalAmount {
  currency_code: string;
  value: string;
}

interface PayPalCapture {
  id: string;
  status: string;
}

interface PayPalPayment {
  captures: PayPalCapture[];
}

interface PayPalPurchaseUnit {
  amount: PayPalAmount;
  payments?: {
    captures: PayPalCapture[];
  };
}

interface PayPalPayer {
  email_address: string;
  name?: {
    given_name: string;
  };
}

interface PayPalOrderDetails {
  id: string;
  status: string;
  payer: PayPalPayer;
  purchase_units: PayPalPurchaseUnit[];
}

// Main Component
export default function PayPalTestPage() {
  const [paymentStatus, setPaymentStatus] = useState<string>('Ready');
  const [orderId, setOrderId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [payerEmail, setPayerEmail] = useState<string>('');
  const buttonsContainerRef = useRef<HTMLDivElement>(null);

  // Use your Client ID directly
  const CLIENT_ID = 'AXSep6sQDhFM_CmLQ11nj7ygAxiU44-dnHfxp58Slvr2VIWKUAbzSussGMk0eaAn7c2bxBATqQhWe4fs';

  useEffect(() => {
    // Check if PayPal is already loaded
    if (window.paypal && buttonsContainerRef.current) {
      renderPayPalButtons();
    }
  }, []);

  const renderPayPalButtons = () => {
    if (!buttonsContainerRef.current || !window.paypal) {
      console.log('PayPal not ready or container not found');
      return;
    }

    // Clear previous buttons
    buttonsContainerRef.current.innerHTML = '';

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical' as const,
          color: 'gold' as const,
          shape: 'rect' as const,
          label: 'paypal' as const,
        },

        // Create order
        createOrder: (data: unknown, actions: any): Promise<string> => {
          setPaymentStatus('Creating order...');
          
          return actions.order.create({
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: '1.00' // Lower test amount
              },
              description: 'Test Payment',
            }]
          });
        },

        // Approve the transaction
        onApprove: async (data: { orderID: string }, actions: any): Promise<void> => {
          try {
            setPaymentStatus('Processing payment...');
            setOrderId(data.orderID);

            const details: PayPalOrderDetails = await actions.order.capture();
            
            setPaymentStatus('COMPLETED');
            
            // Safely access transaction details
            if (details.purchase_units[0]?.payments?.captures?.[0]) {
              setTransactionId(details.purchase_units[0].payments.captures[0].id);
            }
            
            if (details.payer?.email_address) {
              setPayerEmail(details.payer.email_address);
            }
            
            console.log('Transaction completed:', details);
          } catch (error) {
            console.error('Capture error:', error);
            setPaymentStatus('FAILED');
          }
        },

        // Handle errors
        onError: (err: Error): void => {
          console.error('PayPal Error:', err);
          setPaymentStatus(`ERROR: ${err.message}`);
        },

        // When buyer cancels
        onCancel: (data: unknown): void => {
          console.log('Payment cancelled');
          setPaymentStatus('CANCELLED');
        }

      }).render(buttonsContainerRef.current);
    } catch (error) {
      console.error('Failed to render PayPal buttons:', error);
      setPaymentStatus('Failed to load PayPal');
    }
  };

  const resetTest = () => {
    setPaymentStatus('Ready');
    setOrderId('');
    setTransactionId('');
    setPayerEmail('');
    if (buttonsContainerRef.current) {
      buttonsContainerRef.current.innerHTML = '';
      // Re-render after a short delay
      setTimeout(() => {
        if (window.paypal) {
          renderPayPalButtons();
        }
      }, 100);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD`}
        strategy="lazyOnload"
        onLoad={() => {
          console.log('PayPal SDK loaded successfully');
          renderPayPalButtons();
        }}
        onError={() => {
          console.error('Failed to load PayPal SDK');
          setPaymentStatus('Failed to load PayPal SDK');
        }}
      />

      <h1>PayPal Sandbox Test</h1>
      <p style={{ color: '#666', marginBottom: '0.5rem' }}>
        Testing with App: <strong>NrbTalents</strong>
      </p>
      <p style={{ 
        background: '#fff3cd', 
        padding: '0.75rem',
        borderRadius: '6px',
        borderLeft: '4px solid #ffc107',
        marginBottom: '2rem'
      }}>
        Using Sandbox Mode - No real money will be charged
      </p>

      {/* PayPal Button Container */}
      <div style={{ margin: '2rem 0', minHeight: '100px' }}>
        <div ref={buttonsContainerRef} />
      </div>

      {/* Test Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button 
          onClick={resetTest}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Reset Test
        </button>
      </div>

      {/* Status Panel */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h2>Payment Status</h2>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontWeight: 'bold',
          marginBottom: '1rem',
          background: paymentStatus === 'COMPLETED' ? '#d1e7dd' :
                     paymentStatus === 'FAILED' || paymentStatus.includes('ERROR') ? '#f8d7da' :
                     paymentStatus === 'CANCELLED' ? '#fff3cd' : '#e7f1ff',
          color: paymentStatus === 'COMPLETED' ? '#0f5132' :
                 paymentStatus === 'FAILED' || paymentStatus.includes('ERROR') ? '#842029' :
                 paymentStatus === 'CANCELLED' ? '#664d03' : '#084298'
        }}>
          {paymentStatus}
        </div>

        {orderId && (
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '6px',
            borderLeft: '4px solid #0d6efd',
            margin: '1rem 0'
          }}>
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> {orderId}</p>
            {transactionId && <p><strong>Transaction ID:</strong> {transactionId}</p>}
            {payerEmail && <p><strong>Payer Email:</strong> {payerEmail}</p>}
          </div>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #dee2e6' }}>
          <h3>Test Instructions:</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>Click the PayPal button above</li>
            <li>Log in with sandbox credentials</li>
            <li>Complete the $1.00 payment in sandbox mode</li>
            <li>Check status updates here</li>
          </ol>
          <p style={{ 
            background: '#e7f1ff', 
            padding: '1rem', 
            borderRadius: '6px',
            marginTop: '1rem'
           }}>
            💡 Go to <strong>Testing Tools</strong> in your PayPal dashboard to get sandbox account credentials
          </p>
        </div>
      </div>
    </div>
  );
}