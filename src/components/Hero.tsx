"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 text-center">
        <motion.h1

          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: smoothEase }}
          className="text-6xl md:text-8xl lg:text-9xl font-black font-headline tracking-tighter text-on-surface mb-6 leading-none"
        >
          STARIZE SEASON{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary-container">
            SEVEN
          </span>
        </motion.h1>
        <motion.p

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: smoothEase }}
          className="text-xl md:text-2xl text-on-surface-variant max-w-3xl mx-auto mb-10 font-medium tracking-tight"
        >
          Discovering the next generation of gospel talent. A celestial journey
          of faith, voice, and divine purpose.
        </motion.p>
        <motion.div

          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: smoothEase }}
          className="inline-flex items-center gap-3 bg-surface-container-high/50 backdrop-blur px-6 py-3 rounded-full border border-primary/20 mb-12"
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            stars
          </span>
          <span className="text-primary font-bold tracking-widest text-sm md:text-base">
            #500,000 WORTH OF PRIZES
          </span>
        </motion.div>
        <motion.div

          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: smoothEase }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <Link
            href="/events"
            className="liquid-gold-btn text-on-primary px-10 py-5 rounded text-lg font-bold w-full md:w-auto hover:shadow-[0_0_30px_rgba(242,202,80,0.3)] transition-shadow"
          >
            Buy Tickets
          </Link>
          <Link
            href="/voting"
            className="bg-surface-container-highest text-on-surface border border-outline-variant/30 px-10 py-5 rounded text-lg font-bold w-full md:w-auto hover:bg-surface-bright transition-colors"
          >
            Vote Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
