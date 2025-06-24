import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, MapPin, Clock, Phone, Mail, 
  Calendar, Star, Eye, Edit, Trash2, UserCheck, AlertCircle,
  CheckCircle, X, User, Building2, Tag, Settings, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, MessageSquare, Briefcase,
  UserPlus, Activity, BarChart3, Navigation, Award, BookOpen, Upload
} from 'lucide-react';
import UploadComponent from './UploadComponent';

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
  const [activeTab, setActiveTab] = useState<'registrations' | 'database' | 'jobs'>('registrations');
  const [showUpload, setShowUpload] = useState(false);
  
  // Volunteer Registration State
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerRegistration[]>([]);
  
  // Volunteer Database State
  const [volunteerLogs, setVolunteerLogs] = useState<VolunteerLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<VolunteerLogEntry[]>([]);
  
  // Jobs State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRegistration | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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
    }
  }, [volunteers, volunteerLogs, jobs, searchTerm, selectedSkills, selectedCategories, experienceFilter, statusFilter, locationFilter, sortBy, sortOrder, activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadVolunteerRegistrations(),
        loadVolunteerLogs(),
        loadJobs()
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

  const filterVolunteers = () => {
    let filtered = [...volunteers];

    // Text search
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

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(vol => 
        selectedSkills.some(skill => vol.skills?.includes(skill))
      );
    }

    // Categories filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(vol => 
        selectedCategories.some(cat => vol.categories_interested?.includes(cat))
      );
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(vol => vol.experience_level === experienceFilter);
    }

    // Status filter
    filtered = filtered.filter(vol => vol.status === statusFilter);

    // Location filter
    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(vol => 
        vol.city.toLowerCase().includes(location) ||
        vol.state.toLowerCase().includes(location) ||
        vol.zipcode.includes(location)
      );
    }

    // Sort
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

  const exportToPDF = () => {
    const currentData = activeTab === 'registrations' ? filteredVolunteers : 
                      activeTab === 'database' ? filteredLogs : filteredJobs;
    
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
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #3b82f6; color: white; padding: 12px 8px; font-size: 11px; }
              td { border: 1px solid #e5e7eb; padding: 8px; font-size: 10px; }
              tbody tr:nth-child(even) { background: #f9fafb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 VCEG Volunteer Management Report</h1>
              <h2>${activeTab.toUpperCase()} DATA</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Records: ${currentData.length}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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

  const VolunteerCard = ({ volunteer }: { volunteer: VolunteerRegistration }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {volunteer.first_name} {volunteer.last_name}
            </h3>
            <p className="text-sm text-gray-600">{volunteer.email}</p>
            <p className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded mt-1">
              @{volunteer.username}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            volunteer.experience_level === 'expert' ? 'bg-purple-100 text-purple-800' :
            volunteer.experience_level === 'experienced' ? 'bg-blue-100 text-blue-800' :
            volunteer.experience_level === 'some' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {volunteer.experience_level}
          </span>
          <button
            onClick={() => {
              setSelectedVolunteer(volunteer);
              setShowDetails(true);
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          <span>{volunteer.city}, {volunteer.state} {volunteer.zipcode}</span>
        </div>
        
        {volunteer.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            <span>{volunteer.phone}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span>Registered {new Date(volunteer.created_at).toLocaleDateString()}</span>
        </div>

        {volunteer.skills && volunteer.skills.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Star className="w-4 h-4 mr-1" />
              <span>Skills</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {volunteer.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                  {skill}
                </span>
              ))}
              {volunteer.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                  +{volunteer.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const JobCard = ({ job }: { job: Job }) => {
    const isFullyBooked = (job.volunteers_assigned || 0) >= job.volunteers_needed;
    
    return (
      <div className={`bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 ${
        isFullyBooked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isFullyBooked ? 'bg-yellow-200' : 'bg-gradient-to-br from-green-500 to-blue-600'
            }`}>
              <Briefcase className={`w-6 h-6 ${isFullyBooked ? 'text-yellow-800' : 'text-white'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.category}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isFullyBooked 
                ? 'bg-yellow-200 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isFullyBooked ? 'FULLY BOOKED' : 'AVAILABLE'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span>{job.city}, {job.state}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{new Date(job.start_date).toLocaleDateString()} - {new Date(job.end_date).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span>{job.volunteers_assigned || 0} / {job.volunteers_needed} volunteers</span>
          </div>
        </div>
      </div>
    );
  };

  const DetailModal = () => {
    if (!selectedVolunteer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedVolunteer.first_name} {selectedVolunteer.last_name}
                  </h2>
                  <p className="text-gray-600">{selectedVolunteer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <p>Volunteer details would be displayed here...</p>
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
                  Comprehensive volunteer management with registrations, database, and job tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Forms</span>
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
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-8">
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
        </div>

        {/* Stats Cards */}
        {activeTab === 'registrations' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volunteers</p>
                  <p className="text-2xl font-bold text-gray-900">{volunteers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {volunteers.filter(v => v.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Background Checks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {volunteers.filter(v => v.background_check_consent).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Zip Codes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(volunteers.map(v => v.zipcode)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search volunteers, logs, or jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                </h2>
              </div>
            </div>

            {/* Content Grid */}
            {activeTab === 'registrations' && (
              filteredVolunteers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteers found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVolunteers.map(volunteer => (
                    <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                  ))}
                </div>
              )
            )}

            {activeTab === 'database' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
            )}

            {activeTab === 'jobs' && (
              filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetails && <DetailModal />}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="h-full overflow-y-auto">
            <UploadComponent 
              currentUser={{ 
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin' 
              }} 
              onBack={() => setShowUpload(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerManagementAdminDashboard;