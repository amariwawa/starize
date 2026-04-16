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
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center h-20 md:h-32 transition-all duration-300">
        {/* Left: Logo - Scaled up for Premium Presence */}
        <div className="flex items-center h-full mr-auto">
          <Link href="/" className="transition-all duration-300 hover:scale-105 active:scale-95">
            <img 
              src="/logo.png" 
              alt="STARIZE Logo" 
              className="h-20 w-auto md:h-36 lg:h-44 object-contain" 
            />
          </Link>
        </div>

        {/* Right: Links - Spread Left-to-Right and Scaled up */}
        <div className="flex items-center gap-4 lg:gap-8 transition-all">
          {navLinks.map((link, idx) => (
            <Link
              key={link.name}
              href={link.path}
              className={clsx(
                "font-headline font-black transition-all uppercase whitespace-nowrap",
                "text-sm lg:text-sm xl:text-base tracking-tight",
                isLinkActive(link.path, link.name)
                  ? "text-amber-400 border-b-2 border-amber-500 pb-0.5"
                  : "text-neutral-400 hover:text-amber-200",
                // Show About, Contestants, Voting, Events on mobile. Hide Home.
                (idx === 0) ? "hidden lg:flex" : "flex"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop-only Vote Now Button (Hidden on Mobile) */}
        <div className="ml-8 hidden md:flex items-center">
          <button
            onClick={() => router.push("/voting")}
            className="liquid-gold-btn text-on-primary px-8 py-3 rounded-full text-sm font-headline font-black active:scale-95 shadow-xl"
          >
            Vote Now
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
