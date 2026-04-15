"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const About = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("April 18, 2026 00:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Scroll animation hooks for each section
  const legacy = useScrollAnimation("fadeUp");
  const countdown = useScrollAnimation("fadeRight", { delay: 0.2 });
  const celestialHeader = useScrollAnimation("fadeUp");
  const aboutLeft = useScrollAnimation("fadeLeft");
  const aboutRight = useScrollAnimation("fadeRight", { delay: 0.15 });
  const visionary = useScrollAnimation("fadeUp");
  const visionaryImage = useScrollAnimation("fadeLeft");
  const visionaryText = useScrollAnimation("fadeRight", { delay: 0.15 });
  const pillar1 = useScrollAnimation("fadeUp");
  const pillar2 = useScrollAnimation("fadeUp", { delay: 0.15 });
  const pillar3 = useScrollAnimation("fadeUp", { delay: 0.3 });
  const arenaCard = useScrollAnimation("fadeLeft");
  const ctaCard = useScrollAnimation("fadeRight", { delay: 0.15 });

  // Track which image is actively tapped on mobile (for grayscale toggle)
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const toggleImage = useCallback((id: string) => {
    setActiveImage((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      <section className="bg-surface-dim py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end mb-24">
            <motion.div {...legacy.motionProps}>
              <h2 className="text-4xl md:text-5xl font-black font-headline text-on-surface mb-8 tracking-tight">
                A Legacy of <br />
                <span className="text-primary">Excellence.</span>
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                Since it's inception, Starize has gradually grown into a vibrant community of young creatives, music lovers, and supporters who believe in the power of music as a tool for inspiration and positive influence.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary">
                  <div className="text-3xl font-black text-on-surface mb-1 font-headline">
                    250+
                  </div>
                  <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                    Active Contestants
                  </div>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary">
                  <div className="text-3xl font-black text-on-surface mb-1 font-headline">
                    6
                  </div>
                  <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider">
                    Past Winners
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div {...countdown.motionProps} className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 shadow-2xl">
              <h3 className="text-center font-bold uppercase tracking-[0.3em] text-primary mb-8 text-sm">
                Main Event Countdown
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-black font-headline text-on-surface">
                    {timeLeft.days.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase mt-2">
                    Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-black font-headline text-on-surface">
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase mt-2">
                    Hours
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-black font-headline text-on-surface">
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase mt-2">
                    Mins
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-6xl font-black font-headline text-on-surface">
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase mt-2">
                    Secs
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-10 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold uppercase tracking-wider text-on-surface">
                    Live Finale Tickets
                  </span>
                </div>
                <span className="text-primary font-bold">94% Sold</span>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Content from original About page */}
      <section id="about" className="relative pt-4 md:pt-10 pb-16 md:pb-24 px-8 max-w-7xl mx-auto text-center scroll-mt-28">
        <motion.div {...celestialHeader.motionProps}>
          <p className="text-primary font-label tracking-[0.3em] uppercase text-xs mb-4">
            Our Legacy &amp; Mission
          </p>
          <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter liquid-gold-text mb-8">
            Our Mission
          </h1>
          <p className="max-w-2xl mx-auto text-on-surface-variant text-lg leading-relaxed">
            Beyond the spotlight lies a purpose-driven mission to unveil the creative
            gifts within the next generation of world-changers.
          </p>
        </motion.div>
      </section>
      <section className="px-8 py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...aboutLeft.motionProps} className="space-y-8">
              <div className="inline-block px-4 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/20">
                <span className="text-primary-fixed text-xs font-bold tracking-widest uppercase">
                  About Starize
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-headline text-on-surface tracking-tight leading-tight">
                A Faith-Driven <span className="text-primary">Ecosystem</span> for
                Creative Excellence.
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-lg">
                Starize is a gospel music talent platform created to identify and support young individuals with an exceptional musical ability.
                The competition was established with the vision of providing a space where emerging talents can grow, receive exposure, and develop their gifts within a supportive and faith-driven environment.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="bg-surface-container-low p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-4xl mb-4">
                    stars
                  </span>
                  <h4 className="text-on-surface font-bold text-xl mb-2">
                    Talent Discovery
                  </h4>
                  <p className="text-on-surface-variant text-sm">
                    Identifying unique gifts across musical and creative
                    disciplines.
                  </p>
                </div>
                <div className="bg-surface-container-low p-6 rounded-xl">
                  <span className="material-symbols-outlined text-primary text-4xl mb-4">
                    auto_graph
                  </span>
                  <h4 className="text-on-surface font-bold text-xl mb-2">
                    Strategic Growth
                  </h4>
                  <p className="text-on-surface-variant text-sm">
                    Professional mentorship and technical skill development.
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div {...aboutRight.motionProps} className="grid grid-cols-2 gap-4 h-[400px] md:h-[600px]">
              <div
                className="rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                onClick={() => toggleImage("singer")}
              >
                <img
                  src="/images/about/singer-performance.jpg"
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    activeImage === "singer" ? "grayscale-0" : "grayscale"
                  } hover:grayscale-0`}
                  alt="Starize singer performing on stage"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="space-y-4 pt-12">
                <div className="h-1/2 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/about/host-stage.jpg"
                    className="w-full h-full object-cover"
                    alt="Starize host on stage"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div
                  className="h-1/2 rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
                  onClick={() => toggleImage("lights")}
                >
                  <img
                    src="/images/about/stage-lights.jpg"
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      activeImage === "lights" ? "grayscale-0" : "grayscale"
                    } hover:grayscale-0`}
                    alt="Starize stage setup with lights"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <section className="px-8 py-24 bg-surface-dim overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start lg:items-stretch">
            <motion.div {...visionaryImage.motionProps} className="lg:col-span-5 relative lg:h-full">
              <span className="pointer-events-none absolute -left-2 -top-2 h-20 w-20 border-l-2 border-t-2 border-primary/60" />
              <span className="pointer-events-none absolute -right-2 -bottom-2 h-20 w-20 border-r-2 border-b-2 border-primary/60" />
              <div className="relative z-10 aspect-[4/5] lg:aspect-auto lg:h-full overflow-hidden rounded-3xl border border-white/10 bg-surface-container-low shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  className="h-full w-full object-cover"
                  alt="Mrs. Shammah Joshua"
                />
              </div>
            </motion.div>

            <motion.div {...visionaryText.motionProps} className="lg:col-span-7 lg:pl-12 pt-0">
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">
                The Visionary
              </p>
              <h2 className="text-5xl font-black font-headline text-on-surface tracking-tighter mb-4">
                Mrs. Shammah Joshua
              </h2>
              <p className="text-primary-fixed-dim text-xl font-medium italic mb-8">
                Convener, Starize
              </p>

              <div className="mb-8">
                <p className="text-4xl text-primary/60 leading-none mb-1">&quot;</p>
                <p className="text-2xl md:text-3xl text-on-surface font-light leading-snug tracking-tight">
                  Our mission is to create a platform where young talents can be discovered, nurtured,
                  and given the opportunity to share their gifts with the world.
                </p>
                <p className="text-4xl text-primary/60 leading-none mt-1 text-right">&quot;</p>
              </div>

              <div className="h-px w-24 bg-primary/70 mb-7" />

              <p className="text-on-surface-variant text-lg leading-relaxed mb-8 max-w-2xl">
                Mrs. Shammah Joshua is a distinguished advocate for youth development
                and a passionate supporter of gospel music excellence. With over a
                decade of experience in community building, she has dedicated her life
                to empowering young people to harness their creative gifts for positive
                social and spiritual impact.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-surface-container-high/85 border border-white/10 px-6 py-5">
                  <h4 className="text-on-surface font-bold text-lg mb-1">
                    Music Excellence
                  </h4>
                  <p className="text-on-surface-variant text-sm">
                    Standardizing Gospel Artistry
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-high/85 border border-white/10 px-6 py-5">
                  <h4 className="text-on-surface font-bold text-lg mb-1">
                    Youth Empowerment
                  </h4>
                  <p className="text-on-surface-variant text-sm">
                    Unlocking Latent Potentials
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-8 py-32 bg-surface-dim">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <motion.div {...pillar1.motionProps} className="space-y-6">
              <div className="text-primary text-5xl font-black font-headline">01.</div>
              <h3 className="text-2xl font-bold text-on-surface uppercase tracking-widest">Faith</h3>
              <p className="text-on-surface-variant leading-relaxed">
                The foundation of everything we build and every talent we nurture.
              </p>
            </motion.div>
            <motion.div {...pillar2.motionProps} className="space-y-6">
              <div className="text-primary text-5xl font-black font-headline">02.</div>
              <h3 className="text-2xl font-bold text-on-surface uppercase tracking-widest">Excellence</h3>
              <p className="text-on-surface-variant leading-relaxed">
                A commitment to the highest technical and professional standards.
              </p>
            </motion.div>
            <motion.div {...pillar3.motionProps} className="space-y-6">
              <div className="text-primary text-5xl font-black font-headline">03.</div>
              <h3 className="text-2xl font-bold text-on-surface uppercase tracking-widest">Integrity</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Cultivating character that sustains the platform of public influence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-8 pt-2 pb-24 bg-surface-dim">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div {...arenaCard.motionProps} className="relative">
              <Link href="/events" className="block relative group h-[300px] rounded-2xl overflow-hidden border border-white/5 shadow-2xl cursor-pointer">
                <img
                  src="/images/hero-bg.jpg"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  alt="Grand Finale Arena"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 space-y-3">
                  <h3 className="text-2xl font-bold text-white font-headline">Grand Finale Arena</h3>
                  <p className="text-neutral-300 text-sm max-w-sm leading-relaxed">
                    Experience the crowning moment of Starize Season 7. Tap here to secure your spot.
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div {...ctaCard.motionProps} className="bg-primary h-[300px] rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-on-primary text-4xl">workspace_premium</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-on-primary font-headline uppercase tracking-tighter leading-tight">
                  Become the<br />Next Star
                </h3>
              </div>
              <div className="flex items-center gap-2 text-on-primary font-bold uppercase tracking-widest text-sm cursor-pointer hover:gap-4 transition-all">
                Register Today <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
