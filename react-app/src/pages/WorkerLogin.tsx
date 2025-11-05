import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import './Login.css';

interface Props {
  onLogin: (type: UserType, username: string) => void;
}

export default function WorkerLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === 'login' && password === 'login') {
      onLogin('worker', email);
      navigate('/worker-dashboard');
    } else if (email && password) {
      setError("Invalid credentials. Use 'login' for both username and password.");
    } else {
      setError('Please enter both email and password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo-pac"></div>

      <h1>Dasher Login</h1>
      <p className="login-subtitle">Welcome back, let's get you on the road.</p>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label>Email or username</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@campus.edu"
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

        <button type="submit" className="login-button worker">
          Login
        </button>
      </form>

      <div className="signup-text">
        New to the crew? <a href="#" className="signup-link">Sign up here</a>
      </div>
    </div>
  );
}
