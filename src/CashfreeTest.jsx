import React from "react";
import { load } from "@cashfreepayments/cashfree-js";

const CashfreeTest = () => {
  const startSubscription = async () => {
    try {
      const sessionId =
        "sub_session_Fp_i-4tbt7SYxaSoMq9P7PJZ72LWNhuoaNr0TgpzP-aE61SKy_Z9tNXGQ_NdbztVqQ1HRgRYLeVDFl38-0LOvJqUh-tqKlsBhLiPMUYLRMQpayment";

      console.log("Initializing Cashfree...");

      const cashfree = await load({
        mode: "sandbox",
      });

      console.log("Cashfree loaded:", cashfree);

      // 🔥 THIS IS THE ACTUAL FIX
      const result = await cashfree.subscriptionsCheckout({
        subsSessionId: sessionId,
        redirectTarget: "_self",
      });

      console.log("Checkout result:", result);
    } catch (err) {
      console.error("ERROR:", err);
      alert("Checkout failed");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Cashfree Subscription Test</h2>
      <button onClick={startSubscription}>
        Start Subscription
      </button>
    </div>
  );
};

export default CashfreeTest;