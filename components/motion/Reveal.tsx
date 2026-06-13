"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

interface RevealProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
  /** Only animate the first time it enters the viewport. */
  once?: boolean;
  style?: CSSProperties;
}

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. Pure CSS transition driven by an IntersectionObserver — no deps, and
 * it degrades to "always visible" when reduced motion is requested.
 */
export default function Reveal({
  as,
  children,
  className = "",
  delay = 0,
  once = true,
  style,
}: RevealProps) {
  const Component = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once]);

  return (
    <Component
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      ref={ref}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}
