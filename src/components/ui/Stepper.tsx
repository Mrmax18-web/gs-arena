import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@iconify/react';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  /** Ordered list of steps */
  steps: StepItem[];
  /** Zero-based index of the currently active step */
  currentStep: number;
  /** Callback fired when a step indicator is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Maximum step index the user has unlocked (defaults to currentStep) */
  maxAccessibleStep?: number;
  /** Accessible label for the navigation element */
  ariaLabel?: string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Stepper implements the cognitive UX Law of Uniform Connectedness.
 *
 * Visually connects discrete process phases with a thin connecting line that animates
 * from a dim neutral to glowing gold as the user progresses.
 *
 * Rules:
 * - Completed steps display a check icon.
 * - Active step is highlighted with aria-current="step".
 * - Future steps are visually muted.
 * - Users can freely return to completed steps, but cannot skip ahead past validation.
 * - Respects prefers-reduced-motion.
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  maxAccessibleStep = currentStep,
  ariaLabel = 'Form step progression',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const progressRatio = steps.length > 1 ? Math.min(1, Math.max(0, currentStep / (steps.length - 1))) : 1;

  return (
    <nav aria-label={ariaLabel} className={`w-full relative py-3 ${className}`}>
      {/* Background Track (Neutral) */}
      <div className="absolute top-7 left-8 right-8 h-0.5 bg-slate-200 dark:bg-white/10 -translate-y-1/2 z-0" />

      {/* Animated Glowing Gold Progress Line */}
      <motion.div
        className="absolute top-7 left-8 right-8 h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] -translate-y-1/2 z-0 origin-left"
        initial={false}
        animate={{ scaleX: progressRatio }}
        transition={{
          duration: shouldReduceMotion ? 0.01 : 0.4,
          ease: 'easeInOut',
        }}
      />

      {/* Step Indicators */}
      <ol className="relative z-10 flex items-start justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isAccessible = idx <= maxAccessibleStep;

          let circleClass = '';
          if (isCompleted) {
            circleClass =
              'border-amber-500 bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20';
          } else if (isActive) {
            circleClass =
              'border-amber-400 bg-black text-amber-400 ring-4 ring-amber-400/20 font-black shadow-lg shadow-amber-500/30';
          } else {
            circleClass =
              'border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 text-slate-400 dark:text-slate-600 font-semibold';
          }

          let textClass = '';
          if (isActive) {
            textClass = 'text-amber-500 dark:text-amber-400 font-black';
          } else if (isCompleted) {
            textClass = 'text-slate-800 dark:text-slate-200 font-semibold';
          } else {
            textClass = 'text-slate-400 dark:text-slate-500 font-medium';
          }

          return (
            <li key={step.id} className="flex flex-col items-center text-center max-w-[120px]">
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick?.(idx)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${idx + 1}: ${step.title}${isCompleted ? ' (Completed)' : ''}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${circleClass} ${
                  isAccessible && !isActive ? 'cursor-pointer hover:scale-105' : ''
                } ${!isAccessible ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isCompleted ? (
                  <Icon icon="solar:check-circle-bold" className="text-base" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>

              <span className={`text-xs mt-2 transition-colors ${textClass}`}>
                {step.title}
              </span>
              {step.description && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block truncate max-w-full">
                  {step.description}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
