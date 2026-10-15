import React, { useId, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';
import { AnnotationCurvedArrow } from '../../lib/icons';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface MorphTabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  density?: 'compact' | 'default' | 'comfortable';
  variant?: 'underline' | 'segmented';
  panels?: Record<string, React.ReactNode>;
  note?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Broadcast Noir MorphTabs unifying REFERENCE-A hairline tabs with REFERENCE-B segmented pill toggles.
 * Features fluid spring layout morphing, full WCAG roving tabindex keyboard navigation,
 * and automated mobile horizontal scroll centering.
 */
export function MorphTabs({
  tabs,
  value,
  onChange,
  density = 'default',
  variant = 'underline',
  panels,
  note,
  className,
  'aria-label': ariaLabel = 'Navigation tabs',
}: MorphTabsProps) {
  const instanceId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto scroll active tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current && listRef.current) {
      const list = listRef.current;
      const tab = activeTabRef.current;
      const tabRect = tab.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();

      if (tabRect.left < listRect.left || tabRect.right > listRect.right) {
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [value]);

  // Keyboard navigation: roving tabindex & Left/Right/Home/End
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex: number | null = null;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = tabs.length - 1;
      }

      if (targetIndex !== null) {
        e.preventDefault();
        const nextTab = tabs[targetIndex];
        onChange(nextTab.id);
        const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
        buttons?.[targetIndex]?.focus();
      }
    },
    [tabs, onChange]
  );

  const densityClasses = {
    compact: 'px-2.5 py-1 text-xs gap-1.5',
    default: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2',
    comfortable: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const isSegmented = variant === 'segmented';

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Tab bar header container */}
      <div className="relative flex items-center">
        <div
          ref={listRef}
          role="tablist"
          aria-label={ariaLabel}
          className={cn(
            'flex items-center overflow-x-auto scrollbar-none snap-x snap-mandatory relative z-0',
            isSegmented
              ? 'rounded-full border border-border bg-surface-2/70 p-1 backdrop-blur-xl'
              : 'border-b border-border w-full divide-x divide-border/40'
          )}
        >
          {tabs.map((tab, idx) => {
            const isActive = tab.id === value;
            const tabId = `${instanceId}-tab-${tab.id}`;
            const panelId = `${instanceId}-panel-${tab.id}`;

            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                id={tabId}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={panelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={cn(
                  'relative snap-start flex items-center justify-center shrink-0 font-mono transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-background select-none',
                  densityClasses[density],
                  isSegmented ? 'rounded-full' : 'rounded-[6px]',
                  isActive
                    ? 'font-bold text-foreground'
                    : 'text-muted/70 hover:text-foreground hover:bg-surface/30'
                )}
              >
                {/* Active Indicator Sliding Thumb / Pill */}
                {isActive && (
                  <motion.div
                    layoutId={`morphTabActive-${instanceId}`}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                      mass: 0.9,
                    }}
                    className={cn(
                      'absolute inset-0 pointer-events-none -z-10',
                      isSegmented
                        ? 'rounded-full bg-surface border border-accent/40 shadow-[0_1px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
                        : 'rounded-[6px] bg-surface-2 border border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    )}
                  />
                )}

                {tab.icon && (
                  <span
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-accent' : 'text-muted/60'
                    )}
                  >
                    {tab.icon}
                  </span>
                )}

                <span className="tracking-wide uppercase text-[11px] sm:text-[12px] whitespace-nowrap">
                  {tab.label}
                </span>

                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.2 rounded-[4px] text-[10px] font-mono leading-none border',
                      isActive
                        ? 'border-accent/40 bg-accent/15 text-accent font-semibold'
                        : 'border-border bg-surface-2/40 text-muted/80'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Floating annotation note (Reference-B "save 25%" style with curved arrow) */}
        {isSegmented && note && (
          <div className="hidden sm:flex items-center gap-1.5 ml-3 font-mono text-[11px] font-semibold text-accent animate-pulse select-none">
            <AnnotationCurvedArrow className="text-accent shrink-0 -scale-y-100" />
            <span>{note}</span>
          </div>
        )}
      </div>

      {/* Optional animated tab panels */}
      {panels && (
        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              id={`${instanceId}-panel-${value}`}
              role="tabpanel"
              aria-labelledby={`${instanceId}-tab-${value}`}
              tabIndex={0}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="focus-visible:outline-none"
            >
              {panels[value]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
