import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthForm from './AuthForm';

global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

describe('AuthForm', () => {
  test('renders login form by default', () => {
    render(<AuthForm onLogin={jest.fn()} />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  test('switches to register mode', () => {
    render(<AuthForm onLogin={jest.fn()} />);
    
    const registerBtn = screen.getByText(/create account/i);
    fireEvent.click(registerBtn);
    
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
  });

  test('submits login form', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'token123', user: { id: '1' } })
    });
    
    const onLogin = jest.fn();
    render(<AuthForm onLogin={onLogin} />);
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByText(/^login$/i));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.any(Object)
      );
      expect(onLogin).toHaveBeenCalled();
    });
  });

  test('shows error on failed login', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' })
    });
    
    render(<AuthForm onLogin={jest.fn()} />);
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'wrong@test.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByText(/^login$/i));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('shows forgot password form', () => {
    render(<AuthForm onLogin={jest.fn()} />);
    
    const forgotLink = screen.getByText(/forgot password/i);
    fireEvent.click(forgotLink);
    
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  });
});
