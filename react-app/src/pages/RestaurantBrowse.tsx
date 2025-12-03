import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import OrderQRCode from '../components/OrderQRCode';
import OrderStatusTracker from '../components/OrderStatusTracker';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getRestaurantLogo } from '../utils/restaurantLogos';
import './RestaurantBrowse.css';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  location: string;
}

interface OperatingHours {
  restaurant_id: number;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
}

// Helper to format time from "HH:MM:SS" to "X AM/PM"
function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  if (minutes === 0) {
    return `${displayHours} ${ampm}`;
  }
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Check if restaurant is currently open
function isCurrentlyOpen(hours: OperatingHours | undefined): boolean {
  if (!hours || hours.is_closed || !hours.opens_at || !hours.closes_at) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = hours.opens_at.split(':').map(Number);
  const [closeH, closeM] = hours.closes_at.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

// Get status text for restaurant
function getStatusText(hours: OperatingHours | undefined, allHours: OperatingHours[]): string {
  if (!hours || hours.is_closed) {
    // Find next open day
    const today = new Date().getDay();
    for (let i = 1; i <= 7; i++) {
      const nextDay = (today + i) % 7;
      const nextHours = allHours.find(h => h.day_of_week === nextDay && !h.is_closed);
      if (nextHours && nextHours.opens_at) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `Closed · Opens ${dayNames[nextDay]} ${formatTime(nextHours.opens_at)}`;
      }
    }
    return 'Closed';
  }

  if (isCurrentlyOpen(hours)) {
    return `Open · ${formatTime(hours.opens_at)} - ${formatTime(hours.closes_at)}`;
  } else {
    // Check if opens later today
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (hours.opens_at || '0:0').split(':').map(Number);
    const openMinutes = openH * 60 + openM;

    if (currentMinutes < openMinutes) {
      return `Closed · Opens at ${formatTime(hours.opens_at)}`;
    }
    return `Closed · Opens tomorrow`;
  }
}

// Get a fake delivery time based on location
function getDeliveryTime(location: string): string {
  const times: Record<string, string> = {
    'Commons': '10-15 min',
    'University Center': '15-20 min',
    'AOK Library': '10-15 min',
    'Admin': '20-25 min',
    'True Grits': '15-20 min',
  };
  return times[location] || '15-25 min';
}

export default function RestaurantBrowse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { carts, getCartTotal, getCartCount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { orders, addOrder } = useOrders();
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; restaurant: string; total: number; verificationCode: string; pin: string } | null>(null);

  // Supabase data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch restaurants and operating hours
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [restaurantsRes, hoursRes] = await Promise.all([
        supabase.from('restaurants').select('*').order('name'),
        supabase.from('operating_hours').select('*')
      ]);

      if (restaurantsRes.data) {
        setRestaurants(restaurantsRes.data);
      }

      if (hoursRes.data) {
        setOperatingHours(hoursRes.data);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // Get today's hours for a restaurant
  const getTodayHours = (restaurantId: number): OperatingHours | undefined => {
    const today = new Date().getDay();
    return operatingHours.find(h => h.restaurant_id === restaurantId && h.day_of_week === today);
  };

  // Get all hours for a restaurant (for finding next open day)
  const getRestaurantHours = (restaurantId: number): OperatingHours[] => {
    return operatingHours.filter(h => h.restaurant_id === restaurantId);
  };

  // Filter restaurants based on search and location
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === 'All') return matchesSearch;

    // Location-based filtering
    const locationLower = restaurant.location.toLowerCase();
    const selectedLower = selectedCategory.toLowerCase();

    // Match location filter to restaurant location
    return matchesSearch && locationLower.includes(selectedLower);
  });

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

  const handleConfirmOrder = async (_paymentMethod: string, tip: number) => {
    if (!selectedCartId) return;

    const selectedCart = carts[selectedCartId];
    const subtotal = getCartTotal(selectedCartId);
    const totalWithTipAndFees = subtotal + 2.99 + 1.50 + tip;

    // Save the order to Supabase
    const order = await addOrder(
      selectedCartId,
      selectedCart.restaurantName,
      selectedCart.items,
      totalWithTipAndFees,
      tip
    );

    setShowCheckout(false);

    if (order) {
      toast.success(`Order placed! Your PIN is ${order.pin}. Check your orders for details.`, { duration: 5000 });
    } else {
      toast.success('Order placed! Check your orders for details.', { duration: 5000 });
    }

    clearCart(selectedCartId);
    setSelectedCartId(null);
    navigate('/customer-orders');
  };

  const selectedCart = selectedCartId ? carts[selectedCartId] : null;

  // Get current orders (pending, claimed, preparing, or delivering)
  const currentOrders = orders.filter(order =>
    order.status === 'pending' ||
    order.status === 'claimed' ||
    order.status === 'preparing' ||
    order.status === 'delivering'
  );

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

  return (
    <div className="restaurant-browse">
      <Header username={user?.email || 'Guest'} activeTab='home'/>

      <div className="content-wrapper">
        {/* Current Orders Section */}
        {currentOrders.length > 0 && (
          <div className="current-orders-section">
            <h2 className="section-header">Current Orders</h2>
            {currentOrders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const firstItem = order.items[0];

              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'pending': return 'Waiting for Dasher';
                  case 'claimed': return 'Dasher Assigned';
                  case 'preparing': return 'Preparing';
                  case 'delivering': return 'On the Way';
                  default: return 'In Progress';
                }
              };

              return (
                <div
                  key={order.id}
                  className="current-order-card"
                >
                  <div className="order-icon">{firstItem.icon}</div>
                  <div className="order-info">
                    <div className="order-status-badge">{getStatusBadge(order.status)}</div>
                    <div className="order-restaurant-name">{order.restaurant}</div>
                    <div className="order-item-count">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} • ${order.total.toFixed(2)}
                    </div>
                    <OrderStatusTracker status={order.status} compact />
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
            placeholder="Search for restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Location filters */}
        <div className="category-filters">
          {['All', 'Commons', 'University Center', 'AOK Library', 'True Grits', 'Admin'].map(location => (
            <button
              key={location}
              className={`filter-btn ${selectedCategory === location ? 'active' : ''}`}
              onClick={() => setSelectedCategory(location)}
            >
              {location}
            </button>
          ))}
        </div>

        {/* Restaurant grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading restaurants...</p>
          </div>
        ) : (
          <div className="restaurant-grid">
            {filteredRestaurants.map((restaurant) => {
              const todayHours = getTodayHours(restaurant.id);
              const allRestaurantHours = getRestaurantHours(restaurant.id);
              const isOpen = isCurrentlyOpen(todayHours);
              const statusText = getStatusText(todayHours, allRestaurantHours);
              const deliveryTime = getDeliveryTime(restaurant.location);

              return (
                <div key={restaurant.id} className={`restaurant-card ${!isOpen ? 'closed' : ''}`}>
                  <div className="restaurant-image-wrapper">
                    <div className="restaurant-image">
                      <img
                        src={getRestaurantLogo(restaurant.name)}
                        alt={restaurant.name}
                        className="restaurant-logo-img"
                      />
                    </div>
                    {!isOpen && <div className="closed-overlay">Closed - Order for Later</div>}
                  </div>
                  <div className="card-content">
                    <div className="restaurant-name">{restaurant.name}</div>
                    <div className="restaurant-location">{restaurant.location}</div>
                    <div className={`restaurant-hours ${isOpen ? 'open' : 'closed'}`}>
                      <span className={`status-dot ${isOpen ? 'open' : 'closed'}`}></span>
                      {statusText}
                    </div>
                    <div className="delivery-time">{deliveryTime}</div>
                    <button
                      className="order-btn"
                      onClick={() => navigate(`/restaurant/${restaurant.slug}`)}
                    >
                      {isOpen ? 'Order Now' : 'Order for Later'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {!loading && filteredRestaurants.length === 0 && (
          <div className="no-results">
            <p>No restaurants found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Footer */}
        <div className="campus-footer">
          © 2024 DormDash. All Rights Reserved.<br />
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
                      Remove
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
