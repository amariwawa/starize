"use client";

type ScrollAnimationOptions = {
  /** Trigger once or every time element enters view */
  once?: boolean;
  /** Viewport margin for earlier/later triggering (e.g. "-80px") */
  margin?: string;
  /** Delay in seconds before the animation starts */
  delay?: number;
  /** Duration of the animation in seconds */
  duration?: number;
};

const defaults: Required<ScrollAnimationOptions> = {
  once: true,
  margin: "-30px",
  delay: 0,
  duration: 0.6,
};

type AnimState = Record<string, { opacity: number; y?: number; x?: number; scale?: number }>;

const hidden: AnimState = {
  fadeUp: { opacity: 0, y: 40 },
  fadeDown: { opacity: 0, y: -40 },
  fadeLeft: { opacity: 0, x: -40 },
  fadeRight: { opacity: 0, x: 40 },
  fadeIn: { opacity: 0 },
  scale: { opacity: 0, scale: 0.9 },
  staggerChildren: { opacity: 0, y: 30 },
};

const visible: AnimState = {
  fadeUp: { opacity: 1, y: 0 },
  fadeDown: { opacity: 1, y: 0 },
  fadeLeft: { opacity: 1, x: 0 },
  fadeRight: { opacity: 1, x: 0 },
  fadeIn: { opacity: 1 },
  scale: { opacity: 1, scale: 1 },
  staggerChildren: { opacity: 1, y: 0 },
};

/**
 * Returns motion props for smooth scroll-triggered animations.
 *
 * Uses framer-motion's `initial` + `whileInView` which:
 * - Sets the hidden state immediately via inline styles (no FOUC)
 * - Animates to visible when the element enters the viewport
 * - Fires only once by default
 *
 * Usage:
 *   const anim = useScrollAnimation("fadeUp");
 *   <motion.div {...anim.motionProps}>
 */
export function useScrollAnimation(
  variant: "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "fadeIn" | "scale" | "staggerChildren",
  options?: ScrollAnimationOptions
) {
  const merged = { ...defaults, ...options };

  return {
    motionProps: {
      initial: hidden[variant],
      whileInView: visible[variant],
      viewport: { once: merged.once, margin: merged.margin },
      transition: {
        duration: merged.duration,
        delay: merged.delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };
}
