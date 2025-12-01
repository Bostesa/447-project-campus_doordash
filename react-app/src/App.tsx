import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import CustomerLogin from './pages/CustomerLogin';
import WorkerLogin from './pages/WorkerLogin';
import RestaurantBrowse from './pages/RestaurantBrowse';
import RestaurantMenu from './pages/RestaurantMenu';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerOrders from './pages/WorkerOrders';
import CustomerOrders from './pages/CustomerOrders';
import Account from './pages/Account';

// Protected Route for Customers
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/customer-login" replace />;
  }

  if (profile.role === 'worker') {
    return <Navigate to="/worker-dashboard" replace />;
  }

  return <>{children}</>;
}

// Protected Route for Workers
function WorkerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/worker-login" replace />;
  }

  if (profile.role === 'customer') {
    return <Navigate to="/browse" replace />;
  }

  return <>{children}</>;
}

// Protected Route for any authenticated user
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { profile, signOut } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route path="/worker-login" element={<WorkerLogin />} />

      {/* Customer Routes */}
      <Route
        path="/browse"
        element={
          <CustomerRoute>
            <RestaurantBrowse username={profile?.name || ''} onLogout={signOut} />
          </CustomerRoute>
        }
      />
      <Route
        path="/restaurant/:restaurantId"
        element={
          <CustomerRoute>
            <RestaurantMenu username={profile?.name || ''} />
          </CustomerRoute>
        }
      />
      <Route
        path="/customer-orders"
        element={
          <CustomerRoute>
            <CustomerOrders username={profile?.name || ''} />
          </CustomerRoute>
        }
      />

      {/* Worker Routes */}
      <Route
        path="/worker-dashboard"
        element={
          <WorkerRoute>
            <WorkerDashboard username={profile?.name || ''} />
          </WorkerRoute>
        }
      />
      <Route
        path="/worker-orders"
        element={
          <WorkerRoute>
            <WorkerOrders username={profile?.name || ''} />
          </WorkerRoute>
        }
      />

      {/* Shared Routes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account
              username={profile?.name || ''}
              userType={profile?.role || null}
              onLogout={signOut}
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '10px',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;
