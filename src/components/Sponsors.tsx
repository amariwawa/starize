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
        <motion.div {...grid.motionProps} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-outline-variant/10">
          {sponsors.map((sponsor, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-8 flex items-center justify-center group hover:bg-surface-container-low transition-colors"
            >
              <div className="relative w-full h-24 overflow-hidden flex items-center justify-center">
                <img 
                  src={sponsor.logo} 
                  alt={sponsor.name} 
                  className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500 scale-90 group-hover:scale-100 opacity-70 group-hover:opacity-100"
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Sponsors;
