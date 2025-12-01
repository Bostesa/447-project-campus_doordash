import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
  status: 'pending' | 'claimed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  verificationCode: string;
  pin: string;
  workerId?: string;
  supabaseId?: number; // The actual ID from Supabase
}

interface AvailableJob {
  id: number;
  restaurant: string;
  restaurantLocation: string;
  customerName: string;
  itemCount: number;
  totalCents: number;
  tipCents: number;
  createdAt: string;
  dropOffLocation?: string;
}

interface OrderContextType {
  orders: Order[];
  availableJobs: AvailableJob[];
  currentJob: AvailableJob | null;
  addOrder: (
    restaurantId: string,
    restaurantName: string,
    items: Array<{ item: any; quantity: number }>,
    total: number,
    tip: number,
    deliveryInstructions?: string
  ) => Promise<Order | null>;
  confirmDelivery: (code: string) => Promise<boolean>;
  getOrderByCode: (code: string) => Order | undefined;
  fetchAvailableJobs: () => Promise<void>;
  claimJob: (jobId: number) => Promise<boolean>;
  updateJobStatus: (jobId: number, status: string) => Promise<boolean>;
  loadingJobs: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [currentJob, setCurrentJob] = useState<AvailableJob | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Get status display text
  const getStatusMessage = useCallback((status: string, restaurantName?: string) => {
    switch (status) {
      case 'claimed':
        return `A dasher has accepted your order${restaurantName ? ` from ${restaurantName}` : ''}!`;
      case 'preparing':
        return 'Your order is being prepared!';
      case 'delivering':
        return 'Your order is on the way!';
      case 'delivered':
        return 'Your order has been delivered!';
      default:
        return `Order status updated to ${status}`;
    }
  }, []);

  // Load orders from localStorage on mount (for customer's own orders view)
  useEffect(() => {
    if (user?.id) {
      const storageKey = `dormdash_orders_${user.id}`;
      const savedOrders = localStorage.getItem(storageKey);
      if (savedOrders) {
        try {
          setOrders(JSON.parse(savedOrders));
        } catch (error) {
          console.error('Error loading orders:', error);
        }
      }
    }
  }, [user?.id]);

  // Save orders to localStorage
  useEffect(() => {
    if (user?.id && orders.length > 0) {
      const storageKey = `dormdash_orders_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(orders));
    }
  }, [orders, user?.id]);

  // Real-time subscription for customer order updates
  useEffect(() => {
    // Wait for profile to be loaded before setting up subscription
    if (!user?.id || !profile) return;
    if (profile.role === 'worker') return;

    console.log('[OrderContext] Setting up real-time subscription for customer orders');

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${user.id}`
      }, (payload) => {
        console.log('[OrderContext] Order update received:', payload.new);
        const newStatus = payload.new.status as Order['status'];
        const orderId = payload.new.id;

        // Update local order state
        setOrders(prev => prev.map(order => {
          if (order.supabaseId === orderId) {
            return { ...order, status: newStatus };
          }
          return order;
        }));

        // Show toast notification
        const statusMessage = getStatusMessage(newStatus);
        if (newStatus === 'delivered') {
          toast.success(statusMessage);
        } else if (newStatus === 'delivering') {
          toast(statusMessage);
        } else if (newStatus === 'claimed') {
          toast(statusMessage);
        } else if (newStatus === 'preparing') {
          toast(statusMessage);
        }
      })
      .subscribe((status) => {
        console.log('[OrderContext] Customer subscription status:', status);
      });

    return () => {
      console.log('[OrderContext] Cleaning up customer subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile, getStatusMessage]);

  // Real-time subscription for worker new orders
  useEffect(() => {
    // Wait for profile to be loaded before setting up subscription
    if (!user?.id || !profile) return;
    if (profile.role !== 'worker') return;

    console.log('[OrderContext] Setting up real-time subscription for new orders (worker)');

    const channel = supabase
      .channel('new-pending-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, async (payload) => {
        console.log('[OrderContext] New order inserted:', payload.new);

        if (payload.new.status === 'pending' && !payload.new.worker_id) {
          // Fetch restaurant details for the new order
          let restaurantName = 'Unknown Restaurant';
          let restaurantLocation = '';
          if (payload.new.venue_id) {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name, location')
              .eq('id', payload.new.venue_id)
              .single();
            if (restaurant) {
              restaurantName = restaurant.name;
              restaurantLocation = restaurant.location;
            }
          }

          // Get customer name
          let customerName = 'Customer';
          if (payload.new.customer_id) {
            const { data: customer } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', payload.new.customer_id)
              .single();
            if (customer) {
              customerName = customer.name;
            }
          }

          // Parse items
          let itemCount = 1;
          try {
            const items = JSON.parse(payload.new.items_json || '[]');
            itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          } catch (e) {
            // ignore
          }

          const newJob: AvailableJob = {
            id: payload.new.id,
            restaurant: restaurantName,
            restaurantLocation,
            customerName,
            itemCount,
            totalCents: payload.new.total_cents,
            tipCents: payload.new.tip_cents || 0,
            createdAt: payload.new.created_at,
            dropOffLocation: payload.new.delivery_instructions || 'See delivery instructions'
          };

          setAvailableJobs(prev => [...prev, newJob]);
          toast(`New order from ${restaurantName}!`);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        // Remove job from available if it was claimed by someone else
        if (payload.new.status !== 'pending' || payload.new.worker_id) {
          setAvailableJobs(prev => prev.filter(job => job.id !== payload.new.id));
        }
      })
      .subscribe((status) => {
        console.log('[OrderContext] Worker subscription status:', status);
      });

    return () => {
      console.log('[OrderContext] Cleaning up worker subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile]);

  const generatePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateVerificationCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const addOrder = async (
    restaurantId: string,
    restaurantName: string,
    items: Array<{ item: any; quantity: number }>,
    total: number,
    tip: number,
    deliveryInstructions?: string
  ): Promise<Order | null> => {
    if (!user?.id) {
      console.error('Cannot create order: No user logged in');
      return null;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = `Today, ${timeString}`;

    const orderItems: OrderItem[] = items.map(({ item, quantity }) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || '',
      icon: item.icon || '',
      quantity
    }));

    const pin = generatePin();
    const verificationCode = generateVerificationCode();

    // Look up the restaurant ID in Supabase
    let venueId = 0;
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', restaurantId)
        .single();

      if (restaurant) {
        venueId = restaurant.id;
      }
    } catch (err) {
      console.warn('Could not find restaurant by slug:', restaurantId);
    }

    // Insert into Supabase
    try {
      const dbRecord = {
        customer_id: user.id,
        venue_id: venueId,
        total_cents: Math.round(total * 100),
        tip_cents: Math.round(tip * 100),
        status: 'pending',
        verification_code: verificationCode,
        pin: pin,
        delivery_instructions: deliveryInstructions || null,
        items_json: JSON.stringify(orderItems),
        created_at: new Date().toISOString()
      };

      console.log('[OrderContext] Creating order in Supabase:', dbRecord);

      const { data, error } = await supabase
        .from('orders')
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        console.error('[OrderContext] Failed to insert order into Supabase:', error);
        // Still create local order for UX
      } else {
        console.log('[OrderContext] Order created in Supabase:', data);
      }

      const orderId = data?.id ? `order-${data.id}` : `order-${Date.now()}`;

      const newOrder: Order = {
        id: orderId,
        supabaseId: data?.id,
        date: dateString,
        restaurant: restaurantName,
        restaurantId,
        items: orderItems,
        total,
        status: 'pending',
        verificationCode,
        pin
      };

      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error('Unexpected error creating order:', err);
      return null;
    }
  };

  // Fetch available jobs for workers
  const fetchAvailableJobs = async () => {
    setLoadingJobs(true);
    try {
      console.log('[OrderContext] Fetching available jobs...');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_cents,
          tip_cents,
          created_at,
          delivery_instructions,
          items_json,
          venue_id,
          customer_id
        `)
        .eq('status', 'pending')
        .is('worker_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[OrderContext] Error fetching jobs:', error);
        setAvailableJobs([]);
        return;
      }

      console.log('[OrderContext] Raw orders from Supabase:', data);

      // Fetch restaurant and customer details for each order
      const jobsWithDetails: AvailableJob[] = await Promise.all(
        (data || []).map(async (order: any) => {
          // Get restaurant info
          let restaurantName = 'Unknown Restaurant';
          let restaurantLocation = '';
          if (order.venue_id) {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name, location')
              .eq('id', order.venue_id)
              .single();
            if (restaurant) {
              restaurantName = restaurant.name;
              restaurantLocation = restaurant.location;
            }
          }

          // Get customer info
          let customerName = 'Customer';
          if (order.customer_id) {
            const { data: customer } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', order.customer_id)
              .single();
            if (customer) {
              customerName = customer.name;
            }
          }

          // Parse items to get count
          let itemCount = 1;
          try {
            const items = JSON.parse(order.items_json || '[]');
            itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          } catch (e) {
            // ignore
          }

          return {
            id: order.id,
            restaurant: restaurantName,
            restaurantLocation,
            customerName,
            itemCount,
            totalCents: order.total_cents,
            tipCents: order.tip_cents || 0,
            createdAt: order.created_at,
            dropOffLocation: order.delivery_instructions || 'See delivery instructions'
          };
        })
      );

      console.log('[OrderContext] Processed jobs:', jobsWithDetails);
      setAvailableJobs(jobsWithDetails);
    } catch (err) {
      console.error('Unexpected error fetching jobs:', err);
      setAvailableJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Worker claims a job
  const claimJob = async (jobId: number): Promise<boolean> => {
    if (!user?.id) {
      console.error('Cannot claim job: No user logged in');
      return false;
    }

    try {
      console.log('[OrderContext] Claiming job:', jobId);

      const { error } = await supabase
        .from('orders')
        .update({
          worker_id: user.id,
          status: 'claimed'
        })
        .eq('id', jobId)
        .is('worker_id', null); // Only claim if not already claimed

      if (error) {
        console.error('[OrderContext] Error claiming job:', error);
        return false;
      }

      console.log('[OrderContext] Job claimed successfully');

      // Find and set current job
      const claimedJob = availableJobs.find(j => j.id === jobId);
      if (claimedJob) {
        setCurrentJob(claimedJob);
      }

      // Remove from available jobs
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId));

      return true;
    } catch (err) {
      console.error('Unexpected error claiming job:', err);
      return false;
    }
  };

  // Update job status
  const updateJobStatus = async (jobId: number, status: string): Promise<boolean> => {
    try {
      console.log('[OrderContext] Updating job status:', jobId, status);

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', jobId);

      if (error) {
        console.error('[OrderContext] Error updating job status:', error);
        return false;
      }

      console.log('[OrderContext] Job status updated');

      if (status === 'delivered') {
        setCurrentJob(null);
      }

      return true;
    } catch (err) {
      console.error('Unexpected error updating job status:', err);
      return false;
    }
  };

  const confirmDelivery = async (code: string): Promise<boolean> => {
    // First try to find in local orders
    const localOrder = orders.find(o =>
      (o.status === 'pending' || o.status === 'claimed' || o.status === 'preparing' || o.status === 'delivering') &&
      (o.verificationCode === code || o.pin === code)
    );

    if (localOrder) {
      setOrders(prev => prev.map(o =>
        o.id === localOrder.id ? { ...o, status: 'delivered' as const } : o
      ));

      // Also update in Supabase if we have the ID
      if (localOrder.supabaseId) {
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', localOrder.supabaseId);
      }

      return true;
    }

    // Try to find in Supabase by verification code or PIN
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .or(`verification_code.eq.${code},pin.eq.${code}`)
        .in('status', ['pending', 'claimed', 'preparing', 'delivering'])
        .single();

      if (order) {
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', order.id);

        setCurrentJob(null);
        return true;
      }
    } catch (err) {
      console.error('Error confirming delivery:', err);
    }

    return false;
  };

  const getOrderByCode = (code: string): Order | undefined => {
    return orders.find(o =>
      o.verificationCode === code || o.pin === code
    );
  };

  return (
    <OrderContext.Provider value={{
      orders,
      availableJobs,
      currentJob,
      addOrder,
      confirmDelivery,
      getOrderByCode,
      fetchAvailableJobs,
      claimJob,
      updateJobStatus,
      loadingJobs
    }}>
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
