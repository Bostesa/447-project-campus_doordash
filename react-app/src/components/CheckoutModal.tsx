import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './CheckoutModal.css';

interface DeliveryLocation {
  buildingId: string | number | null;
  isDorm: boolean;
  isApt: boolean;
  roomNumber: string;
  instructions: string;
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

interface Props {
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  onClose: () => void;
  onConfirmOrder: (paymentMethod: string, tip: number, deliveryInfo?: string) => void;
}

export default function CheckoutModal({ restaurantName, items, subtotal, onClose, onConfirmOrder }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'apple-pay' | 'card' | 'cash'>('card');
  const [selectedTip, setSelectedTip] = useState<number>(3);
  const [customTip, setCustomTip] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('No address set');

  // Load saved delivery location and fetch building name
  useEffect(() => {
    async function loadDeliveryAddress() {
      try {
        const saved = localStorage.getItem('deliveryLocation');
        if (!saved) {
          setDeliveryAddress('No address set - please update in Account settings');
          return;
        }

        const location: DeliveryLocation = JSON.parse(saved);

        // Pre-fill delivery instructions from saved location
        if (location.instructions) {
          setDeliveryInstructions(location.instructions);
        }

        // Fetch building name from Supabase
        if (location.buildingId) {
          const { data: building, error } = await supabase
            .from('buildings')
            .select('name')
            .eq('id', location.buildingId)
            .single();

          if (error) {
            console.error('[CheckoutModal] Error fetching building:', error);
            setDeliveryAddress('Building not found');
            return;
          }

          if (building) {
            const roomPart = location.roomNumber ? `, Room ${location.roomNumber}` : '';
            const typePart = location.isDorm ? ' (Dorm)' : '';
            setDeliveryAddress(`${building.name}${roomPart}${typePart}`);
          }
        } else {
          setDeliveryAddress('No building selected - please update in Account settings');
        }
      } catch (err) {
        console.error('[CheckoutModal] Error loading delivery address:', err);
        setDeliveryAddress('Error loading address');
      }
    }

    loadDeliveryAddress();
  }, []);

  const deliveryFee = 2.99;
  const serviceFee = 1.50;
  const tipAmount = selectedTip === -1 ? (parseFloat(customTip) || 0) : selectedTip;
  const total = subtotal + deliveryFee + serviceFee + tipAmount;

  const tipOptions = [
    { label: '$2', value: 2 },
    { label: '$3', value: 3 },
    { label: '$4', value: 4 },
    { label: '$5', value: 5 }
  ];

  const handleConfirm = () => {
    // Combine delivery address with any additional instructions
    const fullDeliveryInfo = deliveryInstructions
      ? `${deliveryAddress}\n\nInstructions: ${deliveryInstructions}`
      : deliveryAddress;
    onConfirmOrder(paymentMethod, tipAmount, fullDeliveryInfo);
  };

  return (
    <>
      <div className="checkout-overlay" onClick={onClose} />
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2>Checkout</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
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
            <div className="delivery-info">
              <div className="info-row">
                <span className="info-label">Location</span>
                <span className="info-value">{deliveryAddress}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Estimated Time</span>
                <span className="info-value">15-25 min</span>
              </div>
            </div>
            <textarea
              className="delivery-instructions"
              placeholder="Add delivery instructions (e.g., Leave at door, Ring doorbell)"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              rows={3}
            />
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
            <h3 className="checkout-section-title">Payment Method</h3>
            <div className="payment-options">
              <button
                className={`payment-btn ${paymentMethod === 'apple-pay' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('apple-pay')}
              >
                <span className="payment-text">Apple Pay</span>
              </button>
              <button
                className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className="payment-text">Credit Card .... 4242</span>
              </button>
              <button
                className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <span className="payment-text">Cash</span>
              </button>
            </div>
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
            </div>
          </section>
        </div>

        <div className="checkout-footer">
          <button className="confirm-order-btn" onClick={handleConfirm}>
            Place Order • ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </>
  );
}
