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

// Protected Route - any authenticated UMBC user can access any page
// No role restrictions - everyone can be both customer and worker
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { profile } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route path="/worker-login" element={<WorkerLogin />} />

      {/* Customer Routes - any authenticated user can access */}
      <Route
        path="/browse"
        element={
          <ProtectedRoute>
            <RestaurantBrowse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/:restaurantId"
        element={
          <ProtectedRoute>
            <RestaurantMenu />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-orders"
        element={
          <ProtectedRoute>
            <CustomerOrders username={profile?.name || ''} />
          </ProtectedRoute>
        }
      />

      {/* Worker Routes - any authenticated user can access */}
      <Route
        path="/worker-dashboard"
        element={
          <ProtectedRoute>
            <WorkerDashboard username={profile?.name || ''} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker-orders"
        element={
          <ProtectedRoute>
            <WorkerOrders username={profile?.name || ''} />
          </ProtectedRoute>
        }
      />

      {/* Account - works for both modes */}
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account username={profile?.name || ''} />
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
