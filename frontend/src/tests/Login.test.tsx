import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Helper to render Login with all providers
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch to prevent actual network calls during tests
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
  });

  it('renders login form with fields and buttons', () => {
    renderLogin();

    expect(screen.getByLabelText(/developer email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/access key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authenticate session/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load mock sandbox/i })).toBeInTheDocument();
  });

  it('displays validation errors on empty submission', async () => {
    renderLogin();

    const submitBtn = screen.getByRole('button', { name: /authenticate session/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('displays validation errors for invalid emails', async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/developer email/i);
    const submitBtn = screen.getByRole('button', { name: /authenticate session/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/email address is invalid/i)).toBeInTheDocument();
  });

  it('displays validation error if password is too short', async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/developer email/i);
    const passwordInput = screen.getByLabelText(/access key/i);
    const submitBtn = screen.getByRole('button', { name: /authenticate session/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  it('triggers ghost loaders during Mock Sandbox simulation', async () => {
    renderLogin();

    const sandboxBtn = screen.getByRole('button', { name: /load mock sandbox/i });
    fireEvent.click(sandboxBtn);

    // Should display the ghost loading view containing skeletons
    const ghostView = screen.getByTestId('ghost-loader-view');
    expect(ghostView).toBeInTheDocument();

    // Verify there are skeleton elements rendered
    const skeletons = screen.getAllByTestId('skeleton-element');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
