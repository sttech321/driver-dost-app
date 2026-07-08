// Ambient types for react-native-razorpay (the package ships JS only, no .d.ts).
// Mirrors node_modules/react-native-razorpay/src/types.ts.
declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    key: string;
    amount: number | string;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: { name?: string; email?: string; contact?: string; method?: string; vpa?: string };
    notes?: Record<string, string>;
    theme?: { color?: string; hide_topbar?: boolean };
    [key: string]: any;
  }

  export interface PaymentSuccessData {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    [key: string]: any;
  }

  export interface PaymentErrorData {
    code: number;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string; [key: string]: any };
    [key: string]: any;
  }

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<PaymentSuccessData>;
    onExternalWalletSelection(cb: (data: any) => void): void;
  };

  export default RazorpayCheckout;
}
