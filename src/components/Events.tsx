"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const Events = () => {
  const card = useScrollAnimation("fadeUp");

  return (
    <section className="px-8 pt-2 pb-12 md:py-12 max-w-7xl mx-auto space-y-8" id="events">
      <motion.div
        {...card.motionProps}
        className="group rounded-xl bg-surface-container-low transition-colors duration-500 hover:bg-surface-container-high overflow-hidden flex flex-col md:flex-row"
      >
        <div className="md:w-1/3 w-full h-auto overflow-hidden">
          <img
            src="/images/events/stage-3.jpg"
            alt="Stage 3! Knockout Edition"
            className="w-full h-auto block"
          />
        </div>
        <div className="md:w-2/3 p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-2">
                GRAND <span className="text-primary">FINALE</span>
              </h3>
              <p className="text-secondary font-bold tracking-widest uppercase text-sm">
                Saturday, 18th April, 2026 • 10 AM
              </p>
              <p className="text-on-surface-variant text-sm mt-1">21 Contestants. Only 10 will advance.</p>
            </div>
            <p className="text-on-surface-variant flex items-center gap-2 text-lg">
              <span className="material-symbols-outlined text-secondary">
                location_on
              </span>{" "}
              Maye Hall, Adedoyin Way, Obalufe, Parakin, Ile-Ife
            </p>
          </div>
          <div className="text-secondary font-bold flex items-center gap-2 mt-8 inline-flex w-fit bg-secondary/10 px-6 py-3 rounded-full">
            Free Event
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Events;
