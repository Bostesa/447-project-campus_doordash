import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import CheckoutModal, { OrderPaymentInfo, ScheduleInfo } from '../components/CheckoutModal';
import { useCart } from '../contexts/CartContext';
import { useOrders } from '../contexts/OrderContext';
import { supabase } from '../lib/supabaseClient';
import { getRestaurantLogo } from '../utils/restaurantLogos';
import './RestaurantMenu.css';

interface MenuItemFromDB {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug: string;
  location: string;
  category_id: number;
  category_name: string;
  item_id: number;
  item_name: string;
  description: string | null;
  portion: string | null;
  calories: number | null;
  price: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_protein_source: boolean;
  is_climate_friendly: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  calories?: number;
  portion?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

// Get a food icon based on the category or item name
function getFoodIcon(categoryName: string, itemName: string): string {
  const name = itemName.toLowerCase();
  const category = categoryName.toLowerCase();

  // Specific items
  if (name.includes('burger') || name.includes('cheeseburger')) return '🍔';
  if (name.includes('pizza')) return '🍕';
  if (name.includes('sandwich')) return '🥪';
  if (name.includes('salad')) return '🥗';
  if (name.includes('pasta') || name.includes('alfredo') || name.includes('spaghetti')) return '🍝';
  if (name.includes('chicken') || name.includes('wings') || name.includes('tenders')) return '🍗';
  if (name.includes('nugget')) return '🍖';
  if (name.includes('fries') || name.includes('fry')) return '🍟';
  if (name.includes('taco')) return '🌮';
  if (name.includes('burrito') || name.includes('wrap')) return '🌯';
  if (name.includes('sushi') || name.includes('roll')) return '🍣';
  if (name.includes('rice') || name.includes('bowl')) return '🍚';
  if (name.includes('soup')) return '🍲';
  if (name.includes('steak') || name.includes('beef')) return '🥩';
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna')) return '🐟';
  if (name.includes('shrimp') || name.includes('seafood')) return '🦐';
  if (name.includes('egg')) return '🥚';
  if (name.includes('bacon')) return '🥓';
  if (name.includes('bagel')) return '🥯';
  if (name.includes('bread') || name.includes('toast')) return '🍞';
  if (name.includes('pancake') || name.includes('waffle')) return '🧇';
  if (name.includes('donut') || name.includes('doughnut')) return '🍩';
  if (name.includes('cookie')) return '🍪';
  if (name.includes('cake') || name.includes('brownie')) return '🍰';
  if (name.includes('muffin')) return '🧁';
  if (name.includes('ice cream') || name.includes('sundae')) return '🍨';
  if (name.includes('milkshake') || name.includes('shake')) return '🥛';
  if (name.includes('coffee') || name.includes('latte') || name.includes('espresso') || name.includes('macchiato') || name.includes('cappuccino')) return '☕';
  if (name.includes('tea')) return '🍵';
  if (name.includes('smoothie') || name.includes('juice')) return '🧃';
  if (name.includes('soda') || name.includes('cola') || name.includes('sprite') || name.includes('drink')) return '🥤';
  if (name.includes('lemonade')) return '🍋';
  if (name.includes('water')) return '💧';
  if (name.includes('beer')) return '🍺';
  if (name.includes('wine')) return '🍷';
  if (name.includes('falafel') || name.includes('hummus')) return '🧆';
  if (name.includes('hot dog')) return '🌭';
  if (name.includes('pretzel')) return '🥨';
  if (name.includes('popcorn')) return '🍿';
  if (name.includes('nachos') || name.includes('chips')) return '🌽';
  if (name.includes('hash brown') || name.includes('potato')) return '🥔';
  if (name.includes('fruit') || name.includes('apple')) return '🍎';
  if (name.includes('banana')) return '🍌';
  if (name.includes('orange')) return '🍊';
  if (name.includes('strawberry') || name.includes('berry')) return '🍓';
  if (name.includes('pumpkin')) return '🎃';

  // Category fallbacks
  if (category.includes('burger')) return '🍔';
  if (category.includes('pizza')) return '🍕';
  if (category.includes('sandwich')) return '🥪';
  if (category.includes('salad')) return '🥗';
  if (category.includes('pasta') || category.includes('italian')) return '🍝';
  if (category.includes('chicken') || category.includes('poultry')) return '🍗';
  if (category.includes('seafood') || category.includes('fish')) return '🐟';
  if (category.includes('mexican') || category.includes('taco')) return '🌮';
  if (category.includes('asian') || category.includes('chinese') || category.includes('japanese')) return '🍜';
  if (category.includes('breakfast')) return '🍳';
  if (category.includes('dessert') || category.includes('sweet')) return '🍰';
  if (category.includes('bakery') || category.includes('bread')) return '🥐';
  if (category.includes('beverage') || category.includes('drink')) return '🥤';
  if (category.includes('coffee')) return '☕';
  if (category.includes('appetizer') || category.includes('starter')) return '🍽️';
  if (category.includes('side')) return '🍟';
  if (category.includes('entree') || category.includes('main')) return '🍽️';
  if (category.includes('soup')) return '🍲';
  if (category.includes('grill')) return '🔥';

  // Default
  return '🍽️';
}

export default function RestaurantMenu() {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { carts, addToCart: addToCartContext, removeFromCart: removeFromCartContext, updateQuantity: updateQuantityContext, clearCart, getCartTotal, getCartCount } = useCart();
  const { addOrder } = useOrders();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Supabase data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [restaurantLocation, setRestaurantLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string } | null> | undefined>(undefined);

  // Refs for scrolling to categories
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);

  // Intersection Observer for scroll-spy
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Don't update active category if user clicked a sidebar link (manual scroll)
      if (isScrollingRef.current) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const category = entry.target.getAttribute('data-category');
          if (category) {
            setActiveCategory(category);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all category sections
    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categories, menuItems]);

  // Fetch menu items from Supabase
  useEffect(() => {
    async function fetchMenu() {
      if (!restaurantId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('full_menu')
        .select('*')
        .eq('restaurant_slug', restaurantId)
        .order('category_name')
        .order('item_name');

      if (error) {
        console.error('Error fetching menu:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setRestaurantName(data[0].restaurant_name);
        setRestaurantLocation(data[0].location);

        // Fetch operating hours from operating_hours table
        const restaurantDbId = data[0].restaurant_id;
        const { data: hoursData, error: hoursError } = await supabase
          .from('operating_hours')
          .select('day_of_week, opens_at, closes_at, is_closed')
          .eq('restaurant_id', restaurantDbId);

        if (!hoursError && hoursData && hoursData.length > 0) {
          // Build hours map from operating_hours table
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const hoursMap: Record<string, { open: string; close: string } | null> = {};

          hoursData.forEach((row: { day_of_week: number; opens_at: string; closes_at: string; is_closed: boolean }) => {
            const dayName = days[row.day_of_week];
            if (row.is_closed) {
              hoursMap[dayName] = null;
            } else {
              hoursMap[dayName] = { open: row.opens_at, close: row.closes_at };
            }
          });

          // Fill in any missing days as null (closed)
          days.forEach(day => {
            if (!(day in hoursMap)) {
              hoursMap[day] = null;
            }
          });

          setOperatingHours(hoursMap);

          // Check if currently open
          const now = new Date();
          const todayIndex = now.getDay();
          const todayHours = hoursData.find((h: { day_of_week: number }) => h.day_of_week === todayIndex);

          if (todayHours && !todayHours.is_closed && todayHours.opens_at && todayHours.closes_at) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;

            const [openHour, openMin] = todayHours.opens_at.split(':').map(Number);
            const [closeHour, closeMin] = todayHours.closes_at.split(':').map(Number);
            const openMinutes = openHour * 60 + openMin;
            const closeMinutes = closeHour * 60 + closeMin;

            setIsOpen(currentTime >= openMinutes && currentTime < closeMinutes);
          } else {
            setIsOpen(false);
          }
        }

        // Get unique categories in order
        const uniqueCategories = [...new Set(data.map((item: MenuItemFromDB) => item.category_name))];
        setCategories(uniqueCategories);
        setActiveCategory(uniqueCategories[0] || null);

        // Transform DB items to MenuItem format
        const items: MenuItem[] = data.map((item: MenuItemFromDB) => ({
          id: item.item_id.toString(),
          name: item.item_name,
          description: item.description || '',
          price: item.price,
          category: item.category_name,
          icon: getFoodIcon(item.category_name, item.item_name),
          calories: item.calories || undefined,
          portion: item.portion || undefined,
          isVegetarian: item.is_vegetarian,
          isVegan: item.is_vegan,
          isGlutenFree: item.is_gluten_free,
        }));

        setMenuItems(items);
      }

      setLoading(false);
    }

    fetchMenu();
  }, [restaurantId]);

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

  const handleConfirmOrder = async (
    _paymentMethod: string,
    tip: number,
    deliveryInfo?: string,
    paymentInfo?: OrderPaymentInfo,
    scheduleInfo?: ScheduleInfo
  ) => {
    if (!restaurantId) return;

    const totalWithTipAndFees = cartTotal + 2.99 + 1.50 + tip;

    // Convert OrderPaymentInfo to the format expected by addOrder
    const paymentInfoForOrder = paymentInfo ? {
      paymentMethod: paymentInfo.paymentMethod,
      mealSwipeUsed: paymentInfo.mealSwipeUsed,
      flexAmountCents: paymentInfo.flexAmountCents,
      cardAmountCents: paymentInfo.cardAmountCents,
      stripePaymentId: paymentInfo.stripePaymentId
    } : undefined;

    // Save the order to Supabase
    const order = await addOrder(
      restaurantId,
      restaurantName,
      cart,
      totalWithTipAndFees,
      tip,
      deliveryInfo,
      paymentInfoForOrder,
      scheduleInfo
    );

    setShowCheckout(false);

    if (order) {
      toast.success(`Order placed! Your PIN is ${order.pin}. Check your orders for details.`, { duration: 5000 });
    } else {
      toast.success('Order placed! Check your orders for details.', { duration: 5000 });
    }

    clearCart(restaurantId);
    navigate('/customer-orders');
  };

  // Filter items based on search
  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Scroll to category when clicking sidebar
  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    isScrollingRef.current = true;
    const ref = categoryRefs.current[category];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reset after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  // Get item quantity in cart
  const getItemQuantity = (itemId: string): number => {
    const cartItem = cart.find(({ item }) => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  return (
    <div className="restaurant-menu">
      <Header activeTab="home" />

      <div className="menu-page-content">
        {/* Menu Header */}
        <div className="menu-header">
          <button className="back-btn" onClick={() => navigate('/browse')}>
            ← Back
          </button>
          <div className="header-info">
            <img
              src={getRestaurantLogo(restaurantName)}
              alt={restaurantName}
              className="menu-restaurant-logo"
            />
            <div className="header-text">
              <h1 className="restaurant-title">{restaurantName}</h1>
              {restaurantLocation && <span className="restaurant-location">{restaurantLocation}</span>}
            </div>
          </div>
          <button className="cart-btn" onClick={() => setShowCart(!showCart)}>
            Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>

        {/* Search Bar */}
        <div className="menu-search-container">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="menu-search-input"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading menu...</p>
          </div>
        ) : (
          <div className="menu-layout">
            {/* Category Sidebar */}
            <div className="category-sidebar">
              <div className="category-sidebar-header">Categories</div>
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-nav-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => scrollToCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="menu-items-container">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div
                  key={category}
                  className="menu-category"
                  data-category={category}
                  ref={(el) => { categoryRefs.current[category] = el; }}
                >
                  <h2 className="category-title">{category}</h2>
                  <div className="menu-items-grid">
                    {items.map(item => {
                      const quantity = getItemQuantity(item.id);

                      return (
                        <div key={item.id} className="menu-item-card">
                          <div className="item-icon-large">{item.icon}</div>
                          <div className="item-content">
                            <div className="item-header">
                              <div className="item-name">{item.name}</div>
                              <div className="item-price">${item.price.toFixed(2)}</div>
                            </div>
                            {item.description && (
                              <div className="item-description">{item.description}</div>
                            )}
                            <div className="item-meta">
                              {item.calories && (
                                <span className="item-calories">{item.calories} cal</span>
                              )}
                              {item.portion && (
                                <span className="item-portion">{item.portion}</span>
                              )}
                            </div>
                            <div className="item-badges">
                              {item.isVegan && <span className="badge vegan">Vegan</span>}
                              {item.isVegetarian && !item.isVegan && <span className="badge vegetarian">Vegetarian</span>}
                              {item.isGlutenFree && <span className="badge gluten-free">GF</span>}
                            </div>
                            <div className="item-actions">
                              {quantity > 0 ? (
                                <div className="quantity-control">
                                  <button onClick={() => updateQuantity(item.id, -1)}>−</button>
                                  <span>{quantity}</span>
                                  <button onClick={() => addToCart(item)}>+</button>
                                </div>
                              ) : (
                                <button className="add-btn" onClick={() => addToCart(item)}>
                                  + Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {Object.keys(groupedItems).length === 0 && (
                <div className="no-results">
                  <p>No items found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Cart Button (mobile) */}
      {cartCount > 0 && (
        <button className="floating-cart-btn" onClick={() => setShowCart(true)}>
          View Cart ({cartCount}) · ${cartTotal.toFixed(2)}
        </button>
      )}

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
                      Remove
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
          isOpen={isOpen}
          operatingHours={operatingHours}
        />
      )}
    </div>
  );
}
