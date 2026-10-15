import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

export interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

/** Animates numerical changes while exposing the final value to assistive tech. */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 0.8,
}: AnimatedCounterProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  const current = useRef(reducedMotion ? value : 0);
  const formatter = useMemo(() => new Intl.NumberFormat("en-IN"), []);

  useEffect(() => {
    if (reducedMotion) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const animation = animate(current.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        current.current = latest;
        setDisplay(Math.round(latest));
      },
    });

    return () => animation.stop();
  }, [duration, reducedMotion, value]);

  return (
    <span
      className="counter"
      aria-label={`${prefix}${formatter.format(value)}${suffix}`}
    >
      <span aria-hidden="true">
        {prefix}
        {formatter.format(display)}
        {suffix}
      </span>
    </span>
  );
}
