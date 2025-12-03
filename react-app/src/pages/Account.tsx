import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  const { profile, signOut, refreshProfile } = useAuth();
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
  const [mealPlanMsg, setMealPlanMsg] = useState<string>('');

  const handlePlaceOrder = (restaurantId: string) => {
    setSelectedCartId(restaurantId);
    setShowCartSidebar(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = async (_paymentMethod: string, tip: number, deliveryInfo?: string) => {
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
      toast.success(`Order placed! Your PIN is ${order.pin}. Check your orders for details.`, { duration: 5000 });
    } else {
      toast.success('Order placed! Check your orders for details.', { duration: 5000 });
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

  // Test functions for adding swipes and flex (for development/testing)
  async function handleEnableMealPlan() {
    if (!profile) return;
    setMealPlanMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        has_meal_plan: true,
        meal_swipes_remaining: 10
      })
      .eq('id', profile.id);

    if (error) {
      setMealPlanMsg('Error enabling meal plan.');
      console.error('Error enabling meal plan:', error);
      return;
    }

    await refreshProfile();
    setMealPlanMsg('Meal plan enabled with 10 swipes!');
  }

  async function handleAddSwipes() {
    if (!profile) return;
    setMealPlanMsg('');

    const newSwipes = (profile.meal_swipes_remaining || 0) + 10;
    const { error } = await supabase
      .from('profiles')
      .update({
        has_meal_plan: true,
        meal_swipes_remaining: newSwipes
      })
      .eq('id', profile.id);

    if (error) {
      setMealPlanMsg('Error adding swipes.');
      console.error('Error adding swipes:', error);
      return;
    }

    await refreshProfile();
    setMealPlanMsg('Added 10 meal swipes!');
  }

  async function handleAddFlex() {
    if (!profile) return;
    setMealPlanMsg('');

    const newFlex = (profile.flex_balance_cents || 0) + 5000; // $50.00
    const { error } = await supabase
      .from('profiles')
      .update({ flex_balance_cents: newFlex })
      .eq('id', profile.id);

    if (error) {
      setMealPlanMsg('Error adding flex dollars.');
      console.error('Error adding flex:', error);
      return;
    }

    await refreshProfile();
    setMealPlanMsg('Added $50.00 Flex Dollars!');
  }

  async function handleResetBalances() {
    if (!profile) return;
    setMealPlanMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        has_meal_plan: false,
        meal_swipes_remaining: 0,
        flex_balance_cents: 0
      })
      .eq('id', profile.id);

    if (error) {
      setMealPlanMsg('Error resetting balances.');
      console.error('Error resetting:', error);
      return;
    }

    await refreshProfile();
    setMealPlanMsg('Balances reset to zero.');
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
          <h3 className="subsection-title">Meal Plan</h3>
          <div className="settings-card">
            <div className="meal-plan-status">
              <div className="meal-plan-row">
                <span className="meal-plan-label">Plan Status</span>
                <span className="meal-plan-value">
                  {profile?.has_meal_plan ? 'Active' : 'No Plan'}
                </span>
              </div>
              <div className="meal-plan-row">
                <span className="meal-plan-label">Meal Swipes Remaining</span>
                <span className="meal-plan-value meal-plan-highlight">
                  {profile?.meal_swipes_remaining ?? 0} swipes
                </span>
              </div>
              <div className="meal-plan-row">
                <span className="meal-plan-label">Flex Dollar Balance</span>
                <span className="meal-plan-value meal-plan-highlight">
                  ${((profile?.flex_balance_cents ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="meal-plan-info">
              <p>Meal swipes can be used at participating dining locations. Each swipe is worth $8.42 or covers your entire order at Chick-fil-A.</p>
            </div>
            <div className="form-group test-buttons">
              <span className="test-label">Test Controls:</span>
              {!profile?.has_meal_plan && (
                <button className="btn btn-outline-primary btn-sm" onClick={handleEnableMealPlan}>
                  Enable Meal Plan
                </button>
              )}
              <button className="btn btn-outline-secondary btn-sm" onClick={handleAddSwipes}>
                +10 Swipes
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleAddFlex}>
                +$50 Flex
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={handleResetBalances}>
                Reset All
              </button>
            </div>
            {mealPlanMsg && <div className="alert alert-success mt-2">{mealPlanMsg}</div>}
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
