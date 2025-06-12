'use client';
import React, { useState, useEffect } from 'react';
import { Users, Building2, Clock, Search, Plus, Lock, Navigation, BarChart3 } from 'lucide-react';
import PartnershipForm from './PartnershipForm';
import ActivityForm from './ActivityForm';
import Dashboard from './Dashboard';
import VolunteerManagementAdminDashboard from './VolunteerManagementAdminDashboard';

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

const VolunteerApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Frontend: Component mounted, checking auth status...');
      checkAuthStatus();
    }
  }, []);

  // Debug effect to monitor auth state changes
  useEffect(() => {
    console.log('Auth state changed - Authenticated:', isAuthenticated, 'User:', currentUser?.username, 'View:', currentView);
  }, [isAuthenticated, currentUser, currentView]);

  const checkAuthStatus = async () => {
    try {
      console.log('Frontend: Checking auth status...');
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      
      console.log('Frontend: Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend: Auth check successful:', data);
        
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        console.log('Frontend: Auth check failed, status:', response.status);
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Frontend: Auth check error:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      console.log('Frontend: Starting login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Frontend: Login response:', data);

      if (response.ok && data.success) {
        console.log('Frontend: Login successful, setting user state...');
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setCurrentView('dashboard');
        return { success: true };
      } else {
        console.log('Frontend: Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Frontend: Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Frontend: Starting logout...');
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      console.log('Frontend: Logout successful');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Frontend: Logout error:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView('landing');
    }
  };

  // Login Component
  const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      setError('');
      setIsSubmitting(true);

      const result = await handleLogin(formData.username, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      
      setIsSubmitting(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-300">Access the volunteer management dashboard</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyPress={handleKeyPress}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.username || !formData.password}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentView('landing')}
              className="text-gray-300 hover:text-white text-sm transition-colors duration-200"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-8 shadow-2xl">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              VCEG Volunteer 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Management System
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Track volunteer hours, manage partnerships, and maintain comprehensive records 
              of community service activities with our advanced management platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 hover:border-white/30 hover:-translate-y-2">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-8 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Partnership Volunteer Log
              </h2>
              <p className="text-gray-300 mb-8 text-center leading-relaxed">
                Record agency partnership volunteer activities, track families served, 
                and manage organizational volunteer hours with comprehensive reporting
              </p>
              <button
                onClick={() => setCurrentView('partnership')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Partnership Log
              </button>
            </div>

            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 hover:border-white/30 hover:-translate-y-2">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-8 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Activity Log
              </h2>
              <p className="text-gray-300 mb-8 text-center leading-relaxed">
                Log individual volunteer activities, track hours, and document 
                specific community service contributions with detailed activity tracking
              </p>
              <button
                onClick={() => setCurrentView('activity')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Activity Log
              </button>
            </div>

            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 hover:border-white/30 hover:-translate-y-2">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-8 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Job Board
              </h2>
              <p className="text-gray-300 mb-8 text-center leading-relaxed">
                Browse volunteer opportunities in your community and apply 
                for positions that match your skills and interests
              </p>
              <button
                onClick={() => window.location.href = '/job-board'}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Browse Opportunities
              </button>
            </div>

            <div className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/20 hover:border-white/30 hover:-translate-y-2">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-8 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Volunteer Signup
              </h2>
              <p className="text-gray-300 mb-8 text-center leading-relaxed">
                Register as a volunteer to receive notifications about 
                opportunities that match your location and interests
              </p>
              <button
                onClick={() => window.location.href = '/volunteer-signup'}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Register Now
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => {
                console.log('View Database clicked, authenticated:', isAuthenticated);
                if (isAuthenticated) {
                  setCurrentView('dashboard');
                } else {
                  setCurrentView('login');
                }
              }}
              className="bg-white/10 backdrop-blur-lg text-white py-4 px-8 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Search className="w-5 h-5 inline mr-3" />
              View Database
            </button>
            
            <button
              onClick={() => {
                console.log('Admin Dashboard clicked, authenticated:', isAuthenticated);
                if (isAuthenticated) {
                  setCurrentView('admin-dashboard');
                } else {
                  setCurrentView('login');
                }
              }}
              className="bg-white/10 backdrop-blur-lg text-white py-4 px-8 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-5 h-5 inline mr-3" />
              Admin Dashboard
            </button>
            
            <button
              onClick={() => window.location.href = '/post-job'}
              className="bg-white/10 backdrop-blur-lg text-white py-4 px-8 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 inline mr-3" />
              Post Opportunity
            </button>
          </div>

          <div className="fixed bottom-6 right-6">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Powered by AHTS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="text-white text-lg font-medium">Loading...</div>
          <div className="text-gray-300 text-sm mt-2">Checking authentication status</div>
        </div>
      </div>
    );
  };

  // Render current view with authentication checks
  const renderCurrentView = () => {
    console.log('Current view:', currentView, 'Authenticated:', isAuthenticated);
    
    switch (currentView) {
      case 'partnership':
        return <PartnershipForm onBack={() => setCurrentView('landing')} />;
      case 'activity':
        return <ActivityForm onBack={() => setCurrentView('landing')} />;
      case 'dashboard':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        return (
          <Dashboard 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onNavigate={setCurrentView}
          />
        );
      case 'admin-dashboard':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        return <VolunteerManagementAdminDashboard />;
      case 'login':
        return <LoginPage />;
      default:
        return <LandingPage />;
    }
  };

  return renderCurrentView();
};

export default VolunteerApp;