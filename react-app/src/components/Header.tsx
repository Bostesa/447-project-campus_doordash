import { useNavigate } from 'react-router-dom';
import './Header.css';

interface Props {
  userType: 'customer' | 'worker';
  activeTab: 'home' | 'jobs' | 'earnings' | 'orders' | 'account';
  showLogo?: boolean;
}

export default function Header({ userType, activeTab, showLogo = true }: Props) {
  const navigate = useNavigate();

  const isWorker = userType === 'worker';
  const logoIcon = isWorker ? '🚗' : '🎓';
  const logoText = 'DormDash';

  return (
    <div className="header">
      <div className="header-col header-left">
        {showLogo && (
          <div className="header-logo">
            <div className={`logo-icon ${isWorker ? 'worker' : 'customer'}`}>
              {logoIcon}
            </div>
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
        <div className="user-avatar"></div>
      </div>
    </div>
  );
}
