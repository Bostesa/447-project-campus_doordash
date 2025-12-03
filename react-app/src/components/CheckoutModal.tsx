import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PaymentSelector, { PaymentInfo } from './PaymentSelector';
import './CheckoutModal.css';

interface DeliveryLocation {
  buildingId: string | number | null;
  isDorm: boolean;
  isApt: boolean;
  roomNumber: string;
  instructions: string;
}

interface Building {
  id: number;
  name: string;
  is_dorm: boolean;
  is_apt: boolean;
}

interface CartItem {
  item: {
    id: string;
    name: string;
    price: number;
    icon: string;
  };
  quantity: number;
}

export interface OrderPaymentInfo {
  paymentMethod: string;
  mealSwipeUsed: boolean;
  flexAmountCents: number;
  cardAmountCents: number;
  stripePaymentId?: string;
}

export interface ScheduleInfo {
  isScheduled: boolean;
  scheduledFor?: string; // ISO timestamp
}

interface OperatingHours {
  [key: string]: { open: string; close: string } | null;
}

interface Props {
  restaurantName: string;
  restaurantSlug?: string;
  items: CartItem[];
  subtotal: number;
  onClose: () => void;
  onConfirmOrder: (paymentMethod: string, tip: number, deliveryInfo?: string, paymentInfo?: OrderPaymentInfo, scheduleInfo?: ScheduleInfo) => void;
  isOpen?: boolean;
  operatingHours?: OperatingHours;
}

export default function CheckoutModal({ restaurantName, restaurantSlug, items, subtotal, onClose, onConfirmOrder, isOpen = true, operatingHours }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [selectedTip, setSelectedTip] = useState<number>(3);
  const [customTip, setCustomTip] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isSwipeDeal, setIsSwipeDeal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardValid, setCardValid] = useState(false);

  // Delivery location state
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [loadingBuildings, setLoadingBuildings] = useState(true);

  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'asap' | 'scheduled'>(isOpen ? 'asap' : 'scheduled');
  const [scheduleDate, setScheduleDate] = useState<string>('today');
  const [scheduleTime, setScheduleTime] = useState<string>('');

  // Generate available time slots based on operating hours
  const getAvailableTimeSlots = useCallback(() => {
    const slots: string[] = [];
    const now = new Date();
    const isToday = scheduleDate === 'today';

    // Get the day of week for the selected date
    const targetDate = isToday ? now : new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[targetDate.getDay()];

    // Get operating hours for that day
    const hours = operatingHours?.[dayName];
    if (!hours) {
      // Default hours if not specified: 7 AM - 10 PM
      const defaultOpen = 7;
      const defaultClose = 22;

      for (let hour = defaultOpen; hour < defaultClose; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = new Date(targetDate);
          slotTime.setHours(hour, minute, 0, 0);

          // Skip times less than 30 min from now (for today)
          if (isToday && slotTime.getTime() < now.getTime() + 30 * 60 * 1000) {
            continue;
          }

          const timeStr = slotTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          slots.push(timeStr);
        }
      }
      return slots;
    }

    // Parse operating hours (format: "HH:MM" or "H:MM")
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);

    for (let hour = openHour; hour <= closeHour; hour++) {
      for (const minute of [0, 30]) {
        // Skip times before opening or after closing
        if (hour === openHour && minute < openMin) continue;
        if (hour === closeHour && minute > closeMin) continue;

        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, minute, 0, 0);

        // Skip times less than 30 min from now (for today)
        if (isToday && slotTime.getTime() < now.getTime() + 30 * 60 * 1000) {
          continue;
        }

        const timeStr = slotTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        slots.push(timeStr);
      }
    }

    return slots;
  }, [scheduleDate, operatingHours]);

  // Get scheduled timestamp
  const getScheduledTimestamp = useCallback((): string | undefined => {
    if (scheduleType === 'asap' || !scheduleTime) return undefined;

    const now = new Date();
    const targetDate = scheduleDate === 'today' ? now : new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Parse the time string (e.g., "2:30 PM")
    const timeMatch = scheduleTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return undefined;

    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    const isPM = timeMatch[3].toUpperCase() === 'PM';

    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    targetDate.setHours(hour, minute, 0, 0);
    return targetDate.toISOString();
  }, [scheduleType, scheduleDate, scheduleTime]);

  // Set default time when switching to scheduled
  useEffect(() => {
    if (scheduleType === 'scheduled' && !scheduleTime) {
      const slots = getAvailableTimeSlots();
      if (slots.length > 0) {
        setScheduleTime(slots[0]);
      }
    }
  }, [scheduleType, scheduleTime, getAvailableTimeSlots]);

  // Fetch buildings for delivery location selection
  useEffect(() => {
    async function fetchBuildings() {
      setLoadingBuildings(true);
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('id, name, is_dorm, is_apt')
          .or('is_dorm.eq.true,is_apt.eq.true')
          .order('name');

        if (error) {
          console.error('[CheckoutModal] Error fetching buildings:', error);
          return;
        }

        setBuildings(data || []);

        // Try to load previously saved location as default
        const saved = localStorage.getItem('deliveryLocation');
        if (saved) {
          try {
            const location: DeliveryLocation = JSON.parse(saved);
            if (location.buildingId) {
              setSelectedBuildingId(Number(location.buildingId));
            }
            if (location.roomNumber) {
              setRoomNumber(location.roomNumber);
            }
            if (location.instructions) {
              setDeliveryInstructions(location.instructions);
            }
          } catch (e) {
            console.error('[CheckoutModal] Error parsing saved location:', e);
          }
        }
      } catch (err) {
        console.error('[CheckoutModal] Error loading buildings:', err);
      } finally {
        setLoadingBuildings(false);
      }
    }

    fetchBuildings();
  }, []);

  // Get the selected building object
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);

  // Check if restaurant is a swipe deal
  useEffect(() => {
    async function checkSwipeDeal() {
      if (!restaurantSlug) {
        // Check by name as fallback
        const isChickFilA = restaurantName.toLowerCase().includes('chick-fil-a') ||
                           restaurantName.toLowerCase().includes('chickfila');
        setIsSwipeDeal(isChickFilA);
        return;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('is_swipe_deal')
        .eq('slug', restaurantSlug)
        .single();

      if (error) {
        console.error('[CheckoutModal] Error checking swipe deal:', error);
        return;
      }

      setIsSwipeDeal(data?.is_swipe_deal || false);
    }

    checkSwipeDeal();
  }, [restaurantSlug, restaurantName]);

  const deliveryFee = 2.99;
  const serviceFee = 1.50;
  const tipAmount = selectedTip === -1 ? (parseFloat(customTip) || 0) : selectedTip;
  const total = subtotal + deliveryFee + serviceFee + tipAmount;
  const totalCents = Math.round(total * 100);

  const tipOptions = [
    { label: '$2', value: 2 },
    { label: '$3', value: 3 },
    { label: '$4', value: 4 },
    { label: '$5', value: 5 }
  ];

  const handlePaymentSelect = useCallback((info: PaymentInfo) => {
    setPaymentInfo(info);
  }, []);

  const handleCardValidityChange = useCallback((isValid: boolean) => {
    setCardValid(isValid);
  }, []);

  const handleProcessPayment = async (): Promise<boolean> => {
    // For now, simulate successful payment
    // In production, this would process the Stripe payment
    return true;
  };

  const handleConfirm = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      // Process payment based on selected method
      if (paymentInfo) {
        // If card payment involved, process Stripe (simulated for now)
        if (paymentInfo.cardAmountCents > 0) {
          const success = await handleProcessPayment();
          if (!success) {
            toast.error('Payment failed. Please try again.');
            setProcessing(false);
            return;
          }
        }

        // Update profile balances in Supabase if meal swipe or flex used
        if (paymentInfo.mealSwipeUsed || paymentInfo.flexAmountCents > 0) {
          const updates: Record<string, number> = {};

          if (paymentInfo.mealSwipeUsed && profile) {
            updates.meal_swipes_remaining = Math.max(0, profile.meal_swipes_remaining - 1);
          }

          if (paymentInfo.flexAmountCents > 0 && profile) {
            updates.flex_balance_cents = Math.max(0, profile.flex_balance_cents - paymentInfo.flexAmountCents);
          }

          if (Object.keys(updates).length > 0 && profile) {
            const { error } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', profile.id);

            if (error) {
              console.error('[CheckoutModal] Error updating profile:', error);
              toast.error('Error processing payment. Please try again.');
              setProcessing(false);
              return;
            }

            // Refresh profile to get updated balances
            await refreshProfile();
          }
        }
      }

      // Create structured delivery info as JSON for parsing by workers
      const deliveryData = {
        buildingId: selectedBuildingId,
        buildingName: selectedBuilding?.name || 'Unknown Building',
        roomNumber: roomNumber,
        instructions: deliveryInstructions
      };
      const fullDeliveryInfo = JSON.stringify(deliveryData);

      // Save the delivery location for future orders
      if (selectedBuildingId) {
        localStorage.setItem('deliveryLocation', JSON.stringify({
          buildingId: selectedBuildingId,
          isDorm: selectedBuilding?.is_dorm || false,
          isApt: selectedBuilding?.is_apt || false,
          roomNumber: roomNumber,
          instructions: deliveryInstructions
        }));
      }

      // Create order payment info
      const orderPaymentInfo: OrderPaymentInfo = paymentInfo ? {
        paymentMethod: paymentInfo.method,
        mealSwipeUsed: paymentInfo.mealSwipeUsed,
        flexAmountCents: paymentInfo.flexAmountCents,
        cardAmountCents: paymentInfo.cardAmountCents,
        stripePaymentId: paymentInfo.stripePaymentId,
      } : {
        paymentMethod: 'card',
        mealSwipeUsed: false,
        flexAmountCents: 0,
        cardAmountCents: totalCents,
      };

      // Create schedule info
      const scheduleInfo: ScheduleInfo = {
        isScheduled: scheduleType === 'scheduled',
        scheduledFor: getScheduledTimestamp(),
      };

      onConfirmOrder(paymentInfo?.method || 'card', tipAmount, fullDeliveryInfo, orderPaymentInfo, scheduleInfo);
    } catch (err) {
      console.error('[CheckoutModal] Error confirming order:', err);
      toast.error('Error placing order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate what's due based on payment method
  const getButtonText = () => {
    if (processing) return 'Processing...';

    if (!paymentInfo || paymentInfo.cardAmountCents > 0) {
      const cardDue = paymentInfo?.cardAmountCents ? paymentInfo.cardAmountCents / 100 : total;
      return `Place Order - $${cardDue.toFixed(2)} card`;
    }

    return 'Place Order - $0.00 due';
  };

  return (
    <>
      <div className="checkout-overlay" onClick={onClose} />
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2>Checkout</h2>
          <button className="modal-close-btn" onClick={onClose}>x</button>
        </div>

        <div className="checkout-content">
          {/* Order Summary */}
          <section className="checkout-section">
            <h3 className="checkout-section-title">Order from {restaurantName}</h3>
            <div className="checkout-items">
              {items.map(({ item, quantity }) => (
                <div key={item.id} className="checkout-item">
                  <span className="checkout-item-qty">{quantity}x</span>
                  <span className="checkout-item-name">{item.name}</span>
                  <span className="checkout-item-price">${(item.price * quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Details */}
          <section className="checkout-section">
            <h3 className="checkout-section-title">Delivery Details</h3>
            <div className="delivery-location-form">
              <div className="form-group">
                <label className="form-label">Delivery Building *</label>
                {loadingBuildings ? (
                  <div className="loading-buildings">Loading buildings...</div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedBuildingId || ''}
                    onChange={(e) => setSelectedBuildingId(e.target.value ? Number(e.target.value) : null)}
                    required
                  >
                    <option value="">Select your building...</option>
                    {buildings.map(building => (
                      <option key={building.id} value={building.id}>
                        {building.name} {building.is_dorm ? '(Dorm)' : building.is_apt ? '(Apartment)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Room Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 312, 4A, Suite 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Instructions (optional)</label>
                <textarea
                  className="delivery-instructions"
                  placeholder="e.g., Leave at door, Ring doorbell, Call when arriving"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="delivery-info">
              <div className="info-row">
                <span className="info-label">Estimated Time</span>
                <span className="info-value">
                  {scheduleType === 'scheduled' && scheduleTime
                    ? `Scheduled: ${scheduleDate === 'today' ? 'Today' : 'Tomorrow'} at ${scheduleTime}`
                    : '15-25 min'}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery Time Selection */}
          <section className="checkout-section">
            <h3 className="checkout-section-title">Delivery Time</h3>
            {!isOpen && (
              <div className="schedule-notice">
                This restaurant is currently closed. You can schedule an order for when they open.
              </div>
            )}
            <div className="schedule-options">
              <label className={`schedule-option ${scheduleType === 'asap' ? 'selected' : ''} ${!isOpen ? 'disabled' : ''}`}>
                <input
                  type="radio"
                  name="schedule"
                  value="asap"
                  checked={scheduleType === 'asap'}
                  onChange={() => setScheduleType('asap')}
                  disabled={!isOpen}
                />
                <div className="option-content">
                  <span className="option-title">ASAP</span>
                  <span className="option-detail">Delivery in 15-25 min</span>
                </div>
              </label>

              <label className={`schedule-option ${scheduleType === 'scheduled' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="schedule"
                  value="scheduled"
                  checked={scheduleType === 'scheduled'}
                  onChange={() => setScheduleType('scheduled')}
                />
                <div className="option-content">
                  <span className="option-title">Schedule for Later</span>
                  <span className="option-detail">Choose a specific time</span>
                </div>
              </label>
            </div>

            {scheduleType === 'scheduled' && (
              <div className="schedule-picker">
                <div className="schedule-row">
                  <label className="schedule-label">Date</label>
                  <select
                    className="schedule-select"
                    value={scheduleDate}
                    onChange={(e) => {
                      setScheduleDate(e.target.value);
                      setScheduleTime(''); // Reset time when date changes
                    }}
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                  </select>
                </div>

                <div className="schedule-row">
                  <label className="schedule-label">Time</label>
                  <select
                    className="schedule-select"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  >
                    {getAvailableTimeSlots().length === 0 ? (
                      <option value="">No available times</option>
                    ) : (
                      getAvailableTimeSlots().map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Tip Selection */}
          <section className="checkout-section">
            <h3 className="checkout-section-title">Add a tip for your delivery worker</h3>
            <div className="tip-options">
              {tipOptions.map((option) => (
                <button
                  key={option.value}
                  className={`tip-btn ${selectedTip === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTip(option.value);
                    setCustomTip('');
                  }}
                >
                  {option.label}
                </button>
              ))}
              <button
                className={`tip-btn ${selectedTip === -1 ? 'active' : ''}`}
                onClick={() => setSelectedTip(-1)}
              >
                Other
              </button>
            </div>
            {selectedTip === -1 && (
              <div className="custom-tip-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="checkout-section">
            <PaymentSelector
              totalCents={totalCents}
              hasMealPlan={profile?.has_meal_plan || false}
              mealSwipesRemaining={profile?.meal_swipes_remaining || 0}
              flexBalanceCents={profile?.flex_balance_cents || 0}
              isSwipeDeal={isSwipeDeal}
              onPaymentSelect={handlePaymentSelect}
              onProcessPayment={handleProcessPayment}
              onCardValidityChange={handleCardValidityChange}
            />
          </section>

          {/* Price Breakdown */}
          <section className="checkout-section">
            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Service Fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>Delivery Worker Tip</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
              <div className="price-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {paymentInfo && paymentInfo.mealSwipeUsed && (
                <div className="price-row discount">
                  <span>Meal Swipe Credit</span>
                  <span>-${(isSwipeDeal ? total : 8.42).toFixed(2)}</span>
                </div>
              )}
              {paymentInfo && paymentInfo.flexAmountCents > 0 && (
                <div className="price-row discount">
                  <span>Flex Dollars</span>
                  <span>-${(paymentInfo.flexAmountCents / 100).toFixed(2)}</span>
                </div>
              )}
              {paymentInfo && paymentInfo.cardAmountCents > 0 && (
                <div className="price-row due">
                  <span>Card Payment</span>
                  <span>${(paymentInfo.cardAmountCents / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="checkout-footer">
          {(!selectedBuildingId || !roomNumber.trim()) && (
            <div className="delivery-warning">
              Please select a delivery building and enter your room number
            </div>
          )}
          <button
            className="confirm-order-btn"
            onClick={handleConfirm}
            disabled={processing || !cardValid || !selectedBuildingId || !roomNumber.trim()}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </>
  );
}
