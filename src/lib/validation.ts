/**
 * Tournament Tracker Pro - Validation Utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTeamName(name: string): ValidationResult {
  const clean = name?.trim();
  if (!clean) {
    return { valid: false, error: 'Team name is required' };
  }
  if (clean.length < 2) {
    return { valid: false, error: 'Team name must be at least 2 characters' };
  }
  if (clean.length > 35) {
    return { valid: false, error: 'Team name cannot exceed 35 characters' };
  }
  return { valid: true };
}

export function validateTeamTag(tag?: string): ValidationResult {
  if (!tag) return { valid: true };
  const clean = tag.trim();
  if (clean.length > 0 && (clean.length < 2 || clean.length > 5)) {
    return { valid: false, error: 'Tag must be 2 to 5 characters' };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  const clean = email?.trim().toLowerCase();
  if (!clean) {
    return { valid: false, error: 'Email address is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  const clean = phone?.trim().replace(/\D/g, '');
  if (!clean) {
    return { valid: false, error: 'Phone number is required' };
  }
  if (clean.length !== 10) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  return { valid: true };
}

export function validateGameUid(uid: string): ValidationResult {
  const clean = uid?.trim();
  if (!clean) {
    return { valid: false, error: 'In-Game UID is required' };
  }
  if (clean.length < 4 || clean.length > 20) {
    return { valid: false, error: 'UID must be between 4 and 20 characters' };
  }
  return { valid: true };
}

export function validateIgn(ign: string): ValidationResult {
  const clean = ign?.trim();
  if (!clean) {
    return { valid: false, error: 'In-Game Name (IGN) is required' };
  }
  if (clean.length < 2 || clean.length > 25) {
    return { valid: false, error: 'IGN must be between 2 and 25 characters' };
  }
  return { valid: true };
}

export function validateUpiRef(ref: string): ValidationResult {
  const clean = ref?.trim();
  if (!clean) {
    return { valid: false, error: 'UPI Transaction ID (UTR) is required' };
  }
  if (clean.length < 8) {
    return { valid: false, error: 'UTR reference must be at least 8 characters' };
  }
  return { valid: true };
}
