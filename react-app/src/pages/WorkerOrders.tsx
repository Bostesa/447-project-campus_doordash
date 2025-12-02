import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import './OrdersPage.css';

interface Props {
  username: string;
}

interface DeliveryRecord {
  id: number;
  restaurant: string;
  title: string;
  itemCount: number;
  details: string;
  earnings: number;
  tipCents: number;
  date: string;
  status: 'delivered' | 'cancelled';
  deliveryAddress: string;
}

export default function WorkerOrders(_props: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    weekDeliveries: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    allTimeEarnings: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchDeliveries();
    }
  }, [user?.id]);

  const fetchDeliveries = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch all orders where this worker is the worker_id
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_cents,
          tip_cents,
          created_at,
          status,
          delivery_instructions,
          items_json,
          venue_id
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WorkerOrders] Error fetching deliveries:', error);
        setLoading(false);
        return;
      }

      // Get restaurant details for each order
      const deliveriesWithDetails: DeliveryRecord[] = await Promise.all(
        (data || []).map(async (order: any) => {
          // Get restaurant name
          let restaurantName = 'Unknown Restaurant';
          if (order.venue_id) {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name')
              .eq('id', order.venue_id)
              .single();
            if (restaurant) {
              restaurantName = restaurant.name;
            }
          }

          // Parse items
          let itemCount = 1;
          let title = 'Order';
          try {
            const items = JSON.parse(order.items_json || '[]');
            itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
            if (items.length > 0) {
              const firstItem = items[0];
              title = itemCount === 1 ? firstItem.name : `${firstItem.name} & ${itemCount - 1} more`;
            }
          } catch (e) {
            // ignore
          }

          // Format date
          const orderDate = new Date(order.created_at);
          const now = new Date();
          const isToday = orderDate.toDateString() === now.toDateString();
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const isYesterday = orderDate.toDateString() === yesterday.toDateString();

          let dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (isToday) dateStr = 'Today';
          else if (isYesterday) dateStr = 'Yesterday';

          const timeStr = orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

          // Calculate earnings (tip + base delivery fee of $2)
          const baseFee = 200; // $2.00 base fee in cents
          const tipCents = order.tip_cents || 0;
          const earnings = (baseFee + tipCents) / 100;

          return {
            id: order.id,
            restaurant: restaurantName,
            title,
            itemCount,
            details: `${itemCount} item${itemCount !== 1 ? 's' : ''} - ${order.delivery_instructions || 'Delivered'}`,
            earnings,
            tipCents,
            date: `${dateStr}, ${timeStr}`,
            status: order.status === 'delivered' ? 'delivered' : 'cancelled',
            deliveryAddress: order.delivery_instructions || ''
          };
        })
      );

      setDeliveries(deliveriesWithDetails);

      // Calculate stats
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      let todayDeliveries = 0;
      let weekDeliveries = 0;
      let todayEarnings = 0;
      let weekEarnings = 0;
      let allTimeEarnings = 0;

      (data || []).forEach((order: any) => {
        if (order.status !== 'delivered') return;

        const orderDate = new Date(order.created_at);
        const baseFee = 200; // $2.00 base fee in cents
        const tipCents = order.tip_cents || 0;
        const earnings = (baseFee + tipCents) / 100;

        allTimeEarnings += earnings;

        if (orderDate >= startOfWeek) {
          weekDeliveries++;
          weekEarnings += earnings;
        }

        if (orderDate >= startOfToday) {
          todayDeliveries++;
          todayEarnings += earnings;
        }
      });

      setStats({
        todayDeliveries,
        weekDeliveries,
        todayEarnings,
        weekEarnings,
        allTimeEarnings
      });

    } catch (err) {
      console.error('[WorkerOrders] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orders-page worker">
      <Header activeTab="earnings" />

      <div className="content-wrapper">
        <h2 className="section-title">Your Earnings</h2>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-label">Today</div>
            <div className="stat-value worker-accent">${stats.todayEarnings.toFixed(2)}</div>
            <div className="stat-sublabel">{stats.todayDeliveries} deliveries</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This Week</div>
            <div className="stat-value worker-accent">${stats.weekEarnings.toFixed(2)}</div>
            <div className="stat-sublabel">{stats.weekDeliveries} deliveries</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">All Time</div>
            <div className="stat-value worker-accent">${stats.allTimeEarnings.toFixed(2)}</div>
          </div>
        </div>

        <h3 className="subsection-title">Recent Deliveries</h3>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="empty-state">
            <p>No deliveries yet. Accept jobs from the dashboard to start earning!</p>
            <button className="primary-btn" onClick={() => navigate('/worker-dashboard')}>
              View Available Jobs
            </button>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <div key={delivery.id} className="order-card worker">
              <div className="order-header">
                <div className="order-date">{delivery.date}</div>
                <div className={`order-status ${delivery.status}`}>
                  {delivery.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                </div>
              </div>
              <div className="order-from">Order from {delivery.restaurant}</div>
              <div className="order-title">{delivery.title}</div>
              <div className="order-details">{delivery.details}</div>
              <div className="order-footer">
                <div className="order-earnings">Earned: ${delivery.earnings.toFixed(2)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
