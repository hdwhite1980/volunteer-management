import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Calendar, Star, Mail, Phone, AlertCircle, CheckCircle, Heart, ArrowLeft, Edit, Trash2, Eye, Send, UserCheck, Award } from 'lucide-react';

interface JobBoardProps {
  jobId?: any;
}

const JobDetails = ({ jobId }: { jobId: any }) => {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [volunteerProfile, setVolunteerProfile] = useState<any>(null);
  const [applicationData, setApplicationData] = useState({
    volunteer_name: '',
    email: '',
    phone: '',
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
        setJob(data);
      } else {
        setError('Failed to load job details');
      }
    } catch (err) {
      setError('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingVolunteer = async (email: string) => {
    if (!email || email.length < 3) return;
    
    try {
      const response = await fetch(`/api/volunteer-signup?email=${encodeURIComponent(email)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.volunteers && data.volunteers.length > 0) {
          const volunteer = data.volunteers[0];
          setVolunteerProfile(volunteer);
          
          // Pre-fill application form with volunteer data
          setApplicationData(prev => ({
            ...prev,
            volunteer_name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email,
            phone: volunteer.phone || ''
          }));
        }
      }
    } catch (error) {
      console.log('No existing volunteer registration found');
      setVolunteerProfile(null);
    }
  };

  const handleApplicationSubmit = async (e: any) => {
    e.preventDefault();
    setApplying(true);

    try {
      const applicationPayload: any = {
        job_id: jobId,
        volunteer_name: applicationData.volunteer_name,
        email: applicationData.email,
        phone: applicationData.phone,
        cover_letter: applicationData.cover_letter,
        experience: applicationData.experience
      };

      // If we found an existing volunteer profile, include the volunteer_id
      if (volunteerProfile) {
        applicationPayload.volunteer_id = volunteerProfile.id;
      }

      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationPayload)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Application submitted successfully! You will be contacted if selected.');
        setShowApplicationForm(false);
        setApplicationData({
          volunteer_name: '',
          email: '',
          phone: '',
          cover_letter: '',
          experience: ''
        });
        setVolunteerProfile(null);
      } else {
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
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Board
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Job Header */}
            <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.city}, {job.state}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {job.positions_remaining || job.volunteers_needed} positions available
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(job.urgency)}`}>
                  {job.urgency} priority
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

                  {job.age_requirement && (
                    <div>
                      <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Star className="w-4 h-4 mr-2 text-gray-500" />
                          <span>{job.age_requirement}</span>
                        </div>
                        {job.background_check_required && (
                          <div className="flex items-center text-sm text-gray-700 mt-2">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            <span>Background check required</span>
                          </div>
                        )}
                        {job.training_provided && (
                          <div className="flex items-center text-sm text-gray-700 mt-2">
                            <Award className="w-4 h-4 mr-2 text-blue-500" />
                            <span>Training provided</span>
                          </div>
                        )}
                      </div>
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
                      {job.start_date && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                          <span className="text-sm">Starts {new Date(job.start_date).toLocaleDateString()}</span>
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
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Apply Now
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Apply for {job.title}</h2>
                {volunteerProfile && (
                  <div className="flex items-center text-green-600 text-sm">
                    <UserCheck className="w-4 h-4 mr-1" />
                    <span>Profile Found</span>
                  </div>
                )}
              </div>

              {volunteerProfile && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">Existing volunteer profile found!</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p><strong>Username:</strong> @{volunteerProfile.username}</p>
                    <p><strong>Experience:</strong> {volunteerProfile.experience_level}</p>
                    {volunteerProfile.skills && volunteerProfile.skills.length > 0 && (
                      <p><strong>Skills:</strong> {volunteerProfile.skills.slice(0, 3).join(', ')}{volunteerProfile.skills.length > 3 ? '...' : ''}</p>
                    )}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleApplicationSubmit} className="space-y-4">
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={applicationData.email}
                    onChange={(e) => {
                      setApplicationData({...applicationData, email: e.target.value});
                      checkExistingVolunteer(e.target.value);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email to check for existing profile"
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

                {!volunteerProfile && applicationData.email && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>No existing volunteer profile found. A basic profile will be created for you.</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplicationForm(false);
                      setVolunteerProfile(null);
                      setApplicationData({
                        volunteer_name: '',
                        email: '',
                        phone: '',
                        cover_letter: '',
                        experience: ''
                      });
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
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    zipcode: '',
    distance: 25,
    skills: '',
    search: ''
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchJobs();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/categories?type=volunteer');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/jobs?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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

  const isJobFullyBooked = (job: any) => {
    return (job.volunteers_assigned || 0) >= job.volunteers_needed;
  };

  if (jobId) {
    return <JobDetails jobId={jobId} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Opportunities</h1>
          <p className="text-gray-600">Find meaningful ways to make a difference in your community</p>
          
          {/* Stats Banner */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Active Opportunities</p>
                  <p className="text-2xl font-bold text-blue-900">{jobs.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Available Positions</p>
                  <p className="text-2xl font-bold text-green-900">
                    {jobs.reduce((sum, job) => sum + Math.max(0, job.volunteers_needed - (job.volunteers_assigned || 0)), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Urgent Needs</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {jobs.filter(job => job.urgency === 'urgent').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-40"
                disabled={categoriesLoading}
              >
                <option value="all">All Categories</option>
                {categoriesLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  categories.map((category) => (
                    <option 
                      key={category.id} 
                      value={category.category_name}
                      title={category.description || ''}
                    >
                      {category.category_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <input
                type="text"
                placeholder="Enter zipcode"
                value={filters.zipcode}
                onChange={(e) => handleFilterChange('zipcode', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-32"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Distance</label>
              <select
                value={filters.distance}
                onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!filters.zipcode}
              >
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search opportunities, skills, organizations..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600">Try adjusting your search filters or check back later for new opportunities</p>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {jobs.length} Volunteer Opportunities
                </h2>
                <p className="text-sm text-gray-600">
                  {filters.zipcode && `Within ${filters.distance} miles of ${filters.zipcode}`}
                  {filters.category !== 'all' && ` • ${filters.category}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Sort by:</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>Most Urgent</option>
                  <option>Nearest</option>
                  <option>Most Recent</option>
                  <option>Most Positions</option>
                </select>
              </div>
            </div>

            {/* Job Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const fullyBooked = isJobFullyBooked(job);
                
                return (
                  <div 
                    key={job.id} 
                    className={`bg-white rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300 ${
                      fullyBooked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}>
                          {job.urgency} priority
                        </div>
                        <div className="flex items-center space-x-2">
                          {fullyBooked && (
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-medium">
                              FULL
                            </span>
                          )}
                          <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{job.description}</p>

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{job.city}, {job.state}</span>
                          {job.distance_miles && (
                            <span className="ml-2 text-blue-600 font-medium">
                              ({Math.round(job.distance_miles)} mi)
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {fullyBooked ? 'Fully staffed' : `${job.positions_remaining || job.volunteers_needed} positions available`}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{job.time_commitment || 'Flexible schedule'}</span>
                        </div>

                        {job.skills_needed && job.skills_needed.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {job.skills_needed.slice(0, 2).map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {job.skills_needed.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{job.skills_needed.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Volunteers</span>
                          <span>{job.volunteers_assigned || 0}/{job.volunteers_needed}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              fullyBooked ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ 
                              width: `${Math.min(((job.volunteers_assigned || 0) / job.volunteers_needed) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/jobs/${job.id}`}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button 
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Save for later"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">Ready to Make a Difference?</h3>
                <p className="mb-6 opacity-90">
                  Join our community of volunteers and help create positive change in your area.
                </p>
                <button 
                  onClick={() => window.location.href = '/volunteer-signup'}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Register as a Volunteer
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobBoard;