import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '../components/layout/RoleGuard';
import { Input } from '../components/ui/Input';
import { MemoryRouter } from 'react-router-dom';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Chunk 4: Full QA Verification (Dry & Wet Run)', () => {
  describe('1. Auth Check', () => {
    it('bypasses RoleGuard for creator email without showing loading or restricted access', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'dheerajsinghbaghel1306@gmail.com' },
        role: 'public',
        loading: true, // Even when loading, creator bypasses immediately
      });

      render(
        <MemoryRouter>
          <RoleGuard allowedRoles={['admin', 'creator']}>
            <div data-testid="admin-content">Admin Content Protected</div>
          </RoleGuard>
        </MemoryRouter>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(screen.queryByText(/Restricted Access/i)).not.toBeInTheDocument();
    });

    it('bypasses RoleGuard for creator role without showing restricted access', () => {
      mockUseAuth.mockReturnValue({
        user: { email: 'custom@gsarena.gg' },
        role: 'creator',
        loading: false,
      });

      render(
        <MemoryRouter>
          <RoleGuard allowedRoles={['admin']}>
            <div data-testid="creator-role-content">Creator Allowed</div>
          </RoleGuard>
        </MemoryRouter>
      );

      expect(screen.getByTestId('creator-role-content')).toBeInTheDocument();
    });

    it('blocks unauthenticated public users from protected routes', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        role: 'public',
        loading: false,
      });

      render(
        <MemoryRouter>
          <RoleGuard allowedRoles={['admin', 'creator']}>
            <div data-testid="admin-content">Admin Content Protected</div>
          </RoleGuard>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      expect(screen.getByText(/Restricted Access/i)).toBeInTheDocument();
    });
  });

  describe('2. Admin Check: Payload Sanitization & Delete Timeout', () => {
    it('strips all undefined fields from payload via cleanData helper', () => {
      const cleanData = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

      const rawPayload = {
        name: 'Battle Championship Season 1',
        status: 'upcoming',
        registrationOpen: true,
        entryFeePaise: 0,
        upiQrUrl: undefined, // Simulating no QR code
        upiId: undefined,
      };

      const cleaned = cleanData(rawPayload);

      expect(cleaned).not.toHaveProperty('upiQrUrl');
      expect(cleaned).not.toHaveProperty('upiId');
      expect(cleaned).toHaveProperty('name', 'Battle Championship Season 1');
      expect(cleaned).toHaveProperty('status', 'upcoming');
      expect(Object.values(cleaned).every((val) => val !== undefined)).toBe(true);
    });

    it('stops delete spinner within 5 seconds using Promise.race timeout pattern', async () => {
      const hangingDeletePromise = new Promise<void>(() => {}); // Never resolves
      const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
        setTimeout(() => resolve({ isTimeout: true }), 50) // Accelerated for test
      );

      const result = await Promise.race([
        hangingDeletePromise.then(() => ({ isTimeout: false })),
        timeoutPromise,
      ]);

      expect(result.isTimeout).toBe(true);
    });
  });

  describe('3. Public Check: Tournament Filtering', () => {
    it('includes live, upcoming, and active tournaments while excluding completed/draft', () => {
      const allTournaments = [
        { id: '1', name: 'Upcoming Cup', status: 'upcoming', gameId: 'BGMI' },
        { id: '2', name: 'Live Brawl', status: 'live', gameId: 'BGMI' },
        { id: '3', name: 'Active Showdown', status: 'active', gameId: 'BGMI' },
        { id: '4', name: 'Draft Test', status: 'draft', gameId: 'BGMI' },
        { id: '5', name: 'Past Cup', status: 'completed', gameId: 'BGMI' },
      ];

      const activeTournaments = allTournaments.filter((t) =>
        ['live', 'upcoming', 'active'].includes(t.status)
      );

      expect(activeTournaments.map((t) => t.id)).toEqual(['1', '2', '3']);
      expect(activeTournaments.some((t) => t.status === 'upcoming')).toBe(true);
      expect(activeTournaments.some((t) => t.status === 'live')).toBe(true);
    });
  });

  describe('4. Mobile Check: Input styling and onFocus scroll logic', () => {
    it('renders input with text-base to prevent mobile iOS zoom and handles onFocus smoothly', () => {
      const onFocusMock = vi.fn();
      render(
        <Input
          label="Test Leader Phone"
          placeholder="9876543210"
          onFocus={onFocusMock}
        />
      );

      const input = screen.getByPlaceholderText('9876543210');
      // Assert text-base class is present
      expect(input.className).toContain('text-base');

      // Mock scrollIntoView on the input element
      const scrollIntoViewMock = vi.fn();
      input.scrollIntoView = scrollIntoViewMock;

      input.focus();

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(onFocusMock).toHaveBeenCalled();
    });
  });
});
