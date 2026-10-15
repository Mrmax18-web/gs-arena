import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface FeatureItem {
  label: string;
  included: boolean;
  note?: string;
}

export interface FeatureListProps {
  features: FeatureItem[];
  className?: string;
}

/**
 * Check / Cross feature matrix list matching Reference-B pricing package specifications.
 * Used on Registration tier cards and tournament rule breakdowns.
 */
export function FeatureList({ features, className }: FeatureListProps) {
  return (
    <ul className={cn('space-y-2.5 divide-y divide-border/40 text-sm', className)}>
      {features.map((item, idx) => (
        <li
          key={idx}
          className={cn(
            'flex items-center gap-3 pt-2.5 first:pt-0',
            item.included ? 'text-foreground' : 'text-muted/60'
          )}
        >
          <span
            className={cn(
              'shrink-0 flex items-center justify-center w-4 h-4 rounded-full border text-[10px]',
              item.included
                ? 'border-success/50 bg-success/10 text-success'
                : 'border-border/60 bg-surface-2/40 text-muted/50'
            )}
            aria-hidden="true"
          >
            {item.included ? <Check className="w-2.5 h-2.5 stroke-[2.5]" /> : <X className="w-2.5 h-2.5 stroke-[2]" />}
          </span>

          <span className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
            <span className="truncate">{item.label}</span>
            {item.note && (
              <span className="font-mono text-[10px] text-muted tracking-wider uppercase shrink-0">
                {item.note}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
