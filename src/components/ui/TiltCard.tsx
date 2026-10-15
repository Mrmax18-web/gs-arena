import React, { useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glow?: string;
}

export function TiltCard({
  children,
  className,
  intensity = 8,
  glow,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(0);
  const [rotateY, setRotateY] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;
    setRotateX(-normY * intensity);
    setRotateY(normX * intensity);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="inline-block w-full transition-transform duration-200"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
            isHovered ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)'
          }`,
          boxShadow:
            isHovered && glow
              ? `0 15px 35px -5px ${glow}40, 0 0 15px ${glow}30`
              : undefined,
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out'
            : 'transform 0.4s ease-out, box-shadow 0.4s ease-out',
        }}
        className={cn('will-change-transform transform-gpu', className)}
      >
        {children}
      </div>
    </div>
  );
}
