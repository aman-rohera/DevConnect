import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ResetPassword } from '../pages/ResetPassword';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const renderResetPassword = (hash = '') => {
  // Mock window.location.hash
  if (hash) {
    window.location.hash = hash;
  } else {
    window.location.hash = '';
  }

  return render(
    <BrowserRouter>
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ResetPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
  });

  it('renders token error if access_token hash is missing', () => {
    renderResetPassword('');

    expect(screen.getByText(/invalid or expired recovery link/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
  });

  it('renders password fields when a valid recovery token is in the hash', () => {
    renderResetPassword('#access_token=valid-recovery-token&type=recovery');

    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm new password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commit password reset/i })).toBeInTheDocument();
  });

  it('displays validation errors on mismatched passwords', async () => {
    renderResetPassword('#access_token=valid-recovery-token&type=recovery');

    const passwordInput = screen.getByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);
    const submitBtn = screen.getByRole('button', { name: /commit password reset/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different-password' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls resetPassword API and shows success banner on matching input', async () => {
    renderResetPassword('#access_token=valid-recovery-token&type=recovery');

    const passwordInput = screen.getByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);
    const submitBtn = screen.getByRole('button', { name: /commit password reset/i });

    fireEvent.change(passwordInput, { target: { value: 'securepassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'securepassword123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/access key modified successfully/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceed to login/i })).toBeInTheDocument();
  });
});
