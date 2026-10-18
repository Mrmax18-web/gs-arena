import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RoleGuard } from '../components/layout/RoleGuard';
import { isCreator, isAdmin, canAccessCreatorConsole } from '../lib/permissions';
import { UserRole } from '../types/auth';

// Mock useAuth
let mockRole: UserRole = 'public';
let mockUser: any = null;
let mockLoading = false;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    role: mockRole,
    loading: mockLoading,
  }),
}));

describe('RBAC and RoleGuard Protections', () => {
  it('correctly validates permission helper functions', () => {
    expect(isCreator('creator')).toBe(true);
    expect(isCreator('admin')).toBe(false);
    expect(isCreator('public')).toBe(false);

    expect(isAdmin('creator')).toBe(true);
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('public')).toBe(false);

    expect(canAccessCreatorConsole('creator')).toBe(true);
    expect(canAccessCreatorConsole('admin')).toBe(false);
    expect(canAccessCreatorConsole('public')).toBe(false);
  });

  it('renders restricted access screen when public user attempts to access creator console', () => {
    mockRole = 'public';
    mockUser = null;
    mockLoading = false;

    render(
      <BrowserRouter>
        <RoleGuard allowedRoles={['creator']}>
          <div>SUPER SECRET CREATOR CONTENT</div>
        </RoleGuard>
      </BrowserRouter>
    );

    expect(screen.queryByText('SUPER SECRET CREATOR CONTENT')).not.toBeInTheDocument();
    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
  });

  it('renders restricted access screen when admin user attempts to access creator console', () => {
    mockRole = 'admin';
    mockUser = { uid: 'admin-1', email: 'admin@esports.com' };
    mockLoading = false;

    render(
      <BrowserRouter>
        <RoleGuard allowedRoles={['creator']}>
          <div>SUPER SECRET CREATOR CONTENT</div>
        </RoleGuard>
      </BrowserRouter>
    );

    expect(screen.queryByText('SUPER SECRET CREATOR CONTENT')).not.toBeInTheDocument();
    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
  });

  it('renders protected content when user has creator role claim', () => {
    mockRole = 'creator';
    mockUser = { uid: 'creator-1', email: 'creator@esports.com' };
    mockLoading = false;

    render(
      <BrowserRouter>
        <RoleGuard allowedRoles={['creator']}>
          <div>SUPER SECRET CREATOR CONTENT</div>
        </RoleGuard>
      </BrowserRouter>
    );

    expect(screen.getByText('SUPER SECRET CREATOR CONTENT')).toBeInTheDocument();
  });
});
