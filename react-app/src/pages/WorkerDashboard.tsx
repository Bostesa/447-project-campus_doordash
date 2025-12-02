import { useState, useEffect } from 'react';
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
  const {
    confirmDelivery,
    getOrderByCode,
    availableJobs,
    currentJob,
    fetchAvailableJobs,
    claimJob,
    updateJobStatus,
    loadingJobs
  } = useOrders();

  // Fetch available jobs on mount and periodically
  useEffect(() => {
    fetchAvailableJobs();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAvailableJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleQRScan = async (result: string) => {
    console.log('QR Code scanned:', result);

    let verificationCode = result;
    let orderId = '';

    try {
      const parsedData = JSON.parse(result);
      if (parsedData.type === 'campus-doordash-order' && parsedData.verificationCode) {
        verificationCode = parsedData.verificationCode;
        orderId = parsedData.orderId;
      }
    } catch (e) {
      verificationCode = result;
    }

    const order = getOrderByCode(verificationCode);
    const confirmed = await confirmDelivery(verificationCode);

    if (confirmed) {
      alert(`Delivery Confirmed!\n\nOrder ID: ${orderId || order?.id || 'N/A'}\nRestaurant: ${order?.restaurant || currentJob?.restaurant || 'Unknown'}\n\nOrder has been marked as delivered.`);
    } else {
      alert('Invalid Code\n\nThis QR code is not valid or the order has already been delivered.');
    }

    setShowScanner(false);
    setPin('');
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      alert('Please enter a 4-digit PIN');
      return;
    }

    const order = getOrderByCode(pin);
    const confirmed = await confirmDelivery(pin);

    if (confirmed) {
      alert(`Delivery Confirmed!\n\nRestaurant: ${order?.restaurant || currentJob?.restaurant || 'Unknown'}\n\nOrder has been marked as delivered.`);
      setPin('');
    } else {
      alert('Invalid PIN\n\nThis PIN is not valid or the order has already been delivered.');
      setPin('');
    }
  };

  const handleAcceptJob = async (jobId: number) => {
    const success = await claimJob(jobId);
    if (success) {
      alert('Job accepted! Head to the restaurant to pick up the order.');
    } else {
      alert('Could not accept this job. It may have been claimed by another worker.');
      fetchAvailableJobs(); // Refresh the list
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!currentJob) {
      alert('No active delivery selected');
      return;
    }

    const success = await updateJobStatus(currentJob.id, status);
    if (success) {
      if (status === 'delivering') {
        alert('Status updated: On the way to customer!');
      } else if (status === 'delivered') {
        alert('Delivery completed!');
      }
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getEstimatedPay = (_totalCents: number, tipCents: number) => {
    // Worker gets base fee ($3) + tip
    const baseFee = 300;
    return formatPrice(baseFee + tipCents);
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="worker-dashboard">
      <Header activeTab="jobs" />

      <div className="content-wrapper">
        {/* Active Delivery Section */}
        {currentJob ? (
          <>
            <h2 className="section-title">Active Delivery</h2>
            <div className="active-delivery-grid">
              <div className="active-delivery-card">
                <div className="order-from">Order from {currentJob.restaurant}</div>
                <div className="order-title">{currentJob.itemCount} item{currentJob.itemCount !== 1 ? 's' : ''}</div>
                <div className="order-details">{currentJob.dropOffLocation}</div>
                <div className="order-pay">{getEstimatedPay(currentJob.totalCents, currentJob.tipCents)} Est. Pay</div>
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
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateStatus('delivering')}
                >
                  Picked Up
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenScanner}
                >
                  Scan QR
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-active-delivery">
            <p>No active delivery. Accept a job below to get started!</p>
          </div>
        )}

        {/* Available Jobs Section */}
        <h2 className="section-title" style={{ marginTop: '2rem' }}>
          Available Jobs
          <button
            className="refresh-btn"
            onClick={() => fetchAvailableJobs()}
            disabled={loadingJobs}
          >
            {loadingJobs ? '...' : 'Refresh'}
          </button>
        </h2>

        {loadingJobs && availableJobs.length === 0 ? (
          <div className="loading-jobs">
            <div className="loading-spinner"></div>
            <p>Loading available jobs...</p>
          </div>
        ) : availableJobs.length === 0 ? (
          <div className="no-jobs">
            <p>No orders waiting right now. Check back soon!</p>
          </div>
        ) : (
          availableJobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-details">
                <div className="job-from">Order from {job.restaurant}</div>
                <div className="job-title">
                  {job.itemCount} item{job.itemCount !== 1 ? 's' : ''} - {formatPrice(job.totalCents)}
                </div>
                <div className="job-location">
                  {job.restaurantLocation || 'Campus'} to {job.dropOffLocation}
                </div>
                <div className="job-time">{getTimeAgo(job.createdAt)}</div>
              </div>
              <div className="job-pay">{getEstimatedPay(job.totalCents, job.tipCents)}</div>
              <button
                className="accept-btn"
                onClick={() => handleAcceptJob(job.id)}
                disabled={!!currentJob}
              >
                {currentJob ? 'Busy' : 'Accept'}
              </button>
            </div>
          ))
        )}
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
