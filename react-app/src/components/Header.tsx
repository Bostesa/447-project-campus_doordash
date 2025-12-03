import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

interface Props {
  username?: string;
  activeTab: 'home' | 'jobs' | 'earnings' | 'orders' | 'account';
  showLogo?: boolean;
  onLogout?: () => void;
}

export default function Header({ username, activeTab, showLogo = true, onLogout }: Props) {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Determine if user is in worker mode based on current route
  const isWorker = window.location.pathname.startsWith('/worker');

  // Get display name - prioritize profile name, then username prop, then parse from email
  const displayName = profile?.name || username || user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'User');

  const logoText = 'DormDash';

  const handleSignOut = async () => {
    try {
      if (onLogout) {
        onLogout();
      }
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="header">
      <div className="header-col header-left">
        {showLogo && (
          <div className="header-logo">
            <div className="logo-text">{logoText}</div>
          </div>
        )}
      </div>

      <div className="header-col header-center">
        <div className="nav-links">
          {isWorker ? (
            <>
              <button
                className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => navigate('/worker-dashboard')}
              >
                Jobs
              </button>
              <button
                className={`nav-link ${activeTab === 'earnings' ? 'active' : ''}`}
                onClick={() => navigate('/worker-orders')}
              >
                Earnings
              </button>
              <button
                className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => navigate('/worker-account')}
              >
                Account
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => navigate('/browse')}
              >
                Home
              </button>
              <button
                className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => navigate('/customer-orders')}
              >
                Orders
              </button>
              <button
                className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => navigate('/account')}
              >
                Account
              </button>
            </>
          )}
        </div>
      </div>

      <div className="header-col header-right">
        <div className="user-menu" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="user-avatar-initials">
            {getInitials(displayName)}
          </div>
          <span className="user-name">{displayName.split(' ')[0]}</span>
          <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {showDropdown && (
          <>
            <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={() => { navigate(isWorker ? '/worker-account' : '/account'); setShowDropdown(false); }}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Account</span>
                <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              {isWorker ? (
                <button className="dropdown-item" onClick={() => { navigate('/browse'); setShowDropdown(false); }}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Switch to Customer</span>
                  <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <button className="dropdown-item" onClick={() => { navigate('/worker-dashboard'); setShowDropdown(false); }}>
                  <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <path d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Switch to Dasher</span>
                  <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              )}
              <div className="dropdown-divider" />
              <button className="dropdown-item sign-out" onClick={handleSignOut}>
                <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
