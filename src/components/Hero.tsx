"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const smoothEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] md:min-h-screen w-full max-w-full flex items-end justify-center overflow-hidden bg-[#4e0505] pb-12 md:pb-60">
      {/* Background Image (Desktop - Final Logo Clearing) */}
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          backgroundImage: "url('/images/hero-home.jpg')",
          backgroundSize: "cover",
          // Fine-tuned to 67% (Shifted down from 72%) to clear the navbar perfectly
          backgroundPosition: "center 67%", 
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Background Image (Mobile - Integrated Focal Point - Final Stand) */}
      <div className="absolute inset-0 z-0 md:hidden overflow-hidden">
        <div 
          className="absolute inset-x-0 -top-[180px] h-[130%] bg-cover bg-[50%_100%] bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-home.jpg')" }}
        />
        {/* Next Event Reminder (Mobile Only - Tight Clustering) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: smoothEase }}
          className="absolute top-24 left-0 w-full px-6 text-center"
        >
          <p className="text-secondary font-headline font-black text-[10px] tracking-[0.2em] mb-1">MAIN EVENT</p>
          <h2 className="liquid-gold-text text-xl font-headline font-black tracking-tight leading-tight mb-1">GRAND FINALE</h2>
          <p className="text-on-surface/60 text-[10px] font-bold uppercase tracking-widest leading-none">Saturday, 9th May • 2 PM</p>
        </motion.div>
      </div>
      
      {/* Subtle blend overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center w-full">
        {/* Desktop-only Reminder Block (Tight Cluster) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: smoothEase }}
          className="hidden md:block mb-8"
        >
          <p className="text-secondary font-headline font-black text-xs tracking-[0.2em] mb-1">MAIN EVENT</p>
          <h2 className="liquid-gold-text text-3xl font-headline font-black tracking-tight leading-tight mb-2">GRAND FINALE</h2>
          <p className="text-on-surface/80 text-sm font-bold uppercase tracking-widest">Saturday, 9th May • 2 PM</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: smoothEase }}
          className="flex flex-row items-center justify-center gap-3 md:gap-4 w-full"
        >
          <Link
            href="/events"
            className="flex-1 max-w-[160px] md:max-w-none md:flex-none liquid-gold-btn text-on-primary px-0 md:px-10 py-3.5 md:py-4 rounded text-xs md:text-lg font-bold hover:shadow-[0_0_30px_rgba(242,202,80,0.3)] transition-all active:scale-95 shadow-2xl text-center"
          >
            Buy Tickets
          </Link>
          <Link
            href="/voting"
            className="flex-1 max-w-[160px] md:max-w-none md:flex-none bg-white/10 backdrop-blur-md text-on-surface border border-white/20 px-0 md:px-10 py-3.5 md:py-4 rounded text-xs md:text-lg font-bold hover:bg-white/20 transition-all active:scale-95 shadow-2xl text-center"
          >
            Vote Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
