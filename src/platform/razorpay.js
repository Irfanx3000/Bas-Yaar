/* Web stand-in for react-native-razorpay.

   The whole payment flow is already server-side and unchanged: the backend
   creates the order, verifies the signature, and receives the HMAC webhook.
   Only the checkout widget differs, so this loads Razorpay's own checkout.js
   and wraps it in the same promise shape the native SDK returns — which is why
   usePlanSummary.js copies over untouched.

   Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature },
   exactly what subscription.service.verify() posts back. */

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadCheckout = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Razorpay needs a browser."));
    if (window.Razorpay) return resolve(window.Razorpay);

    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")));
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });

const RazorpayCheckout = {
  open: async (options) => {
    const Razorpay = await loadCheckout();
    return new Promise((resolve, reject) => {
      const checkout = new Razorpay({
        ...options,
        handler: resolve,
        modal: {
          ...options.modal,
          // The native SDK rejects on user cancel; match that so the calling
          // hook's catch branch behaves identically.
          ondismiss: () => reject(new Error("Payment cancelled.")),
        },
      });
      checkout.on("payment.failed", (event) =>
        reject(new Error(event?.error?.description || "Payment failed.")),
      );
      checkout.open();
    });
  },
};

export default RazorpayCheckout;
