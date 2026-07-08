// Razorpay Checkout for web. Loads checkout.js once and opens the modal.
// (Native uses react-native-razorpay via razorpay.native.ts.)
import { RazorpayCheckoutOpts, RazorpayError, RazorpayResult } from './razorpayTypes';

let scriptPromise: Promise<any> | null = null;

function loadScript(): Promise<any> {
  const w = window as any;
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve((window as any).Razorpay);
    s.onerror = () => {
      scriptPromise = null;
      reject(new RazorpayError('Could not reach Razorpay. Check your connection and try again.'));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Opens Razorpay checkout; resolves with the verification payload on success. */
export async function openRazorpayCheckout(opts: RazorpayCheckoutOpts): Promise<RazorpayResult> {
  const Razorpay = await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.name || 'Driver Dost',
      description: opts.description || 'Ride payment',
      prefill: opts.prefill || {},
      theme: { color: '#2F6BC4' },
      handler: (r: any) => {
        if (!r?.razorpay_payment_id || !r?.razorpay_signature) {
          reject(new RazorpayError('Incomplete payment result (missing signature). Could not verify.'));
          return;
        }
        resolve({
          orderId: r.razorpay_order_id || opts.orderId,
          paymentId: r.razorpay_payment_id,
          signature: r.razorpay_signature,
        });
      },
      modal: { ondismiss: () => reject(new RazorpayError('Payment cancelled', true)) },
    });
    rzp.open();
  });
}
