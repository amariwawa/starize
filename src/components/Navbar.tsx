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
      <div className="max-w-7xl mx-auto px-1 md:px-10 flex items-center justify-between py-1 md:py-8 h-16 md:h-32 transition-all duration-300 overflow-hidden">
        {/* Left: Starize Logo (Bigger) */}
        <div className="flex-none flex items-center h-full">
          <Link href="/" className="transition-all duration-300 hover:scale-105 active:scale-95">
            <img 
              src="/logo.png" 
              alt="STARIZE Logo" 
              className="h-12 w-auto md:h-36 lg:h-44 object-contain" 
            />
          </Link>
        </div>

        {/* Center: Essential links in one line, tight tracking, NO OVERFLOW */}
        <div className="flex-grow flex items-center justify-center overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-4 md:gap-8">
            {navLinks.slice(2, 5).map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={clsx(
                  "font-headline font-black transition-all uppercase whitespace-nowrap",
                  "text-[10px] sm:text-xs md:text-sm lg:text-sm xl:text-base tracking-tighter sm:tracking-normal", 
                  isLinkActive(link.path, link.name)
                    ? "text-amber-400"
                    : "text-neutral-400 hover:text-amber-200"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Vote Now Button */}
        <div className="flex-none flex items-center">
          <button
            onClick={() => router.push("/voting")}
            className="liquid-gold-btn text-on-primary px-2.5 sm:px-8 py-1.5 sm:py-3 rounded-full text-[10px] sm:text-sm font-headline font-black active:scale-95 duration-150 transition-all shadow-xl whitespace-nowrap"
          >
            Vote Now
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
