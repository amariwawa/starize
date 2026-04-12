"use client";

import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const Sponsors = () => {
  const header = useScrollAnimation("fadeUp");
  const grid = useScrollAnimation("fadeIn", { delay: 0.2 });

  return (
    <section className="bg-surface-container-lowest py-24 px-8 mt-12" id="sponsors">
      <div className="max-w-7xl mx-auto">
        <motion.div {...header.motionProps} className="text-center mb-16">
          <h3 className="text-4xl font-headline font-bold text-on-surface">
            EMPOWERING EXCELLENCE
          </h3>
        </motion.div>
        <motion.div {...grid.motionProps} className="grid grid-cols-2 md:grid-cols-4 gap-px bg-outline-variant/10">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-12 flex items-center justify-center group hover:bg-surface-container-low transition-colors"
            >
              <div className="w-32 h-12 bg-neutral-800 rounded group-hover:bg-primary/20"></div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Sponsors;
