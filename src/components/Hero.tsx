"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] md:min-h-screen w-full max-w-full flex items-end justify-center overflow-hidden bg-[#4e0505] pb-12 md:pb-32">
      {/* Integrated Hero Background Layer - Cropped for New Content Focal Point */}
      <div
        className="absolute inset-0 z-0 bg-black"
        style={{
          backgroundImage: "url('/images/hero-home.jpg')",
          backgroundSize: "cover",
          // Positioned at the bottom (85%) to crop out the blank red top 
          // and focus on the Season 7 logo and performers.
          backgroundPosition: "center 85%", 
          backgroundRepeat: "no-repeat",
        }}
      />
      
      {/* Subtle blend overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: smoothEase }}
          className="flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/events"
            className="liquid-gold-btn text-on-primary px-10 py-4 rounded text-lg font-bold w-full md:w-auto hover:shadow-[0_0_30px_rgba(242,202,80,0.3)] transition-all active:scale-95 shadow-2xl"
          >
            Buy Tickets
          </Link>
          <Link
            href="/voting"
            className="bg-white/10 backdrop-blur-md text-on-surface border border-white/20 px-10 py-4 rounded text-lg font-bold w-full md:w-auto hover:bg-white/20 transition-all active:scale-95 shadow-2xl"
          >
            Vote Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
