"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getContestantVotes } from "@/lib/database";
import { syncVotesAction } from "@/app/actions/votes";
import { motion, AnimatePresence } from "framer-motion";

type LiveVoteCountProps = {
  contestantSlug: string;
  variant?: "default" | "compact";
};

const LiveVoteCount = ({ contestantSlug, variant = "default" }: LiveVoteCountProps) => {
  const [votes, setVotes] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 1. Fetch initial vote count and sync from Paystack
    const refreshData = async () => {
      // First get what we have in DB instantly
      const dbVotes = await getContestantVotes(contestantSlug);
      setVotes(dbVotes);

      // Then trigger background sync for "Direct from Paystack" accuracy
      // This fills any gaps from missed webhooks
      setIsSyncing(true);
      try {
        const result = await syncVotesAction(contestantSlug);
        if (result.success) {
          setVotes(result.votes);
        }
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    refreshData();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel(`live-votes-${contestantSlug}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE)
          schema: "public",
          table: "votes",
          filter: `contestant_slug=eq.${contestantSlug}`,
        },
        async (payload) => {
          console.log("Vote change detected!", payload);
          
          // Re-fetch the total from the DB to be 100% accurate
          const dbVotes = await getContestantVotes(contestantSlug);
          setVotes(dbVotes);
          
          // Trigger animation
          setIsUpdating(true);
          setTimeout(() => setIsUpdating(false), 1000);
        }
      )
      .subscribe();

    // 3. Fallback Polling every 45s
    // (This ensures the UI never stays stale even if real-time subscriptions fail)
    const pollInterval = setInterval(refreshData, 45000);

    // 4. Re-sync on tab focus
    window.addEventListener("focus", refreshData);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener("focus", refreshData);
    };
  }, [contestantSlug]);

  if (votes === null) {
    return (
      <div className="h-6 w-20 bg-primary/10 animate-pulse rounded-full" />
    );
  }

  return (
    <div className="inline-flex items-center gap-3">
      <motion.div
        key={votes}
        initial={{ scale: 1 }}
        animate={{ scale: isUpdating ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full"
      >
        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
        <span className="text-primary font-black text-sm tracking-tight">
          {votes.toLocaleString()} {variant !== "compact" && <span className="font-normal opacity-60 ml-0.5">VOTES</span>}
        </span>
      </motion.div>
      
      {isSyncing && variant !== "compact" && (
        <span className="text-[10px] text-primary/60 font-medium uppercase tracking-tighter animate-pulse">
           Direct Syncing...
        </span>
      )}
      
      <AnimatePresence>
        {isUpdating && (
          <motion.span
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0 }}
            className="text-primary font-bold text-xs absolute"
          >
            + New Vote!
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveVoteCount;
