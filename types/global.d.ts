import type { RazorpayOptions, RazorpayInstance } from "./razorpay";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};
