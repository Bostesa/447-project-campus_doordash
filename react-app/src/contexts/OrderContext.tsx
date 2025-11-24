import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  icon: string;
  quantity: number;
}

interface Order {
  id: string;
  date: string;
  restaurant: string;
  restaurantId: string;
  items: OrderItem[];
  total: number;
  status: 'in_progress' | 'delivered' | 'cancelled';
  verificationCode: string;
  pin: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (restaurantId: string, restaurantName: string, items: Array<{ item: any; quantity: number }>, total: number) => Promise<void>;
  confirmDelivery: (code: string) => boolean;
  getOrderByCode: (code: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    // Load orders from localStorage on initialization
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      try {
        return JSON.parse(savedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        return [];
      }
    }
    return [];
  });

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  const generatePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateVerificationCode = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORDER-${timestamp}-${random}`;
  };

  // generate a UUID v4 (uses crypto.randomUUID if available)
  const generateUuid = (): string => {
    try {
      // @ts-ignore
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch (e) {
      // ignore
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  async function getOrCreateCustomerId(): Promise<string> {
    try {
      const loginStateRaw = localStorage.getItem('loginState');
      if (loginStateRaw) {
        try {
          const parsed = JSON.parse(loginStateRaw);
          const username: string | undefined = parsed?.username;
          if (username) {
            // try to find profile by name (case-insensitive)
            const { data: existing, error: selErr } = await supabase
              .from('profiles')
              .select('id')
              .ilike('name', username)
              .limit(1)
              .maybeSingle();
            if (selErr) {
              console.error('Error querying profile for customer id', selErr);
            }
            if (existing && (existing as any).id) return (existing as any).id;

            // create profile row and return its id
            const id = generateUuid();
            const { error: insErr } = await supabase.from('profiles').insert([
              { id, name: username, role: 'customer', created_at: new Date().toISOString() }
            ]);
            if (insErr) {
              console.error('Error creating profile during order creation', insErr);
              return id; // return generated id anyway
            }
            return id;
          }
        } catch (e) {
          console.error('Error parsing loginState from localStorage', e);
        }
      }
    } catch (e) {
      console.error('Unexpected error in getOrCreateCustomerId', e);
    }
    // fallback to a generated uuid
    return generateUuid();
  }

  const addOrder = async (restaurantId: string, restaurantName: string, items: Array<{ item: any; quantity: number }>, total: number) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = `Today, ${timeString}`;

    const orderItems: OrderItem[] = items.map(({ item, quantity }) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      icon: item.icon,
      quantity
    }));

    const orderId = `order-${Date.now()}`;
    const pin = generatePin();
    const verificationCode = generateVerificationCode();

    const newOrder: Order = {
      id: orderId,
      date: dateString,
      restaurant: restaurantName,
      restaurantId,
      items: orderItems,
      total,
      status: 'in_progress',
      verificationCode,
      pin
    };

    setOrders(prev => [newOrder, ...prev]);
    // Also persist the order to the database (non-blocking from the UI perspective)
    try {
      const customer_id = await getOrCreateCustomerId();
      const dbRecord = {
        customer_id,
        venue_id: 0,
        drop_zone_id: 0,
        total_cents: Math.round(total * 100),
        status: 'ordered',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('orders').insert([dbRecord]).select();
      if (error) {
        console.error('Failed to insert order into DB', { dbRecord, error, data });
      } else {
        console.log('Order inserted into DB', data);
      }
    } catch (err) {
      console.error('Unexpected error inserting order into DB', err);
    }
  };

  const confirmDelivery = (code: string): boolean => {
    const order = orders.find(o =>
      o.status === 'in_progress' &&
      (o.verificationCode === code || o.pin === code)
    );

    if (order) {
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, status: 'delivered' as const } : o
      ));
      return true;
    }
    return false;
  };

  const getOrderByCode = (code: string): Order | undefined => {
    return orders.find(o =>
      o.verificationCode === code || o.pin === code
    );
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, confirmDelivery, getOrderByCode }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
}
