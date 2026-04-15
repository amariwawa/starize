"use client";

import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const Sponsors = () => {
  const header = useScrollAnimation("fadeUp");
  const grid = useScrollAnimation("fadeIn", { delay: 0.2 });

  const sponsors = [
    { name: "Food O'Clock", logo: "/images/sponsors/sponsor-1.jpg" },
    { name: "Excel: The Creator", logo: "/images/sponsors/sponsor-2.jpg" },
    { name: "CY's Glam", logo: "/images/sponsors/sponsor-3.jpg" },
    { name: "Handbook", logo: "/images/sponsors/sponsor-4.jpg" },
    { name: "Warplink", logo: "/images/sponsors/sponsor-5.png" },
  ];

  return (
    <section className="bg-surface-container-lowest py-24 px-8 mt-12" id="sponsors">
      <div className="max-w-7xl mx-auto">
        <motion.div {...header.motionProps} className="text-center mb-16">
          <h3 className="text-4xl font-headline font-bold text-on-surface">
            EMPOWERING EXCELLENCE
          </h3>
        </motion.div>
        <motion.div {...grid.motionProps} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {sponsors.map((sponsor, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center group"
            >
              <div className="relative w-full h-32 flex items-center justify-center">
                <img 
                  src={`/images/sponsors/sponsor-${i+1}-clean.png`} 
                  alt={sponsor.name} 
                  className="max-w-[90%] max-h-[90%] object-contain transition-all duration-500 scale-95 group-hover:scale-100"
                />
              </div>
              <span className="mt-4 text-[10px] md:text-xs font-headline font-bold text-neutral-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {sponsor.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Sponsors;
