"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import type { Contestant } from "@/lib/contestants";
import LiveVoteCount from "@/components/LiveVoteCount";

type ContestantCardProps = {
  contestant: Contestant;
  index?: number;
};

const ContestantCard = ({ contestant, index = 0 }: ContestantCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const anim = useScrollAnimation("fadeUp", { delay: (index % 4) * 0.1, duration: 0.6 });

  return (
    <motion.div {...anim.motionProps}>
      <article className="group bg-surface-container-low rounded-xl overflow-hidden border border-white/5 hover:-translate-y-2 transition-transform duration-300">
        <div className="aspect-[4/5] relative overflow-hidden">
          <img
            src={contestant.image}
            alt={contestant.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <Link
            href={`/contestants/${contestant.slug}`}
            className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
            aria-label={`View ${contestant.name} profile`}
          >
            <span className="text-on-surface font-headline font-bold text-sm uppercase tracking-widest bg-surface-container-low/90 px-4 py-2 rounded">
              View Profile
            </span>
          </Link>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-headline font-bold text-on-surface">
                {contestant.name}
              </h3>
              <p className="text-on-surface-variant text-sm">{contestant.category}</p>
            </div>
            <div className="flex-shrink-0">
               <LiveVoteCount contestantSlug={contestant.slug} />
            </div>
          </div>

          <p className="text-on-surface-variant text-sm leading-relaxed min-h-[64px]">
            {expanded ? contestant.writeUp : contestant.shortBio}
          </p>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-primary text-xs font-bold uppercase tracking-[0.2em]"
          >
            {expanded ? "Read Less" : "Read More"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/contestants/${contestant.slug}`}
              className="w-full text-center bg-surface-container-high text-on-surface font-bold py-3 rounded-lg text-sm border border-white/10"
            >
              Full Profile
            </Link>
            <Link
              href={`/voting?contestant=${contestant.slug}#vote-panel`}
              className="w-full text-center gold-shimmer text-on-primary font-bold py-3 rounded-lg text-sm"
            >
              Vote Now
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
};

export default ContestantCard;
