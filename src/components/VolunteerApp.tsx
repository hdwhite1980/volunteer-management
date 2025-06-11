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

  return renderCurrentView();

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
        // Always go to dashboard after successful login
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
// ❌ Removed invalid top-level JSX block
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
// ❌ Removed invalid top-level JSX block
  };

  // Landing Page Component with NEW JOB BOARD NAVIGATION
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-16">
          {/* Header */}
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

          {/* UPDATED: Main Action Cards - Now 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            {/* Existing Partnership Card */}
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

            {/* Existing Activity Card */}
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

            {/* NEW: Job Board Card */}
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

            {/* NEW: Volunteer Signup Card */}
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

          {/* Secondary Actions - Add Post Job for Admins */}
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

          {/* Powered by AHTS */}
          <div className="fixed bottom-6 right-6">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400">Powered by AHTS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Dashboard
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
// ❌ Removed invalid top-level JSX block
  };

  // Partnership Form with improved UI
  const PartnershipForm = () => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-800">Partnership Form Placeholder</h1>
      <p className="text-gray-600 mt-2">The real form will be added soon.</p>
    </div>
  );
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

    const generatePDF = () => {
      const currentFormData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        organization: formData.organization,
        email: formData.email,
        phone: formData.phone,
        families_served: formData.families_served,
        prepared_by_first: formData.prepared_by_first,
        prepared_by_last: formData.prepared_by_last,
        position_title: formData.position_title,
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
                  <div><strong>Prepared by:</strong><br>${currentFormData.prepared_by_first} ${currentFormData.prepared_by_last}</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div><strong>Position/Title:</strong><br>${currentFormData.position_title}</div>
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
// ❌ Removed invalid top-level JSX block
  };

  // Activity Form with improved UI
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

    const generateActivityPDF = () => {
      const currentFormData = {
        volunteer_name: formData.volunteer_name,
        email: formData.email,
        phone: formData.phone,
        student_id: formData.student_id,
        prepared_by_first: formData.prepared_by_first,
        prepared_by_last: formData.prepared_by_last,
        position_title: formData.position_title,
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
                  <div class="signature-line">${currentFormData.prepared_by_first} ${currentFormData.prepared_by_last}</div>
                  <div style="font-size: 9px;">Signature</div>
                </div>
                <div class="signature-box">
                  <div class="section-header">Position/Title:</div>
                  <div class="signature-line">${currentFormData.position_title}</div>
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
// ❌ Removed invalid top-level JSX block
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
// ❌ Removed invalid top-level JSX block
  };

  // Loading screen
  if (isLoading) {
// ❌ Removed invalid top-level JSX block
  };

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

};

export default VolunteerApp;