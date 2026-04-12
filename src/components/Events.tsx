"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const Events = () => {
  const card = useScrollAnimation("fadeUp");

  return (
    <section className="px-8 py-12 max-w-7xl mx-auto space-y-8">
      <motion.div
        {...card.motionProps}
        className="group rounded-xl bg-surface-container-low transition-colors duration-500 hover:bg-surface-container-high overflow-hidden flex flex-col md:flex-row"
      >
        <div className="md:w-1/3 h-64 md:h-auto overflow-hidden">
          <img
            src="/images/events/round-2-starize.jpg"
            alt="Regional Auditions"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="md:w-2/3 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-headline font-bold text-on-surface mb-2">
              Round 2. Starize Season 7
            </h3>
            <p className="text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                location_on
              </span>{" "}
              Life Center, Parakin, Ile-Ife
            </p>
          </div>
          <Link href="#tickets" className="text-primary font-bold flex items-center gap-2 mt-4 inline-flex w-fit">
            Get Tickets{" "}
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default Events;
