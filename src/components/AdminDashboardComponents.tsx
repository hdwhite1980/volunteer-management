// src/components/AdminDashboardAssignments.tsx
// Enhanced Admin Dashboard with Job Assignment Features
import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Calendar, CheckCircle, Clock, AlertCircle, 
  UserPlus, Send, Eye, Edit, Trash2, Plus, Search, Filter,
  MapPin, Star, Badge, User, Phone, Mail
} from 'lucide-react';

interface Volunteer {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
  experience_level: string;
  categories_interested: string[];
  skills: string[];
  total_assignments?: number;
  completed_assignments?: number;
  total_hours?: number;
  average_rating?: number;
}

interface Job {
  id: number;
  title: string;
  category: string;
  city: string;
  state: string;
  volunteers_needed: number;
  status: string;
  start_date: string;
  end_date: string;
  total_assigned: number;
  spots_remaining: number;
  assigned_volunteers: any[];
}

interface Assignment {
  id: number;
  volunteer: {
    id: number;
    username: string;
    name: string;
    email: string;
    phone?: string;
  };
  job: {
    id: number;
    title: string;
    category: string;
    location: string;
  };
  status: string;
  assigned_at: string;
}

const AdminDashboardAssignments = () => {
  const [activeTab, setActiveTab] = useState('volunteers');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Search and filter states
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchVolunteers(),
        fetchJobs(),
        fetchAssignments(),
        fetchApplications()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteer-signup');
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data.volunteers || []);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/volunteer-assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/job-applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleAssignVolunteer = async (volunteerId: number, jobId: number) => {
    try {
      const response = await fetch('/api/volunteer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: volunteerId,
          job_id: jobId,
          assigned_by: 1 // Replace with actual admin user ID
        })
      });

      if (response.ok) {
        alert('Volunteer assigned successfully!');
        fetchData(); // Refresh data
        setShowAssignModal(false);
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error assigning volunteer');
    }
  };

  const handleAcceptApplication = async (applicationId: number, jobId: number, volunteerEmail: string) => {
    try {
      // First update application status
      await fetch(`/api/job-applications?id=${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });

      // Then create assignment
      const response = await fetch('/api/volunteer-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_email: volunteerEmail,
          job_id: jobId,
          application_id: applicationId,
          assigned_by: 1 // Replace with actual admin user ID
        })
      });

      if (response.ok) {
        alert('Application accepted and volunteer assigned!');
        fetchData();
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error accepting application');
    }
  };

  const updateAssignmentStatus = async (assignmentId: number, status: string) => {
    try {
      const response = await fetch(`/api/volunteer-assignments?id=${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`Assignment status updated to ${status}`);
        fetchAssignments();
      } else {
        const result = await response.json();
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error updating assignment status');
    }
  };

  const filteredVolunteers = volunteers.filter(volunteer =>
    volunteer.first_name.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
    volunteer.last_name.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
    volunteer.email.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
    volunteer.username.toLowerCase().includes(volunteerSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.category.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredAssignments = assignments.filter(assignment =>
    statusFilter === 'all' || assignment.status === statusFilter
  );

  const pendingApplications = applications.filter(app => app.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard - Volunteer Management</h1>
          <p className="text-gray-600">Manage volunteers, jobs, and assignments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Volunteers</p>
                <p className="text-2xl font-bold text-gray-900">{volunteers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status === 'active').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">{pendingApplications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'volunteers', label: 'Volunteers', icon: Users },
                { key: 'jobs', label: 'Jobs', icon: Briefcase },
                { key: 'assignments', label: 'Assignments', icon: CheckCircle },
                { key: 'applications', label: 'Applications', icon: Clock }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Volunteers Tab */}
            {activeTab === 'volunteers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search volunteers..."
                        value={volunteerSearch}
                        onChange={(e) => setVolunteerSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Assign to Job
                  </button>
                </div>

                <div className="grid gap-4">
                  {filteredVolunteers.map((volunteer) => (
                    <div key={volunteer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {volunteer.first_name} {volunteer.last_name}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              ID: {volunteer.username}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              volunteer.experience_level === 'expert' ? 'bg-purple-100 text-purple-800' :
                              volunteer.experience_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {volunteer.experience_level}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {volunteer.email}
                            </div>
                            {volunteer.phone && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {volunteer.phone}
                              </div>
                            )}
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {volunteer.city}, {volunteer.state}
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {volunteer.total_assignments || 0} assignments
                            </div>
                          </div>

                          {volunteer.categories_interested && volunteer.categories_interested.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-500">Categories: </span>
                              {volunteer.categories_interested.map((cat, index) => (
                                <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mr-1">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedVolunteer(volunteer);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {job.category}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.spots_remaining > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {job.spots_remaining} spots left
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.city}, {job.state}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {job.volunteers_needed} needed
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {job.total_assigned} assigned
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(job.start_date).toLocaleDateString()}
                            </div>
                          </div>

                          {job.assigned_volunteers && job.assigned_volunteers.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm text-gray-500">Assigned volunteers: </span>
                              {job.assigned_volunteers.slice(0, 3).map((vol, index) => (
                                <span key={index} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mr-1">
                                  {vol.username}
                                </span>
                              ))}
                              {job.assigned_volunteers.length > 3 && (
                                <span className="text-xs text-gray-500">+{job.assigned_volunteers.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="assigned">Assigned</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredAssignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{assignment.volunteer.name}</h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {assignment.volunteer.username}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              assignment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              assignment.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {assignment.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Job:</span> {assignment.job.title}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {assignment.job.category}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {assignment.job.location}
                            </div>
                            <div>
                              <span className="font-medium">Assigned:</span> {new Date(assignment.assigned_at).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {assignment.volunteer.email}
                            </div>
                            {assignment.volunteer.phone && (
                              <div>
                                <span className="font-medium">Phone:</span> {assignment.volunteer.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {assignment.status === 'assigned' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'confirmed')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Confirm
                            </button>
                          )}
                          {assignment.status === 'confirmed' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Applications</h3>
                </div>

                <div className="grid gap-4">
                  {pendingApplications.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{application.volunteer_name}</h3>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Pending Review
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Job:</span> {application.job_title}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {application.job_category}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {application.job_city}, {application.job_state}
                            </div>
                            <div>
                              <span className="font-medium">Applied:</span> {new Date(application.applied_at).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {application.email}
                            </div>
                            {application.phone && (
                              <div>
                                <span className="font-medium">Phone:</span> {application.phone}
                              </div>
                            )}
                          </div>

                          {application.cover_letter && (
                            <div className="mb-3">
                              <span className="font-medium text-sm text-gray-600">Cover Letter:</span>
                              <p className="text-sm text-gray-700 mt-1">{application.cover_letter}</p>
                            </div>
                          )}

                          {application.experience && (
                            <div className="mb-3">
                              <span className="font-medium text-sm text-gray-600">Experience:</span>
                              <p className="text-sm text-gray-700 mt-1">{application.experience}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptApplication(application.id, application.job_id, application.email)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Accept & Assign
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await fetch(`/api/job-applications?id=${application.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'rejected' })
                                });
                                alert('Application rejected');
                                fetchApplications();
                              } catch (error) {
                                alert('Error rejecting application');
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                          <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pendingApplications.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Applications</h3>
                    <p className="text-gray-600">All applications have been processed</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {selectedVolunteer ? `Assign ${selectedVolunteer.first_name} ${selectedVolunteer.last_name} to Job` : 
                 selectedJob ? `Assign Volunteer to ${selectedJob.title}` : 
                 'Create New Assignment'}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Volunteer Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedVolunteer ? 'Selected Volunteer' : 'Choose Volunteer'}
                  </h3>
                  
                  {selectedVolunteer ? (
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold">{selectedVolunteer.first_name} {selectedVolunteer.last_name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {selectedVolunteer.username}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedVolunteer.email}</p>
                      <p className="text-sm text-gray-600">{selectedVolunteer.city}, {selectedVolunteer.state}</p>
                      <p className="text-sm text-gray-600">Experience: {selectedVolunteer.experience_level}</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {volunteers.map((volunteer) => (
                        <button
                          key={volunteer.id}
                          onClick={() => setSelectedVolunteer(volunteer)}
                          className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{volunteer.first_name} {volunteer.last_name}</h4>
                              <p className="text-sm text-gray-600">{volunteer.username} • {volunteer.experience_level}</p>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedJob ? 'Selected Job' : 'Choose Job'}
                  </h3>
                  
                  {selectedJob ? (
                    <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold">{selectedJob.title}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {selectedJob.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedJob.city}, {selectedJob.state}</p>
                      <p className="text-sm text-gray-600">{selectedJob.spots_remaining} spots remaining</p>
                      <p className="text-sm text-gray-600">Start: {new Date(selectedJob.start_date).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {jobs.filter(job => job.spots_remaining > 0).map((job) => (
                        <button
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{job.title}</h4>
                              <p className="text-sm text-gray-600">{job.category} • {job.spots_remaining} spots left</p>
                            </div>
                            <Plus className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedVolunteer(null);
                    setSelectedJob(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedVolunteer && selectedJob) {
                      handleAssignVolunteer(selectedVolunteer.id, selectedJob.id);
                    }
                  }}
                  disabled={!selectedVolunteer || !selectedJob}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardAssignments;