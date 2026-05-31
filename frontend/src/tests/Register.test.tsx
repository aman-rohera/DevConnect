import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { Register } from '../pages/Register';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
  });

  it('renders registration form fields and submit button', () => {
    renderRegister();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/developer email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/access password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/professional headline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/core stack skills/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compile & register/i })).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    renderRegister();

    const submitBtn = screen.getByRole('button', { name: /compile & register/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('requires password to be at least 6 characters', async () => {
    renderRegister();

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/developer email/i);
    const passwordInput = screen.getByLabelText(/access password/i);
    const submitBtn = screen.getByRole('button', { name: /compile & register/i });

    fireEvent.change(nameInput, { target: { value: 'Test Developer' } });
    fireEvent.change(emailInput, { target: { value: 'dev@test.io' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });
});
