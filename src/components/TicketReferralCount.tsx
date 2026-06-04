"use client";

import { useEffect, useState } from "react";
import { getReferralTicketCountAction } from "@/app/actions/referrals";
import { motion } from "framer-motion";

type TicketReferralCountProps = {
  contestantSlug: string;
};

const TicketReferralCount = ({ contestantSlug }: TicketReferralCountProps) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await getReferralTicketCountAction(contestantSlug);
        if (result.success) {
          setCount(result.count);
        }
      } catch (error) {
        console.error("Failed to fetch referral ticket count:", error);
      }
    };

    fetchCount();

    // Poll every 30s
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [contestantSlug]);

  if (count === null) {
    return (
      <div className="h-5 w-16 bg-surface-container animate-pulse rounded-full" />
    );
  }

  if (count === 0) {
    return null; // Don't show anything if no tickets sold via referral
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high border border-white/10 rounded-full"
    >
      <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
        confirmation_number
      </span>
      <span className="text-on-surface font-bold text-xs">
        {count} Ticket{count !== 1 ? "s" : ""} Sold
      </span>
    </motion.div>
  );
};

export default TicketReferralCount;
