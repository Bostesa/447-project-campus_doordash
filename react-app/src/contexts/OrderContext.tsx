import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
  // Map coordinates
  pickupCoords?: { latitude: number; longitude: number };
  deliveryCoords?: { latitude: number; longitude: number };
  deliveryBuildingName?: string;
  deliveryRoomNumber?: string;
}

interface PaymentInfo {
  paymentMethod: string;
  mealSwipeUsed: boolean;
  flexAmountCents: number;
  cardAmountCents: number;
  stripePaymentId?: string;
}

interface ScheduleInfo {
  isScheduled: boolean;
  scheduledFor?: string; // ISO timestamp
}

interface ScheduledJob extends AvailableJob {
  scheduledFor: string;
  minutesUntilReady: number;
}

interface OrderContextType {
  orders: Order[];
  availableJobs: AvailableJob[];
  scheduledJobs: ScheduledJob[];
  currentJob: AvailableJob | null;
  addOrder: (
    restaurantId: string,
    restaurantName: string,
    items: Array<{ item: any; quantity: number }>,
    total: number,
    tip: number,
    deliveryInstructions?: string,
    paymentInfo?: PaymentInfo,
    scheduleInfo?: ScheduleInfo
  ) => Promise<Order | null>;
  confirmDelivery: (code: string) => Promise<boolean>;
  getOrderByCode: (code: string) => Order | undefined;
  fetchAvailableJobs: () => Promise<void>;
  fetchScheduledJobs: () => Promise<void>;
  claimJob: (jobId: number) => Promise<boolean>;
  updateJobStatus: (jobId: number, status: string) => Promise<boolean>;
  loadingJobs: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [currentJob, setCurrentJob] = useState<AvailableJob | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Ref to store fetchAvailableJobs for use in polling without dependency loop
  const fetchAvailableJobsRef = useRef<() => Promise<void>>();

  // Clear all state when user logs out
  useEffect(() => {
    if (!user) {
      console.log('[OrderContext] User logged out - clearing all order state');
      setOrders([]);
      setAvailableJobs([]);
      setScheduledJobs([]);
      setCurrentJob(null);
      setLoadingJobs(false);
    }
  }, [user]);

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

  // Load orders from localStorage AND Supabase on mount (for customer's own orders view)
  useEffect(() => {
    async function loadOrders() {
      if (!user?.id) return;

      // First, load from localStorage for immediate display
      const storageKey = `dormdash_orders_${user.id}`;
      const savedOrders = localStorage.getItem(storageKey);
      let localOrders: Order[] = [];
      if (savedOrders) {
        try {
          localOrders = JSON.parse(savedOrders);
          setOrders(localOrders);
        } catch (error) {
          console.error('Error loading orders from localStorage:', error);
        }
      }

      // Then fetch from Supabase to get any orders that might not be in localStorage
      try {
        const { data: supabaseOrders, error } = await supabase
          .from('orders')
          .select(`
            id,
            total_cents,
            tip_cents,
            created_at,
            status,
            verification_code,
            pin,
            items_json,
            venue_id,
            delivery_instructions
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[OrderContext] Error fetching customer orders:', error);
          return;
        }

        if (supabaseOrders && supabaseOrders.length > 0) {
          // Convert Supabase orders to local format
          const ordersFromDb: Order[] = await Promise.all(
            supabaseOrders.map(async (dbOrder: any) => {
              // Get restaurant name
              let restaurantName = 'Unknown Restaurant';
              let restaurantSlug = '';
              if (dbOrder.venue_id) {
                const { data: restaurant } = await supabase
                  .from('restaurants')
                  .select('name, slug')
                  .eq('id', dbOrder.venue_id)
                  .single();
                if (restaurant) {
                  restaurantName = restaurant.name;
                  restaurantSlug = restaurant.slug;
                }
              }

              // Parse items
              let items: OrderItem[] = [];
              try {
                items = JSON.parse(dbOrder.items_json || '[]');
              } catch (e) {
                // ignore
              }

              // Format date
              const date = new Date(dbOrder.created_at);
              const now = new Date();
              const isToday = date.toDateString() === now.toDateString();
              const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              const dateStr = isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString()}, ${timeStr}`;

              return {
                id: `order-${dbOrder.id}`,
                supabaseId: dbOrder.id,
                date: dateStr,
                restaurant: restaurantName,
                restaurantId: restaurantSlug,
                items,
                total: dbOrder.total_cents / 100,
                status: dbOrder.status as Order['status'],
                verificationCode: dbOrder.verification_code || '',
                pin: dbOrder.pin || ''
              };
            })
          );

          // Merge with local orders (Supabase takes precedence for status updates)
          const mergedOrders = ordersFromDb.map(dbOrder => {
            const localOrder = localOrders.find(lo => lo.supabaseId === dbOrder.supabaseId);
            return localOrder ? { ...localOrder, status: dbOrder.status } : dbOrder;
          });

          // Add any local orders that aren't in Supabase yet
          const localOnlyOrders = localOrders.filter(lo =>
            !lo.supabaseId || !ordersFromDb.some(db => db.supabaseId === lo.supabaseId)
          );

          setOrders([...mergedOrders, ...localOnlyOrders]);
          console.log('[OrderContext] Merged orders from Supabase and localStorage:', mergedOrders.length + localOnlyOrders.length);
        }
      } catch (err) {
        console.error('[OrderContext] Error loading orders from Supabase:', err);
      }
    }

    loadOrders();
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

    console.log('[OrderContext] Setting up real-time subscription for customer orders, user:', user.id);

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
            console.log('[OrderContext] Updating order', orderId, 'to status', newStatus);
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
      .subscribe((status, err) => {
        console.log('[OrderContext] Customer subscription status:', status);
        if (err) {
          console.error('[OrderContext] Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[OrderContext] Successfully subscribed to customer order updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[OrderContext] Channel error - realtime may not be enabled on orders table');
        }
      });

    // Fallback: Poll for order updates every 15 seconds if realtime isn't working
    const pollInterval = setInterval(async () => {
      try {
        const { data: updatedOrders, error } = await supabase
          .from('orders')
          .select('id, status')
          .eq('customer_id', user.id)
          .in('status', ['pending', 'claimed', 'preparing', 'delivering']);

        if (error) {
          console.error('[OrderContext] Poll error:', error);
          return;
        }

        if (updatedOrders) {
          setOrders(prev => {
            let hasChanges = false;
            const updated = prev.map(order => {
              const dbOrder = updatedOrders.find((o: any) => o.id === order.supabaseId);
              if (dbOrder && dbOrder.status !== order.status) {
                hasChanges = true;
                console.log('[OrderContext] Poll found status change:', order.supabaseId, order.status, '->', dbOrder.status);
                // Show toast for status changes
                const statusMessage = getStatusMessage(dbOrder.status);
                if (dbOrder.status === 'delivered') {
                  toast.success(statusMessage);
                } else if (['delivering', 'claimed', 'preparing'].includes(dbOrder.status)) {
                  toast(statusMessage);
                }
                return { ...order, status: dbOrder.status as Order['status'] };
              }
              return order;
            });
            return hasChanges ? updated : prev;
          });
        }
      } catch (err) {
        console.error('[OrderContext] Poll exception:', err);
      }
    }, 15000);

    return () => {
      console.log('[OrderContext] Cleaning up customer subscription');
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.id, profile, getStatusMessage]);

  // Real-time subscription for worker new orders
  useEffect(() => {
    // Wait for profile to be loaded before setting up subscription
    if (!user?.id || !profile) return;

    console.log('[OrderContext] Setting up real-time subscription for new orders (worker)');

    let lastKnownJobIds = new Set<number>();

    const channel = supabase
      .channel('new-pending-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, async (payload) => {
        console.log('[OrderContext] New order inserted via realtime:', payload.new);

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

          setAvailableJobs(prev => {
            // Prevent duplicates
            if (prev.some(j => j.id === newJob.id)) return prev;
            return [...prev, newJob];
          });
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
      .subscribe((status, err) => {
        console.log('[OrderContext] Worker subscription status:', status);
        if (err) {
          console.error('[OrderContext] Worker subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[OrderContext] Successfully subscribed to worker order updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[OrderContext] Worker channel error - polling fallback active');
        }
      });

    // Fallback polling for workers - check for new orders every 10 seconds
    // This ensures workers see new orders even if Supabase Realtime isn't enabled
    const workerPollInterval = setInterval(async () => {
      try {
        const { data: pendingOrders, error } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'pending')
          .is('worker_id', null);

        if (error) {
          console.error('[OrderContext] Worker poll error:', error);
          return;
        }

        if (pendingOrders) {
          const currentDbIds = new Set(pendingOrders.map((o: any) => o.id));

          // Check if there are new orders we haven't seen
          const hasNewOrders = pendingOrders.some((o: any) => !lastKnownJobIds.has(o.id));

          // Update last known IDs
          lastKnownJobIds = currentDbIds;

          // Also check if any jobs were claimed and need removal
          setAvailableJobs(prev => {
            const filtered = prev.filter(job => currentDbIds.has(job.id));
            if (filtered.length !== prev.length) {
              console.log('[OrderContext] Worker poll: removed claimed jobs');
            }
            return filtered.length !== prev.length ? filtered : prev;
          });

          // If there are new orders, fetch full details using the ref
          if (hasNewOrders) {
            console.log('[OrderContext] Worker poll: detected new orders, auto-fetching...');
            // Use the ref to call fetchAvailableJobs without dependency loop
            if (fetchAvailableJobsRef.current) {
              fetchAvailableJobsRef.current();
            }
          }
        }
      } catch (err) {
        console.error('[OrderContext] Worker poll exception:', err);
      }
    }, 10000);

    return () => {
      console.log('[OrderContext] Cleaning up worker subscription');
      supabase.removeChannel(channel);
      clearInterval(workerPollInterval);
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
    deliveryInstructions?: string,
    paymentInfo?: PaymentInfo,
    scheduleInfo?: ScheduleInfo
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
      const dbRecord: Record<string, any> = {
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

      // Add payment info if provided
      if (paymentInfo) {
        dbRecord.payment_method = paymentInfo.paymentMethod;
        dbRecord.meal_swipe_used = paymentInfo.mealSwipeUsed;
        dbRecord.flex_amount_cents = paymentInfo.flexAmountCents;
        dbRecord.card_amount_cents = paymentInfo.cardAmountCents;
        if (paymentInfo.stripePaymentId) {
          dbRecord.stripe_payment_id = paymentInfo.stripePaymentId;
        }
      }

      // Add schedule info if provided
      if (scheduleInfo) {
        dbRecord.is_scheduled = scheduleInfo.isScheduled;
        if (scheduleInfo.scheduledFor) {
          dbRecord.scheduled_for = scheduleInfo.scheduledFor;
        }
      }

      console.log('[OrderContext] Creating order in Supabase:', dbRecord);

      const { data, error } = await supabase
        .from('orders')
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        console.error('[OrderContext] Failed to insert order into Supabase:', error);
        toast.error('Order saved locally but may not be visible to dashers. Check your connection.');
        // Still create local order for UX, but warn user
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
          // Get restaurant info including coordinates
          let restaurantName = 'Unknown Restaurant';
          let restaurantLocation = '';
          let pickupCoords: { latitude: number; longitude: number } | undefined;

          if (order.venue_id) {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name, location, latitude, longitude')
              .eq('id', order.venue_id)
              .single();
            if (restaurant) {
              restaurantName = restaurant.name;
              restaurantLocation = restaurant.location;
              if (restaurant.latitude && restaurant.longitude) {
                pickupCoords = {
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude
                };
              }
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

          // Parse delivery instructions for building info
          let deliveryCoords: { latitude: number; longitude: number } | undefined;
          let deliveryBuildingName: string | undefined;
          let deliveryRoomNumber: string | undefined;

          if (order.delivery_instructions) {
            try {
              const deliveryInfo = JSON.parse(order.delivery_instructions);

              // First check if buildingName is provided directly (new format)
              if (deliveryInfo.buildingName) {
                deliveryBuildingName = deliveryInfo.buildingName;
              }

              // If buildingId is provided, fetch additional details from DB
              if (deliveryInfo.buildingId) {
                const { data: building } = await supabase
                  .from('buildings')
                  .select('name, latitude, longitude')
                  .eq('id', deliveryInfo.buildingId)
                  .single();
                if (building) {
                  // Use DB name if not already set, and get coordinates
                  if (!deliveryBuildingName) {
                    deliveryBuildingName = building.name;
                  }
                  if (building.latitude && building.longitude) {
                    deliveryCoords = {
                      latitude: building.latitude,
                      longitude: building.longitude
                    };
                  }
                }
              }

              if (deliveryInfo.roomNumber) {
                deliveryRoomNumber = deliveryInfo.roomNumber;
              }
            } catch (e) {
              // delivery_instructions is plain text, not JSON - use as building name
              deliveryBuildingName = order.delivery_instructions;
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
            dropOffLocation: order.delivery_instructions || 'See delivery instructions',
            pickupCoords,
            deliveryCoords,
            deliveryBuildingName,
            deliveryRoomNumber
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

  // Keep the ref updated so polling can call it
  fetchAvailableJobsRef.current = fetchAvailableJobs;

  // Fetch scheduled jobs for workers (orders scheduled for the future)
  const fetchScheduledJobs = async () => {
    try {
      console.log('[OrderContext] Fetching scheduled jobs...');

      const now = new Date().toISOString();

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
          customer_id,
          scheduled_for
        `)
        .eq('status', 'pending')
        .eq('is_scheduled', true)
        .is('worker_id', null)
        .gt('scheduled_for', now)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('[OrderContext] Error fetching scheduled jobs:', error);
        setScheduledJobs([]);
        return;
      }

      console.log('[OrderContext] Raw scheduled orders from Supabase:', data);

      // Fetch restaurant and customer details for each order
      const jobsWithDetails: ScheduledJob[] = await Promise.all(
        (data || []).map(async (order: any) => {
          // Get restaurant info
          let restaurantName = 'Unknown Restaurant';
          let restaurantLocation = '';
          let pickupCoords: { latitude: number; longitude: number } | undefined;

          if (order.venue_id) {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name, location, latitude, longitude')
              .eq('id', order.venue_id)
              .single();
            if (restaurant) {
              restaurantName = restaurant.name;
              restaurantLocation = restaurant.location;
              if (restaurant.latitude && restaurant.longitude) {
                pickupCoords = {
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude
                };
              }
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

          // Parse delivery instructions for building info
          let deliveryCoords: { latitude: number; longitude: number } | undefined;
          let deliveryBuildingName: string | undefined;
          let deliveryRoomNumber: string | undefined;

          if (order.delivery_instructions) {
            try {
              const deliveryInfo = JSON.parse(order.delivery_instructions);

              // First check if buildingName is provided directly (new format)
              if (deliveryInfo.buildingName) {
                deliveryBuildingName = deliveryInfo.buildingName;
              }

              // If buildingId is provided, fetch additional details from DB
              if (deliveryInfo.buildingId) {
                const { data: building } = await supabase
                  .from('buildings')
                  .select('name, latitude, longitude')
                  .eq('id', deliveryInfo.buildingId)
                  .single();
                if (building) {
                  // Use DB name if not already set, and get coordinates
                  if (!deliveryBuildingName) {
                    deliveryBuildingName = building.name;
                  }
                  if (building.latitude && building.longitude) {
                    deliveryCoords = {
                      latitude: building.latitude,
                      longitude: building.longitude
                    };
                  }
                }
              }

              if (deliveryInfo.roomNumber) {
                deliveryRoomNumber = deliveryInfo.roomNumber;
              }
            } catch (e) {
              // delivery_instructions is plain text, not JSON - use as building name
              deliveryBuildingName = order.delivery_instructions;
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

          // Calculate minutes until ready
          const scheduledTime = new Date(order.scheduled_for);
          const minutesUntilReady = Math.max(0, Math.floor((scheduledTime.getTime() - Date.now()) / 60000));

          return {
            id: order.id,
            restaurant: restaurantName,
            restaurantLocation,
            customerName,
            itemCount,
            totalCents: order.total_cents,
            tipCents: order.tip_cents || 0,
            createdAt: order.created_at,
            dropOffLocation: order.delivery_instructions || 'See delivery instructions',
            pickupCoords,
            deliveryCoords,
            deliveryBuildingName,
            deliveryRoomNumber,
            scheduledFor: order.scheduled_for,
            minutesUntilReady
          };
        })
      );

      console.log('[OrderContext] Processed scheduled jobs:', jobsWithDetails);
      setScheduledJobs(jobsWithDetails);
    } catch (err) {
      console.error('Unexpected error fetching scheduled jobs:', err);
      setScheduledJobs([]);
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
      scheduledJobs,
      currentJob,
      addOrder,
      confirmDelivery,
      getOrderByCode,
      fetchAvailableJobs,
      fetchScheduledJobs,
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
