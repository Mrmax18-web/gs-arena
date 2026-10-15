import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

export interface HudCardProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  accent?: "orange" | "red";
  highlighted?: boolean;
}

/** Corner-bracketed arena card with an accessible reduced-motion hover lift. */
export function HudCard({
  accent = "orange",
  highlighted = false,
  children,
  className = "",
  ...props
}: HudCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={`hud-card ${className}`}
      data-accent={accent}
      data-highlighted={highlighted}
      whileHover={reducedMotion ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <span className="corner corner--tl" aria-hidden="true" />
      <span className="corner corner--tr" aria-hidden="true" />
      <span className="corner corner--bl" aria-hidden="true" />
      <span className="corner corner--br" aria-hidden="true" />
      {children}
    </motion.div>
  );
}
