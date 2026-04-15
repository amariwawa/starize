"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [aboutInView, setAboutInView] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/#about" },
    { name: "Contestants", path: "/contestants" },
    { name: "Voting", path: "/voting" },
    { name: "Events", path: "/events" },
    { name: "Sponsors", path: "/events#sponsors" },
  ];

  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      if (!aboutSection) return;

      const sectionTop =
        aboutSection.getBoundingClientRect().top + window.scrollY - 140;
      setAboutInView(window.scrollY >= sectionTop);
    };

    const rafId = requestAnimationFrame(handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  const isLinkActive = (linkPath: string, linkName: string) => {
    if (linkName === "About" && pathname === "/") {
      return aboutInView;
    }

    if (linkName === "Home" && pathname === "/") {
      return !aboutInView;
    }

    return pathname === linkPath;
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav border-b border-white/5 shadow-lg overflow-hidden max-w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col lg:flex-row items-center justify-between py-6 md:py-8 min-h-[140px] lg:h-32 transition-all duration-300">
        {/* Top Section (Logo & Button) - Stays top on mobile, merges on desktop */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start lg:h-full gap-8 mb-6 lg:mb-0">
          <Link href="/" className="transition-all duration-300 hover:scale-105 active:scale-95">
            <img 
              src="/logo.png" 
              alt="STARIZE Logo" 
              className="h-16 w-auto md:h-36 lg:h-44 object-contain" 
            />
          </Link>

          <div className="lg:hidden">
            <button
              onClick={() => router.push("/voting")}
              className="liquid-gold-btn text-on-primary px-6 py-3 rounded-full text-xs font-headline font-black active:scale-95 duration-150 transition-all shadow-xl"
            >
              Vote Now
            </button>
          </div>
        </div>

        {/* Center/Links Section - Visible on both, scaled up on mobile */}
        <div className="w-full lg:w-auto flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 md:gap-8 xl:gap-10">
            {navLinks.slice(0, 5).map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={clsx(
                  "font-headline font-black tracking-tight transition-all uppercase whitespace-nowrap",
                  "text-[13px] sm:text-sm md:text-base lg:text-sm xl:text-base",
                  isLinkActive(link.path, link.name)
                    ? "text-amber-400 border-b-2 border-amber-500 pb-0.5"
                    : "text-neutral-400 hover:text-amber-200"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section (Desktop only CTA) */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => router.push("/voting")}
            className="liquid-gold-btn text-on-primary px-8 py-3 rounded-full text-sm font-headline font-black active:scale-95 duration-150 transition-all shadow-xl"
          >
            Vote Now
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
