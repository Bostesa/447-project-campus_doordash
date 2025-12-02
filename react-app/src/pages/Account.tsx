import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Account.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Props {
  username: string;
}

export default function Account({ username }: Props) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { carts, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [saveMsg, setSaveMsg] = useState<string>('');

  const handlePlaceOrder = (restaurantId: string) => {
    setSelectedCartId(restaurantId);
    setShowCartSidebar(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = async (paymentMethod: string, tip: number, deliveryInfo?: string) => {
    if (!selectedCartId) return;

    const cart = carts[selectedCartId];
    const subtotal = getCartTotal(selectedCartId);
    const totalWithTipAndFees = subtotal + 2.99 + 1.50 + tip;

    const order = await addOrder(
      selectedCartId,
      cart.restaurantName,
      cart.items,
      totalWithTipAndFees,
      tip,
      deliveryInfo
    );

    setShowCheckout(false);

    if (order) {
      alert(`Order confirmed!\n\nOrder Code: ${order.verificationCode}\nPIN: ${order.pin}\n\nPayment: ${paymentMethod}\nTip: $${tip.toFixed(2)}\nTotal: $${totalWithTipAndFees.toFixed(2)}\n\nYour food will be delivered soon!`);
    } else {
      alert(`Order confirmed!\n\nPayment: ${paymentMethod}\nTip: $${tip.toFixed(2)}\nTotal: $${totalWithTipAndFees.toFixed(2)}\n\nYour food will be delivered soon!`);
    }

    clearCart(selectedCartId);
    setSelectedCartId(null);
  };

  // Load buildings from DB
  useEffect(() => {
    async function loadBuildings() {
      try {
        const { data, error } = await supabase.from('buildings').select('*');
        console.log('[Account] supabase.from(buildings).select(*) returned', { data, error });
        if (error) {
          console.error('[Account] Error loading buildings from Supabase', error);
          return;
        }
        const rows = Array.isArray(data) ? data : [];
        console.log('[Account] setting buildings count=', rows.length);
        setBuildings(rows);
      } catch (err) {
        console.error('[Account] Unexpected error loading buildings', err);
      }
    }

    loadBuildings();
  }, []);

  function validateAndSaveLocation() {
    setSaveMsg('');
    if (!roomNumber || roomNumber.trim().length === 0) {
      setSaveMsg('Room number is required.');
      return;
    }

    const payload = {
      buildingId: selectedBuilding,
      roomNumber,
      instructions
    };
    try {
      localStorage.setItem('deliveryLocation', JSON.stringify(payload));
      setSaveMsg('Delivery location saved.');
    } catch (e) {
      console.error('Error saving delivery location', e);
      setSaveMsg('Failed to save delivery location. See console for details.');
    }
  }

  return (
    <div className="account-page">
      <Header username={username || profile?.name || 'User'} activeTab="account" />

      <div className="content-wrapper">
        <h2 className="section-title">Account Settings</h2>

        <div className="settings-section">
          <h3 className="subsection-title">Personal Information</h3>
          <div className="settings-card">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={username || profile?.name || 'User'}
                readOnly
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                readOnly
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="subsection-title">Delivery Address</h3>
          <div className="settings-card">
            <div className="form-group">
              <label>Campus Building</label>
              <select
                className="form-select"
                value={selectedBuilding ?? ''}
                onChange={e => setSelectedBuilding(e.target.value || null)}
              >
                <option value="">Select building...</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Room Number</label>
              <input
                type="text"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Special Instructions</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="form-control"
                rows={3}
              />
            </div>

            <div className="form-group">
              <button className="btn btn-primary" onClick={validateAndSaveLocation}>Save Delivery Location</button>
              {saveMsg && <div className="alert alert-info mt-2">{saveMsg}</div>}
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

        <div className="settings-section">
          <button className="logout-btn" onClick={signOut}>
            Logout
          </button>
        </div>
      </div>

      {/* Cart Sidebar - Only for customers */}
      {showCartSidebar && (
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
                Object.entries(carts).map(([restaurantId, cart]) => (
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
                          Remove
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
                )))
              }
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
