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

  const generateUsername = (firstName: string, lastName: string, birthDate?: string): string => {
    const firstTwoLetters = firstName.substring(0, 2).toLowerCase();
    const fullLastName = lastName.toLowerCase();
    
    let year = '';
    if (birthDate) {
      year = new Date(birthDate).getFullYear().toString();
    } else {
      // If no birth date, use current year as fallback
      year = new Date().getFullYear().toString();
    }
    
    return `${firstTwoLetters}${fullLastName}${year}`;
  };

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
        // Username should now come from the database, generated during signup
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
              .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
              .stat { text-align: center; padding: 15px; border: 2px solid #e5e7eb; border-radius: 8px; }
              .stat-number { font-size: 24px; font-weight: bold; color: #1f2937; }
              .stat-label { color: #6b7280; font-size: 12px; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #3b82f6; color: white; padding: 12px 8px; font-size: 11px; }
              td { border: 1px solid #e5e7eb; padding: 8px; font-size: 10px; }
              tbody tr:nth-child(even) { background: #f9fafb; }
              .fully-booked { background-color: #fef3c7; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 VCEG Volunteer Management Report</h1>
              <h2>${activeTab.toUpperCase()} DATA</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Records: ${currentData.length}</p>
            </div>
            
            ${activeTab === 'registrations' ? `
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${volunteers.length}</div>
                  <div class="stat-label">Total Volunteers</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${volunteers.filter((v: any) => v.experience_level === 'expert').length}</div>
                  <div class="stat-label">Expert Level</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${volunteers.filter((v: any) => v.background_check_consent).length}</div>
                  <div class="stat-label">Background Checks</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${new Set(volunteers.map((v: any) => v.zipcode)).size}</div>
                  <div class="stat-label">Zip Codes</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Skills</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredVolunteers.map((vol: any) => `
                    <tr>
                      <td><strong>${vol.first_name} ${vol.last_name}</strong></td>
                      <td><strong>${vol.username}</strong></td>
                      <td>${vol.email}<br>${vol.phone || 'No phone'}</td>
                      <td>${vol.city}, ${vol.state}<br>${vol.zipcode}</td>
                      <td>${vol.experience_level}</td>
                      <td>${vol.skills?.slice(0, 3).join(', ') || 'None listed'}</td>
                      <td>${new Date(vol.created_at).toLocaleDateString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : activeTab === 'database' ? `
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Total Hours</th>
                    <th>Type</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLogs.map((log: any) => `
                    <tr>
                      <td><strong>${log.name}</strong></td>
                      <td>${log.email}</td>
                      <td>${log.organization}</td>
                      <td>${Math.round(log.total_hours || 0)}</td>
                      <td>${log.log_type}</td>
                      <td>${new Date(log.created_at).toLocaleDateString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Volunteers Needed</th>
                    <th>Assigned</th>
                    <th>Status</th>
                    <th>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredJobs.map((job: any) => `
                    <tr class="${job.volunteers_assigned >= job.volunteers_needed ? 'fully-booked' : ''}">
                      <td><strong>${job.title}</strong></td>
                      <td>${job.category}</td>
                      <td>${job.city}, ${job.state}</td>
                      <td>${job.volunteers_needed}</td>
                      <td>${job.volunteers_assigned || 0}</td>
                      <td>${job.volunteers_assigned >= job.volunteers_needed ? 'FULLY BOOKED' : job.status}</td>
                      <td>${new Date(job.start_date).toLocaleDateString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
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

        {volunteer.categories_interested && volunteer.categories_interested.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Tag className="w-4 h-4 mr-1" />
              <span>Interests</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {volunteer.categories_interested.slice(0, 2).map((category, index) => (
                <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
                  {category}
                </span>
              ))}
              {volunteer.categories_interested.length > 2 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                  +{volunteer.categories_interested.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          {volunteer.background_check_consent && (
            <div className="flex items-center text-green-600 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>Background Check</span>
            </div>
          )}
          {volunteer.email_notifications && (
            <div className="flex items-center text-blue-600 text-xs">
              <Mail className="w-3 h-3 mr-1" />
              <span>Email OK</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Max Distance: {volunteer.max_distance || 25} miles
        </div>
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

          {job.description && (
            <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isFullyBooked ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(((job.volunteers_assigned || 0) / job.volunteers_needed) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Progress</span>
            <span>{Math.round(((job.volunteers_assigned || 0) / job.volunteers_needed) * 100)}%</span>
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
                  <p className="text-sm font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded mt-1">
                    Username: @{selectedVolunteer.username}
                  </p>
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

          <div className="p-6 space-y-8">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{selectedVolunteer.email}</p>
                </div>
                {selectedVolunteer.phone && (
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <p className="text-gray-900">{selectedVolunteer.phone}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900">
                    {selectedVolunteer.address}<br />
                    {selectedVolunteer.city}, {selectedVolunteer.state} {selectedVolunteer.zipcode}
                  </p>
                </div>
                {selectedVolunteer.birth_date && (
                  <div>
                    <span className="font-medium text-gray-700">Birth Date:</span>
                    <p className="text-gray-900">{new Date(selectedVolunteer.birth_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Emergency Contact
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{selectedVolunteer.emergency_contact_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{selectedVolunteer.emergency_contact_phone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Relationship:</span>
                  <p className="text-gray-900">{selectedVolunteer.emergency_contact_relationship}</p>
                </div>
              </div>
            </div>

            {/* Skills & Experience */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Skills & Experience
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700">Experience Level:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                    selectedVolunteer.experience_level === 'expert' ? 'bg-purple-100 text-purple-800' :
                    selectedVolunteer.experience_level === 'experienced' ? 'bg-blue-100 text-blue-800' :
                    selectedVolunteer.experience_level === 'some' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedVolunteer.experience_level}
                  </span>
                </div>
                
                {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedVolunteer.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVolunteer.categories_interested && selectedVolunteer.categories_interested.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">Categories of Interest:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedVolunteer.categories_interested.map((category, index) => (
                        <span key={index} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-lg">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability & Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Availability & Preferences
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Maximum Distance:</span>
                  <p className="text-gray-900">{selectedVolunteer.max_distance || 25} miles</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Transportation:</span>
                  <p className="text-gray-900">{selectedVolunteer.transportation}</p>
                </div>
              </div>
              
              {selectedVolunteer.availability && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700 block mb-2">Availability:</span>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedVolunteer.availability, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Preferences & Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Preferences & Notes
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">Background Check Consent:</span>
                    {selectedVolunteer.background_check_consent ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">Email Notifications:</span>
                    {selectedVolunteer.email_notifications ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-2">SMS Notifications:</span>
                    {selectedVolunteer.sms_notifications ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {selectedVolunteer.notes && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2">Notes:</span>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-700">{selectedVolunteer.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Registration Information</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    selectedVolunteer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedVolunteer.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Registered:</span>
                  <p className="text-gray-900">{new Date(selectedVolunteer.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">ID:</span>
                  <p className="text-gray-900">#{selectedVolunteer.id}</p>
                </div>
              </div>
            </div>
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

        {activeTab === 'database' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{volunteerLogs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(volunteerLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(volunteerLogs.map(log => log.organization)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.filter(job => (job.volunteers_assigned || 0) < job.volunteers_needed).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fully Booked</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.filter(job => (job.volunteers_assigned || 0) >= job.volunteers_needed).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Volunteers Needed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.reduce((sum, job) => sum + Math.max(0, job.volunteers_needed - (job.volunteers_assigned || 0)), 0)}
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
                      "Search by job title, category, or location..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              {(activeTab === 'registrations' || activeTab === 'jobs') && (
                <div className="flex gap-3">
                  {activeTab === 'registrations' && (
                    <>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>

                      <select
                        value={experienceFilter}
                        onChange={(e) => setExperienceFilter(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Experience</option>
                        <option value="beginner">Beginner</option>
                        <option value="some">Some Experience</option>
                        <option value="experienced">Experienced</option>
                        <option value="expert">Expert</option>
                      </select>

                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Filter className="w-4 h-4" />
                        <span>More Filters</span>
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Advanced Filters for Registrations */}
            {showFilters && activeTab === 'registrations' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Skills Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
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
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <div className="flex space-x-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'location')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="date">Registration Date</option>
                          <option value="name">Name</option>
                          <option value="location">Location</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                </p>
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
              filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteer records found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria.</p>
                </div>
              ) : (
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
              )
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
                id: 1, // You'll need to get this from your auth context
                username: 'admin', // You'll need to get this from your auth context
                email: 'admin@example.com', // You'll need to get this from your auth context
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