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
}

interface OrderContextType {
  orders: Order[];
  addOrder: (restaurantId: string, restaurantName: string, items: Array<{ item: any; quantity: number }>, total: number) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

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

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      date: dateString,
      restaurant: restaurantName,
      restaurantId,
      items: orderItems,
      total,
      status: 'in_progress'
    };

    setOrders(prev => [newOrder, ...prev]);
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder }}>
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
