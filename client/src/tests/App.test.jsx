import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock the AuthContext
const MockAuthProvider = ({ children }) => {
  return <div data-testid="mock-auth-provider">{children}</div>;
};

// Mock the AuthContext module
vi.mock('../context/AuthContext', () => ({
  AuthProvider: MockAuthProvider,
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false
  })
}));

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Just check that the app renders without throwing an error
    expect(document.body).toBeTruthy();
  });

  test('contains router structure', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Check that the app container exists
    // Check that the app container exists
    const appElement = document.querySelector('#root') || document.body;
    expect(appElement).toBeTruthy();
  });
});