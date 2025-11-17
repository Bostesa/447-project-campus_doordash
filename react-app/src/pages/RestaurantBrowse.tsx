import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import OrderQRCode from '../components/OrderQRCode';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import './RestaurantBrowse.css';

interface Props {
  username: string;
  onLogout: () => void;
}

export default function RestaurantBrowse(_props: Props) {
  const navigate = useNavigate();
  const { carts, getCartTotal, getCartCount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { orders, addOrder } = useOrders();
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; restaurant: string; total: number; verificationCode: string; pin: string } | null>(null);

  const handleViewCart = (e: React.MouseEvent, restaurantId: string) => {
    e.stopPropagation();
    setSelectedCartId(restaurantId);
    setShowCartSidebar(true);
  };

  const handleCheckout = () => {
    if (!selectedCartId) return;
    setShowCartSidebar(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = (paymentMethod: string, tip: number) => {
    if (!selectedCartId) return;

    const selectedCart = carts[selectedCartId];
    const subtotal = getCartTotal(selectedCartId);
    const totalWithTipAndFees = subtotal + 2.99 + 1.50 + tip;

    // Save the order
    addOrder(selectedCartId, selectedCart.restaurantName, selectedCart.items, totalWithTipAndFees);

    setShowCheckout(false);
    alert(`Order confirmed!\n\nPayment: ${paymentMethod}\nTip: $${tip.toFixed(2)}\nTotal: $${totalWithTipAndFees.toFixed(2)}\n\nYour food will be delivered soon!`);
    clearCart(selectedCartId);
    setSelectedCartId(null);
    navigate('/customer-orders');
  };

  const selectedCart = selectedCartId ? carts[selectedCartId] : null;

  // Get current orders
  const currentOrders = orders.filter(order => order.status === 'in_progress');

  const handleShowQRCode = (order: typeof orders[0]) => {
    setSelectedOrder({
      id: order.id,
      restaurant: order.restaurant,
      total: order.total,
      verificationCode: order.verificationCode,
      pin: order.pin
    });
    setShowQRCode(true);
  };

  const restaurants = [
    {
      id: "chick-fil-a",
      name: "Chick-fil-A",
      hours: "Open · 8 AM - 8 PM",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Chick-fil-A_Logo.svg/2560px-Chick-fil-A_Logo.svg.png"
    },
    {
      id: "starbucks",
      name: "Starbucks",
      hours: "Open · 7 AM - 9 PM",
      image: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png"
    },
    {
      id: "dining-hall",
      name: "Dining Hall",
      hours: "Open · 7 AM - 10 PM",
      image: "https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
    },
    {
      id: "einstein-bros-bagels",
      name: "Einstein Bros Bagels",
      hours: "Open · 7 AM - 3 PM",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2CVpnPv0cMM34s6fzvCWqF_8d4BzpCdklQA&s"
    },
    {
      id: "the-commons",
      name: "The Commons",
      hours: "Open · 11 AM - 11 PM",
      image: "https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
    },
    {
      id: "dunkin-donuts",
      name: "Dunkin Donuts",
      hours: "Open · 6 AM - 8 PM",
      image: "https://1000logos.net/wp-content/uploads/2023/04/Dunkin-Donuts-logo.png"
    }
  ];

  return (
    <div className="restaurant-browse">
      <Header userType="customer" activeTab="home" />

      <div className="content-wrapper">
        {/* Current Orders Section */}
        {currentOrders.length > 0 && (
          <div className="current-orders-section">
            <h2 className="section-header">Current Orders</h2>
            {currentOrders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const firstItem = order.items[0];

              return (
                <div
                  key={order.id}
                  className="current-order-card"
                >
                  <div className="order-icon">{firstItem.icon}</div>
                  <div className="order-info">
                    <div className="order-status-badge">⏱ In Progress</div>
                    <div className="order-restaurant-name">{order.restaurant}</div>
                    <div className="order-item-count">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} • ${order.total.toFixed(2)}
                    </div>
                    <div className="order-time">{order.date}</div>
                  </div>
                  <button
                    className="show-qr-btn"
                    onClick={() => handleShowQRCode(order)}
                  >
                    Show QR Code
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Carts Section */}
        {Object.keys(carts).length > 0 && (
          <div className="active-carts-section">
            <h2 className="section-header">Active Carts</h2>
            {Object.entries(carts).map(([restaurantId, cart]) => (
              <div
                key={restaurantId}
                className="active-cart-card"
                onClick={() => navigate(`/restaurant/${restaurantId}`)}
              >
                <div className="cart-info">
                  <div className="cart-restaurant-name">{cart.restaurantName}</div>
                  <div className="cart-item-count">
                    {getCartCount(restaurantId)} item{getCartCount(restaurantId) !== 1 ? 's' : ''} in cart
                  </div>
                  <div className="cart-total">Total: ${getCartTotal(restaurantId).toFixed(2)}</div>
                </div>
                <button className="view-cart-btn" onClick={(e) => handleViewCart(e, restaurantId)}>
                  View Cart →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search bar */}
        <div className="search-container">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search for food or venues..."
          />
        </div>

        {/* Category filters */}
        <div className="category-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Dining Hall</button>
          <button className="filter-btn">Café</button>
          <button className="filter-btn">Quick Bites</button>
        </div>

        {/* Restaurant grid */}
        <div className="restaurant-grid">
          {restaurants.map((restaurant, index) => (
            <div key={index} className="restaurant-card">
              <div className="restaurant-image-wrapper">
                <div
                  className="restaurant-image"
                  style={{ backgroundImage: `url(${restaurant.image})` }}
                ></div>
              </div>
              <div className="card-content">
                <div className="restaurant-name">{restaurant.name}</div>
                <div className="restaurant-hours">{restaurant.hours}</div>
                <button
                  className="order-btn"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="campus-footer">
          © 2024 Campus Eats. All Rights Reserved.<br />
          Part of the UMBC Dining Experience.
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCartSidebar && selectedCart && (
        <>
          <div className="cart-overlay" onClick={() => setShowCartSidebar(false)} />
          <div className="cart-sidebar">
            <div className="cart-header">
              <h2>{selectedCart.restaurantName}</h2>
              <button className="close-btn" onClick={() => setShowCartSidebar(false)}>×</button>
            </div>

            <div className="cart-items">
              {selectedCart.items.length === 0 ? (
                <div className="empty-cart">Your cart is empty</div>
              ) : (
                selectedCart.items.map(({ item, quantity }) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-icon">{item.icon}</div>
                    <div className="cart-item-details">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => selectedCartId && updateQuantity(selectedCartId, item.id, -1)}>−</button>
                      <span>{quantity}</span>
                      <button onClick={() => selectedCartId && updateQuantity(selectedCartId, item.id, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => selectedCartId && removeFromCart(selectedCartId, item.id)}>
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {selectedCart.items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-price">${selectedCartId ? getCartTotal(selectedCartId).toFixed(2) : '0.00'}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Place Order
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedCartId && (
        <CheckoutModal
          restaurantName={carts[selectedCartId].restaurantName}
          items={carts[selectedCartId].items}
          subtotal={getCartTotal(selectedCartId)}
          onClose={() => setShowCheckout(false)}
          onConfirmOrder={handleConfirmOrder}
        />
      )}

      {/* Order QR Code Modal */}
      {showQRCode && selectedOrder && (
        <OrderQRCode
          orderId={selectedOrder.id}
          restaurantName={selectedOrder.restaurant}
          orderTotal={selectedOrder.total}
          verificationCode={selectedOrder.verificationCode}
          pin={selectedOrder.pin}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
}
