import { UserRole } from '../types/auth';

export function isCreator(role?: UserRole | null): boolean {
  return role === 'creator';
}

export function isAdmin(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'creator';
}

export function canManageTournaments(role?: UserRole | null): boolean {
  return isAdmin(role);
}

export function canAccessCreatorConsole(role?: UserRole | null): boolean {
  return isCreator(role);
}

export function canConfigureSystem(role?: UserRole | null): boolean {
  return isCreator(role);
}
