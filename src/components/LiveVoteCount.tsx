"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getContestantVotes } from "@/lib/database";
import { motion, AnimatePresence } from "framer-motion";

type LiveVoteCountProps = {
  contestantSlug: string;
};

const LiveVoteCount = ({ contestantSlug }: LiveVoteCountProps) => {
  const [votes, setVotes] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 1. Fetch initial vote count
    const fetchInitialVotes = async () => {
      const initialVotes = await getContestantVotes(contestantSlug);
      setVotes(initialVotes);
    };

    fetchInitialVotes();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel(`live-votes-${contestantSlug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `contestant_slug=eq.${contestantSlug}`,
        },
        (payload) => {
          console.log("New vote received!", payload);
          const newVotes = (payload.new as { votes: number }).votes || 0;
          setVotes((prev) => (prev !== null ? prev + newVotes : newVotes));
          
          // Trigger animation
          setIsUpdating(true);
          setTimeout(() => setIsUpdating(false), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
          {votes.toLocaleString()} <span className="font-normal opacity-60 ml-0.5">VOTES</span>
        </span>
      </motion.div>
      
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
