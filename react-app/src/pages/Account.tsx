import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import './Account.css';

interface Props {
  username: string;
  userType: UserType;
  onLogout: () => void;
}

export default function Account({ username, userType, onLogout }: Props) {
  const navigate = useNavigate();
  const isWorker = userType === 'worker';
  const { carts, getCartTotal, getCartCount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const totalCartCount = Object.keys(carts).reduce((total, restaurantId) => {
    return total + getCartCount(restaurantId);
  }, 0);

  const handlePlaceOrder = (restaurantId: string) => {
    setSelectedCartId(restaurantId);
    setShowCartSidebar(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = (paymentMethod: string, tip: number) => {
    if (!selectedCartId) return;

    const cart = carts[selectedCartId];
    const subtotal = getCartTotal(selectedCartId);
    const totalWithTipAndFees = subtotal + 2.99 + 1.50 + tip;

    // Save the order
    addOrder(selectedCartId, cart.restaurantName, cart.items, totalWithTipAndFees);

    setShowCheckout(false);
    alert(`Order confirmed!\n\nPayment: ${paymentMethod}\nTip: $${tip.toFixed(2)}\nTotal: $${totalWithTipAndFees.toFixed(2)}\n\nYour food will be delivered soon!`);
    clearCart(selectedCartId);
    setSelectedCartId(null);
  };

  return (
    <div className={`account-page ${isWorker ? 'worker' : 'customer'}`}>
      <Header userType={userType || 'customer'} activeTab="account" />

      {!isWorker && totalCartCount > 0 && (
        <button className="floating-cart-btn" onClick={() => setShowCartSidebar(true)}>
          🛒 {totalCartCount}
        </button>
      )}

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

      {/* Cart Sidebar - Only for customers */}
      {!isWorker && showCartSidebar && (
        <>
          <div className="cart-overlay" onClick={() => setShowCartSidebar(false)} />
          <div className="cart-sidebar">
            <div className="cart-header">
              <h2>Your Carts</h2>
              <button className="close-btn" onClick={() => setShowCartSidebar(false)}>×</button>
            </div>

            <div className="cart-items">
              {Object.keys(carts).length === 0 ? (
                <div className="empty-cart">No active carts</div>
              ) : (
                <>
                  {Object.entries(carts).map(([restaurantId, cart]) => (
                    <div key={restaurantId} className="cart-restaurant-section">
                      <div className="cart-restaurant-header">
                        <h3>{cart.restaurantName}</h3>
                        <div className="cart-restaurant-total">
                          ${getCartTotal(restaurantId).toFixed(2)}
                        </div>
                      </div>
                      {cart.items.map(({ item, quantity }) => (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-icon">{item.icon}</div>
                          <div className="cart-item-details">
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-price">${item.price.toFixed(2)}</div>
                          </div>
                          <div className="quantity-controls">
                            <button onClick={() => updateQuantity(restaurantId, item.id, -1)}>−</button>
                            <span>{quantity}</span>
                            <button onClick={() => updateQuantity(restaurantId, item.id, 1)}>+</button>
                          </div>
                          <button className="remove-btn" onClick={() => removeFromCart(restaurantId, item.id)}>
                            🗑️
                          </button>
                        </div>
                      ))}
                      <div className="cart-actions">
                        <button
                          className="goto-menu-btn"
                          onClick={() => {
                            setShowCartSidebar(false);
                            navigate(`/restaurant/${restaurantId}`);
                          }}
                        >
                          Go to Menu
                        </button>
                        <button
                          className="place-order-btn"
                          onClick={() => handlePlaceOrder(restaurantId)}
                        >
                          Place Order
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
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
    </div>
  );
}
