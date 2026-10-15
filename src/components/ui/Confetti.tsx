import confetti from 'canvas-confetti';

export interface ConfettiOptions {
  colors?: string[];
  particleCount?: number;
  spread?: number;
}

const DEFAULT_COLORS = ['#FFD166', '#FF6B35', '#FF2D2D', '#F77F00', '#D62828', '#FFFFFF'];

export function fireConfetti(options?: ConfettiOptions): void {
  const colors = options?.colors || DEFAULT_COLORS;
  const count = options?.particleCount || 80;
  const spread = options?.spread || 70;

  confetti({
    particleCount: count,
    spread,
    origin: { y: 0.6 },
    colors,
    disableForReducedMotion: true,
  });

  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
  }, 150);
}
