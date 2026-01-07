import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Kits from './pages/Kits';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { authAPI } from './api/client';
import { ToastProvider } from './components/ToastProvider';
import type { User } from './types';

function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Desktop Nav */}
            <div className="flex gap-4 sm:gap-6 items-center">
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">Aid Inventory</h1>
              <div className="hidden md:flex gap-4 lg:gap-6">
                <Link to="/" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/inventory" className="text-gray-600 hover:text-gray-900">
                  Inventory
                </Link>
                <Link to="/kits" className="text-gray-600 hover:text-gray-900">
                  Kits
                </Link>
                <Link to="/reports" className="text-gray-600 hover:text-gray-900">
                  Reports
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/users" className="text-gray-600 hover:text-gray-900">
                    Users
                  </Link>
                )}
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex gap-4 items-center">
              {user && (
                <>
                  <Link to="/settings" className="text-sm text-gray-600 hover:text-gray-900">
                    {user.full_name || user.username}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t space-y-2">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded"
              >
                Dashboard
              </Link>
              <Link
                to="/inventory"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded"
              >
                Inventory
              </Link>
              <Link
                to="/kits"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded"
              >
                Kits
              </Link>
              <Link
                to="/reports"
                onClick={closeMobileMenu}
                className="block py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded"
              >
                Reports
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/users"
                  onClick={closeMobileMenu}
                  className="block py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded"
                >
                  Users
                </Link>
              )}
              <div className="pt-2 border-t">
                <Link
                  to="/settings"
                  onClick={closeMobileMenu}
                  className="block py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 rounded"
                >
                  {user?.full_name || user?.username || 'Settings'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
        <main className="pb-6">{children}</main>
      </div>
    </ToastProvider>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <Inventory />
            </PrivateRoute>
          }
        />
        <Route
          path="/kits"
          element={
            <PrivateRoute>
              <Kits />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
