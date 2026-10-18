import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreatorLoginModal } from '../components/auth/CreatorLoginModal';

const mockGrantCreatorPermissions = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    grantCreatorPermissions: mockGrantCreatorPermissions,
  }),
}));

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

describe('CreatorLoginModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('allows typing full code without character truncation or overwrite', () => {
    const handleClose = vi.fn();
    render(<CreatorLoginModal isOpen={true} onClose={handleClose} />);

    const input = screen.getByLabelText(/master access code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '130620' } });

    expect(input.value).toBe('130620');
  });

  it('elevates creator role and saves to localStorage when code 130620 is verified', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <CreatorLoginModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const input = screen.getByLabelText(/master access code/i);
    fireEvent.change(input, { target: { value: '130620' } });

    const submitBtn = screen.getByRole('button', { name: /verify code/i });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem('gs_arena_creator')).toBe('true');
    expect(mockGrantCreatorPermissions).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
    expect(handleSuccess).toHaveBeenCalled();
  });

  it('shows error toast when incorrect code is entered', () => {
    const handleClose = vi.fn();
    render(<CreatorLoginModal isOpen={true} onClose={handleClose} />);

    const input = screen.getByLabelText(/master access code/i);
    fireEvent.change(input, { target: { value: '999999' } });

    const submitBtn = screen.getByRole('button', { name: /verify code/i });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem('gs_arena_creator')).toBeNull();
    expect(mockGrantCreatorPermissions).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
    expect(handleClose).not.toHaveBeenCalled();
  });
});
