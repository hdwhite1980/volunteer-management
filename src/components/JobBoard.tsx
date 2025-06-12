import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Users, Calendar, Star, Mail, Phone, AlertCircle, 
  CheckCircle, Heart, ArrowLeft, Edit, Trash2, Eye, Send, User, 
  Badge, Search, Filter, Home, Zap, Target, Flame, TrendingUp,
  ChevronDown, ChevronUp, X, Plus, UserPlus, Navigation, Sparkles,
  Award, Shield, Rocket, Globe, UserCheck, IdCard
} from 'lucide-react';

const JobBoard = () => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "🚨 Emergency Food Distribution",
      category: "Emergency Services",
      description: "Urgent need for volunteers to help distribute food to families affected by recent flooding. We need compassionate individuals who can work quickly and efficiently.",
      city: "Norfolk",
      state: "VA",
      zipcode: "23510",
      volunteers_needed: 15,
      volunteers_assigned: 12,
      urgency: "urgent",
      start_date: "2024-12-15",
      end_date: "2024-12-20",
      time_commitment: "4-6 hours",
      duration_hours: 5,
      skills_needed: ["Physical stamina", "Team work", "Communication"],
      experience_level: "beginner",
      age_requirement: "16+",
      contact_name: "Sarah Johnson",
      contact_email: "sarah@vceg.org",
      contact_phone: "(757) 555-0123",
      status: "active",
      created_at: "2024-12-10",
      expires_at: "2024-12-25",
      positions_remaining: 3
    },
    {
      id: 2,
      title: "🌟 Community Health Fair Setup",
      category: "Health",
      description: "Help set up and coordinate a community health fair providing free health screenings and wellness education to underserved populations.",
      city: "Virginia Beach",
      state: "VA",
      zipcode: "23451",
      volunteers_needed: 8,
      volunteers_assigned: 3,
      urgency: "high",
      start_date: "2024-12-18",
      end_date: "2024-12-18",
      time_commitment: "Full day",
      duration_hours: 8,
      skills_needed: ["Organization", "Customer service", "Health knowledge"],
      experience_level: "some",
      age_requirement: "18+",
      contact_name: "Dr. Michael Chen",
      contact_email: "mchen@healthfair.org",
      contact_phone: "(757) 555-0456",
      status: "active",
      created_at: "2024-12-08",
      expires_at: "2024-12-18",
      positions_remaining: 5
    },
    {
      id: 3,
      title: "🎓 Youth Mentorship Program",
      category: "Education",
      description: "Mentor high school students in STEM subjects and help them prepare for college applications. Make a lasting impact on young minds!",
      city: "Chesapeake",
      state: "VA",
      zipcode: "23320",
      volunteers_needed: 12,
      volunteers_assigned: 8,
      urgency: "medium",
      start_date: "2024-12-20",
      end_date: "2025-03-20",
      time_commitment: "2 hours/week",
      duration_hours: 2,
      skills_needed: ["STEM knowledge", "Mentoring", "Patience"],
      experience_level: "experienced",
      age_requirement: "21+",
      contact_name: "Lisa Rodriguez",
      contact_email: "lisa@youthmentors.org",
      contact_phone: "(757) 555-0789",
      status: "active",
      created_at: "2024-12-05",
      expires_at: "2025-01-15",
      positions_remaining: 4
    }
  ]);

  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [showVolunteerIdLogin, setShowVolunteerIdLogin] = useState(false);
  const [volunteerId, setVolunteerId] = useState('');
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplication, setShowApplication] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    urgency: 'all',
    search: ''
  });

  const mockVolunteerLookup = (id) => {
    const mockProfiles = {
      'jd2024': {
        id: 'jd2024',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '(757) 555-1234',
        experience: 'experienced',
        skills: ['Emergency Response', 'First Aid', 'Leadership'],
        verified: true,
        hours_completed: 156,
        rating: 4.9
      },
      'sm2023': {
        id: 'sm2023',
        name: 'Sarah Miller',
        email: 'sarah.m@email.com',
        phone: '(757) 555-5678',
        experience: 'expert',
        skills: ['Medical Support', 'Training', 'Coordination'],
        verified: true,
        hours_completed: 284,
        rating: 5.0
      }
    };
    
    return mockProfiles[id.toLowerCase()] || null;
  };

  const handleVolunteerIdSubmit = () => {
    if (volunteerId.trim()) {
      const profile = mockVolunteerLookup(volunteerId.trim());
      setVolunteerProfile(profile);
      if (!profile) {
        alert('Volunteer ID not found. You can still apply, but consider registering for faster applications!');
      }
    }
  };

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
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
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const urgentJobs = filteredJobs.filter(job => job.urgency === 'urgent' && job.positions_remaining > 0);
  const regularJobs = filteredJobs.filter(job => job.urgency !== 'urgent');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header with Volunteer ID Login */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                  <Rocket className="w-8 h-8 mr-3 text-yellow-400" />
                  Volunteer Opportunities
                </h1>
                <p className="text-purple-100 text-lg">Make a difference in your community today!</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Volunteer ID Quick Login */}
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="flex items-center space-x-3">
                    <IdCard className="w-6 h-6 text-yellow-400" />
                    <div>
                      <div className="text-white font-medium">Have a Volunteer ID?</div>
                      <button
                        onClick={() => setShowVolunteerIdLogin(true)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                      >
                        Login for faster applications →
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
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
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Welcome back, {volunteerProfile.name}!</div>
                    <div className="text-green-100 text-sm">
                      ID: {volunteerProfile.id} • {volunteerProfile.hours_completed} hours completed • ⭐ {volunteerProfile.rating} rating
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setVolunteerProfile(null);
                    setVolunteerId('');
                  }}
                  className="text-green-100 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" />
                <input
                  type="text"
                  placeholder="Search opportunities by title, location, or skills..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {/* Urgent Jobs Section */}
          {urgentJobs.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl flex items-center space-x-3 shadow-lg">
                  <Flame className="w-6 h-6 animate-pulse" />
                  <span className="text-xl font-bold">🚨 URGENT OPPORTUNITIES</span>
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {urgentJobs.map((job) => {
                  const urgencyStyles = getUrgencyStyles(job.urgency);
                  return (
                    <div key={job.id} className={`bg-white rounded-3xl shadow-2xl ${urgencyStyles.glow} hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden border-2 border-red-200`}>
                      {/* Urgent Banner */}
                      <div className={`${urgencyStyles.bg} text-white p-4 text-center ${urgencyStyles.pulse}`}>
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
                            <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                            <span className="font-medium">{job.city}, {job.state}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Users className="w-5 h-5 mr-3 text-green-500" />
                            <span className="font-bold text-red-600">
                              Only {job.positions_remaining} of {job.volunteers_needed} spots left!
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-5 h-5 mr-3 text-purple-500" />
                            <span>{job.time_commitment}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Filled: {job.volunteers_needed - job.positions_remaining}</span>
                            <span>Remaining: {job.positions_remaining}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${((job.volunteers_needed - job.positions_remaining) / job.volunteers_needed) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowApplication(true);
                            }}
                            className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Apply Now
                          </button>
                          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-colors">
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
                          <span>{job.city}, {job.state}</span>
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

                        {job.skills_needed && (
                          <div className="flex flex-wrap gap-2">
                            {job.skills_needed.slice(0, 3).map((skill, index) => (
                              <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              job.positions_remaining === 0 ? 'bg-red-500' :
                              job.positions_remaining <= 2 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${((job.volunteers_needed - job.positions_remaining) / job.volunteers_needed) * 100}%` }}
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
                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Volunteer ID Login Modal */}
      {showVolunteerIdLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IdCard className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Volunteer Login</h2>
                    <p className="text-blue-100">Enter your Volunteer ID for faster applications</p>
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
                  Volunteer ID
                </label>
                <input
                  type="text"
                  value={volunteerId}
                  onChange={(e) => setVolunteerId(e.target.value)}
                  placeholder="e.g., jd2024, sm2023"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleVolunteerIdSubmit()}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Benefits of using your Volunteer ID:</p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Pre-filled application forms</li>
                      <li>• Track your volunteer hours</li>
                      <li>• Access to exclusive opportunities</li>
                      <li>• Priority application processing</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-gray-600 text-sm">
                  Try demo IDs: <span className="font-mono bg-gray-100 px-2 py-1 rounded">jd2024</span> or <span className="font-mono bg-gray-100 px-2 py-1 rounded">sm2023</span>
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleVolunteerIdSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowVolunteerIdLogin(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>
              </div>
              
              <div className="text-center mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Don't have a Volunteer ID? Register here →
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-800">ID:</span>
                      <span className="ml-2 text-green-700">{volunteerProfile.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Name:</span>
                      <span className="ml-2 text-green-700">{volunteerProfile.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Experience:</span>
                      <span className="ml-2 text-green-700 capitalize">{volunteerProfile.experience}</span>
                    </div>
                    <div>
                      <span className="font-medium text-green-800">Hours:</span>
                      <span className="ml-2 text-green-700">{volunteerProfile.hours_completed} completed</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-green-800">Skills:</span>
                      <span className="ml-2 text-green-700">{volunteerProfile.skills.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <IdCard className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h3 className="font-bold text-yellow-800">Quick Login Available</h3>
                      <p className="text-yellow-700 text-sm">Enter your Volunteer ID to auto-fill this form</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={volunteerId}
                      onChange={(e) => setVolunteerId(e.target.value)}
                      placeholder="Enter Volunteer ID (e.g., jd2024)"
                      className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleVolunteerIdSubmit()}
                    />
                    <button
                      onClick={handleVolunteerIdSubmit}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                    >
                      Load Profile
                    </button>
                  </div>
                </div>
              )}

              {/* Application Form */}
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      defaultValue={volunteerProfile?.name || ''}
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
                      defaultValue={volunteerProfile?.email || ''}
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
                      defaultValue={volunteerProfile?.phone || ''}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      defaultValue={volunteerProfile?.experience || ''}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="Tell us about your motivation and relevant experience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Skills or Comments
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="Any additional skills, certifications, or special requirements..."
                  />
                </div>

                {/* Skills Match Display */}
                {volunteerProfile && selectedJob.skills_needed && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">Skills Match Analysis</h4>
                    <div className="space-y-2">
                      {selectedJob.skills_needed.map((skill, index) => {
                        const hasSkill = volunteerProfile.skills.some(userSkill => 
                          userSkill.toLowerCase().includes(skill.toLowerCase()) || 
                          skill.toLowerCase().includes(userSkill.toLowerCase())
                        );
                        return (
                          <div key={index} className="flex items-center space-x-2">
                            {hasSkill ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                            )}
                            <span className={hasSkill ? 'text-green-700 font-medium' : 'text-gray-600'}>
                              {skill}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5 mr-2 inline" />
                    Submit Application
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
};

export default JobBoard;