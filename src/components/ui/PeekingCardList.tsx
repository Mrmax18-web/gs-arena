import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface PeekingCardListProps {
  /** The card elements to render */
  children: React.ReactNode[];
  /** Optional container class name */
  className?: string;
  /** Gap in pixels between cards (default 16px / 1rem) */
  gapPx?: number;
  /** Accessible label for the horizontal card list */
  ariaLabel?: string;
}

/**
 * PeekingCardList implements the cognitive UX Law of Closure.
 *
 * When the list overflows the container, cards are dynamically sized such that
 * the next off-screen card peeks out by ~32%, signaling to the user that more content
 * exists without requiring explicit instruction.
 *
 * Formula: cardWidth = (100% - (visibleCount * gapPx)) / (visibleCount + 0.32)
 * Breakpoints:
 * - Mobile (<640px): visibleCount = 1
 * - Tablet (640px - 1024px): visibleCount = 2
 * - Desktop (>=1024px): visibleCount = 3
 *
 * If the list fits without overflow, no peek and no fade are applied.
 */
export const PeekingCardList: React.FC<PeekingCardListProps> = ({
  children,
  className = '',
  gapPx = 16,
  ariaLabel = 'Horizontal card list',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);

  // Determine visible count based on container width
  const updateLayout = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const width = el.clientWidth;
    let count = 1;
    if (width >= 1024) {
      count = 3;
    } else if (width >= 640) {
      count = 2;
    }
    setVisibleCount(count);

    const overflows = el.scrollWidth > el.clientWidth + 2;
    setHasOverflow(overflows);

    if (overflows) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateLayout();

    const handleScroll = () => {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateLayout, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateLayout);
      ro.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateLayout);
      if (ro) {
        ro.disconnect();
      }
    };
  }, [updateLayout, children.length]);

  // Card width calculation: (100% - gaps) / (visibleCount + 0.32)
  const cardStyle: React.CSSProperties = hasOverflow
    ? {
        flex: `0 0 calc((100% - ${visibleCount * gapPx}px) / ${visibleCount + 0.32})`,
        minWidth: `calc((100% - ${visibleCount * gapPx}px) / ${visibleCount + 0.32})`,
      }
    : {
        flex: '1 1 0%',
      };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Left Edge Gradient Fade */}
      {hasOverflow && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-black via-black/80 to-transparent transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={`flex w-full items-stretch focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500/50 rounded-2xl ${
          hasOverflow
            ? 'overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none'
            : 'overflow-visible'
        }`}
        style={{ gap: `${gapPx}px` }}
      >
        {React.Children.map(children, (child, idx) => (
          <div
            key={idx}
            className={hasOverflow ? 'snap-start shrink-0' : 'flex-1'}
            style={cardStyle}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Right Edge Gradient Fade */}
      {hasOverflow && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-black via-black/80 to-transparent transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
