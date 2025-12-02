import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function WorkerLogin() {
  const navigate = useNavigate();
  const { user, profile, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && profile) {
      localStorage.setItem('userRole', 'worker');
      navigate('/worker-dashboard');
    }
  }, [user, profile, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
      // Redirect happens automatically after OAuth callback
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="login-page worker">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page worker">
      <div className="login-logo-pac">DD</div>

      <h1>Dasher Login</h1>
      <p className="login-subtitle">
        Join the DormDash delivery team and earn money on your schedule.
      </p>

      <div className="google-login-container">
        <button
          className="google-sign-in-btn worker"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isSigningIn ? 'Signing in...' : 'Sign in with UMBC Google'}
        </button>

        <p className="umbc-restriction-note">
          Only @umbc.edu accounts can sign in
        </p>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="login-divider">
        <span>Why become a Dasher?</span>
      </div>

      <div className="login-features">
        <div className="feature-item">
          <span>Earn money between classes</span>
        </div>
        <div className="feature-item">
          <span>Flexible hours - work when you want</span>
        </div>
        <div className="feature-item">
          <span>Help fellow students on campus</span>
        </div>
      </div>

      <div className="back-to-home">
        <button onClick={() => navigate('/')} className="back-link">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
