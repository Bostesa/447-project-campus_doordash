import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';
import './PaymentSelector.css';

// Constants
const MEAL_SWIPE_VALUE_CENTS = 842; // $8.42

// Meal periods for swipe validation
function getCurrentMealPeriod(): string | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Breakfast: 6:00 AM - 10:59 AM (360 - 659)
  if (totalMinutes >= 360 && totalMinutes < 660) return 'breakfast';
  // Lunch: 11:00 AM - 3:59 PM (660 - 959)
  if (totalMinutes >= 660 && totalMinutes < 960) return 'lunch';
  // Dinner: 4:00 PM - 7:59 PM (960 - 1199)
  if (totalMinutes >= 960 && totalMinutes < 1200) return 'dinner';
  // Late Night: 8:00 PM - 2:59 AM (1200 - 1439 OR 0 - 179)
  if (totalMinutes >= 1200 || totalMinutes < 180) return 'late_night';

  return null;
}

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface PaymentInfo {
  method: 'meal_swipe' | 'flex' | 'card' | 'split_swipe_flex' | 'split_swipe_card';
  mealSwipeUsed: boolean;
  flexAmountCents: number;
  cardAmountCents: number;
  stripePaymentId?: string;
}

interface PaymentSelectorProps {
  totalCents: number;
  hasMealPlan: boolean;
  mealSwipesRemaining: number;
  flexBalanceCents: number;
  isSwipeDeal: boolean; // True for Chick-fil-A - swipe covers entire order
  onPaymentSelect: (paymentInfo: PaymentInfo) => void;
  onProcessPayment: () => Promise<boolean>;
  onCardValidityChange?: (isValid: boolean) => void;
}

// Card form component
// Note: useStripe() and useElements() hooks are available via the Elements provider
// and can be used for actual payment processing when backend is set up
function CardForm({ onCardReady }: { onCardReady: (ready: boolean) => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: any) => {
    if (event.error) {
      setError(event.error.message);
      onCardReady(false);
    } else {
      setError(null);
      onCardReady(event.complete);
    }
  };

  return (
    <div className="card-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
          onChange={handleChange}
        />
      </div>
      {error && <div className="card-error">{error}</div>}
    </div>
  );
}

export default function PaymentSelector({
  totalCents,
  hasMealPlan,
  mealSwipesRemaining,
  flexBalanceCents,
  isSwipeDeal,
  onPaymentSelect,
  onProcessPayment: _onProcessPayment, // Will be used for actual payment processing
  onCardValidityChange,
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [cardReady, setCardReady] = useState(false);
  const [applePaySelected, setApplePaySelected] = useState(false);
  const [applePayProcessing, setApplePayProcessing] = useState(false);

  const totalDollars = totalCents / 100;
  const mealSwipeValueDollars = MEAL_SWIPE_VALUE_CENTS / 100;
  const flexBalanceDollars = flexBalanceCents / 100;

  // Calculate amounts based on selected payment method
  const mealPeriod = getCurrentMealPeriod();
  const canUseMealSwipe = hasMealPlan && mealSwipesRemaining > 0 && mealPeriod !== null;

  // For swipe deal restaurants, swipe covers entire order
  // Otherwise, swipe = $8.42 credit
  const swipeCreditCents = isSwipeDeal ? totalCents : MEAL_SWIPE_VALUE_CENTS;
  const remainderAfterSwipeCents = Math.max(0, totalCents - swipeCreditCents);
  const remainderAfterSwipeDollars = remainderAfterSwipeCents / 100;

  // Can we cover the remainder with flex?
  const canCoverRemainderWithFlex = flexBalanceCents >= remainderAfterSwipeCents;
  // Can we cover the full total with flex?
  const canCoverFullWithFlex = flexBalanceCents >= totalCents;

  // Notify parent of card validity changes
  useEffect(() => {
    if (onCardValidityChange) {
      // Card is required for 'card' and 'split_swipe_card' methods
      const needsCard = selectedMethod === 'card' || selectedMethod === 'split_swipe_card';
      // Apple Pay counts as valid card payment
      const isValid = !needsCard || cardReady || applePaySelected;
      onCardValidityChange(isValid);
    }
  }, [selectedMethod, cardReady, applePaySelected, onCardValidityChange]);

  // Handle Apple Pay click - simulate successful payment
  const handleApplePayClick = async () => {
    setApplePayProcessing(true);
    // Simulate Apple Pay authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setApplePaySelected(true);
    setApplePayProcessing(false);
  };

  // Update parent when selection changes
  useEffect(() => {
    let paymentInfo: PaymentInfo;

    switch (selectedMethod) {
      case 'meal_swipe':
        paymentInfo = {
          method: 'meal_swipe',
          mealSwipeUsed: true,
          flexAmountCents: 0,
          cardAmountCents: 0,
        };
        break;
      case 'split_swipe_flex':
        paymentInfo = {
          method: 'split_swipe_flex',
          mealSwipeUsed: true,
          flexAmountCents: remainderAfterSwipeCents,
          cardAmountCents: 0,
        };
        break;
      case 'split_swipe_card':
        paymentInfo = {
          method: 'split_swipe_card',
          mealSwipeUsed: true,
          flexAmountCents: 0,
          cardAmountCents: remainderAfterSwipeCents,
        };
        break;
      case 'flex':
        paymentInfo = {
          method: 'flex',
          mealSwipeUsed: false,
          flexAmountCents: totalCents,
          cardAmountCents: 0,
        };
        break;
      case 'card':
      default:
        paymentInfo = {
          method: 'card',
          mealSwipeUsed: false,
          flexAmountCents: 0,
          cardAmountCents: totalCents,
        };
        break;
    }

    onPaymentSelect(paymentInfo);
  }, [selectedMethod, totalCents, remainderAfterSwipeCents, onPaymentSelect]);

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
  };

  return (
    <div className="payment-selector">
      <h3 className="payment-selector-title">Payment Method</h3>

      {/* Meal Plan Status */}
      {hasMealPlan && (
        <div className="meal-plan-status">
          <div className="status-row">
            <span className="status-label">Meal Swipes:</span>
            <span className="status-value">{mealSwipesRemaining} remaining</span>
          </div>
          <div className="status-row">
            <span className="status-label">Flex Balance:</span>
            <span className="status-value">${flexBalanceDollars.toFixed(2)}</span>
          </div>
          {mealPeriod && (
            <div className="status-row">
              <span className="status-label">Current Period:</span>
              <span className="status-value">{mealPeriod.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      )}

      <div className="payment-options">
        {/* Meal Swipe Option */}
        {canUseMealSwipe && (
          <>
            {/* Full swipe (covers entire order) */}
            {(isSwipeDeal || totalCents <= MEAL_SWIPE_VALUE_CENTS) && (
              <label className={`payment-option ${selectedMethod === 'meal_swipe' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="meal_swipe"
                  checked={selectedMethod === 'meal_swipe'}
                  onChange={() => handleMethodChange('meal_swipe')}
                />
                <div className="option-content">
                  <span className="option-title">Use Meal Swipe</span>
                  <span className="option-detail">
                    {isSwipeDeal
                      ? 'Swipe deal - covers entire order'
                      : `Covers up to $${mealSwipeValueDollars.toFixed(2)}`}
                  </span>
                </div>
                <span className="option-amount">$0.00 due</span>
              </label>
            )}

            {/* Swipe + remainder (order exceeds swipe value) */}
            {!isSwipeDeal && totalCents > MEAL_SWIPE_VALUE_CENTS && (
              <>
                {/* Swipe + Flex for remainder */}
                {canCoverRemainderWithFlex && (
                  <label className={`payment-option ${selectedMethod === 'split_swipe_flex' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="split_swipe_flex"
                      checked={selectedMethod === 'split_swipe_flex'}
                      onChange={() => handleMethodChange('split_swipe_flex')}
                    />
                    <div className="option-content">
                      <span className="option-title">Meal Swipe + Flex</span>
                      <span className="option-detail">
                        Swipe: ${mealSwipeValueDollars.toFixed(2)} credit, Flex: ${remainderAfterSwipeDollars.toFixed(2)}
                      </span>
                    </div>
                    <span className="option-amount">$0.00 card</span>
                  </label>
                )}

                {/* Swipe + Card for remainder */}
                <label className={`payment-option ${selectedMethod === 'split_swipe_card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="split_swipe_card"
                    checked={selectedMethod === 'split_swipe_card'}
                    onChange={() => handleMethodChange('split_swipe_card')}
                  />
                  <div className="option-content">
                    <span className="option-title">Meal Swipe + Card</span>
                    <span className="option-detail">
                      Swipe: ${mealSwipeValueDollars.toFixed(2)} credit, Card: ${remainderAfterSwipeDollars.toFixed(2)}
                    </span>
                  </div>
                  <span className="option-amount">${remainderAfterSwipeDollars.toFixed(2)} card</span>
                </label>
              </>
            )}
          </>
        )}

        {/* Flex Only Option */}
        {canCoverFullWithFlex && (
          <label className={`payment-option ${selectedMethod === 'flex' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="flex"
              checked={selectedMethod === 'flex'}
              onChange={() => handleMethodChange('flex')}
            />
            <div className="option-content">
              <span className="option-title">Pay with Flex Dollars</span>
              <span className="option-detail">
                Balance: ${flexBalanceDollars.toFixed(2)}
              </span>
            </div>
            <span className="option-amount">-${totalDollars.toFixed(2)}</span>
          </label>
        )}

        {/* Card Option */}
        <label className={`payment-option ${selectedMethod === 'card' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="payment"
            value="card"
            checked={selectedMethod === 'card'}
            onChange={() => handleMethodChange('card')}
          />
          <div className="option-content">
            <span className="option-title">Pay with Card</span>
            <span className="option-detail">Credit or debit card</span>
          </div>
          <span className="option-amount">${totalDollars.toFixed(2)}</span>
        </label>
      </div>

      {/* Card Input Form */}
      {(selectedMethod === 'card' || selectedMethod === 'split_swipe_card') && (
        <div className="card-payment-section">
          {/* Apple Pay Button */}
          <button
            type="button"
            className={`apple-pay-button ${applePaySelected ? 'success' : ''}`}
            onClick={handleApplePayClick}
            disabled={applePayProcessing || applePaySelected}
          >
            {applePayProcessing ? (
              <span>Processing...</span>
            ) : applePaySelected ? (
              <>
                <svg className="apple-pay-icon checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                <span>Apple Pay Ready</span>
              </>
            ) : (
              <>
                <svg className="apple-pay-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Pay</span>
              </>
            )}
          </button>

          {!applePaySelected && (
            <>
              <div className="payment-divider">
                <span>or pay with card</span>
              </div>

              <Elements stripe={stripePromise}>
                <CardForm onCardReady={setCardReady} />
              </Elements>
            </>
          )}
        </div>
      )}

      {/* Info messages */}
      {!canUseMealSwipe && hasMealPlan && mealSwipesRemaining > 0 && !mealPeriod && (
        <div className="payment-info-message">
          Meal swipes are available during meal periods: Breakfast (6-11 AM), Lunch (11 AM-4 PM), Dinner (4-8 PM), Late Night (8 PM-3 AM)
        </div>
      )}

      {!canUseMealSwipe && hasMealPlan && mealSwipesRemaining === 0 && (
        <div className="payment-info-message">
          You have no meal swipes remaining this week.
        </div>
      )}
    </div>
  );
}
