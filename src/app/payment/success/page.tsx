"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-surface">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-surface-container-low rounded-2xl border border-primary/20 p-10 md:p-16 max-w-lg w-full text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
        >
          <span
            className="material-symbols-outlined text-primary text-5xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-black font-headline text-on-surface mb-3">
          Payment Successful! 🎉
        </h1>

        <p className="text-on-surface-variant text-lg mb-2">
          Check your email for your ticket
        </p>

        <p className="text-secondary text-sm mb-8">
          A confirmation with your ticket code has been sent to your inbox.
        </p>

        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-on-primary font-bold rounded-lg hover:brightness-110 transition-all active:scale-95"
        >
          Back to Starize
        </Link>
      </motion.div>
    </main>
  );
}
