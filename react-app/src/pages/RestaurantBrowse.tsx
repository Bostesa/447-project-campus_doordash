import Header from '../components/Header';
import './RestaurantBrowse.css';

interface Props {
  username: string;
  onLogout: () => void;
}

export default function RestaurantBrowse({ username, onLogout }: Props) {
  const restaurants = [
    {
      name: "Chick-fil-A",
      hours: "Open · 8 AM - 8 PM",
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Chick-fil-A_Logo.svg/2560px-Chick-fil-A_Logo.svg.png"
    },
    {
      name: "Starbucks",
      hours: "Open · 7 AM - 9 PM",
      image: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png"
    },
    {
      name: "Dining Hall",
      hours: "Open · 7 AM - 10 PM",
      image: "https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
    },
    {
      name: "Einstein Bros Bagels",
      hours: "Open · 7 AM - 3 PM",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2CVpnPv0cMM34s6fzvCWqF_8d4BzpCdklQA&s"
    },
    {
      name: "The Commons",
      hours: "Open · 11 AM - 11 PM",
      image: "https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
    },
    {
      name: "Dunkin Donuts",
      hours: "Open · 6 AM - 8 PM",
      image: "https://1000logos.net/wp-content/uploads/2023/04/Dunkin-Donuts-logo.png"
    }
  ];

  return (
    <div className="restaurant-browse">
      <Header userType="customer" activeTab="home" />

      <div className="content-wrapper">
        {/* Search bar */}
        <div className="search-container">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search for food or venues..."
          />
        </div>

        {/* Category filters */}
        <div className="category-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Dining Hall</button>
          <button className="filter-btn">Café</button>
          <button className="filter-btn">Quick Bites</button>
        </div>

        {/* Restaurant grid */}
        <div className="restaurant-grid">
          {restaurants.map((restaurant, index) => (
            <div key={index} className="restaurant-card">
              <div className="restaurant-image-wrapper">
                <div
                  className="restaurant-image"
                  style={{ backgroundImage: `url(${restaurant.image})` }}
                ></div>
              </div>
              <div className="card-content">
                <div className="restaurant-name">{restaurant.name}</div>
                <div className="restaurant-hours">{restaurant.hours}</div>
                <button className="order-btn">Order Now</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="campus-footer">
          © 2024 Campus Eats. All Rights Reserved.<br />
          Part of the UMBC Dining Experience.
        </div>
      </div>
    </div>
  );
}
