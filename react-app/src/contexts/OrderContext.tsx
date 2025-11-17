import { createContext, useContext, useState, ReactNode } from 'react';

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
  addOrder: (restaurantId: string, restaurantName: string, items: Array<{ item: any; quantity: number }>, total: number) => void;
  confirmDelivery: (code: string) => boolean;
  getOrderByCode: (code: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const generatePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateVerificationCode = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORDER-${timestamp}-${random}`;
  };

  const addOrder = (restaurantId: string, restaurantName: string, items: Array<{ item: any; quantity: number }>, total: number) => {
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
