import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';

interface Props {
  username: string;
}

export default function WorkerOrders(_props: Props) {
  const navigate = useNavigate();

  const orders = [
    {
      date: "Today, 2:45 PM",
      restaurant: "Commons",
      title: "Cheeseburger & Fries",
      details: "2 items • Delivered to Sondheim Hall",
      earnings: "$9.50",
      status: "completed" as const,
      icon: "🍔"
    },
    {
      date: "Today, 1:30 PM",
      restaurant: "Chick fil A",
      title: "Spicy Chicken Sandwich Meal",
      details: "2 items • Delivered to Chesapeake Hall",
      earnings: "$4.75",
      status: "completed" as const,
      icon: "🍗"
    },
    {
      date: "Today, 12:15 PM",
      restaurant: "Starbucks",
      title: "Coffee & Pastries",
      details: "3 items • Delivered to ITE",
      earnings: "$6.25",
      status: "completed" as const,
      icon: "☕"
    },
    {
      date: "Today, 11:00 AM",
      restaurant: "The Commons",
      title: "Chipotle Bowl",
      details: "1 item • Delivered to Library",
      earnings: "$4.00",
      status: "completed" as const,
      icon: "🥗"
    },
    {
      date: "Yesterday, 6:45 PM",
      restaurant: "Einstein Bros",
      title: "Bagel Sandwich",
      details: "1 item • Cancelled",
      earnings: "$0.00",
      status: "cancelled" as const,
      icon: "🥯"
    }
  ];

  return (
    <div className="orders-page worker">
      <div className="orders-header">
        <button className="back-btn" onClick={() => navigate('/worker-dashboard')}>
          ← Jobs
        </button>
        <div className="header-spacer"></div>
        <div className="header-spacer"></div>
      </div>

      <div className="content-wrapper">
        <h2 className="section-title">Your Orders</h2>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Today's Deliveries</div>
            <div className="stat-value worker-accent">8</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Week</div>
            <div className="stat-value worker-accent">42</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value worker-accent">$387.50</div>
          </div>
        </div>

        <h3 className="subsection-title">Recent Orders</h3>

        {orders.map((order, index) => (
          <div key={index} className="order-card worker">
            <div className="food-icon-small">{order.icon}</div>
            <div className="order-header">
              <div className="order-date">{order.date}</div>
              <div className={`order-status ${order.status}`}>
                {order.status === 'completed' ? '✓ Delivered' : '✗ Cancelled'}
              </div>
            </div>
            <div className="order-from">Order from {order.restaurant}</div>
            <div className="order-title">{order.title}</div>
            <div className="order-details">{order.details}</div>
            <div className="order-footer">
              <div className="order-earnings">Earned: {order.earnings}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
