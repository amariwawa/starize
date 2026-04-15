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
      <div className="flex items-center justify-between px-6 md:px-10 py-5 max-w-full mx-auto h-24 md:h-32 relative overflow-hidden">
        {/* Left: Logo */}
        <div className="flex-1 flex items-center h-full">
          <Link href="/" className="absolute top-1/2 -translate-y-1/2 left-6 md:left-10 transition-all duration-300">
            <img 
              src="/logo.png" 
              alt="STARIZE Logo" 
              className="h-28 w-auto max-w-[160px] md:h-36 md:max-w-none lg:h-44 object-contain" 
            />
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop only) */}
        <div className="hidden lg:flex flex-none items-center justify-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={clsx(
                "font-headline font-bold tracking-tight transition-all text-xs xl:text-sm uppercase whitespace-nowrap",
                isLinkActive(link.path, link.name)
                  ? "text-amber-400 border-b-2 border-amber-500 pb-0.5"
                  : "text-neutral-400 hover:text-amber-200"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: Action Button */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <button
            onClick={() => router.push("/voting")}
            className="liquid-gold-btn text-on-primary px-8 py-3 rounded-full text-xs md:text-sm font-headline font-bold active:scale-95 duration-150 transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Vote Now
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Links (Scrollable row) */}
      <div className="lg:hidden flex items-center justify-start gap-8 pb-5 overflow-x-auto px-6 scrollbar-hide border-t border-white/5 pt-4 bg-black/50">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className={clsx(
              "font-headline font-bold tracking-tight transition-all text-sm uppercase whitespace-nowrap inline-block",
              isLinkActive(link.path, link.name)
                ? "text-amber-400"
                : "text-neutral-400 hover:text-amber-200"
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
