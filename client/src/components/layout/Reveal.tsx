import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Full class names so Tailwind can find them when scanning the source
const ENTER_FROM = {
  bottom: "motion-safe:slide-in-from-bottom-5",
  left: "motion-safe:slide-in-from-left-5",
  zoom: "motion-safe:zoom-in-95",
} as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  from?: keyof typeof ENTER_FROM;
  /** Delay in ms before the animation starts. */
  delay?: number;
  /** Wait until the element scrolls into view instead of animating on mount. */
  inView?: boolean;
}

/** Fades content in with a CSS animation; skipped for users who prefer reduced motion. */
export function Reveal({ children, className, from = "bottom", delay = 0, inView = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!inView);

  useEffect(() => {
    if (!inView || !ref.current || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        visible
          ? cn("motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:fill-mode-both", ENTER_FROM[from])
          : "motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
