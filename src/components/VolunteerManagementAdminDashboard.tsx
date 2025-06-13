import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, MapPin, Clock, Phone, Mail, 
  Calendar, Star, Eye, Edit, Trash2, UserCheck, AlertCircle,
  CheckCircle, X, User, Building2, Tag, Settings, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, MessageSquare, Briefcase,
  UserPlus, Activity, BarChart3, Navigation, Award, BookOpen,
  Send, FileText, UserMinus, Home, Menu
} from 'lucide-react';
import { 
  VolunteerCard, 
  JobCard, 
  ApplicationCard, 
  DetailModal, 
  ApplicationDetailsModal 
} from './AdminDashboardComponents';

interface VolunteerRegistration {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  skills: string[];
  categories_interested: string[];
  experience_level: string;
  availability: any;
  max_distance?: number;
  transportation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  background_check_consent: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  notes?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  username?: string;
}

interface JobApplication {
  id: number;
  job_id: number;
  volunteer_id: number;
  status: string;
  message: string;
  applied_at: string;
  updated_at?: string;
  feedback?: string;
  job_title: string;
  job_category: string;
  job_city: string;
  job_state: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  volunteer_name?: string;
}

interface VolunteerLogEntry {
  name: string;
  email: string;
  organization: string;
  total_hours: number;
  log_type: string;
  created_at: string;
}

interface Job {
  id: number;
  title: string;
  category: string;
  city: string;
  state: string;
  zipcode: string;
  volunteers_needed: number;
  volunteers_assigned: number;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

const VolunteerManagementAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'registrations' | 'database' | 'jobs' | 'applications'>('registrations');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data State
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerRegistration[]>([]);
  const [volunteerLogs, setVolunteerLogs] = useState<VolunteerLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<VolunteerLogEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRegistration | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'location'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available skills and categories
  const availableSkills = [
    'First Aid', 'CPR Certified', 'Debris Removal', 'Search & Rescue',
    'Emergency Communications', 'Medical Support', 'Food Service',
    'Construction', 'Transportation', 'Translation', 'Administrative',
    'Technology Support', 'Child Care', 'Elder Care', 'Animal Care'
  ];

  const availableCategories = [
    'Emergency Services', 'Supply Distribution', 'Medical Support',
    'Search & Rescue', 'Shelter Operations', 'Food Services',
    'Transportation', 'Administrative Support', 'Community Outreach',
    'Education', 'Environmental', 'Construction & Repair'
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'registrations') {
      filterVolunteers();
    } else if (activeTab === 'database') {
      filterVolunteerLogs();
    } else if (activeTab === 'jobs') {
      filterJobs();
    } else if (activeTab === 'applications') {
      filterApplications();
    }
  }, [volunteers, volunteerLogs, jobs, jobApplications, searchTerm, selectedSkills, selectedCategories, experienceFilter, statusFilter, applicationStatusFilter, locationFilter, sortBy, sortOrder, activeTab]);

  // Data Loading Functions
  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadVolunteerRegistrations(),
        loadVolunteerLogs(),
        loadJobs(),
        loadJobApplications()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVolunteerRegistrations = async () => {
    try {
      // Simulate API call with mock data
      const mockVolunteers = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '555-0123',
          birth_date: '1990-01-01',
          address: '123 Main St',
          city: 'Norfolk',
          state: 'VA',
          zipcode: '23505',
          skills: ['First Aid', 'CPR Certified'],
          categories_interested: ['Emergency Services', 'Medical Support'],
          experience_level: 'experienced',
          availability: {},
          transportation: 'own',
          emergency_contact_name: 'Jane Doe',
          emergency_contact_phone: '555-0124',
          emergency_contact_relationship: 'Spouse',
          background_check_consent: true,
          email_notifications: true,
          sms_notifications: false,
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          username: 'john2024'
        }
      ];
      setVolunteers(mockVolunteers);
    } catch (error) {
      console.error('Error loading volunteer registrations:', error);
    }
  };

  const loadVolunteerLogs = async () => {
    try {
      const mockLogs = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          organization: 'Red Cross',
          total_hours: 25,
          log_type: 'volunteer',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];
      setVolunteerLogs(mockLogs);
    } catch (error) {
      console.error('Error loading volunteer logs:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const mockJobs = [
        {
          id: 1,
          title: 'Community Cleanup',
          category: 'Environmental',
          city: 'Norfolk',
          state: 'VA',
          zipcode: '23505',
          volunteers_needed: 10,
          volunteers_assigned: 3,
          description: 'Help clean up the community park',
          start_date: '2024-02-01',
          end_date: '2024-02-01',
          status: 'active',
          created_at: '2024-01-10T10:00:00Z'
        }
      ];
      setJobs(mockJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadJobApplications = async () => {
    try {
      const mockApplications = [
        {
          id: 1,
          job_id: 1,
          volunteer_id: 1,
          status: 'pending',
          message: 'I would love to help with this community cleanup project!',
          applied_at: '2024-01-20T10:00:00Z',
          job_title: 'Community Cleanup',
          job_category: 'Environmental',
          job_city: 'Norfolk',
          job_state: 'VA',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '555-0123',
          volunteer_name: 'John Doe'
        }
      ];
      setJobApplications(mockApplications);
    } catch (error) {
      console.error('Error loading job applications:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: number, newStatus: string, feedback?: string) => {
    try {
      // Simulate API call
      console.log(`Updating application ${applicationId} to ${newStatus}`);
      await loadJobApplications();
      alert(`Application ${newStatus} successfully!`);
    } catch (error) {
      alert('Error updating application status');
    }
  };

  // Filter Functions
  const filterVolunteers = () => {
    let filtered = [...volunteers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vol => 
        `${vol.first_name} ${vol.last_name}`.toLowerCase().includes(term) ||
        vol.email.toLowerCase().includes(term) ||
        vol.city.toLowerCase().includes(term) ||
        vol.zipcode.includes(term) ||
        (vol.username && vol.username.includes(term))
      );
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(vol => 
        selectedSkills.some(skill => vol.skills?.includes(skill))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(vol => 
        selectedCategories.some(cat => vol.categories_interested?.includes(cat))
      );
    }

    if (experienceFilter !== 'all') {
      filtered = filtered.filter(vol => vol.experience_level === experienceFilter);
    }

    filtered = filtered.filter(vol => vol.status === statusFilter);

    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(vol => 
        vol.city.toLowerCase().includes(location) ||
        vol.state.toLowerCase().includes(location) ||
        vol.zipcode.includes(location)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'location':
          comparison = `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredVolunteers(filtered);
  };

  const filterVolunteerLogs = () => {
    let filtered = [...volunteerLogs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.name.toLowerCase().includes(term) ||
        log.email.toLowerCase().includes(term) ||
        log.organization.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.category.toLowerCase().includes(term) ||
        job.city.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'active') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  };

  const filterApplications = () => {
    let filtered = [...jobApplications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.volunteer_name?.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        app.job_title.toLowerCase().includes(term) ||
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(term)
      );
    }

    if (applicationStatusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === applicationStatusFilter);
    }

    setFilteredApplications(filtered);
  };

  const exportToPDF = () => {
    const currentData = activeTab === 'registrations' ? filteredVolunteers : 
                      activeTab === 'database' ? filteredLogs : 
                      activeTab === 'jobs' ? filteredJobs : filteredApplications;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>VCEG Volunteer Management Report - ${activeTab.toUpperCase()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #374151; }
              .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
              .header h1 { color: #1f2937; font-size: 28px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 VCEG Volunteer Management Report</h1>
              <h2>${activeTab.toUpperCase()} DATA</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Records: ${Array.isArray(currentData) ? currentData.length : 0}</p>
            </div>
            <p>Exported data from ${activeTab} tab</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const TabButton = ({ tab, label, icon: Icon, count }: { tab: string; label: string; icon: any; count?: number }) => (
    <button
      onClick={() => {
        setActiveTab(tab as any);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center justify-between w-full sm:w-auto sm:justify-center space-x-2 px-3 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="sm:hidden lg:inline">{label}</span>
        <span className="hidden sm:inline lg:hidden">
          {label.split(' ')[0]}
        </span>
      </div>
      {count !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">Volunteer Management Admin Dashboard</span>
                  <span className="sm:hidden">Admin Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Comprehensive volunteer management with registrations, database, job tracking, and applications
                </p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg ml-2 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop action buttons */}
            <div className="hidden sm:flex items-center space-x-3 ml-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={loadAllData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Mobile action buttons */}
          <div className="flex sm:hidden items-center justify-between mt-3 space-x-2">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm flex-1 justify-center"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={loadAllData}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg text-sm flex-1 justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex-1 justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-8">
        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          {/* Desktop tabs */}
          <div className="hidden sm:flex items-center space-x-4 overflow-x-auto">
            <TabButton 
              tab="registrations" 
              label="Volunteer Registrations" 
              icon={UserPlus}
              count={volunteers.length}
            />
            <TabButton 
              tab="database" 
              label="Volunteer Database" 
              icon={Activity}
              count={volunteerLogs.length}
            />
            <TabButton 
              tab="jobs" 
              label="Job Opportunities" 
              icon={Briefcase}
              count={jobs.length}
            />
            <TabButton 
              tab="applications" 
              label="Job Applications" 
              icon={MessageSquare}
              count={jobApplications.length}
            />
          </div>

          {/* Mobile tab dropdown */}
          <div className="sm:hidden">
            {isMobileMenuOpen && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg mb-4">
                <div className="p-2 space-y-1">
                  <TabButton 
                    tab="registrations" 
                    label="Volunteer Registrations" 
                    icon={UserPlus}
                    count={volunteers.length}
                  />
                  <TabButton 
                    tab="database" 
                    label="Volunteer Database" 
                    icon={Activity}
                    count={volunteerLogs.length}
                  />
                  <TabButton 
                    tab="jobs" 
                    label="Job Opportunities" 
                    icon={Briefcase}
                    count={jobs.length}
                  />
                  <TabButton 
                    tab="applications" 
                    label="Job Applications" 
                    icon={MessageSquare}
                    count={jobApplications.length}
                  />
                </div>
              </div>
            )}
            
            {/* Current tab indicator for mobile */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {activeTab === 'registrations' && <UserPlus className="w-5 h-5 text-blue-600" />}
                  {activeTab === 'database' && <Activity className="w-5 h-5 text-blue-600" />}
                  {activeTab === 'jobs' && <Briefcase className="w-5 h-5 text-blue-600" />}
                  {activeTab === 'applications' && <MessageSquare className="w-5 h-5 text-blue-600" />}
                  <span className="font-medium text-gray-900">
                    {activeTab === 'registrations' && 'Volunteer Registrations'}
                    {activeTab === 'database' && 'Volunteer Database'}
                    {activeTab === 'jobs' && 'Job Opportunities'}
                    {activeTab === 'applications' && 'Job Applications'}
                  </span>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {activeTab === 'registrations' && volunteers.length}
                  {activeTab === 'database' && volunteerLogs.length}
                  {activeTab === 'jobs' && jobs.length}
                  {activeTab === 'applications' && jobApplications.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards for registrations tab */}
        {activeTab === 'registrations' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{volunteers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {volunteers.filter(v => v.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Checks</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {volunteers.filter(v => v.background_check_consent).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-2 sm:mr-4">
                  <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Zip Codes</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {new Set(volunteers.map(v => v.zipcode)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'registrations' ? "Search by name, email, username..." :
                    activeTab === 'database' ? "Search by name, email, organization..." :
                    activeTab === 'jobs' ? "Search by job title, category..." :
                    "Search by volunteer name, email..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {activeTab === 'registrations' && (
                  <>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>

                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="all">All Experience</option>
                      <option value="beginner">Beginner</option>
                      <option value="some">Some Experience</option>
                      <option value="experienced">Experienced</option>
                      <option value="expert">Expert</option>
                    </select>

                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    >
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">More Filters</span>
                      <span className="sm:hidden">Filters</span>
                      {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </>
                )}
                {activeTab === 'applications' && (
                  <select
                    value={applicationStatusFilter}
                    onChange={(e) => setApplicationStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="all">All Applications</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                )}
              </div>
            </div>

            {/* Advanced Filters for Registrations */}
            {showFilters && activeTab === 'registrations' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Skills Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {availableSkills.map(skill => (
                        <label key={skill} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills([...selectedSkills, skill]);
                              } else {
                                setSelectedSkills(selectedSkills.filter(s => s !== skill));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Categories Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {availableCategories.map(category => (
                        <label key={category} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Location & Sort */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        placeholder="City, State, or Zip"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <div className="flex space-x-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'location')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="date">Registration Date</option>
                          <option value="name">Name</option>
                          <option value="location">Location</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedSkills([]);
                        setSelectedCategories([]);
                        setExperienceFilter('all');
                        setLocationFilter('');
                        setSortBy('date');
                        setSortOrder('desc');
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-4">
              <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-gray-600 text-sm sm:text-base">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="text-center sm:text-left mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'registrations' && `Volunteer Registrations (${filteredVolunteers.length})`}
                {activeTab === 'database' && `Volunteer Database (${filteredLogs.length})`}
                {activeTab === 'jobs' && `Job Opportunities (${filteredJobs.length})`}
                {activeTab === 'applications' && `Job Applications (${filteredApplications.length})`}
              </h2>
              <p className="text-sm text-gray-600">
                {activeTab === 'registrations' && filteredVolunteers.length !== volunteers.length && 
                  `${filteredVolunteers.length} of ${volunteers.length} volunteers shown`
                }
                {activeTab === 'database' && filteredLogs.length !== volunteerLogs.length && 
                  `${filteredLogs.length} of ${volunteerLogs.length} entries shown`
                }
                {activeTab === 'jobs' && filteredJobs.length !== jobs.length && 
                  `${filteredJobs.length} of ${jobs.length} jobs shown`
                }
                {activeTab === 'applications' && filteredApplications.length !== jobApplications.length && 
                  `${filteredApplications.length} of ${jobApplications.length} applications shown`
                }
              </p>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'registrations' && (
              filteredVolunteers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteers found</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredVolunteers.map(volunteer => (
                    <VolunteerCard 
                      key={volunteer.id} 
                      volunteer={volunteer}
                      onViewDetails={(vol) => {
                        setSelectedVolunteer(vol);
                        setShowDetails(true);
                      }}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'database' && (
              filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteer records found</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Mobile view - Cards */}
                  <div className="block sm:hidden">
                    <div className="divide-y divide-gray-200">
                      {filteredLogs.map((log, index) => (
                        <div key={index} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">{log.name}</div>
                              <div className="text-xs text-gray-600 break-all mt-1">{log.email}</div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                              log.log_type === 'partnership' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {log.log_type}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Organization:</span>
                              <span className="text-gray-900 font-medium">{log.organization}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hours:</span>
                              <span className="text-gray-900 font-semibold">{Math.round(log.total_hours || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="text-gray-900">{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop view - Table */}
                  <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hours</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredLogs.map((log, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{log.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{log.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">{log.organization}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-gray-900">{Math.round(log.total_hours || 0)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  log.log_type === 'partnership' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {log.log_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {new Date(log.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}

            {activeTab === 'jobs' && (
              filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )
            )}

            {activeTab === 'applications' && (
              filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                    <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredApplications.map(application => (
                    <ApplicationCard 
                      key={application.id} 
                      application={application}
                      onViewDetails={(app) => {
                        setSelectedApplication(app);
                        setShowApplicationDetails(true);
                      }}
                      onUpdateStatus={updateApplicationStatus}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Detail Modals */}
      {showDetails && (
        <DetailModal 
          volunteer={selectedVolunteer}
          onClose={() => setShowDetails(false)}
        />
      )}
      
      {showApplicationDetails && (
        <ApplicationDetailsModal 
          application={selectedApplication}
          onClose={() => setShowApplicationDetails(false)}
          onUpdateStatus={(id, status, feedback) => {
            updateApplicationStatus(id, status, feedback);
            setShowApplicationDetails(false);
          }}
        />
      )}
    </div>
  );
};

export default VolunteerManagementAdminDashboard;