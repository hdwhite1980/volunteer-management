'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Download, Search, Clock, Users, Building2, User, Lock, Plus, Edit, Trash2, LogOut } from 'lucide-react';

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

const VolunteerApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [stats, setStats] = useState({ total_volunteers: 0, total_hours: 0, total_organizations: 0 });
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    // Only check auth status if we're not already authenticated
    if (!isAuthenticated) {
      console.log('Frontend: Component mounted, checking auth status...');
      checkAuthStatus();
    }
  }, []);

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
        
        // Our session API returns {authenticated: true, user: {...}}
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
        // Our login API returns {success: true, user: {...}}
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
      // Still clear local state even if logout request fails
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
        
        // Calculate stats from data
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

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Database Access</h1>
              <p className="text-gray-600">Please sign in to view volunteer records</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  onKeyPress={handleKeyPress}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  onKeyPress={handleKeyPress}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to Home
              </button>
              <div className="mt-4 text-xs text-gray-500">
                Default: admin / admin123
              </div>
            </div>
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create User
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>

            {/* Create/Edit User Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password {editingUser ? '(leave blank to keep current)' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <button
                      type="button"
                      onClick={editingUser ? handleUpdateUser : handleCreateUser}
                      className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Username</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Email</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Role</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Created</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="border border-gray-300 p-3 text-gray-900">{user.username}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{user.email}</td>
                        <td className="border border-gray-300 p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-3 text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(user)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Landing Page Component with Auth Button
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Virtu Volunteer Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track volunteer hours, manage partnerships, and maintain comprehensive records 
            of community service activities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Partnership Volunteer Log
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Record agency partnership volunteer activities, track families served, 
              and manage organizational volunteer hours
            </p>
            <button
              onClick={() => setCurrentView('partnership')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Start Partnership Log
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Activity Log
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Log individual volunteer activities, track hours, and document 
              specific community service contributions
            </p>
            <button
              onClick={() => setCurrentView('activity')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
            >
              Start Activity Log
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => setCurrentView(isAuthenticated ? 'dashboard' : 'login')}
            className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 mr-4"
          >
            <Search className="w-5 h-5 inline mr-2" />
            View Database
          </button>
          <button
            onClick={() => setCurrentView('upload')}
            className="bg-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload Forms
          </button>
        </div>

        {/* Powered by AHTS */}
        <div className="fixed bottom-4 right-4">
          <p className="text-xs text-gray-400">Powered by AHTS</p>
        </div>
      </div>
    </div>
  );

  // Enhanced Dashboard with Logout
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
              <title>Virtu Volunteer Management Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat { text-align: center; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
                .stat-number { font-size: 24px; font-weight: bold; color: #1f2937; }
                .stat-label { color: #6b7280; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                th { background-color: #f9fafb; font-weight: bold; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .badge-partnership { background-color: #dbeafe; color: #1e40af; }
                .badge-activity { background-color: #d1fae5; color: #065f46; }
                .powered-by { position: fixed; bottom: 10px; right: 10px; font-size: 8px; color: #999; }
                @media print { body { margin: 0; } .stats { display: block; } .stat { margin: 10px 0; } .powered-by { position: absolute; } }
              </style>
            </head>
            <body>
              <h1>Virtu Volunteer Management Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Filter Applied: ${filterType === 'all' ? 'All Records' : filterType.charAt(0).toUpperCase() + filterType.slice(1)} ${searchTerm ? `| Search: "${searchTerm}"` : ''}</p>
              
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
              
              <h2>Volunteer Details (${filteredVolunteers.length} records)</h2>
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
                      <td>${volunteer.name}</td>
                      <td>${volunteer.email}</td>
                      <td>${volunteer.organization}</td>
                      <td>${Math.round(volunteer.total_hours || 0)}</td>
                      <td>
                        <span class="badge ${volunteer.log_type === 'partnership' ? 'badge-partnership' : 'badge-activity'}">
                          ${volunteer.log_type}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="powered-by">Powered by AHTS</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Volunteer Database</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {currentUser?.username}
                </span>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('users')}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Manage Users
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Home
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Volunteers</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_volunteers || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-800">{Math.round(stats.total_hours || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Building2 className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_organizations || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Volunteer Records</h2>
                
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search volunteers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="all">All Types</option>
                    <option value="partnership">Partnership Only</option>
                    <option value="activity">Activity Only</option>
                  </select>
                  
                  <button 
                    onClick={exportPDFReport}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Export PDF
                  </button>
                </div>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredVolunteers.length} of {volunteers.length} records
                {filterType !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">{filterType}</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Name</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Email</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Organization</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Total Hours</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVolunteers.map((volunteer, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-3 text-gray-900">{volunteer.name}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{volunteer.email}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{volunteer.organization}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{Math.round(volunteer.total_hours || 0)}</td>
                        <td className="border border-gray-300 p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            volunteer.log_type === 'partnership' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {volunteer.log_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredVolunteers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 p-8 text-center text-gray-500">
                          No volunteers found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Partnership Form (Complete - keeping your excellent implementation)
  const PartnershipForm = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      organization: '',
      email: '',
      phone: '',
      families_served: '',
      prepared_by: ''
    });
    const [eventRows, setEventRows] = useState([
      { date: '', site: '', zip: '', hours: '', volunteers: '' }
    ]);

    const addEventRow = () => {
      if (eventRows.length < 11) {
        setEventRows([...eventRows, { date: '', site: '', zip: '', hours: '', volunteers: '' }]);
      }
    };

    const updateEventRow = (index: number, field: keyof typeof eventRows[0], value: string) => {
      const newRows = [...eventRows];
      newRows[index][field] = value;  
      setEventRows(newRows);
    };

    const generatePDF = () => {
      const currentFormData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        organization: formData.organization,
        email: formData.email,
        phone: formData.phone,
        families_served: formData.families_served,
        prepared_by: formData.prepared_by,
        events: eventRows.filter(row => row.date || row.site)
      };
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Agency Partnership Volunteer Log</title>
              <style>
                @page { margin: 0.5in; }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.4;
                  background: white;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 15px;
                }
                
                .header h1 {
                  font-size: 18px;
                  font-weight: bold;
                  margin: 0 0 5px 0;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                
                .header h2 {
                  font-size: 16px;
                  font-weight: bold;
                  margin: 5px 0;
                  text-transform: uppercase;
                }
                
                .date-section {
                  text-align: right;
                  margin-bottom: 20px;
                  font-weight: bold;
                }
                
                .form-section {
                  margin-bottom: 20px;
                }
                
                .field-row {
                  display: flex;
                  margin-bottom: 8px;
                  align-items: center;
                }
                
                .field-label {
                  font-weight: bold;
                  min-width: 120px;
                  margin-right: 10px;
                }
                
                .field-line {
                  flex: 1;
                  border-bottom: 1px solid #000;
                  height: 20px;
                  padding-left: 5px;
                  padding-bottom: 2px;
                }
                
                .volunteer-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                  border: 2px solid #000;
                }
                
                .volunteer-table th {
                  border: 1px solid #000;
                  padding: 8px 4px;
                  text-align: center;
                  font-weight: bold;
                  background-color: #f0f0f0;
                  font-size: 10px;
                  vertical-align: middle;
                }
                
                .volunteer-table td {
                  border: 1px solid #000;
                  padding: 8px 4px;
                  text-align: center;
                  height: 25px;
                  vertical-align: middle;
                }
                
                .table-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: 14px;
                  margin: 20px 0 10px 0;
                  text-transform: uppercase;
                }
                
                .total-row {
                  background-color: #f0f0f0;
                  font-weight: bold;
                }
                
                .signature-section {
                  margin-top: 30px;
                  display: flex;
                  justify-content: space-between;
                }
                
                .signature-box {
                  width: 30%;
                  text-align: center;
                }
                
                .signature-line {
                  border-bottom: 1px solid #000;
                  height: 30px;
                  margin-bottom: 5px;
                }
                
                .powered-by {
                  position: fixed;
                  bottom: 10px;
                  right: 10px;
                  font-size: 8px;
                  color: #999;
                }
                
                @media print {
                  .powered-by { position: absolute; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Virtu Community Enhancement Group</h1>
                <h2>Agency Partnership Volunteer Log</h2>
              </div>
              
              <div class="date-section">
                Date: ${new Date().toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric' 
                }).replace(/\//g, '/')}
              </div>
              
              <div class="form-section">
                <div class="field-row">
                  <span class="field-label">Name:</span>
                  <div class="field-line">${currentFormData.first_name} ${currentFormData.last_name}</div>
                </div>
                <div class="field-row">
                  <span class="field-label">Organization:</span>
                  <div class="field-line">${currentFormData.organization}</div>
                </div>
                <div class="field-row">
                  <span class="field-label">Email:</span>
                  <div class="field-line">${currentFormData.email}</div>
                </div>
                <div class="field-row">
                  <span class="field-label">Phone:</span>
                  <div class="field-line">${currentFormData.phone}</div>
                </div>
              </div>
              
              <div class="table-title">Agency Partnership Volunteer Log</div>
              
              <table class="volunteer-table">
                <thead>
                  <tr>
                    <th>Event Date</th>
                    <th>Event Site Zip</th>
                    <th>Total Number of<br>Hours Worked</th>
                    <th>Total Number of<br>Volunteers</th>
                    <th>Total Volunteer<br>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  ${Array.from({length: 10}, (_, i) => {
                    const event = currentFormData.events[i];
                    const totalHours = event ? (parseInt(event.hours || '0') * parseInt(event.volunteers || '1')) : '';
                    return `
                      <tr>
                        <td>${event ? new Date(event.date).toLocaleDateString() : ''}</td>
                        <td>${event ? event.zip : ''}</td>
                        <td>${event ? event.hours : ''}</td>
                        <td>${event ? event.volunteers : ''}</td>
                        <td>${totalHours}</td>
                      </tr>
                    `;
                  }).join('')}
                  <tr class="total-row">
                    <td colspan="4" style="text-align: center; font-weight: bold;">TOTAL VOLUNTEER HOURS</td>
                    <td style="font-weight: bold;">
                      ${currentFormData.events.reduce((total, event) => {
                        if (event.hours && event.volunteers) {
                          return total + (parseInt(event.hours) * parseInt(event.volunteers));
                        }
                        return total;
                      }, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div><strong>Prepared by:</strong><br>${currentFormData.prepared_by}</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div><strong>Position/Title:</strong></div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div><strong>Date/Time:</strong><br>${new Date().toLocaleDateString()}</div>
                </div>
              </div>
              
              <div class="powered-by">Powered by AHTS</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    const handleSubmit = async () => {
      try {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.organization || !formData.phone || !formData.prepared_by) {
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
          prepared_by: formData.prepared_by.trim(),
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
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Agency Partnership Volunteer Log</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="example@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Number of "Families" Served *
                </label>
                <input
                  type="number"
                  required
                  value={formData.families_served}
                  onChange={(e) => setFormData({...formData, families_served: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prepared By *
                </label>
                <input
                  type="text"
                  required
                  value={formData.prepared_by}
                  onChange={(e) => setFormData({...formData, prepared_by: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Volunteer Hours</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Event Date</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Event Site</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Zip</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Total Hours Worked</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Total Volunteers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRows.map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => updateEventRow(index, 'date', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={row.site}
                              onChange={(e) => updateEventRow(index, 'site', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={row.zip}
                              onChange={(e) => updateEventRow(index, 'zip', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={row.hours}
                              onChange={(e) => updateEventRow(index, 'hours', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={row.volunteers}
                              onChange={(e) => updateEventRow(index, 'volunteers', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {eventRows.length < 11 && (
                  <button
                    type="button"
                    onClick={addEventRow}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Event Row
                  </button>
                )}
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={generatePDF}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Activity Form (Complete - keeping your excellent implementation) 
  const ActivityForm = () => {
    const [formData, setFormData] = useState({
      volunteer_name: '',
      email: '',
      phone: '',
      student_id: '',
      prepared_by: ''
    });
    const [activities, setActivities] = useState([
      { date: '', activity: '', organization: '', location: '', hours: '', description: '' }
    ]);

    const addActivity = () => {
      setActivities([...activities, { date: '', activity: '', organization: '', location: '', hours: '', description: '' }]);
    };

    const updateActivity = (index: number, field: keyof typeof activities[0], value: string) => {
      const newActivities = [...activities];
      newActivities[index][field] = value;
      setActivities(newActivities);
    };

    const generateActivityPDF = () => {
      const currentFormData = {
        volunteer_name: formData.volunteer_name,
        email: formData.email,
        phone: formData.phone,
        student_id: formData.student_id,
        prepared_by: formData.prepared_by,
        activities: activities.filter(activity => activity.date || activity.activity || activity.organization)
      };
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Activity Log (ICS 214)</title>
              <style>
                @page { margin: 0.5in; }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 15px;
                  font-size: 11px;
                  line-height: 1.3;
                  background: white;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 15px;
                  border: 2px solid #000;
                  padding: 10px;
                }
                
                .header h1 {
                  font-size: 16px;
                  font-weight: bold;
                  margin: 0;
                  text-transform: uppercase;
                }
                
                .form-section {
                  border: 1px solid #000;
                  margin-bottom: 10px;
                  padding: 8px;
                }
                
                .section-header {
                  font-weight: bold;
                  margin-bottom: 8px;
                  font-size: 12px;
                }
                
                .field-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 8px;
                }
                
                .field {
                  display: flex;
                  align-items: center;
                }
                
                .field-label {
                  font-weight: bold;
                  margin-right: 5px;
                  min-width: 80px;
                  font-size: 10px;
                }
                
                .field-line {
                  flex: 1;
                  border-bottom: 1px solid #000;
                  height: 18px;
                  padding-left: 3px;
                  padding-bottom: 1px;
                }
                
                .resources-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 10px 0;
                }
                
                .resources-table th {
                  border: 1px solid #000;
                  padding: 4px;
                  text-align: center;
                  font-weight: bold;
                  background-color: #f0f0f0;
                  font-size: 10px;
                }
                
                .resources-table td {
                  border: 1px solid #000;
                  padding: 4px;
                  height: 20px;
                }
                
                .activity-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 10px 0;
                }
                
                .activity-table th {
                  border: 1px solid #000;
                  padding: 6px 4px;
                  text-align: center;
                  font-weight: bold;
                  background-color: #f0f0f0;
                  font-size: 10px;
                }
                
                .activity-table td {
                  border: 1px solid #000;
                  padding: 4px;
                  vertical-align: top;
                  min-height: 25px;
                  font-size: 10px;
                }
                
                .signature-section {
                  display: grid;
                  grid-template-columns: 1fr 1fr 1fr;
                  gap: 20px;
                  margin-top: 20px;
                  border: 1px solid #000;
                  padding: 10px;
                }
                
                .signature-box {
                  text-align: center;
                }
                
                .signature-line {
                  border-bottom: 1px solid #000;
                  height: 25px;
                  margin-bottom: 3px;
                }
                
                .powered-by {
                  position: fixed;
                  bottom: 10px;
                  right: 10px;
                  font-size: 8px;
                  color: #999;
                }
                
                @media print {
                  .powered-by { position: absolute; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Activity Log (ICS 214)</h1>
              </div>
              
              <div class="form-section">
                <div class="field-grid">
                  <div class="field">
                    <span class="field-label">1. Incident Name:</span>
                    <div class="field-line">Volunteer Service</div>
                  </div>
                  <div class="field">
                    <span class="field-label">2. Operational Period:</span>
                    <div class="field-line"></div>
                  </div>
                  <div class="field">
                    <span class="field-label">Date From:</span>
                    <div class="field-line"></div>
                  </div>
                </div>
                <div class="field-grid">
                  <div class="field">
                    <span class="field-label">3. Name:</span>
                    <div class="field-line">${currentFormData.volunteer_name}</div>
                  </div>
                  <div class="field">
                    <span class="field-label">4. ICS Position:</span>
                    <div class="field-line">Volunteer</div>
                  </div>
                  <div class="field">
                    <span class="field-label">Date To:</span>
                    <div class="field-line"></div>
                  </div>
                </div>
                <div class="field-grid">
                  <div class="field">
                    <span class="field-label"></span>
                    <div class="field-line"></div>
                  </div>
                  <div class="field">
                    <span class="field-label"></span>
                    <div class="field-line"></div>
                  </div>
                  <div class="field">
                    <span class="field-label">Time To:</span>
                    <div class="field-line"></div>
                  </div>
                </div>
                <div class="field">
                  <span class="field-label">5. Home Agency (and Unit):</span>
                  <div class="field-line">Virtu Community Enhancement Group</div>
                </div>
              </div>
              
              <div class="form-section">
                <div class="section-header">6. Resources Assigned:</div>
                <table class="resources-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ICS Position</th>
                      <th>Home Agency (and Unit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${currentFormData.volunteer_name}</td>
                      <td>Volunteer</td>
                      <td>Individual Volunteer</td>
                    </tr>
                    ${Array.from({length: 4}, () => '<tr><td></td><td></td><td></td></tr>').join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="form-section">
                <div class="section-header">7. Activity Log:</div>
                <table class="activity-table">
                  <thead>
                    <tr>
                      <th style="width: 20%;">Date/Time</th>
                      <th style="width: 80%;">Notable Activities</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${currentFormData.activities.map(activity => `
                      <tr>
                        <td style="text-align: center;">
                          ${activity.date ? new Date(activity.date).toLocaleDateString() : ''}<br>
                          ${activity.hours ? activity.hours + ' hrs' : ''}
                        </td>
                        <td>
                          <strong>${activity.activity || ''}</strong><br>
                          Organization: ${activity.organization || ''}<br>
                          Location: ${activity.location || ''}<br>
                          ${activity.description || ''}
                        </td>
                      </tr>
                    `).join('')}
                    ${Array.from({length: Math.max(0, 8 - currentFormData.activities.length)}, () => 
                      '<tr><td style="height: 30px;"></td><td></td></tr>'
                    ).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="signature-section">
                <div class="signature-box">
                  <div class="section-header">8. Prepared by:</div>
                  <div class="signature-line">${currentFormData.prepared_by}</div>
                  <div style="font-size: 9px;">Signature</div>
                </div>
                <div class="signature-box">
                  <div class="section-header">Position/Title:</div>
                  <div class="signature-line"></div>
                  <div style="font-size: 9px;">Position/Title</div>
                </div>
                <div class="signature-box">
                  <div class="section-header">Date/Time:</div>
                  <div class="signature-line">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div style="font-size: 9px;">Date/Time</div>
                </div>
              </div>
              
              <div class="powered-by">Powered by AHTS</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    const handleSubmit = async () => {
      try {
        if (!formData.volunteer_name || !formData.email || !formData.prepared_by) {
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
          prepared_by: formData.prepared_by.trim(),
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
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Volunteer Activity Log</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.volunteer_name}
                    onChange={(e) => setFormData({...formData, volunteer_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prepared By *
                </label>
                <input
                  type="text"
                  required
                  value={formData.prepared_by}
                  onChange={(e) => setFormData({...formData, prepared_by: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Details</h3>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            value={activity.date}
                            onChange={(e) => updateActivity(index, 'date', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hours *
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={activity.hours}
                            onChange={(e) => updateActivity(index, 'hours', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization *
                          </label>
                          <input
                            type="text"
                            value={activity.organization}
                            onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Type *
                          </label>
                          <select
                            value={activity.activity}
                            onChange={(e) => updateActivity(index, 'activity', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          >
                            <option value="">Select Activity Type</option>
                            <option value="Community Service">Community Service</option>
                            <option value="Tutoring/Mentoring">Tutoring/Mentoring</option>
                            <option value="Environmental">Environmental</option>
                            <option value="Food Service">Food Service</option>
                            <option value="Construction/Repair">Construction/Repair</option>
                            <option value="Event Support">Event Support</option>
                            <option value="Administrative">Administrative</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={activity.location}
                            onChange={(e) => updateActivity(index, 'location', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Activity Description *
                        </label>
                        <textarea
                          value={activity.description}
                          onChange={(e) => updateActivity(index, 'description', e.target.value)}
                          required
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                          placeholder="Describe the volunteer activity performed..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addActivity}
                  className="mt-3 text-green-600 hover:text-green-800 font-medium"
                >
                  + Add Another Activity
                </button>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={generateActivityPDF}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Component with working functionality
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Upload Completed Forms</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Upload Volunteer Forms
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop your completed forms here, or click to browse
                </p>
                
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileInput"
                />
                <label
                  htmlFor="fileInput"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </label>
                
                <p className="text-sm text-gray-400 mt-2">
                  Supported formats: PDF, Excel, Word, JPG, PNG
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Successfully Uploaded:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {uploadedFiles.map((fileName, index) => (
                      <li key={index}>• {fileName}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Upload Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ensure all required fields are completed on scanned forms</li>
                  <li>• Files will be automatically processed using OCR technology</li>
                  <li>• Data will be extracted and added to the database automatically</li>
                  <li>• You'll receive a confirmation email once processing is complete</li>
                  <li>• Maximum file size: 10MB per file</li>
                  <li>• Supported formats: PDF, JPG, PNG for scanned forms</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">OCR Processing:</h4>
                <p className="text-sm text-yellow-700">
                  Uploaded forms will be processed using Optical Character Recognition (OCR) to automatically extract 
                  volunteer information, hours, and activities. This data will be verified and added to your database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render current view with authentication checks
  const renderCurrentView = () => {
    switch (currentView) {
      case 'partnership':
        return <PartnershipForm />;
      case 'activity':
        return <ActivityForm />;
      case 'dashboard':
        return isAuthenticated ? <Dashboard /> : <LoginPage />;
      case 'users':
        return isAuthenticated ? <UserManagement /> : <LoginPage />;
      case 'login':
        return <LoginPage />;
      case 'upload':
        return <UploadComponent />;
      default:
        return <LandingPage />;
    }
  };

  return renderCurrentView();
};

export default VolunteerApp;