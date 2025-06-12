import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, MapPin, Clock, Phone, Mail, 
  Calendar, Star, Eye, Edit, Trash2, UserCheck, AlertCircle,
  CheckCircle, X, User, Building2, Tag, Settings, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, MessageSquare, Briefcase,
  UserPlus, Activity, BarChart3, Navigation, Award, BookOpen,
  Send, FileText, UserMinus
} from 'lucide-react';

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
  
  // Volunteer Registration State
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerRegistration[]>([]);
  
  // Volunteer Database State
  const [volunteerLogs, setVolunteerLogs] = useState<VolunteerLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<VolunteerLogEntry[]>([]);
  
  // Jobs State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  
  // Job Applications State
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
      const response = await fetch('/api/volunteer-signup', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data.volunteers || []);
      }
    } catch (error) {
      console.error('Error loading volunteer registrations:', error);
    }
  };

  const loadVolunteerLogs = async () => {
    try {
      const response = await fetch('/api/volunteers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVolunteerLogs(data || []);
      }
    } catch (error) {
      console.error('Error loading volunteer logs:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadJobApplications = async () => {
    try {
      const response = await fetch('/api/job-applications', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error loading job applications:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: number, newStatus: string, feedback?: string) => {
    try {
      const response = await fetch(`/api/job-applications?id=${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, feedback })
      });

      if (response.ok) {
        await loadJobApplications(); // Reload applications
        alert(`Application ${newStatus} successfully!`);
      } else {
        alert('Error updating application status');
      }
    } catch (error) {
      alert('Error updating application status');
    }
  };

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

  const TabButton = ({ tab, label, icon: Icon, count }: { tab: string; label: string; icon: any; count?: number }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const ApplicationCard = ({ application }: { application: JobApplication }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
        case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {application.first_name} {application.last_name}
              </h3>
              <p className="text-sm text-gray-600">{application.email}</p>
              <p className="text-xs text-blue-600 font-medium">{application.job_title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
              {application.status}
            </span>
            <button
              onClick={() => {
                setSelectedApplication(application);
                setShowApplicationDetails(true);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
            <span>{application.job_category} • {application.job_city}, {application.job_state}</span>
          </div>
          
          {application.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{application.phone}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
          </div>

          {application.message && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 line-clamp-2">{application.message}</p>
            </div>
          )}
        </div>

        {application.status === 'pending' && (
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => updateApplicationStatus(application.id, 'accepted')}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept
            </button>
            <button
              onClick={() => updateApplicationStatus(application.id, 'rejected')}
              className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  const ApplicationDetailsModal = () => {
    if (!selectedApplication) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.first_name} {selectedApplication.last_name}
                  </h2>
                  <p className="text-gray-600">{selectedApplication.email}</p>
                  <p className="text-blue-600 font-medium">{selectedApplication.job_title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplicationDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Application Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    selectedApplication.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    selectedApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedApplication.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Applied:</span>
                  <p className="text-gray-900">{new Date(selectedApplication.applied_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{selectedApplication.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Job Category:</span>
                  <p className="text-gray-900">{selectedApplication.job_category}</p>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            {selectedApplication.message && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.message}</p>
                </div>
              </div>
            )}

            {/* Feedback */}
            {selectedApplication.feedback && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Feedback</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800">{selectedApplication.feedback}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedApplication.status === 'pending' && (
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    updateApplicationStatus(selectedApplication.id, 'accepted');
                    setShowApplicationDetails(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept Application
                </button>
                <button
                  onClick={() => {
                    updateApplicationStatus(selectedApplication.id, 'rejected');
                    setShowApplicationDetails(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 mr-2" />
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Volunteer Management Admin Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Comprehensive volunteer management with registrations, database, job tracking, and applications
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadAllData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-8 overflow-x-auto">
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

        {/* Stats Cards for Applications Tab */}
        {activeTab === 'applications' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{jobApplications.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobApplications.filter(app => app.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobApplications.filter(app => app.status === 'accepted').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <UserMinus className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobApplications.filter(app => app.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'registrations' ? "Search by name, email, username, city, or zip code..." :
                      activeTab === 'database' ? "Search by name, email, or organization..." :
                      activeTab === 'jobs' ? "Search by job title, category, or location..." :
                      "Search by volunteer name, email, or job title..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-3">
                {activeTab === 'applications' && (
                  <select
                    value={applicationStatusFilter}
                    onChange={(e) => setApplicationStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
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
            </div>

            {/* Job Applications Content */}
            {activeTab === 'applications' && (
              filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredApplications.map(application => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              )
            )}

            {/* Placeholder for other tabs - you can add the existing content here */}
            {activeTab !== 'applications' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tab Content</h3>
                <p className="text-gray-600">Add the existing content for {activeTab} tab here.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationDetails && <ApplicationDetailsModal />}
    </div>
  );
};

export default VolunteerManagementAdminDashboard;