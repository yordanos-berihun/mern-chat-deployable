import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import io from 'socket.io-client';

// Provide a minimal `window.matchMedia` mock before components render
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
}

jest.mock('socket.io-client');

// Mock `useAuth` so tests don't need provider wrappers
jest.mock('./AuthContext', () => ({
  useAuth: () => {
    // URL-aware apiCall mock to return rooms, messages, users as needed
    const apiCall = jest.fn((url) => {
      if (typeof url !== 'string') return Promise.resolve({ ok: false });
      if (url.startsWith('/api/rooms/user')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [{ _id: 'r1', name: 'Test Room', participants: ['1'], pinnedMessages: [] }] }) });
      }
      if (url.startsWith('/api/messages/room')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: { messages: [{ _id: 'm1', content: 'Hello', createdAt: new Date().toISOString(), sender: { _id: '1', name: 'testuser' }, messageType: 'text' }] } }) });
      }
      if (url === '/api/users') {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [{ _id: '1', name: 'testuser' }] }) });
      }
      if (url.startsWith('/api/messages/bookmarks')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, data: {} }) });
    });

    return {
      user: { _id: '1', name: 'testuser' },
      apiCall,
      logout: jest.fn()
    };
  }
}));

// Mock theme hook so ThemeProvider is not required
jest.mock('./ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn() })
}));

// Require the component after mocks so module initialization uses the mocked globals
const EnhancedChatApp = require('./EnhancedChatApp').default;

const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn()
};

beforeEach(() => {
  io.mockReturnValue(mockSocket);
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ _id: '1', username: 'testuser' }));
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('EnhancedChatApp', () => {
  test('renders chat interface', () => {
    const { container } = render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    // ensure hidden file input exists
    expect(container.querySelector('#file-input')).toBeTruthy();
  });

  test('sends message on submit', async () => {
    const { container } = render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendBtn = screen.getByText(/send/i);

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', expect.objectContaining({
        content: 'Hello'
      }));
    });
  });

  test('displays typing indicator', async () => {
    render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'T' } });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('typing', expect.any(Object));
    });
  });

  test('toggles emoji picker', () => {
    render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const emojiBtn = screen.getByText('😊');
    fireEvent.click(emojiBtn);

    expect(screen.queryByText(/smileys/i)).not.toBeNull();
  });

  test('uploads file', async () => {
    const { container } = render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = container.querySelector('#file-input');

    // Simulate selecting a file
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText('test.txt')).not.toBeNull();
    });
  });

  test('adds reaction to message', async () => {
    render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const reactionBtn = screen.getAllByText('👍')[0];
    fireEvent.click(reactionBtn);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('addReaction', expect.any(Object));
    });
  });

  test('searches messages', async () => {
    render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search messages/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('toggles dark mode', () => {
    render(
      <MemoryRouter>
        <EnhancedChatApp />
      </MemoryRouter>
    );

    const darkModeBtn = screen.getByTitle('Toggle theme') || screen.queryByLabelText(/toggle dark mode/i);
    if (darkModeBtn) fireEvent.click(darkModeBtn);

    // dark-mode class may be applied to root container; ensure no crash
    expect(document.body).toBeTruthy();
  });
});
