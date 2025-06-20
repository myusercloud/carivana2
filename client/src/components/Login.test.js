import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import Login from './Login';
import authService from '../services/authService';
import axios from 'axios'; // Import axios to mock it

// Mock authService
jest.mock('../services/authService', () => ({
  login: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock axios
jest.mock('axios');

// Mock jwt-decode
// Login.js uses: import { jwtDecode } from 'jwt-decode';
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn().mockReturnValue({ id: 1, username: 'testuser' }),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Preserve other exports like Router, Link
  useNavigate: () => mockedNavigate,
}));

// Mock window.location.reload
const originalLocation = window.location;
beforeAll(() => {
  delete window.location;
  window.location = { ...originalLocation, reload: jest.fn() };
});
afterAll(() => {
  window.location = originalLocation; // Restore original location
});


describe('Login Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    authService.login.mockClear();
    axios.post.mockClear();
    mockedNavigate.mockClear();
    window.location.reload.mockClear();
    // Default to no user logged in for services that might be called by other components
    authService.getCurrentUser.mockReturnValue(null);
  });

  test('renders login form correctly', () => {
    render(<Router><Login /></Router>);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to input email and password', () => {
    render(<Router><Login /></Router>);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    expect(screen.getByLabelText(/email address/i).value).toBe('test@example.com');
    expect(screen.getByLabelText(/password/i).value).toBe('password123');
  });

  test('calls axios.post, authService.login, navigates, and reloads on successful login', async () => {
    const fakeToken = 'fakeToken123';
    const decodedUserPayload = { id: 1, username: 'testuser' };

    // jest.mock('jwt-decode') is already set up to return decodedUserPayload for any token
    // So jwtDecode(fakeToken) will return decodedUserPayload

    axios.post.mockResolvedValue({ data: { token: fakeToken, message: 'Logged in successfully!' } });

    render(<Router><Login /></Router>);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for axios.post to be called
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    // Wait for authService.login to be called
    // authService.login is called with (token, userObjectFromDecodedToken)
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
    expect(authService.login).toHaveBeenCalledWith(fakeToken, decodedUserPayload);

    // Check for success message
    expect(await screen.findByText('Login successful! Redirecting...')).toBeInTheDocument();

    // Check navigation
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/dashboard'));

    // Check window reload
    await waitFor(() => expect(window.location.reload).toHaveBeenCalledTimes(1));
  });

  test('shows error message on failed login (API error)', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    render(<Router><Login /></Router>);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
    expect(authService.login).not.toHaveBeenCalled();
    expect(mockedNavigate).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

   test('shows error message if no token is received', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Logged in successfully but no token' } }); // No token in response

    render(<Router><Login /></Router>);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText(/login failed: no token received/i)).toBeInTheDocument());
    expect(authService.login).not.toHaveBeenCalled();
  });
});
