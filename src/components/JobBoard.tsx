// src/components/JobBoard.tsx
// Enhanced Job Board with Volunteer ID Integration & Advanced Features
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Users, Calendar, Star, Mail, Phone, AlertCircle, 
  CheckCircle, Heart, ArrowLeft, Edit, Trash2, Eye, Send, User, 
  Badge, Search, Filter, Home, Zap, Target, Fire, TrendingUp,
  ChevronDown, ChevronUp, X, Plus, UserPlus, Navigation
} from 'lucide-react';

interface JobBoardProps {
  jobId?: any;
}

interface Job {
  id: number;
  title: string;
  category: string;
  description: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  volunteers_needed: number;
  volunteers_assigned?: number;
  urgency: string;
  start_date: string;
  end_date: string;
  time_commitment: string;
  duration_hours?: number;
  skills_needed?: string[];
  experience_level?: string;
  age_requirement?: string;
  contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  status: string;
  created_at: string;
  expires_at: string;
  distance_miles?: number;
  positions_remaining?: number;
}

interface VolunteerProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  experience_level: string;
  skills: string[];
  categories_interested: string[];
}

const JobDetails = ({ jobId }: { jobId: any }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile | null>(null);
  const [checkingVolunteer, setCheckingVolunteer] = useState(false);
  const [applicationData, setApplicationData] = useState({
    volunteer_name: '',
    email: '',
    phone: '',
    volunteer_id: '',
    cover_letter: '',
    experience: ''
  });

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (response.ok) {
        const data = await response.json();
        // Calculate real-time availability
        const positionsRemaining = data.volunteers_needed - (data.volunteers_assigned || 0);
        setJob({ ...data, positions_remaining: Math.max(0, positionsRemaining) });
      } else {
        setError('Failed to load job details');
      }
    } catch (err) {
      setError('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced volunteer lookup by ID or email
  const checkVolunteerByIdOrEmail = async (identifier: string) => {
    if (!identifier || identifier.length < 3) {
      setVolunteerProfile(null);
      return;
    }

    setCheckingVolunteer(true);
    try {
      // Try by volunteer ID first, then by email
      const isEmail = identifier.includes('@');
      const searchParam = isEmail ? `email=${encodeURIComponent(identifier)}` : `search=${encodeURIComponent(identifier)}`;
      
      const response = await fetch(`/api/volunteers?${searchParam}`);
      if (response.ok) {
        const data = await response.json();
        if (data.volunteers && data.volunteers.length > 0) {
          const volunteer = data.volunteers[0];
          setVolunteerProfile({
            id: volunteer.id,
            username: volunteer.username,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email,
            phone: volunteer.phone,
            experience_level: volunteer.experience_level,
            skills: volunteer.skills || [],
            categories_interested: volunteer.categories_interested || []
          });
          
          // Auto-fill form data
          setApplicationData(prev => ({
            ...prev,
            volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email,
            phone: volunteer.phone || prev.phone,
            volunteer_id: volunteer.username
          }));
        } else {
          setVolunteerProfile(null);
        }
      }
    } catch (error) {
      console.error('Error checking volunteer:', error);
      setVolunteerProfile(null);
    } finally {
      setCheckingVolunteer(false);
    }
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);

    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          volunteer_id: volunteerProfile?.id,
          ...applicationData
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Application submitted successfully! ${volunteerProfile ? `Your volunteer ID: ${volunteerProfile.username}` : ''}`);
        setShowApplicationForm(false);
        setApplicationData({
          volunteer_name: '',
          email: '',
          phone: '',
          volunteer_id: '',
          cover_letter: '',
          experience: ''
        });
        setVolunteerProfile(null);
        // Refresh job details to update availability
        fetchJobDetails();
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAvailabilityColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-100';
    if (percentage > 20) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job Board
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Job Header with Urgency */}
            <div className={`p-8 ${
              job.urgency === 'urgent' 
                ? 'bg-gradient-to-r from-red-600 to-orange-600' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
            } text-white relative overflow-hidden`}>
              {job.urgency === 'urgent' && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <Fire className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-bold">URGENT</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.city}, {job.state}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span className={`font-bold ${
                        job.positions_remaining === 0 ? 'text-red-200' : 
                        job.positions_remaining <= 2 ? 'text-yellow-200' : 'text-green-200'
                      }`}>
                        {job.positions_remaining} of {job.volunteers_needed} spots available
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getUrgencyColor(job.urgency)}`}>
                  {job.urgency} priority
                </div>
              </div>

              {/* Real-time Availability Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Position Availability</span>
                  <span className="text-sm">
                    {job.volunteers_needed - job.positions_remaining} filled • {job.positions_remaining} remaining
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      job.positions_remaining === 0 ? 'bg-red-400' :
                      job.positions_remaining <= 2 ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{ 
                      width: `${((job.volunteers_needed - job.positions_remaining) / job.volunteers_needed) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{job.description}</p>
                  </div>

                  {job.skills_needed && job.skills_needed.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Skills Needed</h2>
                      <div className="flex flex-wrap gap-2">
                        {job.skills_needed.map((skill: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.experience_level && (
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Experience Required</h2>
                      <p className="text-gray-700 capitalize">{job.experience_level}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Opportunity Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                        <span className="text-sm">{job.time_commitment}</span>
                      </div>
                      {job.duration_hours && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-3 text-gray-500" />
                          <span className="text-sm">{job.duration_hours} hours</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-3 text-gray-500" />
                        <span className="text-sm">{job.volunteers_needed} volunteers needed</span>
                      </div>
                      {job.age_requirement && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-3 text-gray-500" />
                          <span className="text-sm">{job.age_requirement}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      {job.contact_name && (
                        <p className="text-sm font-medium">{job.contact_name}</p>
                      )}
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-3 text-gray-500" />
                        <a href={`mailto:${job.contact_email}`} className="text-blue-600 text-sm hover:underline">
                          {job.contact_email}
                        </a>
                      </div>
                      {job.contact_phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-3 text-gray-500" />
                          <a href={`tel:${job.contact_phone}`} className="text-blue-600 text-sm hover:underline">
                            {job.contact_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    disabled={job.positions_remaining === 0}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                      job.positions_remaining === 0 
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : job.urgency === 'urgent'
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {job.positions_remaining === 0 ? 'Position Filled' : 'Apply Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Application Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Apply for {job.title}</h2>
              
              {/* Volunteer Profile Display */}
              {volunteerProfile && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-800">Volunteer Profile Found!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> {volunteerProfile.username}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {volunteerProfile.name}
                    </div>
                    <div>
                      <span className="font-medium">Experience:</span> {volunteerProfile.experience_level}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {volunteerProfile.email}
                    </div>
                    {volunteerProfile.skills.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">Skills:</span> {volunteerProfile.skills.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteer ID or Email Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your volunteer ID (e.g., johndoe2024) or email address"
                    value={applicationData.volunteer_id || applicationData.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('@')) {
                        setApplicationData({...applicationData, email: value, volunteer_id: ''});
                      } else {
                        setApplicationData({...applicationData, volunteer_id: value, email: ''});
                      }
                      checkVolunteerByIdOrEmail(value);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {checkingVolunteer && (
                    <p className="text-sm text-blue-600 mt-1">Checking volunteer profile...</p>
                  )}
                  {!volunteerProfile && (applicationData.email || applicationData.volunteer_id) && !checkingVolunteer && (
                    <p className="text-sm text-orange-600 mt-1">
                      No volunteer profile found. You can still apply, but consider registering as a volunteer for faster future applications.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicationData.volunteer_name}
                    onChange={(e) => setApplicationData({...applicationData, volunteer_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relevant Experience
                  </label>
                  <textarea
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe any relevant experience or skills..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    value={applicationData.cover_letter}
                    onChange={(e) => setApplicationData({...applicationData, cover_letter: e.target.value})}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Why are you interested in this opportunity?"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplicationForm(false);
                      setVolunteerProfile(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JobBoard = ({ jobId }: JobBoardProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    zipcode: '',
    distance: 25,
    urgency: 'all',
    availability: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Available categories for filtering
  const availableCategories = [
    'Emergency Services', 'Supply Distribution', 'Medical Support',
    'Search & Rescue', 'Shelter Operations', 'Food Services',
    'Transportation', 'Administrative Support', 'Community Outreach',
    'Education', 'Environmental', 'Construction & Repair'
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs?status=active');
      
      if (response.ok) {
        const data = await response.json();
        // Calculate positions remaining for each job
        const jobsWithAvailability = (data.jobs || []).map((job: Job) => ({
          ...job,
          positions_remaining: Math.max(0, job.volunteers_needed - (job.volunteers_assigned || 0))
        }));
        setJobs(jobsWithAvailability);
        setFilteredJobs(jobsWithAvailability);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm) ||
        job.description.toLowerCase().includes(searchTerm) ||
        job.category.toLowerCase().includes(searchTerm) ||
        job.city.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(job => job.category === filters.category);
    }

    // Zipcode filter
    if (filters.zipcode) {
      filtered = filtered.filter(job => 
        job.zipcode.includes(filters.zipcode) ||
        job.city.toLowerCase().includes(filters.zipcode.toLowerCase())
      );
    }

    // Urgency filter  
    if (filters.urgency !== 'all') {
      filtered = filtered.filter(job => job.urgency === filters.urgency);
    }

    // Availability filter
    if (filters.availability !== 'all') {
      if (filters.availability === 'available') {
        filtered = filtered.filter(job => job.positions_remaining > 0);
      } else if (filters.availability === 'urgent') {
        filtered = filtered.filter(job => job.positions_remaining <= 2 && job.positions_remaining > 0);
      } else if (filters.availability === 'filled') {
        filtered = filtered.filter(job => job.positions_remaining === 0);
      }
    }

    // Sort by urgency and availability
    filtered.sort((a, b) => {
      // Urgent jobs first
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;
      
      // Then by positions remaining (fewer spots = higher priority)
      if (a.positions_remaining !== b.positions_remaining) {
        return a.positions_remaining - b.positions_remaining;
      }
      
      // Finally by creation date (newer first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      zipcode: '',
      distance: 25,
      urgency: 'all',
      availability: 'all',
      search: ''
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAvailabilityStatus = (remaining: number, total: number) => {
    if (remaining === 0) return { text: 'Filled', color: 'text-red-600 bg-red-100' };
    if (remaining <= 2) return { text: `Only ${remaining} left!`, color: 'text-orange-600 bg-orange-100' };
    return { text: `${remaining} available`, color: 'text-green-600 bg-green-100' };
  };

  if (jobId) {
    return <JobDetails jobId={jobId} />;
  }

  // Separate urgent jobs for special display
  const urgentJobs = filteredJobs.filter(job => job.urgency === 'urgent' && job.positions_remaining > 0);
  const regularJobs = filteredJobs.filter(job => job.urgency !== 'urgent' || job.positions_remaining === 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Opportunities</h1>
              <p className="text-gray-600">Find meaningful ways to make a difference in your community</p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title, description, category, or location..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('urgency', filters.urgency === 'urgent' ? 'all' : 'urgent')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.urgency === 'urgent'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <Fire className="w-4 h-4 inline mr-1" />
                Urgent Jobs
              </button>
              
              <button
                onClick={() => handleFilterChange('availability', filters.availability === 'urgent' ? 'all' : 'urgent')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.availability === 'urgent'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                <Target className="w-4 h-4 inline mr-1" />
                Few Spots Left
              </button>
              
              <button
                onClick={() => handleFilterChange('availability', filters.availability === 'available' ? 'all' : 'available')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.availability === 'available'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Available Now
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {availableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="Enter zipcode or city"
                      value={filters.zipcode}
                      onChange={(e) => handleFilterChange('zipcode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                    <select
                      value={filters.urgency}
                      onChange={(e) => handleFilterChange('urgency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Urgency Levels</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <select
                      value={filters.availability}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Jobs</option>
                      <option value="available">Available Positions</option>
                      <option value="urgent">Few Spots Left</option>
                      <option value="filled">Filled Positions</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Showing {filteredJobs.length} of {jobs.length} opportunities
                  </span>
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Urgent Jobs Section */}
            {urgentJobs.length > 0 && (
              <div>
                <div className="flex items-center mb-6">
                  <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                    <Fire className="w-5 h-5 animate-pulse" />
                    <span className="font-bold">URGENT OPPORTUNITIES</span>
                  </div>
                  <div className="flex-1 h-px bg-red-200 ml-4"></div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {urgentJobs.map((job) => (
                    <div key={job.id} className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Urgent Badge */}
                      <div className="bg-red-600 text-white p-2 flex items-center justify-center">
                        <Fire className="w-4 h-4 mr-1 animate-pulse" />
                        <span className="font-bold text-sm">URGENT - IMMEDIATE NEED</span>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {job.city}, {job.state}
                            {job.distance_miles && (
                              <span className="ml-2 text-blue-600">
                                ({Math.round(job.distance_miles)} mi)
                              </span>
                            )}
                          </div>
                          
                          {/* Prominent Availability Display */}
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-2 text-red-600" />
                            <span className="font-bold text-red-600">
                              {job.positions_remaining} of {job.volunteers_needed} spots left!
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            {job.time_commitment}
                          </div>
                        </div>

                        {/* Availability Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Filled: {job.volunteers_needed - job.positions_remaining}</span>
                            <span>Remaining: {job.positions_remaining}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((job.volunteers_needed - job.positions_remaining) / job.volunteers_needed) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.location.href = `/jobs/${job.id}`}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Apply Now
                          </button>
                          <button 
                            onClick={() => window.location.href = `/jobs/${job.id}`}
                            className="px-3 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Jobs Section */}
            {regularJobs.length > 0 && (
              <div>
                {urgentJobs.length > 0 && (
                  <div className="flex items-center mb-6">
                    <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-bold">ALL OPPORTUNITIES</span>
                    </div>
                    <div className="flex-1 h-px bg-blue-200 ml-4"></div>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularJobs.map((job) => {
                    const availabilityStatus = getAvailabilityStatus(job.positions_remaining, job.volunteers_needed);
                    
                    return (
                      <div key={job.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}>
                              {job.urgency}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${availabilityStatus.color}`}>
                              {availabilityStatus.text}
                            </div>
                          </div>

                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-2" />
                              {job.city}, {job.state}
                              {job.distance_miles && (
                                <span className="ml-2 text-blue-600">
                                  ({Math.round(job.distance_miles)} mi)
                                </span>
                              )}
                            </div>
                            
                            {/* Availability Display */}
                            <div className="flex items-center text-sm">
                              <Users className="w-4 h-4 mr-2" />
                              <span className={`font-medium ${
                                job.positions_remaining === 0 ? 'text-red-600' :
                                job.positions_remaining <= 2 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {job.positions_remaining} of {job.volunteers_needed} spots available
                              </span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="w-4 h-4 mr-2" />
                              {job.time_commitment}
                            </div>
                          </div>

                          {/* Availability Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  job.positions_remaining === 0 ? 'bg-red-500' :
                                  job.positions_remaining <= 2 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${((job.volunteers_needed - job.positions_remaining) / job.volunteers_needed) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.location.href = `/jobs/${job.id}`}
                              disabled={job.positions_remaining === 0}
                              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                job.positions_remaining === 0
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {job.positions_remaining === 0 ? 'Filled' : 'View Details'}
                            </button>
                            <button 
                              onClick={() => window.location.href = `/jobs/${job.id}`}
                              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoard;