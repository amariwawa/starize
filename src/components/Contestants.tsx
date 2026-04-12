"use client";

import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import ContestantCard from "@/components/ContestantCard";
import { contestants } from "@/lib/contestants";

const Contestants = () => {
  const header = useScrollAnimation("fadeUp");

  return (
    <main className="pt-32 pb-20 px-8 max-w-[1440px] mx-auto relative overflow-hidden">
      <motion.header {...header.motionProps} className="mb-16 relative z-10">
        <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter mb-4 text-on-surface">
          MEET THE{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary-container">
            VOICES
          </span>
        </h1>
      </motion.header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {contestants.map((contestant, i) => (
          <ContestantCard key={contestant.slug} contestant={contestant} index={i} />
        ))}
      </div>
    </main>
  );
};

export default Contestants;
