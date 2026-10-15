import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export interface HexButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  accent?: "orange" | "red";
}

/** Angular gradient-bordered action with press feedback and corner brackets. */
export function HexButton({
  children,
  accent = "orange",
  className = "",
  disabled,
  ...props
}: HexButtonProps) {
  return (
    <motion.button
      type="button"
      {...props}
      disabled={disabled}
      className={`hex-button cursor-pointer select-none ${className}`}
      data-accent={accent}
      whileTap={disabled ? undefined : { scale: 0.975 }}
      transition={{ duration: 0.16 }}
    >
      <span className="hex-button__inner pointer-events-none select-none">
        <span>{children}</span>
        <ArrowUpRight className="button-arrow" size={20} aria-hidden="true" />
        <span className="button-bracket tl" aria-hidden="true" />
        <span className="button-bracket tr" aria-hidden="true" />
        <span className="button-bracket bl" aria-hidden="true" />
        <span className="button-bracket br" aria-hidden="true" />
      </span>
    </motion.button>
  );
}
