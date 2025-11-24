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

async function ensureProfileExists(username: string, role: string = 'customer') {
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

interface CustomerAccount {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export default function CustomerLogin({ onLogin }: Props) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const getStoredAccounts = (): CustomerAccount[] => {
    const stored = localStorage.getItem('customerAccounts');
    return stored ? JSON.parse(stored) : [];
  };

  const saveAccount = (account: CustomerAccount) => {
    const accounts = getStoredAccounts();
    accounts.push(account);
    localStorage.setItem('customerAccounts', JSON.stringify(accounts));
  };

  const validateEmail = (email: string): boolean => {
    return email.endsWith('@umbc.edu') || email.endsWith('@jhu.edu');
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please use a valid .edu email address (@umbc.edu or @jhu.edu)');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check if email already exists
    const accounts = getStoredAccounts();
    const existingAccount = accounts.find(acc => acc.email === email);
    if (existingAccount) {
      setError('An account with this email already exists');
      return;
    }

    // Create new account
    const newAccount: CustomerAccount = {
      fullName,
      email,
      password,
      phoneNumber
    };

    saveAccount(newAccount);
    setSuccess('Account created successfully! You can now login.');

    // Switch to login mode after 2 seconds
    setTimeout(() => {
      setIsSignUp(false);
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhoneNumber('');
      setSuccess('');
    }, 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Check demo account
    if (email === 'login' && password === 'login') {
      onLogin('customer', email);
      // ensure profile exists (non-blocking)
      ensureProfileExists(email, 'customer').catch(e => console.error(e));
      navigate('/browse');
      return;
    }

    // Check stored accounts
    const accounts = getStoredAccounts();
    const account = accounts.find(acc => acc.email === email && acc.password === password);

    if (account) {
      onLogin('customer', account.email);
      // ensure profile exists (non-blocking)
      ensureProfileExists(account.email, 'customer').catch(e => console.error(e));
      navigate('/browse');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isSignUp) {
      handleSignUp(e);
    } else {
      handleLogin(e);
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">🍔</div>

      <h1>DormDash</h1>
      <p className="login-subtitle">
        {isSignUp
          ? 'Create your account to get started.'
          : 'Welcome back! Please login to your account.'}
      </p>

      <form onSubmit={handleSubmit} className="login-form">
        {isSignUp && (
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Hopkins"
            />
          </div>
        )}

        <div className="form-group">
          <label>{isSignUp ? 'Email' : 'Email or Username'}</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@umbc.edu"
          />
        </div>

        {isSignUp && (
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(410) 555-0123"
            />
          </div>
        )}

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {isSignUp && (
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        {!isSignUp && (
          <div className="forgot-password">
            <a href="#">Forgot password?</a>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" className="login-button">
          {isSignUp ? 'Sign Up' : 'Login'}
        </button>
      </form>

      <div className="signup-text">
        {isSignUp ? (
          <>
            Already have an account? <a href="#" className="signup-link" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setError(''); }}>Login</a>
          </>
        ) : (
          <>
            Don't have an account? <a href="#" className="signup-link" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setError(''); }}>Sign up</a>
          </>
        )}
      </div>
    </div>
  );
}
