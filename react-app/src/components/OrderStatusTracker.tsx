import './OrderStatusTracker.css';

interface Props {
  status: 'pending' | 'claimed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  compact?: boolean;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: '1' },
  { key: 'claimed', label: 'Dasher Assigned', icon: '2' },
  { key: 'preparing', label: 'Preparing', icon: '3' },
  { key: 'delivering', label: 'On the Way', icon: '4' },
  { key: 'delivered', label: 'Delivered', icon: '5' }
];

function getStatusIndex(status: string): number {
  if (status === 'cancelled') return -1;
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
}

export default function OrderStatusTracker({ status, compact = false }: Props) {
  const currentIndex = getStatusIndex(status);

  if (status === 'cancelled') {
    return (
      <div className={`order-status-tracker ${compact ? 'compact' : ''} cancelled`}>
        <div className="status-cancelled">
          <span className="cancelled-icon">X</span>
          <span className="cancelled-text">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`order-status-tracker ${compact ? 'compact' : ''}`}>
      <div className="status-steps">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isActive = index <= currentIndex;

          return (
            <div key={step.key} className="status-step-container">
              <div className={`status-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className={`step-icon ${isActive ? 'active' : ''}`}>
                  {isCompleted ? step.icon : (index + 1)}
                </div>
                {!compact && (
                  <div className="step-label">{step.label}</div>
                )}
              </div>
              {index < statusSteps.length - 1 && (
                <div className={`step-connector ${index < currentIndex ? 'completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
      {compact && (
        <div className="current-status-text">
          {statusSteps[currentIndex]?.label || 'Processing'}
        </div>
      )}
    </div>
  );
}
