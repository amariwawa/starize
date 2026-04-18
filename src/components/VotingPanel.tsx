"use client";

import { useState, useEffect, useMemo } from "react";
import { usePaystackPayment } from "react-paystack";
import { useSearchParams } from "next/navigation";
import SelectContestant from "@/components/SelectContestant";
import { contestants } from "@/lib/contestants";
import { saveVote } from "@/lib/database";

const PRICE_PER_VOTE = 50; // ₦50 per vote
const DEFAULT_PAYSTACK_KEY = "pk_test_placeholder"; // Fallback for build time

const VotingPanel = () => {
  const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || DEFAULT_PAYSTACK_KEY;
  const searchParams = useSearchParams();
  const [votes, setVotes] = useState(20);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [saveError, setSaveError] = useState(false);

  // Use local state for contestant selection — no router navigation
  const preselectedContestant = searchParams.get("contestant");
  const initialSlug =
    preselectedContestant &&
    contestants.some((c) => c.slug === preselectedContestant)
      ? preselectedContestant
      : contestants[0]?.slug ?? "";

  const [selectedSlug, setSelectedSlug] = useState(initialSlug);

  const selectedContestant = useMemo(
    () => contestants.find((c) => c.slug === selectedSlug) ?? contestants[0],
    [selectedSlug],
  );

  // Fallback: Reset processing state when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      setPaymentStatus((prev) => (prev === "processing" ? "idle" : prev));
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const amount = votes * PRICE_PER_VOTE * 100; // Paystack takes amount in kobo

  const handleSelectContestant = (slug: string) => {
    setSelectedSlug(slug);
  };

  const config = {
    reference: `vote_${selectedSlug}_${Date.now()}`,
    email: email,
    amount: amount,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      custom_fields: [
        {
          display_name: "Full Name",
          variable_name: "full_name",
          value: fullName,
        },
        {
          display_name: "Contestant",
          variable_name: "contestant",
          value: selectedContestant?.name || "",
        },
        {
          display_name: "Contestant Slug",
          variable_name: "contestant_slug",
          value: selectedSlug,
        },
        {
          display_name: "Votes",
          variable_name: "votes",
          value: votes.toString(),
        },
        {
          display_name: "Type",
          variable_name: "payment_type",
          value: "voting",
        },
      ],
    },
  };

  const onSuccess = async (reference: { reference: string } | unknown) => {
    const ref =
      typeof reference === "object" && reference !== null && "reference" in reference
        ? (reference as { reference: string }).reference
        : config.reference;

    console.log("Vote payment successful", ref);
    setPaymentStatus("success");

    // Save to Supabase
    try {
      await saveVote({
        full_name: fullName,
        email,
        contestant_slug: selectedSlug,
        contestant_name: selectedContestant?.name || "",
        votes,
        amount_naira: votes * PRICE_PER_VOTE,
        paystack_reference: ref,
      });
      setSaveError(false);
    } catch (err) {
      console.error("Failed to save vote to database:", err);
      setSaveError(true);
    }
  };

  const onClose = () => {
    console.log("Vote payment closed");
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
    setPaymentStatus("processing");
    // @ts-expect-error: react-paystack types are not fully compatible with React 19
    initializePayment(onSuccess, onClose);
  };

  return (
    <section id="vote-panel" className="max-w-7xl mx-auto px-8 py-20">
      <div className="text-center mb-16">
        <span className="text-primary font-bold uppercase tracking-[0.3em] text-sm">
          Vote and Support
        </span>
        <h2 className="text-4xl md:text-5xl font-black font-headline mt-2 text-on-surface">
          Official Voting Portal
        </h2>
      </div>

      <SelectContestant
        contestants={contestants}
        selectedSlug={selectedSlug}
        onSelect={handleSelectContestant}
      />

      {paymentStatus === "success" ? (
        <div className="bg-surface-container-low p-8 md:p-12 rounded-2xl border border-primary/30 text-center">
          <span className="material-symbols-outlined text-primary text-6xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <h3 className="text-2xl font-bold text-on-surface mb-2">
            Payment Successful!
          </h3>
          <p className="text-on-surface-variant mb-6">
            You have successfully purchased <strong className="text-primary">{votes} votes</strong> for{" "}
            <strong className="text-on-surface">{selectedContestant?.name}</strong>.
          </p>
          {saveError && (
            <p className="text-red-400 text-sm mb-4">
              Payment was successful but there was an issue saving your vote. Please contact support with your payment reference.
            </p>
          )}
          <button
            onClick={() => {
              setPaymentStatus("idle");
              setVotes(20);
              setEmail("");
              setFullName("");
              setSaveError(false);
            }}
            className="px-8 py-3 bg-primary text-on-primary font-bold rounded-lg"
          >
            Vote Again
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-low p-8 md:p-12 rounded-2xl border border-white/5">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase text-primary mb-4">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-container-lowest p-4 rounded border border-white/10 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-primary mb-4">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest p-4 rounded border border-white/10 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-primary mb-4">
                  Number of Votes
                </label>
                <div className="flex items-center bg-surface-container-lowest rounded-lg overflow-hidden border border-white/10 mb-4">
                  <button
                    onClick={() => setVotes(Math.max(1, votes - 1))}
                    className="p-4 text-primary hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input
                    readOnly
                    value={votes}
                    className="w-full bg-transparent border-none text-center text-3xl font-black text-on-surface"
                  />
                  <button
                    onClick={() => setVotes(votes + 1)}
                    className="p-4 text-primary hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  {[1, 5, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVotes(votes + v)}
                      className="flex-1 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-black rounded transition-all active:scale-95"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-surface-container-high p-6 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase text-primary tracking-widest mb-2">
                Order Summary
              </h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Contestant</span>
                <span className="text-on-surface font-bold">
                  {selectedContestant?.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">Votes</span>
                <span className="text-on-surface font-bold">{votes}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">
                  Rate
                </span>
                <span className="text-on-surface font-bold">
                  ₦{PRICE_PER_VOTE} / vote
                </span>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <span className="text-on-surface font-bold">Total</span>
                <span className="text-2xl font-black text-primary">
                  ₦{(votes * PRICE_PER_VOTE).toLocaleString()}
                </span>
              </div>
              <button
                onClick={handlePay}
                disabled={paymentStatus === "processing"}
                className="w-full py-4 golden-glow text-on-primary font-black uppercase tracking-widest rounded-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              >
                {paymentStatus === "processing" ? "Processing..." : "Pay & Vote"}
              </button>
              <p className="text-[10px] text-on-surface-variant text-center mt-2">
                Secured by Paystack • SSL Encrypted
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VotingPanel;
