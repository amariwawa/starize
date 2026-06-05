"use client";

import { useEffect, useState } from "react";
import { getReferralTicketCountAction } from "@/app/actions/referrals";
import { motion } from "framer-motion";

type TicketReferralCountProps = {
  contestantSlug: string;
};

const TicketReferralCount = ({ contestantSlug }: TicketReferralCountProps) => {
  const [count, setCount] = useState<number>(0);

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

    // Poll every 5s for faster updates
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, [contestantSlug]);

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
        {count ?? 0} Ticket{count !== 1 ? "s" : ""} Sold
      </span>
    </motion.div>
  );
};

export default TicketReferralCount;
