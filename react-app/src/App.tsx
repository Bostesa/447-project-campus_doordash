import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { UserType } from './types';

// Pages
import LandingPage from './pages/LandingPage';
import CustomerLogin from './pages/CustomerLogin';
import WorkerLogin from './pages/WorkerLogin';
import RestaurantBrowse from './pages/RestaurantBrowse';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerOrders from './pages/WorkerOrders';
import CustomerOrders from './pages/CustomerOrders';
import Account from './pages/Account';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [username, setUsername] = useState('');

  const handleLogin = (type: UserType, user: string) => {
    setIsLoggedIn(true);
    setUserType(type);
    setUsername(user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType(null);
    setUsername('');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer-login" element={<CustomerLogin onLogin={handleLogin} />} />
        <Route path="/worker-login" element={<WorkerLogin onLogin={handleLogin} />} />

        {/* Customer Routes */}
        <Route
          path="/browse"
          element={
            isLoggedIn && userType === 'customer' ?
            <RestaurantBrowse username={username} onLogout={handleLogout} /> :
            <Navigate to="/customer-login" />
          }
        />
        <Route
          path="/customer-orders"
          element={
            isLoggedIn && userType === 'customer' ?
            <CustomerOrders username={username} /> :
            <Navigate to="/customer-login" />
          }
        />

        {/* Worker Routes */}
        <Route
          path="/worker-dashboard"
          element={
            isLoggedIn && userType === 'worker' ?
            <WorkerDashboard username={username} /> :
            <Navigate to="/worker-login" />
          }
        />
        <Route
          path="/worker-orders"
          element={
            isLoggedIn && userType === 'worker' ?
            <WorkerOrders username={username} /> :
            <Navigate to="/worker-login" />
          }
        />

        {/* Shared Routes */}
        <Route
          path="/account"
          element={
            isLoggedIn ?
            <Account username={username} userType={userType} onLogout={handleLogout} /> :
            <Navigate to="/" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
