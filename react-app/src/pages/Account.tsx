import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../types';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { supabase } from '../lib/supabaseClient';
import './Account.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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
  // Delivery selection state
  const [isDorm, setIsDorm] = useState<boolean>(false);
  const [isApt, setIsApt] = useState<boolean>(false);
  const [dormChosen, setDormChosen] = useState<boolean>(false);
  const [aptChosen, setAptChosen] = useState<boolean>(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [saveMsg, setSaveMsg] = useState<string>('');

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

  // Load buildings from DB and restore saved delivery location
  useEffect(() => {
    let mounted = true;
    async function loadBuildings() {
      try {
        const { data, error } = await supabase.from('buildings').select('*');
        console.log('[Account] supabase.from(buildings).select(*) returned', { data, error });
        if (error) {
          console.error('[Account] Error loading buildings from Supabase', error);
          return;
        }
        if (!mounted) {
          console.log('[Account] component unmounted before buildings could be set');
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

    // restore saved delivery location if present
    try {
      const saved = localStorage.getItem('deliveryLocation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isDorm !== undefined && parsed.isDorm !== null) { setIsDorm(Boolean(parsed.isDorm)); setDormChosen(true); }
        if (parsed.isApt !== undefined && parsed.isApt !== null) { setIsApt(Boolean(parsed.isApt)); setAptChosen(true); }
        setSelectedBuilding(parsed.buildingId ?? null);
        setRoomNumber(parsed.roomNumber ?? '');
        setInstructions(parsed.instructions ?? '');
      }
    } catch (e) {
      // ignore
    }

    return () => { mounted = false; };
  }, []);

  const filteredBuildings = buildings.filter(b => {
    // If building rows don't have expected flags, include them
    const hasIsDorm = Object.prototype.hasOwnProperty.call(b, 'is_dorm') || Object.prototype.hasOwnProperty.call(b, 'isDorm');
    const hasIsApt = Object.prototype.hasOwnProperty.call(b, 'is_apt') || Object.prototype.hasOwnProperty.call(b, 'isApt');

    const bIsDorm = hasIsDorm ? Boolean(b.is_dorm ?? b.isDorm) : undefined;
    const bIsApt = hasIsApt ? Boolean(b.is_apt ?? b.isApt) : undefined;

    // If the user hasn't chosen dorm/apt, don't filter by that flag.
    if (dormChosen && hasIsDorm && bIsDorm !== isDorm) return false;
    if (aptChosen && hasIsApt && bIsApt !== isApt) return false;
    return true;
  });

  // Debug: log current building/filter state so it's easy to inspect in console
  useEffect(() => {
    try {
      console.log('[Account] buildings.length=', buildings.length);
      console.log('[Account] dormChosen=', dormChosen, 'isDorm=', isDorm, 'aptChosen=', aptChosen, 'isApt=', isApt);
      console.log('[Account] filteredBuildings.length=', filteredBuildings.length, 'filteredBuildings=', filteredBuildings.slice(0, 20));
    } catch (e) {
      console.error('[Account] Error logging debug info', e);
    }
  }, [buildings, dormChosen, isDorm, aptChosen, isApt, filteredBuildings]);

  function validateAndSaveLocation() {
    setSaveMsg('');
    if (isDorm === false && (!roomNumber || roomNumber.trim().length === 0)) {
      setSaveMsg('Room number is required.');
      return;
    }

    const payload = {
      buildingId: selectedBuilding,
      isDorm,
      isApt,
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
                    <label>Are you in a dorm?</label>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isDorm}
                        onChange={e => { setIsDorm(e.target.checked); if (!e.target.checked) setIsApt(false); }}
                      />
                    </div>
                  </div>

                  {isDorm === true && (
                    <div className="form-group">
                      <label>Are you in an apartment?</label>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isApt}
                          onChange={e => setIsApt(e.target.checked)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Campus Building</label>
                    <select
                      className="form-select"
                      value={selectedBuilding ?? ''}
                      onChange={e => setSelectedBuilding(e.target.value || null)}
                    >
                      <option value="">Select building...</option>
                      {filteredBuildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {!isDorm && (
                    <div className="form-group">
                      <label>Room Number</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={e => setRoomNumber(e.target.value)}
                        className="form-control"
                      />
                    </div>
                  )}

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
