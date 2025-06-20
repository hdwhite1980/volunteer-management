// src/components/AdminDashboardComponents.tsx - IMPROVED Mobile-Responsive Version
import React, { useState } from 'react';
import { 
  MapPin, Clock, Phone, Mail, Calendar, Star, Eye, Edit, Trash2, 
  UserCheck, AlertCircle, CheckCircle, X, User, Building2, Tag,
  Users, Briefcase, Send, MessageSquare, Award, ExternalLink
} from 'lucide-react';

// Interfaces
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

// VolunteerCard Component - IMPROVED
export const VolunteerCard: React.FC<{
  volunteer: VolunteerRegistration;
  onViewDetails: (volunteer: VolunteerRegistration) => void;
}> = ({ volunteer, onViewDetails }) => {
  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'experienced': return 'bg-blue-100 text-blue-800';
      case 'some': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 hover:shadow-md transition-shadow w-full">
      {/* Header Section */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-lg truncate">
              {volunteer.first_name} {volunteer.last_name}
            </h3>
            {volunteer.username && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium mt-1">
                ID: {volunteer.username}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1 ml-2">
            <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
              volunteer.status === 'active' ? 'bg-green-100 text-green-800' :
              volunteer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {volunteer.status}
            </span>
            
            <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getExperienceBadgeColor(volunteer.experience_level)}`}>
              {volunteer.experience_level}
            </span>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
            <span className="break-all text-xs sm:text-sm">{volunteer.email}</span>
          </div>
          {volunteer.phone && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span>{volunteer.phone}</span>
            </div>
          )}
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
            <span>{volunteer.city}, {volunteer.state} {volunteer.zipcode}</span>
          </div>
        </div>
      </div>

      {/* Skills & Categories */}
      <div className="mb-3 sm:mb-4 space-y-2">
        {volunteer.skills && volunteer.skills.length > 0 && (
          <div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Skills: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {volunteer.skills.slice(0, 2).map((skill, index) => (
                <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                  {skill}
                </span>
              ))}
              {volunteer.skills.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  +{volunteer.skills.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
        
        {volunteer.categories_interested && volunteer.categories_interested.length > 0 && (
          <div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Interested: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {volunteer.categories_interested.slice(0, 1).map((category, index) => (
                <span key={index} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                  {category}
                </span>
              ))}
              {volunteer.categories_interested.length > 1 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  +{volunteer.categories_interested.length - 1}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional Info - Mobile Condensed */}
      <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4 text-xs sm:text-sm">
        <div>
          <span className="font-medium text-gray-700">Distance:</span>
          <p className="text-gray-600">{volunteer.max_distance || 25}mi</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Transport:</span>
          <p className="text-gray-600 capitalize">{volunteer.transportation || 'Own'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Background:</span>
          <p className={volunteer.background_check_consent ? 'text-green-600' : 'text-red-600'}>
            {volunteer.background_check_consent ? 'Yes' : 'No'}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Registered:</span>
          <p className="text-gray-600">{new Date(volunteer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Action Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
        <div className="flex items-center justify-center sm:justify-start space-x-3">
          {volunteer.email_notifications && (
            <div title="Email notifications enabled">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
          )}
          {volunteer.sms_notifications && (
            <div title="SMS notifications enabled">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            </div>
          )}
          {volunteer.background_check_consent && (
            <div title="Background check consented">
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
            </div>
          )}
        </div>
        
        <button
          onClick={() => onViewDetails(volunteer)}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
};

// JobCard Component - IMPROVED
export const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'filled': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const spotsRemaining = job.volunteers_needed - job.volunteers_assigned;

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 hover:shadow-md transition-shadow w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-lg mb-2 line-clamp-2">{job.title}</h3>
          <div className="space-y-1">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{job.category}</span>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{job.city}, {job.state}</span>
            </div>
          </div>
        </div>
        
        <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ml-2 ${getStatusColor(job.status)}`}>
          {job.status}
        </span>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{job.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs sm:text-sm">
        <div>
          <span className="font-medium text-gray-700">Needed:</span>
          <p className="text-gray-900 font-semibold">{job.volunteers_needed}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Assigned:</span>
          <p className="text-gray-900 font-semibold">{job.volunteers_assigned}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Remaining:</span>
          <p className={`font-semibold ${spotsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {spotsRemaining}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Start:</span>
          <p className="text-gray-600">{new Date(job.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
        <div className="text-xs text-gray-500 text-center sm:text-left">
          Created {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        
        <div className="flex space-x-2">
          <button className="flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none text-xs sm:text-sm">
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>View</span>
          </button>
          <button className="flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none text-xs sm:text-sm">
            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ApplicationCard Component - IMPROVED
export const ApplicationCard: React.FC<{
  application: JobApplication;
  onViewDetails: (application: JobApplication) => void;
  onUpdateStatus: (id: number, status: string, feedback?: string) => void;
}> = ({ application, onViewDetails, onUpdateStatus }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-600';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 hover:shadow-md transition-shadow w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-lg mb-1 truncate">
            {application.volunteer_name || `${application.first_name} ${application.last_name}`}
          </h3>
          <p className="text-blue-600 font-medium mb-2 text-xs sm:text-base line-clamp-1">{application.job_title}</p>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="break-all text-xs">{application.email}</span>
            </div>
            {application.phone && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span>{application.phone}</span>
              </div>
            )}
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{application.job_city}, {application.job_state}</span>
            </div>
          </div>
        </div>
        
        <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ml-2 ${getStatusColor(application.status)}`}>
          {application.status}
        </span>
      </div>

      {/* Message Preview */}
      {application.message && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{application.message}</p>
        </div>
      )}

      {/* Dates */}
      <div className="flex justify-between text-xs text-gray-500 mb-3">
        <span>Applied {new Date(application.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        {application.updated_at && (
          <span>Updated {new Date(application.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>

      {/* Feedback */}
      {application.feedback && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
          <span className="text-xs font-medium text-blue-800">Feedback:</span>
          <p className="text-xs text-blue-700 mt-1 line-clamp-2">{application.feedback}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <button
          onClick={() => onViewDetails(application)}
          className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full text-xs sm:text-sm"
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>View Details</span>
        </button>
        
        {application.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onUpdateStatus(application.id, 'accepted')}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors flex-1"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => onUpdateStatus(application.id, 'rejected')}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors flex-1"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// DetailModal Component - IMPROVED
export const DetailModal: React.FC<{
  volunteer: VolunteerRegistration | null;
  onClose: () => void;
}> = ({ volunteer, onClose }) => {
  if (!volunteer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-3 sm:p-6">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 truncate">
                {volunteer.first_name} {volunteer.last_name}
              </h2>
              {volunteer.username && (
                <p className="text-blue-600 font-medium text-sm sm:text-base">Volunteer ID: {volunteer.username}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Personal Information</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm sm:text-base text-gray-900 break-all">{volunteer.email}</p>
                </div>
                {volunteer.phone && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm sm:text-base text-gray-900">{volunteer.phone}</p>
                  </div>
                )}
                {volunteer.birth_date && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Birth Date</label>
                    <p className="text-sm sm:text-base text-gray-900">{new Date(volunteer.birth_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Address</label>
                  <p className="text-sm sm:text-base text-gray-900">
                    {volunteer.address}<br />
                    {volunteer.city}, {volunteer.state} {volunteer.zipcode}
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Experience Level</label>
                  <p className="text-sm sm:text-base text-gray-900 capitalize">{volunteer.experience_level}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Transportation</label>
                  <p className="text-sm sm:text-base text-gray-900 capitalize">{volunteer.transportation}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Max Distance</label>
                  <p className="text-sm sm:text-base text-gray-900">{volunteer.max_distance || 25} miles</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact & Preferences */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Emergency Contact</h3>
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm sm:text-base text-gray-900">{volunteer.emergency_contact_name}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm sm:text-base text-gray-900">{volunteer.emergency_contact_phone}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Relationship</label>
                  <p className="text-sm sm:text-base text-gray-900">{volunteer.emergency_contact_relationship}</p>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Preferences</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${volunteer.email_notifications ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm sm:text-base text-gray-900">Email Notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${volunteer.sms_notifications ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm sm:text-base text-gray-900">SMS Notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${volunteer.background_check_consent ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm sm:text-base text-gray-900">Background Check Consent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills & Categories */}
          <div className="mt-4 sm:mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              {volunteer.skills && volunteer.skills.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.map((skill, index) => (
                      <span key={index} className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {volunteer.categories_interested && volunteer.categories_interested.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Categories of Interest</h3>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.categories_interested.map((category, index) => (
                      <span key={index} className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs sm:text-sm rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          {volunteer.availability && (
            <div className="mt-4 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Availability</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-x-auto">
                <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(volunteer.availability, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Notes */}
          {volunteer.notes && (
            <div className="mt-4 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-700">{volunteer.notes}</p>
              </div>
            </div>
          )}

          {/* Registration Info */}
          <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  volunteer.status === 'active' ? 'bg-green-100 text-green-800' :
                  volunteer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {volunteer.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Registered:</span>
                <span className="ml-2 text-gray-600">{new Date(volunteer.created_at).toLocaleDateString()}</span>
              </div>
              {volunteer.updated_at && (
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="ml-2 text-gray-600">{new Date(volunteer.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors order-2 sm:order-1 text-sm sm:text-base"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 sm:order-2 text-sm sm:text-base">
              Edit Volunteer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ApplicationDetailsModal Component - IMPROVED
export const ApplicationDetailsModal: React.FC<{
  application: JobApplication | null;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string, feedback?: string) => void;
}> = ({ application, onClose, onUpdateStatus }) => {
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!application) return null;

  const handleStatusUpdate = async (status: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(application.id, status, feedback);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-3 sm:p-6">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">Application Details</h2>
              <p className="text-gray-600 text-xs sm:text-base truncate">
                {application.volunteer_name || `${application.first_name} ${application.last_name}`} • {application.job_title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Application Info */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Application Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Applicant</label>
                  <p className="text-sm sm:text-base text-gray-900">{application.volunteer_name || `${application.first_name} ${application.last_name}`}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm sm:text-base text-gray-900 break-all">{application.email}</p>
                </div>
                {application.phone && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm sm:text-base text-gray-900">{application.phone}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm rounded-full font-medium ${
                    application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {application.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Job Title</label>
                  <p className="text-sm sm:text-base text-gray-900">{application.job_title}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm sm:text-base text-gray-900">{application.job_category}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm sm:text-base text-gray-900">{application.job_city}, {application.job_state}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Applied Date</label>
                  <p className="text-sm sm:text-base text-gray-900">{new Date(application.applied_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Application Message */}
            {application.message && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Cover Letter / Message</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{application.message}</p>
                </div>
              </div>
            )}

            {/* Current Feedback */}
            {application.feedback && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Current Feedback</h3>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-700">{application.feedback}</p>
                </div>
              </div>
            )}

            {/* Status Update Section */}
            {application.status === 'pending' && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Update Application Status</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Feedback (optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      placeholder="Add feedback for the applicant..."
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleStatusUpdate('accepted')}
                      disabled={isUpdating}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{isUpdating ? 'Updating...' : 'Accept Application'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isUpdating}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{isUpdating ? 'Updating...' : 'Reject Application'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 sm:pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div>
                  <span className="font-medium">Applied:</span>
                  <span className="ml-2">{new Date(application.applied_at).toLocaleString()}</span>
                </div>
                {application.updated_at && (
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <span className="ml-2">{new Date(application.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors order-2 sm:order-1 text-xs sm:text-sm"
              >
                Close
              </button>
              
              {application.status !== 'pending' && (
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors order-1 sm:order-2 text-xs sm:text-sm">
                  Contact Applicant
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};