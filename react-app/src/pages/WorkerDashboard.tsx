import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import QRScanner from '../components/QRScanner';
import DeliveryMap, { DEFAULT_COORDINATES } from '../components/DeliveryMap';
import { useOrders } from '../contexts/OrderContext';
import { getRestaurantLogo } from '../utils/restaurantLogos';
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
    scheduledJobs,
    currentJob,
    fetchAvailableJobs,
    fetchScheduledJobs,
    fetchActiveDelivery,
    claimJob,
    updateJobStatus,
    loadingJobs
  } = useOrders();

  // Fetch worker's active delivery and available jobs on mount
  useEffect(() => {
    console.log('[WorkerDashboard] Component mounted, fetching data...');
    fetchActiveDelivery();
    fetchAvailableJobs();
    fetchScheduledJobs();
    // Note: OrderContext handles 10-second polling for new orders, so we don't need
    // additional polling here. This prevents redundant API calls and potential freezing.
  }, []);

  const handleQRScan = async (result: string) => {
    console.log('QR Code scanned:', result);

    let verificationCode = result;

    try {
      const parsedData = JSON.parse(result);
      if (parsedData.type === 'campus-doordash-order' && parsedData.verificationCode) {
        verificationCode = parsedData.verificationCode;
      }
    } catch (e) {
      verificationCode = result;
    }

    const order = getOrderByCode(verificationCode);
    const confirmed = await confirmDelivery(verificationCode);

    if (confirmed) {
      toast.success(`Delivery confirmed! Order from ${order?.restaurant || currentJob?.restaurant || 'Unknown'} delivered.`);
    } else {
      toast.error('Invalid code. This QR code is not valid or already delivered.');
    }

    setShowScanner(false);
    setPin('');
  };

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    const order = getOrderByCode(pin);
    const confirmed = await confirmDelivery(pin);

    if (confirmed) {
      toast.success(`Delivery confirmed! Order from ${order?.restaurant || currentJob?.restaurant || 'Unknown'} delivered.`);
      setPin('');
    } else {
      toast.error('Invalid PIN. This PIN is not valid or already delivered.');
      setPin('');
    }
  };

  const handleAcceptJob = async (jobId: number) => {
    const success = await claimJob(jobId);
    if (success) {
      toast.success('Job accepted! Head to the restaurant to pick up the order.');
    } else {
      toast.error('Could not accept this job. It may have been claimed by another worker.');
      fetchAvailableJobs(); // Refresh the list
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!currentJob) {
      toast.error('No active delivery selected');
      return;
    }

    const success = await updateJobStatus(currentJob.id, status);
    if (success) {
      if (status === 'delivering') {
        toast.success('Picked up! On the way to customer.');
      } else if (status === 'delivered') {
        toast.success('Delivery completed!');
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

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  const getMinutesUntilText = (minutes: number) => {
    if (minutes < 60) return `Ready in ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `Ready in ${hours} hr`;
    return `Ready in ${hours} hr ${mins} min`;
  };

  // Check if current job is a scheduled order that's still in the future
  const isScheduledFuture = () => {
    if (!currentJob?.scheduledFor) return false;
    const scheduledTime = new Date(currentJob.scheduledFor);
    const now = new Date();
    // Consider "ready" if within 15 minutes of scheduled time
    const fifteenMinutes = 15 * 60 * 1000;
    return scheduledTime.getTime() - now.getTime() > fifteenMinutes;
  };

  const getScheduledCountdown = () => {
    if (!currentJob?.scheduledFor) return '';
    const scheduledTime = new Date(currentJob.scheduledFor);
    const now = new Date();
    const diffMs = scheduledTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  // Debug log for scheduled order
  if (currentJob) {
    console.log('[WorkerDashboard] Current job:', {
      id: currentJob.id,
      restaurant: currentJob.restaurant,
      scheduledFor: currentJob.scheduledFor,
      isScheduledFuture: isScheduledFuture()
    });
  }

  return (
    <div className="worker-dashboard">
      <Header activeTab="jobs" />

      <div className="content-wrapper">
        {/* Active Delivery Section */}
        {currentJob ? (
          <>
            <h2 className="section-title">Active Delivery</h2>

            {/* Scheduled Order Banner */}
            {isScheduledFuture() && (
              <div className="scheduled-order-banner">
                <div className="scheduled-badge-large">SCHEDULED ORDER</div>
                <div className="scheduled-info-text">
                  <span className="scheduled-time-label">Pickup scheduled for:</span>
                  <span className="scheduled-time-value">{formatScheduledTime(currentJob.scheduledFor!)}</span>
                </div>
                <div className="scheduled-countdown-box">
                  <span className="countdown-label">Ready for pickup in:</span>
                  <span className="countdown-value">{getScheduledCountdown()}</span>
                </div>
              </div>
            )}

            <div className={`active-delivery-grid ${isScheduledFuture() ? 'scheduled-active' : ''}`}>
              <div className={`active-delivery-card ${isScheduledFuture() ? 'scheduled-card' : ''}`}>
                <div className="order-from">Order from {currentJob.restaurant}</div>
                <div className="order-title">{currentJob.itemCount} item{currentJob.itemCount !== 1 ? 's' : ''}</div>
                <div className="order-details delivery-location">
                  <strong>Deliver to:</strong> {currentJob.deliveryBuildingName || 'Unknown Building'}
                  {currentJob.deliveryRoomNumber && <span className="room-number">, Room {currentJob.deliveryRoomNumber}</span>}
                </div>
                <div className="order-pay">{getEstimatedPay(currentJob.totalCents, currentJob.tipCents)} Est. Pay</div>
              </div>

              <div className={`confirm-delivery-card ${isScheduledFuture() ? 'scheduled-card' : ''}`}>
                <div className="confirm-title">
                  {isScheduledFuture() ? 'Waiting for Pickup Time' : 'Confirm Delivery'}
                </div>
                <div className="confirm-description">
                  {isScheduledFuture()
                    ? 'This order is scheduled for later. You can pick it up when the scheduled time arrives.'
                    : 'Enter PIN or scan QR code to complete the order.'}
                </div>
                {!isScheduledFuture() && (
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
                )}
              </div>
            </div>

            {/* Delivery Map */}
            <DeliveryMap
              pickupLocation={{
                name: currentJob.restaurant,
                latitude: currentJob.pickupCoords?.latitude || DEFAULT_COORDINATES.COMMONS.latitude,
                longitude: currentJob.pickupCoords?.longitude || DEFAULT_COORDINATES.COMMONS.longitude
              }}
              deliveryLocation={{
                name: currentJob.deliveryBuildingName || 'Delivery Location',
                latitude: currentJob.deliveryCoords?.latitude || DEFAULT_COORDINATES.UMBC_CENTER[0],
                longitude: currentJob.deliveryCoords?.longitude || DEFAULT_COORDINATES.UMBC_CENTER[1]
              }}
              roomNumber={currentJob.deliveryRoomNumber}
            />

            <div className="button-row">
              <div className="status-buttons">
                {isScheduledFuture() ? (
                  <button className="btn btn-disabled" disabled>
                    Waiting for scheduled time...
                  </button>
                ) : (
                  <>
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
                  </>
                )}
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
              <div className="job-icon">
                <img src={getRestaurantLogo(job.restaurant)} alt={job.restaurant} className="job-logo-img" />
              </div>
              <div className="job-details">
                <div className="job-from">Order from {job.restaurant}</div>
                <div className="job-title">
                  {job.itemCount} item{job.itemCount !== 1 ? 's' : ''} - {formatPrice(job.totalCents)}
                </div>
                <div className="job-location">
                  {job.restaurantLocation || 'Campus'} to {job.deliveryBuildingName || 'Unknown Building'}
                  {job.deliveryRoomNumber && `, Rm ${job.deliveryRoomNumber}`}
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

        {/* Scheduled Orders Section */}
        {scheduledJobs.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: '2rem' }}>
              Scheduled Orders
              <span className="scheduled-count">{scheduledJobs.length}</span>
            </h2>
            <p className="scheduled-info">
              These orders are scheduled for later. You can accept them in advance.
            </p>
            {scheduledJobs.map((job) => (
              <div key={job.id} className="job-card scheduled-job">
                <div className="scheduled-badge">
                  {formatScheduledTime(job.scheduledFor)}
                </div>
                <div className="job-icon">
                  <img src={getRestaurantLogo(job.restaurant)} alt={job.restaurant} className="job-logo-img" />
                </div>
                <div className="job-details">
                  <div className="job-from">Order from {job.restaurant}</div>
                  <div className="job-title">
                    {job.itemCount} item{job.itemCount !== 1 ? 's' : ''} - {formatPrice(job.totalCents)}
                  </div>
                  <div className="job-location">
                    {job.restaurantLocation || 'Campus'} to {job.deliveryBuildingName || 'Unknown Building'}
                    {job.deliveryRoomNumber && `, Rm ${job.deliveryRoomNumber}`}
                  </div>
                  <div className="job-time scheduled-countdown">
                    {getMinutesUntilText(job.minutesUntilReady)}
                  </div>
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
            ))}
          </>
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
