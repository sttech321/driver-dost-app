// Shared (platform-agnostic) types for the Razorpay checkout wrappers.
// Both razorpay.ts (web) and razorpay.native.ts import from here so they stay
// signature-compatible and throw the same error type.

export interface RazorpayCheckoutOpts {
  keyId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; contact?: string; email?: string };
}

export interface RazorpayResult {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Thrown by openRazorpayCheckout. `cancelled` = the user dismissed the sheet
 * (not a real failure) so callers can show a softer message and let them retry.
 */
export class RazorpayError extends Error {
  cancelled: boolean;
  constructor(message: string, cancelled = false) {
    super(message);
    this.name = 'RazorpayError';
    this.cancelled = cancelled;
  }
}
