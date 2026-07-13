import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  variant?: "up" | "left" | "right" | "scale";
  delay?: number;
  threshold?: number;
  once?: boolean;
  as?: ElementType;
}

export function Reveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
  threshold = 0.15,
  once = true,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) obs.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [once, threshold]);

  const variantClass =
    variant === "left"
      ? "reveal reveal--left"
      : variant === "right"
      ? "reveal reveal--right"
      : variant === "scale"
      ? "reveal reveal--scale"
      : "reveal";

  return (
    <Tag
      ref={ref as never}
      className={`${variantClass}${visible ? " is-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  threshold?: number;
}

export function Stagger({ children, className = "", gap = 80, threshold = 0.12 }: StaggerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);

  const items = Array.isArray(children) ? children : [children];

  return (
    <div
      ref={ref}
      className={`reveal--stagger${visible ? " is-visible" : ""} ${className}`.trim()}
      style={{ ["--stagger-gap" as string]: `${gap}ms` }}
    >
      {items.map((child, i) => (
        <div
          key={i}
          style={{ ["--stagger-index" as string]: i }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
