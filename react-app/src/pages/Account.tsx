import { UserType } from '../types';
import Header from '../components/Header';
import './Account.css';

interface Props {
  username: string;
  userType: UserType;
  onLogout: () => void;
}

export default function Account({ username, userType, onLogout }: Props) {
  const isWorker = userType === 'worker';

  return (
    <div className={`account-page ${isWorker ? 'worker' : 'customer'}`}>
      <Header userType={userType || 'customer'} activeTab="account" />

      <div className="content-wrapper">
        <h2 className="section-title">Account Settings</h2>

        <div className="settings-section">
          <h3 className="subsection-title">Personal Information</h3>
          <div className="settings-card">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value="John Hopkins"
                readOnly
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={`${username}@jhu.edu`}
                readOnly
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value="(410) 555-0123"
                readOnly
                className="form-input"
              />
            </div>
          </div>
        </div>

        {isWorker ? (
          <div className="settings-section">
            <h3 className="subsection-title">Vehicle Information</h3>
            <div className="settings-card">
              <div className="form-group">
                <label>Vehicle Type</label>
                <input
                  type="text"
                  value="Bicycle"
                  readOnly
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>License Plate</label>
                <input
                  type="text"
                  value="N/A"
                  readOnly
                  className="form-input"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="settings-section">
              <h3 className="subsection-title">Delivery Address</h3>
              <div className="settings-card">
                <div className="form-group">
                  <label>Campus Building</label>
                  <input
                    type="text"
                    value="Sondheim Hall"
                    readOnly
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Room Number</label>
                  <input
                    type="text"
                    value="Room 312"
                    readOnly
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Special Instructions</label>
                  <textarea
                    value="Leave at front desk if not available"
                    readOnly
                    className="form-input"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="subsection-title">Payment Method</h3>
              <div className="settings-card">
                <div className="form-group">
                  <label>Card Type</label>
                  <input
                    type="text"
                    value="Visa •••• 4242"
                    readOnly
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Expiration Date</label>
                  <input
                    type="text"
                    value="12/2025"
                    readOnly
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div className="settings-section">
          <button
            className={`logout-btn ${isWorker ? 'worker' : 'customer'}`}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
