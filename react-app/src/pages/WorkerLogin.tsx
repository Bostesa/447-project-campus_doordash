import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import './Login.css';
import { supabase } from '../lib/supabaseClient';

// generate a UUID v4 (uses crypto.randomUUID if available)
function generateUuid(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch (e) {
    // ignore and fall back
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function ensureProfileExists(username: string, role: string = 'worker') {
  try {
    // case-insensitive exact match using ILIKE (no wildcards)
    const { data: existing, error: selErr } = await supabase
      .from('profiles')
      .select('id')
      .ilike('name', username)
      .limit(1)
      .maybeSingle();

    if (selErr) {
      console.error('Error checking profile existence', selErr);
      return;
    }

    if (existing && (existing as any).id) return; // profile exists

    const id = generateUuid();
    const { error: insErr } = await supabase.from('profiles').insert([
      { id, name: username, role, created_at: new Date().toISOString() }
    ]);
    if (insErr) console.error('Error creating profile', insErr);
    else console.log('Created profile for', username, 'id=', id);
  } catch (err) {
    console.error('Unexpected error ensuring profile', err);
  }
}

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
      // ensure profile exists (non-blocking)
      ensureProfileExists(email, 'worker').catch(e => console.error(e));
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
