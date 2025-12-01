import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface RestaurantCart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
}

interface CartContextType {
  carts: Record<string, RestaurantCart>;
  addToCart: (restaurantId: string, restaurantName: string, item: MenuItem) => void;
  removeFromCart: (restaurantId: string, itemId: string) => void;
  updateQuantity: (restaurantId: string, itemId: string, change: number) => void;
  clearCart: (restaurantId: string) => void;
  getCartTotal: (restaurantId: string) => number;
  getCartCount: (restaurantId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get localStorage key for a user
const getCartStorageKey = (userId: string | null) => {
  return userId ? `dormdash_cart_${userId}` : 'dormdash_cart_guest';
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [carts, setCarts] = useState<Record<string, RestaurantCart>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage when user changes or on mount
  useEffect(() => {
    const storageKey = getCartStorageKey(user?.id ?? null);

    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCarts(parsed);
        console.log('[CartContext] Loaded cart from localStorage:', storageKey);
      } else {
        setCarts({});
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCarts({});
    }

    setIsInitialized(true);
  }, [user?.id]);

  // Save cart to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const storageKey = getCartStorageKey(user?.id ?? null);

    try {
      if (Object.keys(carts).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(carts));
        console.log('[CartContext] Saved cart to localStorage:', storageKey);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [carts, user?.id, isInitialized]);

  const addToCart = (restaurantId: string, restaurantName: string, item: MenuItem) => {
    setCarts(prev => {
      const currentCart = prev[restaurantId] || {
        restaurantId,
        restaurantName,
        items: []
      };

      const existingItem = currentCart.items.find(c => c.item.id === item.id);

      if (existingItem) {
        return {
          ...prev,
          [restaurantId]: {
            ...currentCart,
            items: currentCart.items.map(c =>
              c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
            )
          }
        };
      }

      return {
        ...prev,
        [restaurantId]: {
          ...currentCart,
          items: [...currentCart.items, { item, quantity: 1 }]
        }
      };
    });
  };

  const removeFromCart = (restaurantId: string, itemId: string) => {
    setCarts(prev => {
      const currentCart = prev[restaurantId];
      if (!currentCart) return prev;

      const newItems = currentCart.items.filter(c => c.item.id !== itemId);

      if (newItems.length === 0) {
        const { [restaurantId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [restaurantId]: {
          ...currentCart,
          items: newItems
        }
      };
    });
  };

  const updateQuantity = (restaurantId: string, itemId: string, change: number) => {
    setCarts(prev => {
      const currentCart = prev[restaurantId];
      if (!currentCart) return prev;

      const newItems = currentCart.items
        .map(c =>
          c.item.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + change) }
            : c
        )
        .filter(c => c.quantity > 0);

      if (newItems.length === 0) {
        const { [restaurantId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [restaurantId]: {
          ...currentCart,
          items: newItems
        }
      };
    });
  };

  const clearCart = (restaurantId: string) => {
    setCarts(prev => {
      const { [restaurantId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const getCartTotal = (restaurantId: string): number => {
    const cart = carts[restaurantId];
    if (!cart) return 0;
    return cart.items.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  };

  const getCartCount = (restaurantId: string): number => {
    const cart = carts[restaurantId];
    if (!cart) return 0;
    return cart.items.reduce((sum, c) => sum + c.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        carts,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
