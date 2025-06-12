import React from 'react';
import { 
  Users, MapPin, Clock, Phone, Mail, Calendar, Star, Eye, 
  CheckCircle, X, User, Tag, Settings, AlertCircle, Briefcase,
  FileText
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

// Volunteer Card Component
export const VolunteerCard = ({ 
  volunteer, 
  onViewDetails 
}: { 
  volunteer: VolunteerRegistration;
  onViewDetails: (volunteer: VolunteerRegistration) => void;
}) => (
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
          onClick={() => onViewDetails(volunteer)}
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

// Job Card Component
export const JobCard = ({ job }: { job: Job }) => {
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

// Application Card Component
export const ApplicationCard = ({ 
  application, 
  onViewDetails,
  onUpdateStatus 
}: { 
  application: JobApplication;
  onViewDetails: (application: JobApplication) => void;
  onUpdateStatus: (applicationId: number, status: string, feedback?: string) => void;
}) => {
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
            onClick={() => onViewDetails(application)}
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
            onClick={() => onUpdateStatus(application.id, 'accepted')}
            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Accept
          </button>
          <button
            onClick={() => onUpdateStatus(application.id, 'rejected')}
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

// Detail Modal Component
export const DetailModal = ({ 
  volunteer, 
  onClose 
}: { 
  volunteer: VolunteerRegistration | null;
  onClose: () => void;
}) => {
  if (!volunteer) return null;

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
                  {volunteer.first_name} {volunteer.last_name}
                </h2>
                <p className="text-gray-600">{volunteer.email}</p>
                <p className="text-sm font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded mt-1">
                  Username: @{volunteer.username}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
                <p className="text-gray-900">{volunteer.email}</p>
              </div>
              {volunteer.phone && (
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{volunteer.phone}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Address:</span>
                <p className="text-gray-900">
                  {volunteer.address}<br />
                  {volunteer.city}, {volunteer.state} {volunteer.zipcode}
                </p>
              </div>
              {volunteer.birth_date && (
                <div>
                  <span className="font-medium text-gray-700">Birth Date:</span>
                  <p className="text-gray-900">{new Date(volunteer.birth_date).toLocaleDateString()}</p>
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
                <p className="text-gray-900">{volunteer.emergency_contact_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-900">{volunteer.emergency_contact_phone}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Relationship:</span>
                <p className="text-gray-900">{volunteer.emergency_contact_relationship}</p>
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
                  volunteer.experience_level === 'expert' ? 'bg-purple-100 text-purple-800' :
                  volunteer.experience_level === 'experienced' ? 'bg-blue-100 text-blue-800' :
                  volunteer.experience_level === 'some' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {volunteer.experience_level}
                </span>
              </div>
              
              {volunteer.skills && volunteer.skills.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700 block mb-2">Skills:</span>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {volunteer.categories_interested && volunteer.categories_interested.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700 block mb-2">Categories of Interest:</span>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.categories_interested.map((category, index) => (
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
                <p className="text-gray-900">{volunteer.max_distance || 25} miles</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Transportation:</span>
                <p className="text-gray-900">{volunteer.transportation}</p>
              </div>
            </div>
            
            {volunteer.availability && (
              <div className="mt-4">
                <span className="font-medium text-gray-700 block mb-2">Availability:</span>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(volunteer.availability, null, 2)}
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
                  {volunteer.background_check_consent ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 mr-2">Email Notifications:</span>
                  {volunteer.email_notifications ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 mr-2">SMS Notifications:</span>
                  {volunteer.sms_notifications ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              {volunteer.notes && (
                <div>
                  <span className="font-medium text-gray-700 block mb-2">Notes:</span>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700">{volunteer.notes}</p>
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
                  volunteer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {volunteer.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Registered:</span>
                <p className="text-gray-900">{new Date(volunteer.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <p className="text-gray-900">#{volunteer.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Application Details Modal Component
export const ApplicationDetailsModal = ({ 
  application, 
  onClose,
  onUpdateStatus 
}: { 
  application: JobApplication | null;
  onClose: () => void;
  onUpdateStatus: (applicationId: number, status: string, feedback?: string) => void;
}) => {
  if (!application) return null;

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
                  {application.first_name} {application.last_name}
                </h2>
                <p className="text-gray-600">{application.email}</p>
                <p className="text-blue-600 font-medium">{application.job_title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
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
                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {application.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Applied:</span>
                <p className="text-gray-900">{new Date(application.applied_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-900">{application.phone || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Job Category:</span>
                <p className="text-gray-900">{application.job_category}</p>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          {application.message && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{application.message}</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {application.feedback && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Feedback</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800">{application.feedback}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {application.status === 'pending' && (
            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => onUpdateStatus(application.id, 'accepted')}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Accept Application
              </button>
              <button
                onClick={() => onUpdateStatus(application.id, 'rejected')}
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