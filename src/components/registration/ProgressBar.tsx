import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  isFreeFire?: boolean;
}

export function ProgressBar({ currentStep, totalSteps, isFreeFire = false }: ProgressBarProps) {
  const steps = isFreeFire
    ? [
        { id: 1, label: 'Game' },
        { id: 2, label: 'Format' },
        { id: 3, label: 'Team' },
        { id: 4, label: 'Roster' },
        { id: 5, label: 'Payment' },
      ]
    : [
        { id: 1, label: 'Game' },
        { id: 3, label: 'Team' },
        { id: 4, label: 'Roster' },
        { id: 5, label: 'Payment' },
      ];

  const maxStepId = 5;
  const numSteps = steps.length;
  const maxStepIndex = numSteps - 1;

  // Find index of current step in step array
  let currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  if (currentStepIndex === -1) {
    if (currentStep > maxStepId) currentStepIndex = numSteps;
    else currentStepIndex = 0;
  }

  const progressPercent =
    currentStep > maxStepId
      ? 100
      : Math.round((currentStepIndex / maxStepIndex) * 100);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 space-y-3">
      {/* Connecting Track */}
      <div className="relative flex items-center justify-between">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-white/10 z-0" />

        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-gradient-to-r from-orange-600 via-amber-500 to-rose-500 transition-all duration-500 ease-out z-0"
          style={{ width: `${progressPercent}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300',
                  isCompleted &&
                    'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-100',
                  isCurrent &&
                    'bg-orange-500 text-white ring-4 ring-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.6)] scale-110',
                  isUpcoming &&
                    'bg-[#0f111a] text-gray-500 border border-white/15'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
              </div>

              <span
                className={cn(
                  'text-[11px] font-semibold tracking-wide uppercase mt-1.5 transition-colors',
                  isCurrent && 'text-orange-400 font-bold',
                  isCompleted && 'text-gray-200',
                  isUpcoming && 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
