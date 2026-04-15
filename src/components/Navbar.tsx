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
      <div className="flex items-center justify-between px-4 md:px-10 py-5 max-w-full mx-auto h-20 md:h-32 relative overflow-hidden">
        {/* Left: Logo */}
        <div className="flex-none flex items-center h-full">
          <Link href="/" className="transition-all duration-300">
            <img 
              src="/logo.png" 
              alt="STARIZE Logo" 
              className="h-14 w-auto md:h-36 lg:h-44 object-contain" 
            />
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop: All, Mobile: Key 3) */}
        <div className="flex-grow flex items-center justify-center gap-3 md:gap-6 xl:gap-8 px-2 md:px-0">
          {/* Mobile: Show top 3 only to keep it in one line without scrolling */}
          <div className="flex lg:hidden items-center justify-center gap-4">
            {navLinks.slice(0, 3).map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={clsx(
                  "font-headline font-bold tracking-tight text-[10px] uppercase whitespace-nowrap",
                  isLinkActive(link.path, link.name) ? "text-amber-400" : "text-neutral-400"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* Desktop: Show all */}
          <div className="hidden lg:flex items-center justify-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={clsx(
                  "font-headline font-bold tracking-tight transition-all text-sm uppercase whitespace-nowrap",
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

        {/* Right: Action Button */}
        <div className="flex-none flex items-center">
          <button
            onClick={() => router.push("/voting")}
            className="liquid-gold-btn text-on-primary px-4 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-sm font-headline font-bold active:scale-95 duration-150 transition-all shadow-lg"
          >
            Vote Now
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
