import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Calendar, Star, Mail, Phone, AlertCircle, CheckCircle, Heart, ArrowLeft, Edit, Trash2, Eye, Send } from 'lucide-react';

const JobDetails = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    volunteer_email: '',
    message: '',
    preferred_start_date: '',
    availability_notes: ''
  });
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [applicationError, setApplicationError] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();

      if (response.ok) {
        setJob(data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch job details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmit = async () => {
    setApplicationLoading(true);
    setApplicationError('');

    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          volunteer_email: applicationData.volunteer_email,
          message: applicationData.message,
          preferred_start_date: applicationData.preferred_start_date,
          availability_notes: applicationData.availability_notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setApplicationSuccess(data);
        setShowApplyModal(false);
        // Refresh job details to update positions remaining
        fetchJobDetails();
      } else {
        setApplicationError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setApplicationError('Network error. Please try again.');
      console.error('Application submission error:', err);
    } finally {
      setApplicationLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/job-board'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Job Board
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(job.urgency)}`}>
                  {job.urgency?.toUpperCase() || 'NORMAL'}
                </span>
              </div>
              <p className="text-xl text-blue-600 font-medium">{job.organization}</p>
            </div>
            
            {job.can_edit && (
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = `/jobs/${job.id}/edit`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Info Bar */}
          <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{job.city}, {job.state} {job.zipcode}</span>
              {job.distance_miles && (
                <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {job.distance_miles.toFixed(1)} mi away
                </span>
              )}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>
                {job.positions_remaining > 0 
                  ? `${job.positions_remaining} position${job.positions_remaining > 1 ? 's' : ''} available`
                  : 'All positions filled'
                }
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{job.time_commitment || 'Flexible schedule'}</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              <span>Posted {formatDate(job.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Opportunity</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            </div>

            {/* Requirements & Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements & Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Basic Requirements</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Age requirement: {job.age_requirement || 'All ages'}</li>
                    <li>• Background check: {job.background_check_required ? 'Required' : 'Not required'}</li>
                    <li>• Transportation: {job.transportation_provided ? 'Provided' : 'Must provide own'}</li>
                    {job.duration_hours && <li>• Time commitment: {job.duration_hours} hours per session</li>}
                  </ul>
                </div>
                
                {job.skills_needed && job.skills_needed.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_needed.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule */}
              {(job.start_date || job.end_date || job.preferred_times) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Schedule</h4>
                  <div className="space-y-2 text-gray-600">
                    {job.start_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Starts: {formatDate(job.start_date)}</span>
                      </div>
                    )}
                    {job.end_date && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Ends: {formatDate(job.end_date)}</span>
                      </div>
                    )}
                    {job.preferred_times && (
                      <div className="flex items-start">
                        <Clock className="w-4 h-4 mr-2 mt-0.5" />
                        <span>{job.preferred_times}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                <div className="grid grid-cols-2 gap-3">
                  {job.training_provided && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Training provided</span>
                    </div>
                  )}
                  {job.meal_provided && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Meals provided</span>
                    </div>
                  )}
                  {job.transportation_provided && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Transportation provided</span>
                    </div>
                  )}
                  {job.stipend_amount && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">${job.stipend_amount} stipend</span>
                    </div>
                  )}
                  {job.remote_possible && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Remote possible</span>
                    </div>
                  )}
                  {job.flexible_schedule && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Flexible scheduling</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Users className="w-5 h-5 mr-3 text-blue-600" />
                  <span className="font-medium">{job.contact_name}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-blue-600" />
                  <a href={`mailto:${job.contact_email}`} className="text-blue-600 hover:underline">
                    {job.contact_email}
                  </a>
                </div>
                {job.contact_phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="w-5 h-5 mr-3 text-blue-600" />
                    <a href={`tel:${job.contact_phone}`} className="text-blue-600 hover:underline">
                      {job.contact_phone}
                    </a>
                  </div>
                )}
                {job.address && (
                  <div className="flex items-start text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600 mt-0.5" />
                    <div>
                      <div>{job.address}</div>
                      <div>{job.city}, {job.state} {job.zipcode}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <div className="text-center">
                {job.positions_remaining > 0 ? (
                  <>
                    <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Help?</h3>
                    <p className="text-gray-600 mb-6">
                      Join {job.organization} in making a difference in your community.
                    </p>
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Apply Now
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Quick application - takes less than 2 minutes
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Position Filled</h3>
                    <p className="text-gray-600 mb-6">
                      All volunteer positions for this opportunity have been filled.
                    </p>
                    <button
                      onClick={() => window.location.href = '/job-board'}
                      className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Browse Other Opportunities
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Facts</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{job.category || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volunteers needed:</span>
                  <span className="font-medium">{job.volunteers_needed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Applications:</span>
                  <span className="font-medium">{job.pending_applications || 0} pending</span>
                </div>
                {job.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">{formatDate(job.expires_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share This Opportunity</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Share on Facebook
                </button>
                <button className="w-full px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm">
                  Share on Twitter
                </button>
                <button 
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {applicationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <p className="text-red-800">{applicationError}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={applicationData.volunteer_email}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, volunteer_email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use this to contact you about your application
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter/Message
                  </label>
                  <textarea
                    rows={4}
                    value={applicationData.message}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us why you're interested in this opportunity and any relevant experience you have..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={applicationData.preferred_start_date}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, preferred_start_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability Notes
                  </label>
                  <textarea
                    rows={3}
                    value={applicationData.availability_notes}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, availability_notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Let us know your availability and any scheduling constraints..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplicationSubmit}
                  disabled={applicationLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {applicationLoading ? (
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {applicationSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for applying! The organization will review your application and contact you soon.
            </p>
            <button
              onClick={() => setApplicationSuccess(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;