import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getRestaurantLogo } from '../utils/restaurantLogos';
import './LandingPage.css';

interface Restaurant {
  id: number;
  name: string;
  slug: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    async function fetchRestaurants() {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug')
        .order('name');

      if (error) {
        console.error('Error fetching restaurants:', error);
        return;
      }

      if (data) {
        setRestaurants(data);
      }
    }

    fetchRestaurants();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-top-section">
          <div className="umbc-logo-container">
            <img
              src="https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
              alt="UMBC Logo"
              className="umbc-logo"
            />
          </div>
          <div className="hero-badge">Official UMBC Campus Food Delivery</div>
        </div>
        <h1 className="hero-title">
          <span className="brand-name">DormDash</span>
        </h1>
        <p className="hero-subtitle">
          Connecting UMBC students with campus dining - Order from 15+ locations - Earn money delivering between classes
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-number">2,000+</div>
            <div className="hero-stat-label">Active Students</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">500+</div>
            <div className="hero-stat-label">Daily Orders</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-number">8min</div>
            <div className="hero-stat-label">Avg Delivery</div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="info-section">
        <h2 className="info-title">How DormDash Works</h2>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">1</div>
            <h3>Browse & Order</h3>
            <p>Choose from 15+ campus locations including dining halls, Starbucks, Chick-fil-A, and more</p>
          </div>
          <div className="info-card">
            <div className="info-icon">2</div>
            <h3>Student Delivers</h3>
            <p>A fellow UMBC student picks up and delivers your order right to your dorm or building</p>
          </div>
          <div className="info-card">
            <div className="info-icon">3</div>
            <h3>Enjoy!</h3>
            <p>Get your food delivered to your door within 10 minutes on average. Track in real-time!</p>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="selection-prompt">Choose Your Role</div>

      <div className="role-cards-container">
        {/* Customer Card */}
        <div
          className="role-card customer-card"
          onClick={() => navigate('/customer-login')}
        >
          <div className="card-decoration customer-decoration"></div>
          <div className="role-card-icon-large">Order</div>
          <h2 className="role-card-title">I Want to Order</h2>
          <p className="role-card-subtitle">Get food delivered to your dorm</p>
          <div className="role-features">
            <div className="feature-item">
              <span>15+ campus dining locations</span>
            </div>
            <div className="feature-item">
              <span>Average 8-10 minute delivery</span>
            </div>
            <div className="feature-item">
              <span>Pay with dining dollars or card</span>
            </div>
            <div className="feature-item">
              <span>Live order tracking</span>
            </div>
            <div className="feature-item">
              <span>Deliver to any campus building</span>
            </div>
          </div>
          <button className="role-button customer-button">
            Start Ordering
            <span className="button-arrow">→</span>
          </button>
        </div>

        {/* Worker Card */}
        <div
          className="role-card worker-card"
          onClick={() => navigate('/worker-login')}
        >
          <div className="card-decoration worker-decoration"></div>
          <div className="role-card-icon-large">Earn</div>
          <h2 className="role-card-title">I Want to Earn</h2>
          <p className="role-card-subtitle">Make money delivering on campus</p>
          <div className="role-features">
            <div className="feature-item">
              <span>Earn $10-20/hour on average</span>
            </div>
            <div className="feature-item">
              <span>Work when it fits your schedule</span>
            </div>
            <div className="feature-item">
              <span>Deliver between classes</span>
            </div>
            <div className="feature-item">
              <span>Walk, bike, or drive</span>
            </div>
            <div className="feature-item">
              <span>Weekly direct deposit</span>
            </div>
          </div>
          <button className="role-button worker-button">
            Start Earning
            <span className="button-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h2 className="benefits-title">Why Choose DormDash?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h3>100% Campus-Based</h3>
            <p>All orders stay on UMBC campus for fast, reliable service</p>
          </div>
          <div className="benefit-item">
            <h3>Student-to-Student</h3>
            <p>Support fellow Retrievers while getting your food delivered</p>
          </div>
          <div className="benefit-item">
            <h3>Affordable Fees</h3>
            <p>Low delivery fees starting at just $2.99 per order</p>
          </div>
          <div className="benefit-item">
            <h3>Safe & Secure</h3>
            <p>Verified UMBC student accounts and secure payments</p>
          </div>
        </div>
      </div>

      {/* Available Locations */}
      <div className="locations-section">
        <h2 className="locations-title">Available Locations</h2>
        <div className="locations-grid">
          {restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <div key={restaurant.id} className="location-card">
                <img
                  src={getRestaurantLogo(restaurant.name)}
                  alt={restaurant.name}
                  className="location-logo"
                />
                <span className="location-name">{restaurant.name}</span>
              </div>
            ))
          ) : (
            <>
              <div className="location-tag">Chick-fil-A</div>
              <div className="location-tag">Starbucks</div>
              <div className="location-tag">Einstein Bros Bagels</div>
              <div className="location-tag">Dunkin</div>
              <div className="location-tag">True Grits</div>
              <div className="location-tag">The Commons</div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <p className="footer-text">Join the UMBC community - Made by students, for students</p>
        <p className="footer-subtext">DormDash is an independent student service and is not officially affiliated with UMBC</p>
      </div>
    </div>
  );
}
