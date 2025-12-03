import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

interface Props {
  userType: 'customer' | 'worker';
  activeTab: 'home' | 'jobs' | 'earnings' | 'orders' | 'account';
  showLogo?: boolean;
}

export default function Header({ userType, activeTab, showLogo = true }: Props) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const isWorker = userType === 'worker';
  const logoText = 'DormDash';

  const handleSignOut = async () => {
    try {
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
            {profile?.name ? getInitials(profile.name) : '?'}
          </div>
          <span className="user-name">{profile?.name?.split(' ')[0] || 'User'}</span>
          <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>

        {showDropdown && (
          <>
            <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <span className="dropdown-name">{profile?.name || 'User'}</span>
                  <span className="dropdown-email">{profile?.email || ''}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { navigate(isWorker ? '/worker-account' : '/account'); setShowDropdown(false); }}>
                Account Settings
              </button>
              <div className="dropdown-divider" />
              {isWorker ? (
                <button className="dropdown-item mode-switch" onClick={() => { navigate('/browse'); setShowDropdown(false); }}>
                  Switch to Customer
                </button>
              ) : (
                <button className="dropdown-item mode-switch" onClick={() => { navigate('/worker-dashboard'); setShowDropdown(false); }}>
                  Switch to Dasher
                </button>
              )}
              <div className="dropdown-divider" />
              <button className="dropdown-item sign-out" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
