"use client";

import { useState, useEffect } from "react";
import { usePaystackPayment } from "react-paystack";
import { saveTicket } from "@/lib/database";

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

type TicketTier = "regular" | "vip" | "vip_table";

const TICKET_PRICES: Record<TicketTier, number> = {
  regular: 1000,
  vip: 3500,
  vip_table: 25000,
};

const TICKET_LABELS: Record<TicketTier, string> = {
  regular: "Regular",
  vip: "VIP",
  vip_table: "VIP Table",
};

const TICKET_DESCRIPTIONS: Record<TicketTier, string> = {
  regular: "Standard entry to the event",
  vip: "Priority seating & refreshments",
  vip_table: "Front-row table, backstage access & full hospitality",
};

const TicketPanel = () => {
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [saveError, setSaveError] = useState(false);

  // Fallback: Reset processing state when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      setPaymentStatus((prev) => (prev === "processing" ? "idle" : prev));
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const totalAmount = selectedTier
    ? TICKET_PRICES[selectedTier] * quantity
    : 0;

  const config = {
    reference: `ticket_${selectedTier}_${Date.now()}`,
    email: email,
    amount: totalAmount * 100, // kobo
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      custom_fields: [
        {
          display_name: "Full Name",
          variable_name: "full_name",
          value: fullName,
        },
        {
          display_name: "Ticket Tier",
          variable_name: "ticket_tier",
          value: selectedTier || "",
        },
        {
          display_name: "Tier Label",
          variable_name: "tier_label",
          value: selectedTier ? TICKET_LABELS[selectedTier] : "",
        },
        {
          display_name: "Quantity",
          variable_name: "quantity",
          value: quantity.toString(),
        },
        {
          display_name: "Type",
          variable_name: "payment_type",
          value: "ticket",
        },
      ],
    },
  };

  const onSuccess = async (reference: { reference: string } | unknown) => {
    const ref =
      typeof reference === "object" && reference !== null && "reference" in reference
        ? (reference as { reference: string }).reference
        : config.reference;

    console.log("Ticket payment successful", ref);

    // Save to Supabase
    if (selectedTier) {
      try {
        await saveTicket({
          full_name: fullName,
          email,
          tier: selectedTier,
          tier_label: TICKET_LABELS[selectedTier],
          quantity,
          unit_price_naira: TICKET_PRICES[selectedTier],
          total_amount_naira: totalAmount,
          paystack_reference: ref,
        });
        setSaveError(false);
      } catch (err) {
        console.error("Failed to save ticket to database:", err);
        setSaveError(true);
      }
    }

    setPaymentStatus("success");
  };

  const onClose = () => {
    console.log("Ticket payment closed");
    setPaymentStatus((prev) => (prev === "success" ? "success" : "idle"));
  };

  const initializePayment = usePaystackPayment(config);

  const handlePay = () => {
    if (!fullName.trim()) {
      alert("Please enter your full name");
      return;
    }
    if (!email) {
      alert("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    if (!selectedTier) {
      alert("Please select a ticket tier");
      return;
    }
    setPaymentStatus("processing");
    // @ts-expect-error: react-paystack types are not fully compatible with React 19
    initializePayment(onSuccess, onClose);
  };

  if (paymentStatus === "success") {
    return (
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="bg-surface-container-low p-12 rounded-2xl border border-primary/30 text-center max-w-xl mx-auto">
          <span
            className="material-symbols-outlined text-primary text-7xl mb-6"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            confirmation_number
          </span>
          <h3 className="text-3xl font-black font-headline text-on-surface mb-3">
            Payment Successful!
          </h3>
          <p className="text-on-surface-variant mb-2 text-lg">
            You have successfully purchased <strong className="text-primary">{quantity} {selectedTier && TICKET_LABELS[selectedTier]}</strong> ticket{quantity > 1 ? "s" : ""} for{" "}
            <strong className="text-on-surface">Stage 3! Knockout Edition</strong>.
          </p>
          <p className="text-on-surface-variant text-sm mb-8">
            A confirmation email will be sent to <strong>{email}</strong>.
          </p>
          {saveError && (
            <p className="text-red-400 text-sm mb-4">
              Payment was successful but there was an issue saving your ticket details. Please contact support with your payment reference.
            </p>
          )}
          <button
            onClick={() => {
              setPaymentStatus("idle");
              setSelectedTier(null);
              setEmail("");
              setFullName("");
              setQuantity(1);
              setSaveError(false);
            }}
            className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg"
          >
            Buy Another Ticket
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="tickets" className="max-w-7xl mx-auto px-8 py-20">
      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2">
        {/* Ticket Tiers Selection */}
        <div className="p-8 md:p-12 border-r border-white/5">
          <h2 className="text-3xl font-headline font-extrabold mb-8 flex items-center gap-3 text-on-surface">
            <span className="material-symbols-outlined text-primary text-3xl">
              confirmation_number
            </span>
            Ticket Tiers
          </h2>
          <div className="space-y-4">
            {/* Regular Ticket */}
            <button
              onClick={() => setSelectedTier("regular")}
              className={`w-full text-left bg-surface-container p-6 rounded-lg border-2 transition-colors ${
                selectedTier === "regular"
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {selectedTier === "regular" && (
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    Regular
                  </h3>
                </div>
                <span className="text-2xl font-black text-primary">₦500</span>
              </div>
              <p className="text-on-surface-variant text-sm">
                {TICKET_DESCRIPTIONS.regular}
              </p>
            </button>

            {/* VIP Ticket */}
            <button
              onClick={() => setSelectedTier("vip")}
              className={`w-full text-left bg-surface-container-high p-6 rounded-lg border-2 relative overflow-hidden transition-colors ${
                selectedTier === "vip"
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 text-[10px] font-bold uppercase rounded-bl">
                Popular
              </div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {selectedTier === "vip" && (
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    VIP
                  </h3>
                </div>
                <span className="text-2xl font-black text-primary">
                  ₦3,500
                </span>
              </div>
              <p className="text-on-surface-variant text-sm">
                {TICKET_DESCRIPTIONS.vip}
              </p>
            </button>

            {/* VIP Table Ticket */}
            <button
              onClick={() => setSelectedTier("vip_table")}
              className={`w-full text-left p-6 rounded-lg border-2 relative overflow-hidden transition-colors ${
                selectedTier === "vip_table"
                  ? "border-primary shadow-lg shadow-primary/10 bg-gradient-to-br from-surface-container-high to-surface-container-highest"
                  : "border-white/10 hover:border-white/20 bg-gradient-to-br from-surface-container-high to-surface-container-highest"
              }`}
            >
              <div className="absolute top-0 right-0 golden-glow text-on-primary px-3 py-1 text-[10px] font-bold uppercase rounded-bl">
                Premium
              </div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {selectedTier === "vip_table" && (
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                  <h3 className="text-xl font-bold font-headline text-on-surface">
                    VIP Table
                  </h3>
                </div>
                <span className="text-2xl font-black text-primary">
                  ₦20,000
                </span>
              </div>
              <p className="text-on-surface-variant text-sm">
                {TICKET_DESCRIPTIONS.vip_table}
              </p>
            </button>
          </div>

          {/* Quantity selector */}
          {selectedTier && (
            <div className="mt-8">
              <label className="block text-xs font-bold uppercase text-primary mb-3">
                Quantity
              </label>
              <div className="flex items-center bg-surface-container-lowest rounded-lg overflow-hidden border border-white/10 max-w-[200px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-primary hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input
                  readOnly
                  value={quantity}
                  className="w-full bg-transparent border-none text-center text-xl font-black text-on-surface"
                />
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="p-3 text-primary hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <div className="p-8 md:p-12 bg-surface-container-lowest">
          <h2 className="text-3xl font-headline font-extrabold mb-8 flex items-center gap-3 text-on-surface">
            <span className="material-symbols-outlined text-secondary text-3xl">
              shopping_cart
            </span>
            Checkout
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-primary mb-2">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container p-4 rounded border border-white/10 text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container p-4 rounded border border-white/10 text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Order summary */}
            {selectedTier ? (
              <div className="bg-surface-container-high/50 p-5 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Tier</span>
                  <span className="text-on-surface font-bold">
                    {TICKET_LABELS[selectedTier]}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">
                    ₦{TICKET_PRICES[selectedTier].toLocaleString()} × {quantity}
                  </span>
                  <span className="text-on-surface font-bold">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-on-surface font-bold">Total</span>
                  <span className="text-xl font-black text-primary">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-high/30 p-5 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-on-surface-variant text-sm">
                  Select a ticket tier to continue
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={!selectedTier || paymentStatus === "processing"}
              className="w-full py-4 golden-glow text-on-primary font-black uppercase tracking-widest rounded disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              {paymentStatus === "processing"
                ? "Processing..."
                : selectedTier
                ? `Pay ₦${totalAmount.toLocaleString()}`
                : "Select a Tier"}
            </button>
            <p className="text-[10px] text-on-surface-variant text-center">
              Secured by Paystack • SSL Encrypted
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TicketPanel;
