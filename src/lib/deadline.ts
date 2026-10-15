/**
 * Registration Deadline utilities for GS Arena
 */

export function isRegistrationExpired(deadlineStr?: string | null): boolean {
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return false;
  return Date.now() > deadline.getTime();
}

export function isDeadlineNear(deadlineStr?: string | null, thresholdHours = 24): boolean {
  if (!deadlineStr) return false;
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return false;
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return false;
  return diffMs <= thresholdHours * 60 * 60 * 1000;
}

export function formatTimeRemaining(targetDate: Date | string | null | undefined): string {
  if (!targetDate) return '';
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  if (isNaN(target.getTime())) return '';

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 1) {
    return `${days} days, ${hours}h`;
  }
  if (days === 1) {
    return `1 day, ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatDeadlineDateTime(deadlineStr?: string | null): string {
  if (!deadlineStr) return 'Not set';
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return 'Not set';
  return deadline.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
