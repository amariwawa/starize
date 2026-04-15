"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const Footer = () => {
  const footer = useScrollAnimation("fadeUp", { margin: "-40px" });

  return (
    <footer className="bg-black w-full pt-24 pb-12 font-body border-t border-white/5">
      <motion.div {...footer.motionProps} className="max-w-7xl mx-auto px-8 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          {/* Brand Column */}
          <div className="col-span-1 space-y-8">
            <div className="text-2xl font-black text-primary font-headline tracking-tighter">
              STARIZE S7
            </div>
            <p className="text-neutral-500 text-base leading-relaxed max-w-xs">
              Elevating the sound of the kingdom through excellence, talent discovery, and spiritual growth.
            </p>
          </div>

          {/* Platform Column */}
          <div className="space-y-8">
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-[0.2em]">Platform</h4>
            <ul className="space-y-4">
              <li><Link href="/auditions" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Auditions</Link></li>
              <li><Link href="/voting" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Voting System</Link></li>
              <li><Link href="/events" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Events Calendar</Link></li>
              <li><Link href="/contestants" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Contestant Hub</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-8">
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-[0.2em]">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Terms of Service</Link></li>
              <li><Link href="/about" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Privacy Policy</Link></li>
              <li><Link href="/about" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Cookie Policy</Link></li>
              <li><Link href="/events" className="text-neutral-500 hover:text-primary transition-colors text-sm font-medium">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-8">
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-[0.2em]">Newsletter</h4>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Stay updated with the latest news and stage announcements.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-full">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-surface-container-high border border-white/10 rounded px-4 py-3 text-sm w-full min-w-0 focus:outline-none focus:border-primary transition-colors"
              />
              <button className="bg-primary text-on-primary px-6 py-3 rounded font-bold text-sm hover:brightness-110 transition-all shrink-0">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-neutral-600 text-xs tracking-wide">
            © 2026 Starize Season 7. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <span className="material-symbols-outlined text-neutral-600 cursor-pointer hover:text-primary transition-colors text-xl">public</span>
            <span className="material-symbols-outlined text-neutral-600 cursor-pointer hover:text-primary transition-colors text-xl">alternate_email</span>
            <span className="material-symbols-outlined text-neutral-600 cursor-pointer hover:text-primary transition-colors text-xl">share</span>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
