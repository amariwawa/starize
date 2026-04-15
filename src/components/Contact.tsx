"use client";

import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const Contact = () => {
  const left = useScrollAnimation("fadeLeft");
  const right = useScrollAnimation("fadeRight", { delay: 0.15 });

  return (
    <section className="py-24 px-8 max-w-7xl mx-auto overflow-hidden">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <motion.div {...left.motionProps} className="space-y-12">
          <h2 className="text-4xl font-headline font-bold text-on-surface">
            REACH OUT
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <span className="material-symbols-outlined text-primary text-3xl">
                location_on
              </span>
              <div>
                <h4 className="font-bold text-on-surface">Our Office</h4>
                <p className="text-on-surface-variant">
                  Line 6, Ibadan Rd, Ile-Ife
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div {...right.motionProps} className="h-[500px] rounded-2xl overflow-hidden shadow-2xl relative">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDUPb3T6wG-k-OK1JlTqe6eIsnCh5dkIVsIvk2HJZSHZx82aAWgaK0kdPNUJYCTSqQgp-fFA3Sw67mXUWYX_bhTRgzS_Ow1BVHH-YdRIu-4qbhcSmVWCkmTbJXjBbQKVqMTk3EqzG_Vk4StUChP4OKskmEcdqQ2LyIqbHsoBL5E0UY8ZH6UVLq34mLjViWTiCxvhZVewxMjdLP84XcIzN6i-gZ7e7WbNhkN8TdY225OnT91dpYW92D1-QdC3AtCzFoFO0NMJA1DA"
            alt="Contact"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
