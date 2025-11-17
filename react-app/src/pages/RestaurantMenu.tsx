import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { menuData, restaurantNames, MenuItem } from '../data/menuData';
import './RestaurantMenu.css';

interface Props {
  username: string;
}

export default function RestaurantMenu(_props: Props) {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { carts, addToCart: addToCartContext, removeFromCart: removeFromCartContext, updateQuantity: updateQuantityContext, clearCart, getCartTotal, getCartCount } = useCart();
  const { addOrder } = useOrders();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const menuItems = restaurantId ? menuData[restaurantId] || [] : [];
  const restaurantName = restaurantId ? restaurantNames[restaurantId] || 'Restaurant' : 'Restaurant';

  const currentCart = restaurantId ? carts[restaurantId] : undefined;
  const cart = currentCart?.items || [];
  const cartTotal = restaurantId ? getCartTotal(restaurantId) : 0;
  const cartCount = restaurantId ? getCartCount(restaurantId) : 0;

  const addToCart = (item: MenuItem) => {
    if (restaurantId) {
      addToCartContext(restaurantId, restaurantName, item);
    }
  };

  const removeFromCart = (itemId: string) => {
    if (restaurantId) {
      removeFromCartContext(restaurantId, itemId);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    if (restaurantId) {
      updateQuantityContext(restaurantId, itemId, change);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !restaurantId) return;
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = (paymentMethod: string, tip: number) => {
    if (!restaurantId) return;

    const totalWithTipAndFees = cartTotal + 2.99 + 1.50 + tip;

    // Save the order
    addOrder(restaurantId, restaurantName, cart, totalWithTipAndFees);

    setShowCheckout(false);
    alert(`Order confirmed!\n\nPayment: ${paymentMethod}\nTip: $${tip.toFixed(2)}\nTotal: $${totalWithTipAndFees.toFixed(2)}\n\nYour food will be delivered soon!`);
    clearCart(restaurantId);
    navigate('/customer-orders');
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="restaurant-menu">
      <Header userType="customer" activeTab="home" />

      <div className="content-wrapper">
        <div className="menu-header">
          <button className="back-btn" onClick={() => navigate('/browse')}>
            ← Back to Restaurants
          </button>
          <h1 className="restaurant-title">{restaurantName}</h1>
          <button className="cart-btn" onClick={() => setShowCart(!showCart)}>
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        </div>

        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="menu-category">
            <h2 className="category-title">{category}</h2>
            <div className="menu-items">
              {items.map(item => (
                <div key={item.id} className="menu-item-card">
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    <div className="item-description">{item.description}</div>
                    <div className="item-price">${item.price.toFixed(2)}</div>
                  </div>
                  <button className="add-btn" onClick={() => addToCart(item)}>
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <>
          <div className="cart-overlay" onClick={() => setShowCart(false)} />
          <div className="cart-sidebar">
            <div className="cart-header">
              <h2>Your Cart</h2>
              <button className="close-btn" onClick={() => setShowCart(false)}>×</button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">Your cart is empty</div>
              ) : (
                cart.map(({ item, quantity }) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-icon">{item.icon}</div>
                    <div className="cart-item-details">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span>{quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-price">${cartTotal.toFixed(2)}</span>
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
      {showCheckout && (
        <CheckoutModal
          restaurantName={restaurantName}
          items={cart}
          subtotal={cartTotal}
          onClose={() => setShowCheckout(false)}
          onConfirmOrder={handleConfirmOrder}
        />
      )}
    </div>
  );
}
