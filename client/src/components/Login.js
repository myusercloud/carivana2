import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Corrected path
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // For general messages
  const [error, setError] = useState('');     // For error messages
  const navigate = useNavigate();

  // This function would ideally be passed down from App.js or use Context API
  // For now, we'll call authService and then navigate, App.js will pick up changes from localStorage on next render/reload
  // const { setCurrentUser } = props; // Assuming setCurrentUser is passed as a prop

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token } = response.data;
      if (token) {
        const decodedUser = jwtDecode(token); // Decode token to get user info (id, username)
        authService.login(token, decodedUser); // Store token and decoded user info
        // setCurrentUser(decodedUser); // This would update App.js state if passed as prop
        setMessage('Login successful! Redirecting...');
        navigate('/dashboard'); // Redirect to dashboard or home
        window.location.reload(); // Force a reload to update App.js state and navbar
      } else {
        setError('Login failed: No token received.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err.response?.data || err.message);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2>Login</h2>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="emailInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="passwordInput" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="passwordInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
