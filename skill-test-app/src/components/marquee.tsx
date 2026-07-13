import type { ReactNode } from "react";

interface MarqueeProps {
  items: ReactNode[];
  duration?: number;
  className?: string;
}

export function Marquee({ items, duration = 40, className = "" }: MarqueeProps) {
  const doubled = [...items, ...items];
  return (
    <div className={`marquee ${className}`.trim()} aria-hidden="true">
      <div
        className="marquee__track"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((item, i) => (
          <div className="marquee__item" key={i}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
