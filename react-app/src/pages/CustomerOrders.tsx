import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';

interface Props {
  username: string;
}

export default function CustomerOrders({ username }: Props) {
  const navigate = useNavigate();

  const orders = [
    {
      date: "Today, 2:45 PM",
      restaurant: "Commons",
      title: "Cheeseburger & Fries",
      details: "2 items • Delivered to Sondheim Hall",
      total: "$18.50",
      status: "delivered" as const,
      icon: "🍔"
    },
    {
      date: "Today, 1:30 PM",
      restaurant: "Chick fil A",
      title: "Spicy Chicken Sandwich Meal",
      details: "2 items • Delivered to Chesapeake Hall",
      total: "$14.75",
      status: "delivered" as const,
      icon: "🍗"
    },
    {
      date: "Today, 12:15 PM",
      restaurant: "Starbucks",
      title: "Coffee & Pastries",
      details: "3 items • In Progress",
      total: "$16.25",
      status: "in_progress" as const,
      icon: "☕"
    },
    {
      date: "Today, 11:00 AM",
      restaurant: "The Commons",
      title: "Chipotle Bowl",
      details: "1 item • Delivered to Library",
      total: "$12.00",
      status: "delivered" as const,
      icon: "🥗"
    },
    {
      date: "Yesterday, 6:45 PM",
      restaurant: "Einstein Bros",
      title: "Bagel Sandwich",
      details: "1 item • Cancelled",
      total: "$0.00",
      status: "cancelled" as const,
      icon: "🥯"
    }
  ];

  return (
    <div className="orders-page customer">
      <div className="orders-header">
        <button className="back-btn" onClick={() => navigate('/browse')}>
          ← Home
        </button>
        <div className="header-spacer"></div>
        <div className="header-spacer"></div>
      </div>

      <div className="content-wrapper">
        <h2 className="section-title">Your Orders</h2>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value customer-accent">24</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-value customer-accent">12</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value customer-accent">$387.50</div>
          </div>
        </div>

        <h3 className="subsection-title">Recent Orders</h3>

        {orders.map((order, index) => (
          <div key={index} className="order-card customer">
            <div className="food-icon-small">{order.icon}</div>
            <div className="order-header">
              <div className="order-date">{order.date}</div>
              <div className={`order-status ${order.status}`}>
                {order.status === 'delivered' ? '✓ Delivered' :
                 order.status === 'in_progress' ? '⏱ In Progress' : '✗ Cancelled'}
              </div>
            </div>
            <div className="order-from">Order from {order.restaurant}</div>
            <div className="order-title">{order.title}</div>
            <div className="order-details">{order.details}</div>
            <div className="order-footer">
              <div className="order-total">Total: {order.total}</div>
              {order.status === 'delivered' && (
                <button className="reorder-btn">Reorder</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
