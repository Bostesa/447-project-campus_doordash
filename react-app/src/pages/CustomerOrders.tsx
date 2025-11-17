import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import OrderQRCode from '../components/OrderQRCode';
import './OrdersPage.css';

interface Props {
  username: string;
}

// Map restaurant display names to their IDs
const restaurantIdMap: Record<string, string> = {
  'Commons': 'the-commons',
  'The Commons': 'the-commons',
  'Chick fil A': 'chick-fil-a',
  'Starbucks': 'starbucks',
  'Einstein Bros': 'einstein-bros-bagels',
  'Dining Hall': 'dining-hall',
  'Dunkin Donuts': 'dunkin-donuts'
};

export default function CustomerOrders(_props: Props) {
  const navigate = useNavigate();
  const { carts, addToCart, getCartTotal, getCartCount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { orders: savedOrders, addOrder } = useOrders();
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; restaurant: string; total: number; verificationCode: string; pin: string } | null>(null);

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

  // Convert saved orders to display format
  const displaySavedOrders = savedOrders.map(order => {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const firstItem = order.items[0];
    const title = itemCount === 1 ? firstItem.name : `${firstItem.name} & ${itemCount - 1} more`;
    const details = `${itemCount} item${itemCount !== 1 ? 's' : ''} • ${order.status === 'in_progress' ? 'In Progress' : 'Delivered to Sondheim Hall'}`;

    return {
      orderId: order.id,
      date: order.date,
      restaurant: order.restaurant,
      title,
      details,
      total: `$${order.total.toFixed(2)}`,
      status: order.status,
      icon: firstItem.icon,
      verificationCode: order.verificationCode,
      pin: order.pin,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        icon: item.icon
      }))
    };
  });

  const placeholderOrders = [
    {
      date: "Today, 2:45 PM",
      restaurant: "Commons",
      title: "Cheeseburger & Fries",
      details: "2 items • Delivered to Sondheim Hall",
      total: "$18.50",
      status: "delivered" as const,
      icon: "🍔",
      items: [
        { id: '1', name: 'Cheeseburger', description: 'Juicy beef patty with cheese, lettuce, tomato', price: 9.50, category: 'Burgers', icon: '🍔' },
        { id: '2', name: 'Classic Fries', description: 'Crispy golden fries', price: 3.50, category: 'Sides', icon: '🍟' }
      ]
    },
    {
      date: "Today, 1:30 PM",
      restaurant: "Chick fil A",
      title: "Spicy Chicken Sandwich Meal",
      details: "2 items • Delivered to Chesapeake Hall",
      total: "$14.75",
      status: "delivered" as const,
      icon: "🍗",
      items: [
        { id: '2', name: 'Spicy Deluxe Sandwich', description: 'Spicy chicken with lettuce & tomato', price: 6.49, category: 'Entrees', icon: '🔥' },
        { id: '4', name: 'Waffle Fries', description: 'Crispy waffle-cut fries', price: 2.99, category: 'Sides', icon: '🍟' }
      ]
    },
    {
      date: "Today, 12:15 PM",
      restaurant: "Starbucks",
      title: "Coffee & Pastries",
      details: "3 items • In Progress",
      total: "$16.25",
      status: "in_progress" as const,
      icon: "☕",
      items: [
        { id: '1', name: 'Caramel Macchiato', description: 'Espresso with vanilla and caramel', price: 5.25, category: 'Hot Drinks', icon: '☕' },
        { id: '4', name: 'Blueberry Muffin', description: 'Fresh baked muffin', price: 3.25, category: 'Food', icon: '🧁' }
      ]
    },
    {
      date: "Today, 11:00 AM",
      restaurant: "The Commons",
      title: "Chipotle Bowl",
      details: "1 item • Delivered to Library",
      total: "$12.00",
      status: "delivered" as const,
      icon: "🥗",
      items: [
        { id: '4', name: 'Veggie Wrap', description: 'Fresh vegetables in a wrap', price: 7.99, category: 'Wraps', icon: '🌯' }
      ]
    },
    {
      date: "Yesterday, 6:45 PM",
      restaurant: "Einstein Bros",
      title: "Bagel Sandwich",
      details: "1 item • Cancelled",
      total: "$0.00",
      status: "cancelled" as const,
      icon: "🥯",
      items: [
        { id: '2', name: 'Bacon Egg & Cheese', description: 'On a toasted bagel', price: 6.49, category: 'Sandwiches', icon: '🥓' }
      ]
    }
  ];

  // Separate current and past orders
  const currentOrders = displaySavedOrders.filter(order => order.status === 'in_progress');
  const pastOrders = displaySavedOrders.filter(order => order.status === 'delivered' || order.status === 'cancelled');

  // Only show placeholder orders if there are no real orders
  const orders = displaySavedOrders.length > 0
    ? [...displaySavedOrders]
    : [...placeholderOrders];

  // Calculate real stats
  const totalOrderCount = displaySavedOrders.length;
  const totalSpent = displaySavedOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total.replace('$', ''));
  }, 0);

  const handleReorder = (order: typeof orders[0]) => {
    const restaurantId = restaurantIdMap[order.restaurant];
    if (!restaurantId) return;

    // Add all items from the order to the cart
    order.items.forEach(item => {
      addToCart(restaurantId, order.restaurant, item);
    });

    // Show cart sidebar with the reordered items
    setSelectedCartId(restaurantId);
    setShowCartSidebar(true);
  };

  const handleShowQRCode = (order: typeof orders[0], index: number) => {
    // Only show QR code for orders that have verification codes (actual placed orders)
    if ('verificationCode' in order && 'pin' in order && order.verificationCode && order.pin) {
      const orderId = ('orderId' in order && typeof order.orderId === 'string')
        ? order.orderId
        : `ORD${String(index + 1).padStart(4, '0')}`;
      setSelectedOrder({
        id: orderId,
        restaurant: order.restaurant,
        total: parseFloat(order.total.replace('$', '')),
        verificationCode: order.verificationCode as string,
        pin: order.pin as string
      });
      setShowQRCode(true);
    }
  };

  return (
    <div className="orders-page customer">
      <Header userType="customer" activeTab="orders" />

      {totalCartCount > 0 && (
        <button className="floating-cart-btn" onClick={() => setShowCartSidebar(true)}>
          🛒 {totalCartCount}
        </button>
      )}

      <div className="content-wrapper">
        <h2 className="section-title">Your Orders</h2>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value customer-accent">{totalOrderCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Orders</div>
            <div className="stat-value customer-accent">{currentOrders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value customer-accent">${totalSpent.toFixed(2)}</div>
          </div>
        </div>

        {currentOrders.length > 0 && (
          <>
            <h3 className="subsection-title">Current Orders</h3>
            {currentOrders.map((order, index) => (
              <div key={index} className="order-card customer highlighted">
                <div className="food-icon-small">{order.icon}</div>
                <div className="order-header">
                  <div className="order-date">{order.date}</div>
                  <div className={`order-status ${order.status}`}>
                    ⏱ In Progress
                  </div>
                </div>
                <div className="order-from">Order from {order.restaurant}</div>
                <div className="order-title">{order.title}</div>
                <div className="order-details">{order.details}</div>
                <div className="order-footer">
                  <div className="order-total">Total: {order.total}</div>
                  <button
                    className="qr-code-btn"
                    onClick={() => handleShowQRCode(order, index)}
                  >
                    Show QR Code
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {pastOrders.length > 0 && (
          <>
            <h3 className="subsection-title" style={{ marginTop: currentOrders.length > 0 ? '2rem' : '0' }}>Past Orders</h3>
            {pastOrders.map((order, index) => (
              <div key={index} className="order-card customer">
                <div className="food-icon-small">{order.icon}</div>
                <div className="order-header">
                  <div className="order-date">{order.date}</div>
                  <div className={`order-status ${order.status}`}>
                    {order.status === 'delivered' ? '✓ Delivered' : '✗ Cancelled'}
                  </div>
                </div>
                <div className="order-from">Order from {order.restaurant}</div>
                <div className="order-title">{order.title}</div>
                <div className="order-details">{order.details}</div>
                <div className="order-footer">
                  <div className="order-total">Total: {order.total}</div>
                  {order.status === 'delivered' && (
                    <button
                      className="reorder-btn"
                      onClick={() => handleReorder(order)}
                    >
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {displaySavedOrders.length === 0 && (
          <>
            <h3 className="subsection-title">Example Orders</h3>
            {placeholderOrders.map((order, index) => (
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
                  {order.status === 'in_progress' && (
                    <button
                      className="qr-code-btn"
                      onClick={() => handleShowQRCode(order, index)}
                    >
                      Show QR Code
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      className="reorder-btn"
                      onClick={() => handleReorder(order)}
                    >
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Cart Sidebar */}
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
