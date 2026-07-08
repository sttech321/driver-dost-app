// Razorpay Checkout for native (iOS / Android) via the react-native-razorpay SDK.
// Same signature as razorpay.ts (web) — Metro picks this file on device.
//
// IMPORTANT: react-native-razorpay is a NATIVE module. It is loaded LAZILY (require
// inside the function) so that Expo Go — which doesn't bundle the native side —
// doesn't crash at app startup (the SDK runs `new NativeEventEmitter(...)` at module
// load, which throws when the native module is absent). Card/UPI need a dev build:
//   npx expo prebuild && npx expo run:android   (or run:ios)
import { RazorpayCheckoutOpts, RazorpayError, RazorpayResult } from './razorpayTypes';

/** Load the SDK on demand; returns null if the native module isn't present (Expo Go). */
function getRazorpayCheckout(): { open: (opts: any) => Promise<any> } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-razorpay');
    const Checkout = mod?.default ?? mod;
    return Checkout && typeof Checkout.open === 'function' ? Checkout : null;
  } catch {
    return null;
  }
}

/** Opens the native Razorpay checkout; resolves with the verification payload on success. */
export async function openRazorpayCheckout(opts: RazorpayCheckoutOpts): Promise<RazorpayResult> {
  const RazorpayCheckout = getRazorpayCheckout();
  if (!RazorpayCheckout) {
    throw new RazorpayError(
      'Razorpay is not available in this build. Card/UPI need a dev build — run ' +
        '"npx expo prebuild" then "npx expo run:android" (or run:ios). It does not work in Expo Go.'
    );
  }

  let data;
  try {
    data = await RazorpayCheckout.open({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.name || 'Driver Dost',
      description: opts.description || 'Ride payment',
      prefill: opts.prefill || {},
      theme: { color: '#2F6BC4' },
    });
  } catch (e: any) {
    // The SDK rejects with { code, description }; code 2 / "cancel" = user dismissed.
    const desc = e?.description || e?.message || '';
    const cancelled = e?.code === 2 || /cancel/i.test(desc);
    const message = desc || (cancelled ? 'Payment cancelled' : 'Payment was not completed');
    throw new RazorpayError(message, cancelled);
  }

  if (!data?.razorpay_payment_id || !data?.razorpay_signature) {
    throw new RazorpayError('Incomplete payment result (missing signature). Could not verify.');
  }

  return {
    orderId: data.razorpay_order_id || opts.orderId,
    paymentId: data.razorpay_payment_id,
    signature: data.razorpay_signature,
  };
}
