import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface Props {
  username?: string; // Made optional to handle undefined cases
  activeTab: 'home' | 'jobs' | 'earnings' | 'orders' | 'account';
  showLogo?: boolean;
}

export default function Header({ username = 'User', activeTab, showLogo = true }: Props) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUsername] = useState('');

  const userRole = localStorage.getItem('userRole');

  const logoText = 'DormDash';

  const onLogout = () => {
    setUsername('');

    // Clear localStorage
    localStorage.removeItem('loginState');
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
          {userRole === "worker" ? (
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
                onClick={() => navigate('/account')}
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
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{username}</span>
          <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {showDropdown && (
          <>
            <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <span className="dropdown-name">{username}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { navigate('/account'); setShowDropdown(false); }}>
                Account Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item sign-out" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
