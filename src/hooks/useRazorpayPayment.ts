import { useCallback, useState } from 'react';
import { openRazorpayCheckout } from '@/components/razorpay';
import { RazorpayCheckoutOpts, RazorpayError, RazorpayResult } from '@/components/razorpayTypes';

/** Discriminated result so callers can react to cancel vs. failure distinctly. */
export type PaymentOutcome =
  | { status: 'success'; result: RazorpayResult }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

/**
 * Reusable Razorpay checkout hook. Wraps the platform checkout (web checkout.js /
 * native SDK), tracks a `processing` flag + last `error`, and normalises the
 * outcome into success / cancelled / failed — including network + cancel cases.
 *
 * Usage:
 *   const { open, processing, error } = useRazorpayPayment();
 *   const outcome = await open({ keyId, orderId, amount, currency });
 *   if (outcome.status === 'success') { await verify(outcome.result); }
 */
export function useRazorpayPayment() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async (opts: RazorpayCheckoutOpts): Promise<PaymentOutcome> => {
    setProcessing(true);
    setError(null);
    try {
      const result = await openRazorpayCheckout(opts);
      return { status: 'success', result };
    } catch (e: any) {
      // User dismissed the sheet — not a failure, don't surface a red error.
      if (e instanceof RazorpayError && e.cancelled) {
        return { status: 'cancelled' };
      }
      const message = e?.message || 'Payment failed. Please try again.';
      setError(message);
      return { status: 'failed', message };
    } finally {
      setProcessing(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { open, processing, error, reset };
}
