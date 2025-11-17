import { useState } from 'react';
import Header from '../components/Header';
import QRScanner from '../components/QRScanner';
import { useOrders } from '../contexts/OrderContext';
import './WorkerDashboard.css';

interface Props {
  username: string;
}

export default function WorkerDashboard(_props: Props) {
  const [pin, setPin] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const { confirmDelivery, getOrderByCode } = useOrders();

  const handleQRScan = (result: string) => {
    console.log('QR Code scanned:', result);

    // Parse QR code data - support both JSON and plain string formats
    let verificationCode = result;
    let orderId = '';

    try {
      const parsedData = JSON.parse(result);
      if (parsedData.type === 'campus-doordash-order' && parsedData.verificationCode) {
        verificationCode = parsedData.verificationCode;
        orderId = parsedData.orderId;
      }
    } catch (e) {
      // If not JSON, treat as plain verification code (backward compatibility)
      verificationCode = result;
    }

    const order = getOrderByCode(verificationCode);

    if (order && confirmDelivery(verificationCode)) {
      alert(`✓ Delivery Confirmed!\n\nOrder ID: ${orderId || order.id}\nRestaurant: ${order.restaurant}\nTotal: $${order.total.toFixed(2)}\n\nOrder has been marked as delivered.`);
    } else {
      alert('❌ Invalid Code\n\nThis QR code is not valid or the order has already been delivered.');
    }

    setShowScanner(false);
    setPin('');
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleVerifyPin = () => {
    if (pin.length !== 4) {
      alert('Please enter a 4-digit PIN');
      return;
    }

    const order = getOrderByCode(pin);

    if (order && confirmDelivery(pin)) {
      alert(`✓ Delivery Confirmed!\n\nRestaurant: ${order.restaurant}\nTotal: $${order.total.toFixed(2)}\n\nOrder has been marked as delivered.`);
      setPin('');
    } else {
      alert('❌ Invalid PIN\n\nThis PIN is not valid or the order has already been delivered.');
      setPin('');
    }
  };

  const jobs = [
    {
      id: '1',
      restaurant: 'Chick fil A',
      title: 'Spicy chicken sandwich meal',
      location: '2 items • Drop-off at Chesapeake hall',
      price: '$4.75',
      icon: '🍔'
    },
    {
      id: '2',
      restaurant: 'Starbucks',
      title: 'Coffee & Pastries',
      location: '3 items • Drop-off at ITE',
      price: '$6.25',
      icon: '☕'
    },
    {
      id: '3',
      restaurant: 'The Commons',
      title: 'Chipotle Bowl',
      location: '1 item • Drop-off at Library',
      price: '$4.00',
      icon: '🥗'
    }
  ];

  return (
    <div className="worker-dashboard">
      <Header userType="worker" activeTab="jobs" />

      <div className="content-wrapper">
        <h2 className="section-title">Active Delivery</h2>

        <div className="active-delivery-grid">
          <div className="active-delivery-card">
            <div className="food-icon">🍔</div>
            <div className="order-from">Order from Commons</div>
            <div className="order-title">Cheeseburger & Fries</div>
            <div className="order-details">2 items • Drop-off at Sondheim Hall</div>
            <div className="order-pay">💵 $9.50 Est. Pay</div>
          </div>

          <div className="confirm-delivery-card">
            <div className="confirm-title">Confirm Delivery</div>
            <div className="confirm-description">
              Enter PIN or scan QR code to complete the order.
            </div>
            <div className="pin-input-group">
              <label>Customer PIN</label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                placeholder="– – – –"
                maxLength={4}
                className="pin-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && pin.length === 4) {
                    handleVerifyPin();
                  }
                }}
              />
              <button
                className="verify-pin-btn"
                onClick={handleVerifyPin}
                disabled={pin.length !== 4}
              >
                Verify PIN
              </button>
            </div>
          </div>
        </div>

        <div className="button-row">
          <div className="status-buttons">
            <button className="btn btn-primary">🚚 Picked Up</button>
            <button className="btn btn-secondary">✓ Delivered</button>
          </div>

          <div className="scan-button-wrapper">
            <button className="btn btn-primary" onClick={handleOpenScanner}>🔲 Scan QR Code</button>
          </div>
        </div>

        <h2 className="section-title" style={{ marginTop: '2rem' }}>Available Jobs</h2>

        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-icon">{job.icon}</div>
            <div className="job-details">
              <div className="job-from">Order from {job.restaurant}</div>
              <div className="job-title">{job.title}</div>
              <div className="job-location">{job.location}</div>
            </div>
            <div className="job-price">{job.price}</div>
            <button className="accept-btn">Accept →</button>
          </div>
        ))}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
