import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Users, Calendar, Star, Mail, Phone, AlertCircle, 
  CheckCircle, Heart, ArrowLeft, Edit, Trash2, Eye, Send, User, 
  Badge, Search, Filter, Home, Zap, Target, Flame, TrendingUp,
  ChevronDown, ChevronUp, X, Plus, UserPlus, Navigation, Sparkles,
  Award, Shield, Rocket, Globe, UserCheck, CreditCard
} from 'lucide-react';

interface JobBoardProps {
  jobId?: string | number;
}

function JobBoard({ jobId }: JobBoardProps) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showVolunteerIdLogin, setShowVolunteerIdLogin] = useState(false);
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplication, setShowApplication] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState({
    category: 'all',
    urgency: 'all',
    search: '',
    zipcode: '',
    distance: 25,
    skills: ''
  });

  const [applicationData, setApplicationData] = useState({
    volunteer_name: '',
    email: '',
    phone: '',
    cover_letter: '',
    experience: ''
  });

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      
      // Add filters as URL params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure skills_needed is always an array
      const processedJobs = data.jobs.map(job => ({
        ...job,
        skills_needed: typeof job.skills_needed === 'string' 
          ? job.skills_needed.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : job.skills_needed || [],
        filled_positions: job.filled_positions || 0,
        positions_remaining: job.positions_remaining || job.volunteers_needed || 0
      }));
      
      setJobs(processedJobs);
      setFilteredJobs(processedJobs);
      setPagination(data.pagination);
      
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load job details if jobId is provided
  const loadJobDetails = async () => {
    if (!jobId) return;
    
    setLoadingJobDetails(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const job = await response.json();
      
      // Process skills_needed
      const processedJob = {
        ...job,
        skills_needed: typeof job.skills_needed === 'string' 
          ? job.skills_needed.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : job.skills_needed || []
      };
      
      setJobDetails(processedJob);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError('Failed to load job details.');
    } finally {
      setLoadingJobDetails(false);
    }
  };

  // Fetch volunteer profile by email
  const fetchVolunteerProfile = async (email) => {
    if (!email.trim()) return null;
    
    setLoadingProfile(true);
    try {
      const response = await fetch(`/api/volunteers?email=${encodeURIComponent(email.trim())}`);
      
      if (response.ok) {
        const data = await response.json();
        // Assuming the API returns an array of volunteers
        const volunteers = Array.isArray(data) ? data : data.volunteers || [];
        return volunteers.length > 0 ? volunteers[0] : null;
      }
      return null;
    } catch (err) {
      console.error('Error fetching volunteer profile:', err);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  // Submit job application
  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob && !jobDetails) return;
    
    setApplying(true);
    try {
      const targetJob = selectedJob || jobDetails;
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: targetJob.id,
          volunteer_id: volunteerProfile?.id || null,
          ...applicationData
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Application submitted successfully! You will be contacted if selected.');
        setShowApplication(false);
        setApplicationData({
          volunteer_name: '',
          email: '',
          phone: '',
          cover_letter: '',
          experience: ''
        });
        // Refresh jobs to update positions remaining
        fetchJobs();
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      alert('Error submitting application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Helper functions
  const getUrgencyStyles = (urgency) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-pink-500',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800 border-red-200',
          glow: 'shadow-red-500/25',
          pulse: 'animate-pulse'
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
          text: 'text-orange-700',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          glow: 'shadow-orange-500/25',
          pulse: ''
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-purple-500',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          glow: 'shadow-blue-500/25',
          pulse: ''
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-green-500 to-teal-500',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800 border-green-200',
          glow: 'shadow-green-500/25',
          pulse: ''
        };
    }
  };

  const getAvailabilityColor = (remaining, total) => {
    if (total === 0) return 'text-gray-600';
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleVolunteerLogin = async () => {
    if (volunteerEmail.trim()) {
      const profile = await fetchVolunteerProfile(volunteerEmail.trim());
      setVolunteerProfile(profile);
      if (profile) {
        setApplicationData({
          volunteer_name: `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
          phone: profile.phone || '',
          cover_letter: '',
          experience: profile.experience_level || ''
        });
      }
      setShowVolunteerIdLogin(false);
      if (!profile) {
        alert('Volunteer not found with that email address. You can still apply as a new volunteer!');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const handleLogout = () => {
    setVolunteerProfile(null);
    setVolunteerEmail('');
    setApplicationData({
      volunteer_name: '',
      email: '',
      phone: '',
      cover_letter: '',
      experience: ''
    });
  };

  // Effects
  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    } else {
      fetchJobs();
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      fetchJobs();
    }
  }, [filters, pagination.page]);

  // If jobId is provided and we have job details, show job details view
  if (jobId && jobDetails) {
    const urgencyStyles = getUrgencyStyles(jobDetails.urgency);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
            <div className="container mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center text-white hover:text-yellow-400 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Job Board
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300"
                >
                  <Home className="w-5 h-5 mr-2 inline" />
                  Home
                </button>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className={`p-8 ${urgencyStyles.bg} text-white`}>
                  <h1 className="text-4xl font-bold mb-4">{jobDetails.title}</h1>
                  <div className="flex items-center space-x-6 text-lg">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      {jobDetails.city}, {jobDetails.state}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      {jobDetails.positions_remaining} of {jobDetails.volunteers_needed} spots available
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
                      <p className="text-gray-700 text-lg leading-relaxed mb-6">{jobDetails.description}</p>

                      {jobDetails.skills_needed && Array.isArray(jobDetails.skills_needed) && jobDetails.skills_needed.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-800 mb-3">Skills Needed</h3>
                          <div className="flex flex-wrap gap-3">
                            {jobDetails.skills_needed.map((skill, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Opportunity Details</h3>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 mr-3 text-blue-600" />
                            <span>{jobDetails.time_commitment}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-3 text-green-600" />
                            <span className="capitalize">{jobDetails.category}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedJob(jobDetails);
                          setShowApplication(true);
                        }}
                        disabled={jobDetails.positions_remaining === 0}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                          jobDetails.positions_remaining === 0
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : `${urgencyStyles.bg} text-white hover:opacity-90`
                        }`}
                      >
                        {jobDetails.positions_remaining === 0 ? 'Position Filled' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal for Job Details View */}
        {showApplication && selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Apply for {selectedJob.title}</h2>
                    <p className="text-green-100">Complete your application below</p>
                  </div>
                  <button
                    onClick={() => setShowApplication(false)}
                    className="text-green-100 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleApplicationSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={applicationData.volunteer_name}
                        onChange={(e) => setApplicationData({...applicationData, volunteer_name: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={applicationData.email}
                        onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why are you interested in this opportunity?
                    </label>
                    <textarea
                      rows={4}
                      value={applicationData.cover_letter}
                      onChange={(e) => setApplicationData({...applicationData, cover_letter: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="Tell us about your motivation..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={applying}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
                    >
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplication(false)}
                      className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
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
  }

  // Main job board view
  const urgentJobs = filteredJobs.filter(job => job.urgency.toLowerCase() === 'urgent' && job.positions_remaining > 0);
  const regularJobs = filteredJobs.filter(job => job.urgency.toLowerCase() !== 'urgent');

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading volunteer opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={() => fetchJobs()}
            className="bg-white text-purple-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="relative z-20">
        {/* Header with Volunteer Login */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 shadow-xl">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 flex items-center justify-center lg:justify-start">
                  <Rocket className="w-10 h-10 mr-3 text-blue-300" />
                  Volunteer Opportunities
                </h1>
                <p className="text-lg text-blue-100 font-medium">Make a meaningful difference in your community</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-gray-800 font-semibold text-base">Returning Volunteer?</div>
                      <button
                        onClick={() => setShowVolunteerIdLogin(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-all duration-200"
                      >
                        Login with email →
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg border border-blue-200"
                >
                  <Home className="w-5 h-5 mr-2 inline" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Volunteer Profile Display */}
        {volunteerProfile && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
            <div className="container mx-auto px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-xl p-3">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xl">Welcome back, {volunteerProfile.first_name} {volunteerProfile.last_name}!</div>
                    <div className="text-green-100 text-sm font-medium">
                      {volunteerProfile.total_hours > 0 && `${volunteerProfile.total_hours} hours completed`}
                      {volunteerProfile.experience_level && ` • ${volunteerProfile.experience_level} level`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-green-100 hover:text-white bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="bg-white shadow-md border-b border-gray-200">
          <div className="container mx-auto px-6 py-6">
            <div className="max-w-6xl mx-auto">
              <div className="relative mb-6">
                <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search opportunities by title, location, or skills..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="Environment">Environment</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Human Services">Human Services</option>
                    <option value="Community">Community</option>
                    <option value="Emergency Services">Emergency Services</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="all">All Urgencies</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zipcode</label>
                  <input
                    type="text"
                    placeholder="Enter zipcode"
                    value={filters.zipcode}
                    onChange={(e) => handleFilterChange('zipcode', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                  <select
                    value={filters.distance}
                    onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value={5}>Within 5 miles</option>
                    <option value={10}>Within 10 miles</option>
                    <option value={25}>Within 25 miles</option>
                    <option value={50}>Within 50 miles</option>
                    <option value={100}>Within 100 miles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <input
                    type="text"
                    placeholder="e.g., First Aid"
                    value={filters.skills}
                    onChange={(e) => handleFilterChange('skills', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-10">
          <div className="mb-8 text-center">
            <p className="text-white text-lg">
              {loading ? 'Loading...' : `Found ${pagination.total} volunteer opportunities`}
              {filters.zipcode && ` near ${filters.zipcode}`}
            </p>
          </div>

          {/* Urgent Jobs Section */}
          {urgentJobs.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-center mb-10">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                  <Flame className="w-6 h-6" />
                  <span className="text-xl font-bold">🚨 URGENT OPPORTUNITIES</span>
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {urgentJobs.map((job) => {
                  const urgencyStyles = getUrgencyStyles(job.urgency);
                  return (
                    <div key={job.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border-2 border-red-200">
                      <div className={`${urgencyStyles.bg} text-white p-4 text-center`}>
                        <div className="flex items-center justify-center space-x-2">
                          <Flame className="w-5 h-5" />
                          <span className="font-bold text-lg">URGENT - APPLY NOW!</span>
                          <Flame className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{job.title}</h3>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${urgencyStyles.badge}`}>
                              {job.category}
                            </div>
                          </div>
                          <Heart className="w-6 h-6 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-gray-700">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                              <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium">
                              {job.city}, {job.state}
                              {job.distance_miles && (
                                <span className="ml-2 text-blue-600">
                                  ({Math.round(job.distance_miles)} mi)
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <div className="bg-red-100 p-2 rounded-lg mr-3">
                              <Users className="w-4 h-4 text-red-600" />
                            </div>
                            <span className="font-bold text-red-600">
                              Only {job.positions_remaining} of {job.volunteers_needed} spots left!
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <div className="bg-purple-100 p-2 rounded-lg mr-3">
                              <Clock className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="font-medium">{job.time_commitment}</span>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                            <span>Filled: {job.filled_positions}</span>
                            <span>Remaining: {job.positions_remaining}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${job.volunteers_needed > 0 ? (job.filled_positions / job.volunteers_needed) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowApplication(true);
                            }}
                            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-xl font-bold hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            Apply Now
                          </button>
                          <button 
                            onClick={() => window.location.href = `/jobs/${job.id}`}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Jobs Section */}
          {regularJobs.length > 0 && (
            <div>
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-xl font-bold">All Opportunities</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularJobs.map((job) => {
                  const urgencyStyles = getUrgencyStyles(job.urgency);
                  return (
                    <div key={job.id} className={`bg-white rounded-3xl shadow-xl ${urgencyStyles.glow} hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${urgencyStyles.bg}`}></div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyStyles.badge}`}>
                              {job.urgency} priority
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            job.positions_remaining === 0 ? 'bg-red-100 text-red-800' :
                            job.positions_remaining <= 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {job.positions_remaining === 0 ? 'Filled' : 
                             job.positions_remaining <= 2 ? `${job.positions_remaining} left!` :
                             `${job.positions_remaining} available`}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-3">{job.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-gray-700">
                            <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                            <span>
                              {job.city}, {job.state}
                              {job.distance_miles && (
                                <span className="ml-2 text-blue-600">
                                  ({Math.round(job.distance_miles)} mi)
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Users className="w-5 h-5 mr-3 text-green-500" />
                            <span className={`font-medium ${getAvailabilityColor(job.positions_remaining, job.volunteers_needed)}`}>
                              {job.positions_remaining} of {job.volunteers_needed} spots available
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-5 h-5 mr-3 text-purple-500" />
                            <span>{job.time_commitment}</span>
                          </div>

                          {job.skills_needed && Array.isArray(job.skills_needed) && job.skills_needed.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {job.skills_needed.slice(0, 3).map((skill, index) => (
                                <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                              {job.skills_needed.length > 3 && (
                                <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-sm">
                                  +{job.skills_needed.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mb-6">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                job.positions_remaining === 0 ? 'bg-red-500' :
                                job.positions_remaining <= 2 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${job.volunteers_needed > 0 ? (job.filled_positions / job.volunteers_needed) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowApplication(true);
                            }}
                            disabled={job.positions_remaining === 0}
                            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                              job.positions_remaining === 0
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : `${urgencyStyles.bg} text-white hover:opacity-90`
                            }`}
                          >
                            {job.positions_remaining === 0 ? 'Filled' : 'Apply Now'}
                          </button>
                          <button 
                            onClick={() => window.location.href = `/jobs/${job.id}`}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && jobs.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-white/60 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">No opportunities found</h3>
              <p className="text-white/80 mb-6">Try adjusting your search filters or check back later for new opportunities.</p>
              <button
                onClick={() => {
                  setFilters({
                    category: 'all',
                    urgency: 'all',
                    search: '',
                    zipcode: '',
                    distance: 25,
                    skills: ''
                  });
                }}
                className="bg-white text-purple-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Login Modal */}
      {showVolunteerIdLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Volunteer Login</h2>
                    <p className="text-blue-100">Enter your email to load your profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVolunteerIdLogin(false)}
                  className="text-blue-100 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={volunteerEmail}
                  onChange={(e) => setVolunteerEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleVolunteerLogin()}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleVolunteerLogin}
                  disabled={loadingProfile}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-colors disabled:opacity-50"
                >
                  {loadingProfile ? 'Loading...' : 'Login'}
                </button>
                <button
                  onClick={() => setShowVolunteerIdLogin(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplication && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Apply for {selectedJob.title}</h2>
                  <p className="text-green-100">Complete your application below</p>
                </div>
                <button
                  onClick={() => setShowApplication(false)}
                  className="text-green-100 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Volunteer Profile Section */}
              {volunteerProfile ? (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-500 text-white p-2 rounded-full">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800">Volunteer Profile Loaded!</h3>
                      <p className="text-green-700 text-sm">Your information has been pre-filled</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h3 className="font-bold text-yellow-800">Quick Login Available</h3>
                      <p className="text-yellow-700 text-sm">Enter your email to auto-fill this form</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <input
                      type="email"
                      value={volunteerEmail}
                      onChange={(e) => setVolunteerEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleVolunteerLogin()}
                    />
                    <button
                      onClick={handleVolunteerLogin}
                      disabled={loadingProfile}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {loadingProfile ? 'Loading...' : 'Load Profile'}
                    </button>
                  </div>
                </div>
              )}

              {/* Application Form */}
              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.volunteer_name}
                      onChange={(e) => setApplicationData({...applicationData, volunteer_name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your email"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={applicationData.experience}
                      onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select experience level</option>
                      <option value="beginner">Beginner</option>
                      <option value="some">Some Experience</option>
                      <option value="experienced">Experienced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why are you interested in this opportunity?
                  </label>
                  <textarea
                    rows={4}
                    value={applicationData.cover_letter}
                    onChange={(e) => setApplicationData({...applicationData, cover_letter: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="Tell us about your motivation and relevant experience..."
                  />
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    <Send className="w-5 h-5 mr-2 inline" />
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplication(false)}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default JobBoard;