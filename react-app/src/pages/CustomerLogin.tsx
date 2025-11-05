import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import './Login.css';

interface Props {
  onLogin: (type: UserType, username: string) => void;
}

export default function CustomerLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === 'login' && password === 'login') {
      onLogin('customer', email);
      navigate('/browse');
    } else if (email && password) {
      setError("Invalid credentials. Use 'login' for both username and password.");
    } else {
      setError('Please enter both email and password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">🍔</div>

      <h1>DormDash</h1>
      <p className="login-subtitle">Welcome back! Please login to your account.</p>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Email or Username</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@umbc.edu"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="forgot-password">
          <a href="#">Forgot password?</a>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-button">
          Login
        </button>
      </form>

      <div className="signup-text">
        Don't have an account? <a href="#" className="signup-link">Sign up</a>
      </div>
    </div>
  );
}
