'use client';
import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { Upload, Download, Search, Clock, Users, Building2, User, Lock, Plus, Edit, Trash2, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

interface Volunteer {
  name: string;
  email: string;
  organization: string;
  total_hours: number;
  log_type: string;
  created_at: string;
}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

// Job Board Categories
export const VOLUNTEER_CATEGORIES = [
  'Debris Removal & Cleanup',
  'Structural Assessment & Repair',
  'Home Stabilization (e.g., tarping, boarding)',
  'Utility Restoration Support',
  'Supply Distribution',
  'Warehouse Management',
  'Transportation Assistance',
  'Administrative & Office Support',
  'First Aid & Medical Support',
  'Mental Health & Emotional Support',
  'Spiritual Care',
  'Pet Care Services',
  'Childcare & Youth Programs',
  'Senior Assistance',
  'Multilingual & Translation Support',
  'Legal Aid Assistance',
  'Volunteer Coordination',
  'IT & Communication Support',
  'Damage Assessment & Reporting',
  'Fundraising & Community Outreach'
];

export const HELP_REQUEST_CATEGORIES = [
  'Need Debris Cleanup',
  'Need Roof Tarping / Emergency Repairs',
  'Need Structural Assessment',
  'Need Minor Home Repairs',
  'Need Food Assistance',
  'Need Water or Hydration Supplies',
  'Need Clothing or Shoes',
  'Need Hygiene or Sanitation Items',
  'Need Pet Food / Pet Supplies',
  'Need Transportation / Ride to Shelter',
  'Need Delivery of Supplies',
  'Need Vehicle Help (e.g., jumpstart)',
  'Need First Aid / Medical Check-In',
  'Need Mental Health Support',
  'Need Medication Refill or Replacement',
  'Need Childcare Support',
  'Need Elderly Assistance',
  'Need Disability Support',
  'Need Translation / Interpretation Help',
  'Need Help Applying for FEMA or Other Aid',
  'Need Help Filing Insurance Claims',
  'Need Help Replacing Lost Documents',
  'Need Emergency Shelter',
  'Need Generator or Charging Station',
  'Need Heating or Cooling Relief',
  'Need Internet or Hotspot Access',
  'Need Help Filling Online Forms'
];

const VolunteerApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [stats, setStats] = useState({ total_volunteers: 0, total_hours: 0, total_organizations: 0 });
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
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

  // Load data when viewing dashboard
  useEffect(() => {
    if (currentView === 'dashboard' && isAuthenticated) {
      loadStats();
      loadVolunteers();
    }
  }, [currentView, isAuthenticated]);

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

  const loadStats = async () => {
    try {
      console.log('Dashboard: Fetching volunteers for stats...');
      const response = await fetch('/api/volunteers', {
        credentials: 'include'
      });
      
      console.log('Dashboard: Volunteers response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
        
        const totalHours = data.reduce((sum: number, vol: any) => sum + (vol.total_hours || 0), 0);
        const organizations = new Set(data.map((vol: any) => vol.organization).filter(Boolean));
        
        setStats({
          total_volunteers: data.length,
          total_hours: totalHours,
          total_organizations: organizations.size
        });
      } else if (response.status === 401) {
        console.log('Dashboard: Unauthorized, redirecting to login...');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Dashboard: Error loading stats:', error);
    }
  };

  const loadVolunteers = async () => {
    try {
      console.log('Dashboard: Fetching volunteers...');
      const response = await fetch('/api/volunteers', {
        credentials: 'include'
      });
      
      console.log('Dashboard: Volunteers response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
      } else if (response.status === 401) {
        console.log('Dashboard: Unauthorized, redirecting to login...');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Dashboard: Error loading volunteers:', error);
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

  // User Management Component
  const UserManagement = () => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      email: '',
      role: 'user'
    });

    useEffect(() => {
      loadUsers();
    }, []);

    const loadUsers = async () => {
      try {
        console.log('UserManagement: Fetching users...');
        const response = await fetch('/api/users', {
          credentials: 'include'
        });
        
        console.log('UserManagement: Users response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else if (response.status === 401) {
          console.log('UserManagement: Unauthorized access');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setCurrentView('login');
        }
      } catch (error) {
        console.error('UserManagement: Error loading users:', error);
      }
    };

    const handleCreateUser = async () => {
      try {
        console.log('UserManagement: Creating user...');
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setFormData({ username: '', password: '', email: '', role: 'user' });
          setShowCreateForm(false);
          loadUsers();
          alert('User created successfully!');
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || 'Failed to create user'}`);
        }
      } catch (error) {
        console.error('UserManagement: Error creating user:', error);
        alert('Failed to create user');
      }
    };

    const handleUpdateUser = async () => {
      if (!editingUser) return;

      try {
        console.log('UserManagement: Updating user...');
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          ...(formData.password && { password: formData.password })
        };

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          setFormData({ username: '', password: '', email: '', role: 'user' });
          setEditingUser(null);
          setShowCreateForm(false);
          loadUsers();
          alert('User updated successfully!');
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || 'Failed to update user'}`);
        }
      } catch (error) {
        console.error('UserManagement: Error updating user:', error);
        alert('Failed to update user');
      }
    };

    const handleDeleteUser = async (userId: number) => {
      if (!confirm('Are you sure you want to delete this user?')) return;

      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          loadUsers();
          alert('User deleted successfully!');
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        alert('Failed to delete user');
      }
    };

    const startEdit = (user: AuthUser) => {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        email: user.email,
        role: user.role
      });
      setShowCreateForm(true);
    };

    const cancelEdit = () => {
      setEditingUser(null);
      setShowCreateForm(false);
      setFormData({ username: '', password: '', email: '', role: 'user' });
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="password"
                  placeholder={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={editingUser ? handleUpdateUser : handleCreateUser}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  // Dashboard Component
  const Dashboard = () => {
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredVolunteers = volunteers.filter(volunteer => {
      const matchesType = filterType === 'all' || volunteer.log_type === filterType;
      const matchesSearch = searchTerm === '' || 
        volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.organization.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });

    const exportPDFReport = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>VCEG Volunteer Management Report</title>
              <style>
                body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 20px; color: #374151; }
                .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
                .header h1 { color: #1f2937; font-size: 28px; margin-bottom: 10px; }
                .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
                .stat { text-align: center; padding: 20px; border: 2px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
                .stat-number { font-size: 32px; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
                .stat-label { color: #6b7280; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; border-radius: 8px; overflow: hidden; }
                th { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 10px; font-weight: 600; }
                td { border: 1px solid #e5e7eb; padding: 12px 10px; }
                tbody tr:nth-child(even) { background: #f9fafb; }
                .badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                .badge-partnership { background: #dbeafe; color: #1e40af; }
                .badge-activity { background: #d1fae5; color: #065f46; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>🎯 VCEG Volunteer Management Report</h1>
                <p style="color: #6b7280; margin: 0;">Generated on: ${new Date().toLocaleDateString()}</p>
                <p style="color: #6b7280; margin: 5px 0 0 0;">Filter: ${filterType === 'all' ? 'All Records' : filterType.charAt(0).toUpperCase() + filterType.slice(1)} ${searchTerm ? `| Search: "${searchTerm}"` : ''}</p>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${stats.total_volunteers}</div>
                  <div class="stat-label">Total Volunteers</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${Math.round(stats.total_hours)}</div>
                  <div class="stat-label">Total Hours</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${stats.total_organizations}</div>
                  <div class="stat-label">Organizations</div>
                </div>
              </div>
              
              <h2 style="color: #1f2937; margin-top: 40px;">📊 Volunteer Details (${filteredVolunteers.length} records)</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Total Hours</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredVolunteers.map(volunteer => `
                    <tr>
                      <td><strong>${volunteer.name}</strong></td>
                      <td>${volunteer.email}</td>
                      <td>${volunteer.organization}</td>
                      <td style="text-align: center; font-weight: 600;">${Math.round(volunteer.total_hours || 0)}</td>
                      <td style="text-align: center;">
                        <span class="badge ${volunteer.log_type === 'partnership' ? 'badge-partnership' : 'badge-activity'}">
                          ${volunteer.log_type}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Volunteer Management Dashboard</h1>
                  <p className="text-gray-600">Welcome back, {currentUser?.username}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('users')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Manage Users
                  </button>
                )}
                <button
                  onClick={exportPDFReport}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Volunteers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_volunteers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.total_hours)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_organizations}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search volunteers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="partnership">Partnership</option>
                <option value="activity">Activity</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Volunteer Records ({filteredVolunteers.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volunteer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVolunteers.map((volunteer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                          <div className="text-sm text-gray-500">{volunteer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{volunteer.organization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{Math.round(volunteer.total_hours || 0)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          volunteer.log_type === 'partnership' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {volunteer.log_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(volunteer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVolunteers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No volunteers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by adding your first volunteer log.'}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setCurrentView('partnership')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Add Partnership Log
              </button>
              <button
                onClick={() => setCurrentView('activity')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Add Activity Log
              </button>
              <button
                onClick={() => setCurrentView('landing')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Partnership Form
  const PartnershipForm = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      organization: '',
      email: '',
      phone: '',
      families_served: '',
      prepared_by_first: '',
      prepared_by_last: '',
      position_title: ''
    });
    const [eventRows, setEventRows] = useState([
      { date: '', site: '', zip: '', hours: '', volunteers: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addEventRow = () => {
      setEventRows([...eventRows, { date: '', site: '', zip: '', hours: '', volunteers: '' }]);
    };

    const removeEventRow = (index: number) => {
      if (eventRows.length > 1) {
        const newRows = eventRows.filter((_, i) => i !== index);
        setEventRows(newRows);
      }
    };

    const updateEventRow = (index: number, field: keyof typeof eventRows[0], value: string) => {
      const newRows = [...eventRows];
      newRows[index][field] = value;  
      setEventRows(newRows);
    };

    const calculateTotalHours = () => {
      return eventRows.reduce((total, row) => {
        if (row.hours && row.volunteers) {
          return total + (parseInt(row.hours) * parseInt(row.volunteers));
        }
        return total;
      }, 0);
    };

    const handleSubmit = async () => {
      setIsSubmitting(true);
      try {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.organization || !formData.phone || !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
          alert('Please fill in all required fields (marked with *)');
          return;
        }

        if (!formData.families_served || isNaN(parseInt(formData.families_served))) {
          alert('Please enter a valid number for families served');
          return;
        }

        const validEvents = eventRows.filter(row => row.date && row.site);

        if (validEvents.length === 0) {
          alert('Please add at least one event with a date and site location');
          return;
        }

        const submitData = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          organization: formData.organization.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          families_served: parseInt(formData.families_served),
          prepared_by_first: formData.prepared_by_first.trim(),
          prepared_by_last: formData.prepared_by_last.trim(),
          position_title: formData.position_title.trim(),
          events: validEvents
        };

        const response = await fetch('/api/partnership-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          alert('Partnership log submitted successfully!');
          setCurrentView('landing');
        } else {
          const result = await response.json();
          alert(`Error submitting form: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please check your internet connection and try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
              <h1 className="text-2xl font-bold mb-2">Agency Partnership Volunteer Log</h1>
              <p className="text-blue-100">Record organizational volunteer activities and track families served</p>
            </div>

            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization *
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Families Served *
                    </label>
                    <input
                      type="number"
                      value={formData.families_served}
                      onChange={(e) => setFormData({ ...formData, families_served: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Number of families served"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Event Details
                  </h2>
                  <button
                    onClick={addEventRow}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                </div>

                <div className="space-y-4">
                  {eventRows.map((row, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-700">Event {index + 1}</h3>
                        {eventRows.length > 1 && (
                          <button
                            onClick={() => removeEventRow(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => updateEventRow(index, 'date', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                          <input
                            type="text"
                            value={row.site}
                            onChange={(e) => updateEventRow(index, 'site', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Event location"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                          <input
                            type="text"
                            value={row.zip}
                            onChange={(e) => updateEventRow(index, 'zip', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ZIP"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                          <input
                            type="number"
                            value={row.hours}
                            onChange={(e) => updateEventRow(index, 'hours', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Hours"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers</label>
                          <input
                            type="number"
                            value={row.volunteers}
                            onChange={(e) => updateEventRow(index, 'volunteers', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Count"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-800">
                    Total Volunteer Hours: {calculateTotalHours()}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Prepared By
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.prepared_by_first}
                      onChange={(e) => setFormData({ ...formData, prepared_by_first: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Preparer's first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.prepared_by_last}
                      onChange={(e) => setFormData({ ...formData, prepared_by_last: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Preparer's last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position/Title *
                    </label>
                    <input
                      type="text"
                      onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Job title or position"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={() => setCurrentView('landing')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Log
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Component
  const UploadComponent = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const formData = new FormData();

      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          alert(Successfully uploaded ${result.files?.length || 1} files!);
          setUploadedFiles(prev => [...prev, ...(result.files?.map((f: any) => f.name) || ['Uploaded file'])]);
        } else {
          alert(Upload failed: ${result.error});
        }
      } catch {
        alert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">File Upload</h1>
              <p className="text-gray-600">Upload documents, images, or other files to the system</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                onChange={handleFileUpload}
                multiple
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}}
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload files'}
                  </p>
                  <p className="text-gray-500">
                    Select multiple files to upload at once
                  </p>
                </div>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-800">{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
  }

  // Render current view with authentication checks
  const renderCurrentView = () => {
    console.log('Current view:', currentView, 'Authenticated:', isAuthenticated);

    switch (currentView) {
      case 'partnership':
        return <PartnershipForm />;
      case 'activity':
        return <ActivityForm />;
      case 'dashboard':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        return <Dashboard />;
      case 'users':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        if (currentUser?.role !== 'admin') {
          alert('Access denied. Admin privileges required.');
          setCurrentView('dashboard');
          return <Dashboard />;
        }
        return <UserManagement />;
      case 'upload':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        return <UploadComponent />;
      case 'login':
        return <LoginPage />;
      default:
        return <LandingPage />;
    }
  };

  return renderCurrentView();
};

export default VolunteerApp;
                      onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Job title or position"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={() => setCurrentView('landing')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Log
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Activity Form
  const ActivityForm = () => {
    const [formData, setFormData] = useState({
      volunteer_name: '',
      email: '',
      phone: '',
      student_id: '',
      prepared_by_first: '',
      prepared_by_last: '',
      position_title: ''
    });
    const [activities, setActivities] = useState([
      { date: '', activity: '', organization: '', location: '', hours: '', description: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addActivity = () => {
      setActivities([...activities, { date: '', activity: '', organization: '', location: '', hours: '', description: '' }]);
    };

    const removeActivity = (index: number) => {
      if (activities.length > 1) {
        const newActivities = activities.filter((_, i) => i !== index);
        setActivities(newActivities);
      }
    };

    const updateActivity = (index: number, field: keyof typeof activities[0], value: string) => {
      const newActivities = [...activities];
      newActivities[index][field] = value;
      setActivities(newActivities);
    };

    const calculateTotalHours = () => {
      return activities.reduce((total, activity) => {
        return total + (parseFloat(activity.hours) || 0);
      }, 0);
    };

    const handleSubmit = async () => {
      setIsSubmitting(true);
      try {
        if (!formData.volunteer_name || !formData.email || !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
          alert('Please fill in all required fields (marked with *)');
          return;
        }

        const validActivities = activities.filter(activity => 
          activity.date && activity.activity && activity.organization && activity.description
        );

        if (validActivities.length === 0) {
          alert('Please add at least one complete activity with date, type, organization, and description');
          return;
        }

        for (const activity of validActivities) {
          if (!activity.hours || isNaN(parseFloat(activity.hours))) {
            alert('Please enter valid hours for all activities');
            return;
          }
        }

        const submitData = {
          volunteer_name: formData.volunteer_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || null,
          student_id: formData.student_id?.trim() || null,
          prepared_by_first: formData.prepared_by_first.trim(),
          prepared_by_last: formData.prepared_by_last.trim(),
          position_title: formData.position_title.trim(),
          activities: validActivities.map(activity => ({
            date: activity.date,
            activity: activity.activity,
            organization: activity.organization.trim(),
            location: activity.location?.trim() || '',
            hours: activity.hours,
            description: activity.description.trim()
          }))
        };

        const response = await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(submitData),
        });

        if (response.ok) {
          alert('Activity log submitted successfully!');
          setCurrentView('landing');
        } else {
          const result = await response.json();
          alert(`Error submitting form: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please check your internet connection and try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
              <h1 className="text-2xl font-bold mb-2">Activity Log (ICS 214)</h1>
              <p className="text-green-100">Record individual volunteer activities and track service hours</p>
            </div>

            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Volunteer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volunteer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.volunteer_name}
                      onChange={(e) => setFormData({ ...formData, volunteer_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID (if applicable)
                    </label>
                    <input
                      type="text"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter student ID"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Activities
                  </h2>
                  <button
                    onClick={addActivity}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Activity
                  </button>
                </div>

                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-700">Activity {index + 1}</h3>
                        {activities.length > 1 && (
                          <button
                            onClick={() => removeActivity(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={activity.date}
                            onChange={(e) => updateActivity(index, 'date', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                          <select
                            value={activity.activity}
                            onChange={(e) => updateActivity(index, 'activity', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select activity type</option>
                            {VOLUNTEER_CATEGORIES.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                          <input
                            type="text"
                            value={activity.organization}
                            onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Organization name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={activity.location}
                            onChange={(e) => updateActivity(index, 'location', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Activity location"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                          <input
                            type="number"
                            value={activity.hours}
                            onChange={(e) => updateActivity(index, 'hours', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Hours worked"
                            min="0"
                            step="0.5"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={activity.description}
                          onChange={(e) => updateActivity(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={3}
                          placeholder="Describe the volunteer activity..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-800">
                    Total Volunteer Hours: {calculateTotalHours()}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Edit className="w-5 h-5 mr-2" />
                  Prepared By
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.prepared_by_first}
                      onChange={(e) => setFormData({ ...formData, prepared_by_first: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Preparer's first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.prepared_by_last}
                      onChange={(e) => setFormData({ ...formData, prepared_by_last: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Preparer's last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position/Title *
                    </label>
                    <input
                      type="text"
                      value={formData.position_title}
                      onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Job title or position"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={() => setCurrentView('landing')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Log
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Component
  const UploadComponent = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const formData = new FormData();
      
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
          alert(`Successfully uploaded ${result.files?.length || 1} files!`);
          setUploadedFiles(prev => [...prev, ...(result.files?.map((f: any) => f.name) || ['Uploaded file'])]);
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      } catch {
        alert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">File Upload</h1>
              <p className="text-gray-600">Upload documents, images, or other files to the system</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                onChange={handleFileUpload}
                multiple
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload files'}
                  </p>
                  <p className="text-gray-500">
                    Select multiple files to upload at once
                  </p>
                </div>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-gray-800">{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
  }

  // Render current view with authentication checks
  const renderCurrentView = () => {
    console.log('Current view:', currentView, 'Authenticated:', isAuthenticated);
    
    switch (currentView) {
      case 'partnership':
        return <PartnershipForm />;
      case 'activity':
        return <ActivityForm />;
      case 'dashboard':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        return <Dashboard />;
      case 'users':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        if (currentUser?.role !== 'admin') {
          alert('Access denied. Admin privileges required.');
          setCurrentView('dashboard');
          return <Dashboard />;
        }
        return <UserManagement />;
      case 'upload':
        if (!isAuthenticated) {
          return <LoginPage />;
        }
        return <UploadComponent />;
      case 'login':
        return <LoginPage />;
      default:
        return <LandingPage />;
    }
  };

  return renderCurrentView();
};

export default VolunteerApp;