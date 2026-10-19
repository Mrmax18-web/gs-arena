import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

// Mock dependencies
const mockSignIn = vi.fn().mockResolvedValue(undefined);
const mockSignUp = vi.fn().mockResolvedValue(undefined);
const mockApplyForAdmin = vi.fn().mockResolvedValue(undefined);
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    role: 'public',
    signIn: mockSignIn,
    signUp: mockSignUp,
    applyForAdmin: mockApplyForAdmin,
  }),
}));

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock('../lib/firebase', () => ({
  isFirebaseConfigured: () => true,
  db: { type: 'firestore-mock' },
  auth: { type: 'auth-mock' },
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    collection: vi.fn((_db: any, path: string) => ({ type: 'collection-ref', path })),
    query: vi.fn((ref: any) => ref),
    onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  };
});

describe('LoginPage Mobile & Touch Usability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a single form wrapping email, password inputs and submit button', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const forms = container.querySelectorAll('form');
    expect(forms).toHaveLength(1);

    const form = forms[0];
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = within(form).getByRole('button', { name: /^sign in$/i });

    expect(form.contains(emailInput)).toBe(true);
    expect(form.contains(passwordInput)).toBe(true);
    expect(form.contains(submitBtn)).toBe(true);
  });

  it('associates labels with inputs and provides proper mobile autoComplete and type attributes', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    expect(emailInput.id).toBe('signin-email');
    expect(emailInput.name).toBe('email');
    expect(emailInput.type).toBe('email');
    expect(emailInput.autocomplete).toBe('email');

    expect(passwordInput.id).toBe('signin-password');
    expect(passwordInput.name).toBe('password');
    expect(passwordInput.type).toBe('password');
    expect(passwordInput.autocomplete).toBe('current-password');
  });

  it('ensures submit button has type="submit", min 44px touch height, and is enabled by default', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const form = container.querySelector('form')!;
    const submitBtn = within(form).getByRole('button', { name: /^sign in$/i }) as HTMLButtonElement;
    expect(submitBtn.type).toBe('submit');
    expect(submitBtn.disabled).toBe(false);
    expect(submitBtn.className).toContain('min-h-[44px]');
  });

  it('provides accessible form and inputs when switching to Register tab', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Click register tab button
    const tabs = screen.getAllByRole('button');
    const registerTab = tabs.find((btn) => btn.textContent?.trim() === 'Register')!;
    fireEvent.click(registerTab);

    const forms = container.querySelectorAll('form');
    expect(forms).toHaveLength(1);

    const nameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitBtn = within(forms[0]).getByRole('button', { name: /create account/i }) as HTMLButtonElement;

    expect(nameInput.id).toBe('signup-displayName');
    expect(emailInput.id).toBe('signup-email');
    expect(passwordInput.id).toBe('signup-password');
    expect(passwordInput.autocomplete).toBe('new-password');
    expect(submitBtn.type).toBe('submit');
    expect(submitBtn.className).toContain('min-h-[44px]');
  });

  it('submits credentials through the form onSubmit handler', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const form = container.querySelector('form')!;
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = within(form).getByRole('button', { name: /^sign in$/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'tester@gs-arena.test' } });
      fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
      fireEvent.click(submitBtn);
    });

    expect(mockSignIn).toHaveBeenCalledWith('tester@gs-arena.test', 'Secret123!');
  });
});

describe('useFirestoreCollection Listener Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT invoke onSnapshot when enabled: false is provided', () => {
    const { result } = renderHook(() =>
      useFirestoreCollection('adminRequests', [], undefined, { enabled: false })
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('invokes onSnapshot and manages cleanup when enabled: true is provided', () => {
    const mockUnsub = vi.fn();
    mockOnSnapshot.mockImplementation((_query: any, onNext: any) => {
      onNext({
        forEach: (cb: any) => {
          cb({ data: () => ({ id: 'req-1', status: 'pending' }) });
        },
      });
      return mockUnsub;
    });

    const { result, unmount } = renderHook(() =>
      useFirestoreCollection<{ id: string; status: string }>(
        'adminRequests',
        [],
        undefined,
        { enabled: true }
      )
    );

    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([{ id: 'req-1', status: 'pending' }]);

    unmount();
    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });
});
