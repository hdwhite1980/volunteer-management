/* --------------------------------------------------------------------------
   src/components/JobDetails.tsx – Updated for new job application flow
   
   Changes:
   1. First handles volunteer signup when needed
   2. Then submits job application with volunteer_id
   3. Simplified application data structure
-------------------------------------------------------------------------- */
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Users,
  Calendar,
  Star,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  Heart,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Send
} from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */
interface JobDetailsProps {
  jobId: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  category: string;
  contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  city: string;
  state: string;
  zipcode: string;
  skills_needed?: string[] | string | null;
  time_commitment?: string;
  duration_hours?: number;
  volunteers_needed: number;
  age_requirement?: string;
  urgency: string;
  positions_remaining: number;
  posted_by_username?: string;
  can_edit?: boolean;
  [key: string]: any;
}

interface ApplicationData {
  volunteer_name: string;
  email: string;
  phone: string;
  cover_letter: string;
  experience: string;
}

interface VolunteerSignupData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  skills: string[];
  interests: string[];
  categories_interested: string[];
  experience_level: string;
  availability: any;
  transportation: string;
  background_check_consent: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

/* ─────────────────── helpers ─────────────────── */
/** Convert Postgres array literal or comma list to a clean string[] */
const normalizeSkills = (raw: Job['skills_needed']): string[] => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  return raw
    .toString()
    .replace(/^[{\[]|[}\]]$/g, '') // strip { } if postgres literal or [ ]
    .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/) // split on commas not inside quotes
    .map((s) => s.replace(/^\"|\"$/g, '').trim())
    .filter(Boolean);
};

/* --------------------------------------------------------------------------
   Component
-------------------------------------------------------------------------- */
const JobDetails = ({ jobId }: JobDetailsProps) => {
  /* ---------------- state ---------------- */
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showVolunteerSignup, setShowVolunteerSignup] = useState(false);
  const [volunteerId, setVolunteerId] = useState<number | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    volunteer_name: '',
    email: '',
    phone: '',
    cover_letter: '',
    experience: ''
  });
  const [volunteerSignupData, setVolunteerSignupData] = useState<VolunteerSignupData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    skills: [],
    interests: [],
    categories_interested: [],
    experience_level: 'beginner',
    availability: {},
    transportation: 'own',
    background_check_consent: false,
    email_notifications: true,
    sms_notifications: false
  });

  /* ---------------- effects ---------------- */
  useEffect(() => {
    if (jobId) fetchJobDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  /* ---------------- fetch ---------------- */
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setJob(data);
    } catch (err) {
      setError('Error loading job details');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- volunteer signup ---------------- */
  const handleVolunteerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      const response = await fetch('/api/volunteer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volunteerSignupData)
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      
      const result = await response.json();
      setVolunteerId(result.volunteer.id);
      
      // Pre-fill application data from signup
      setApplicationData(prev => ({
        ...prev,
        volunteer_name: `${volunteerSignupData.first_name} ${volunteerSignupData.last_name}`,
        email: volunteerSignupData.email,
        phone: volunteerSignupData.phone || ''
      }));
      
      setShowVolunteerSignup(false);
      setShowApplicationForm(true);
      
    } catch (err: any) {
      alert(err.message || 'Error creating volunteer profile');
    } finally {
      setApplying(false);
    }
  };

  /* ---------------- application submit ---------------- */
  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      // Prepare application payload
      const payload: any = {
        job_id: parseInt(jobId),
        cover_letter: applicationData.cover_letter
      };

      // If we have a volunteer_id, use it; otherwise include signup data
      if (volunteerId) {
        payload.volunteer_id = volunteerId;
      } else {
        payload.volunteer_name = applicationData.volunteer_name;
        payload.email = applicationData.email;
        payload.phone = applicationData.phone;
      }

      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }
      
      const result = await response.json();
      
      // Store volunteer_id for future applications
      if (result.application.volunteer_id) {
        setVolunteerId(result.application.volunteer_id);
      }
      
      alert('Application submitted successfully!');
      setShowApplicationForm(false);
      setApplicationData({ volunteer_name: '', email: '', phone: '', cover_letter: '', experience: '' });
      fetchJobDetails();
      
    } catch (err: any) {
      alert(err.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  /* ---------------- handlers ---------------- */
  const handleInputChange = (field: keyof ApplicationData, value: string) =>
    setApplicationData((prev) => ({ ...prev, [field]: value }));

  const handleVolunteerInputChange = (field: keyof VolunteerSignupData, value: any) =>
    setVolunteerSignupData((prev) => ({ ...prev, [field]: value }));

  const handleApplyClick = () => {
    // Check if user might be a returning volunteer
    if (!volunteerId) {
      const hasEmail = applicationData.email.trim();
      if (hasEmail) {
        // Try applying directly - the API will handle lookup/creation
        setShowApplicationForm(true);
      } else {
        // Show volunteer signup first
        setShowVolunteerSignup(true);
      }
    } else {
      // We have a volunteer_id, go straight to application
      setShowApplicationForm(true);
    }
  };

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'urgent':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  /* ----------------------------------------------------------------------
     Render guards – loading / error
  ---------------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Job not found'}</p>
          <button
            onClick={() => (window.location.href = '/job-board')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Job Board
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- derived ---------------- */
  const skills = normalizeSkills(job.skills_needed);

  /* ----------------------------------------------------------------------
     Main render
  ---------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Job Board
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{job.city}, {job.state}</span>
                    <span className="flex items-center"><Users className="w-4 h-4 mr-1" />{job.positions_remaining} positions available</span>
                  </div>
                  {job.posted_by_username && (
                    <p className="text-blue-200 text-sm mt-2">Posted by: {job.posted_by_username}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(job.urgency)}`}>{job.urgency} priority</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Main column */}
                <div className="md:col-span-2 space-y-6">
                  {/* Description */}
                  <section>
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                  </section>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <section>
                      <h2 className="text-xl font-semibold mb-3">Skills Needed</h2>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{skill}</span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Category */}
                  {job.category && (
                    <section>
                      <h2 className="text-xl font-semibold mb-3">Category</h2>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{job.category}</span>
                    </section>
                  )}
                </div>

                {/* Sidebar column */}
                <div className="space-y-6">
                  {/* Opportunity details */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Opportunity Details</h3>
                    <div className="space-y-3 text-sm">
                      {job.time_commitment && (
                        <div className="flex items-center"><Calendar className="w-4 h-4 mr-3 text-gray-500" />{job.time_commitment}</div>
                      )}
                      {job.duration_hours && (
                        <div className="flex items-center"><Clock className="w-4 h-4 mr-3 text-gray-500" />{job.duration_hours} hours</div>
                      )}
                      <div className="flex items-center"><Users className="w-4 h-4 mr-3 text-gray-500" />{job.volunteers_needed} volunteers needed</div>
                      {job.age_requirement && (
                        <div className="flex items-center"><Star className="w-4 h-4 mr-3 text-gray-500" />{job.age_requirement}</div>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-3 text-sm">
                      {job.contact_name && <p className="font-medium">{job.contact_name}</p>}
                      <div className="flex items-center"><Mail className="w-4 h-4 mr-3 text-gray-500" /><a href={`mailto:${job.contact_email}`} className="text-blue-600 hover:underline">{job.contact_email}</a></div>
                      {job.contact_phone && (
                        <div className="flex items-center"><Phone className="w-4 h-4 mr-3 text-gray-500" /><a href={`tel:${job.contact_phone}`} className="text-blue-600 hover:underline">{job.contact_phone}</a></div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    {job.positions_remaining > 0 ? (
                      <button onClick={handleApplyClick} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl">Apply Now</button>
                    ) : (
                      <div className="w-full bg-gray-200 text-gray-600 py-3 px-6 rounded-lg font-semibold text-center">Position Filled</div>
                    )}

                    {job.can_edit && (
                      <div className="flex space-x-2">
                        <button onClick={() => (window.location.href = `/post-job?edit=${job.id}`)} className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                          <Edit className="w-4 h-4" /><span>Edit</span>
                        </button>
                        <button onClick={() => confirm('Are you sure you want to delete this job posting?') && alert('Delete functionality here')} className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                          <Trash2 className="w-4 h-4" /><span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Volunteer Signup Modal */}
      {showVolunteerSignup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col mx-2">
            <div className="p-3 overflow-y-auto flex-1">
              <h2 className="text-lg font-bold mb-2">Create Volunteer Profile</h2>
              <p className="text-gray-600 mb-3 text-xs">Complete your profile to apply for opportunities.</p>
              
              <form id="volunteer-signup-form" onSubmit={handleVolunteerSignup} className="space-y-2">
                {/* Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerSignupData.first_name} 
                      onChange={(e) => handleVolunteerInputChange('first_name', e.target.value)} 
                      className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerSignupData.last_name} 
                      onChange={(e) => handleVolunteerInputChange('last_name', e.target.value)} 
                      className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={volunteerSignupData.email} 
                    onChange={(e) => handleVolunteerInputChange('email', e.target.value)} 
                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={volunteerSignupData.phone} 
                    onChange={(e) => handleVolunteerInputChange('phone', e.target.value)} 
                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
                  <input 
                    type="text" 
                    required 
                    value={volunteerSignupData.address} 
                    onChange={(e) => handleVolunteerInputChange('address', e.target.value)} 
                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerSignupData.city} 
                      onChange={(e) => handleVolunteerInputChange('city', e.target.value)} 
                      className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerSignupData.state} 
                      onChange={(e) => handleVolunteerInputChange('state', e.target.value)} 
                      className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ZIP *</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerSignupData.zipcode} 
                      onChange={(e) => handleVolunteerInputChange('zipcode', e.target.value)} 
                      className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-2 mt-2">
                  <h3 className="font-semibold mb-1 text-xs">Emergency Contact</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={volunteerSignupData.emergency_contact_name} 
                      onChange={(e) => handleVolunteerInputChange('emergency_contact_name', e.target.value)} 
                      className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                      <input 
                        type="tel" 
                        required 
                        value={volunteerSignupData.emergency_contact_phone} 
                        onChange={(e) => handleVolunteerInputChange('emergency_contact_phone', e.target.value)} 
                        className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Relationship *</label>
                      <input 
                        type="text" 
                        required 
                        value={volunteerSignupData.emergency_contact_relationship} 
                        onChange={(e) => handleVolunteerInputChange('emergency_contact_relationship', e.target.value)} 
                        className="w-full p-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" 
                        placeholder="Parent, Spouse"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div className="border-t pt-2 mt-2">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={volunteerSignupData.background_check_consent} 
                      onChange={(e) => handleVolunteerInputChange('background_check_consent', e.target.checked)} 
                      className="mt-0.5 rounded flex-shrink-0 w-3 h-3"
                    />
                    <span className="text-xs text-gray-700 leading-tight">
                      I consent to background check if required
                    </span>
                  </label>
                </div>
              </form>
            </div>
            
            {/* Fixed bottom buttons */}
            <div className="border-t bg-gray-50 p-3 rounded-b-xl">
              <div className="flex space-x-2">
                <button 
                  type="submit" 
                  form="volunteer-signup-form"
                  disabled={applying} 
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-1"
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Create Profile</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowVolunteerSignup(false)} 
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded text-xs font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Apply for {job.title}</h2>
              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                
                {/* Only show name/email fields if we don't have volunteer_id */}
                {!volunteerId && (
                  <>
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={applicationData.volunteer_name} 
                        onChange={(e) => handleInputChange('volunteer_name', e.target.value)} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        value={applicationData.email} 
                        onChange={(e) => handleInputChange('email', e.target.value)} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={applicationData.phone} 
                        onChange={(e) => handleInputChange('phone', e.target.value)} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </>
                )}

                {/* Cover Letter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                  <textarea 
                    rows={6} 
                    value={applicationData.cover_letter} 
                    onChange={(e) => handleInputChange('cover_letter', e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="Why are you interested in this opportunity? What relevant experience do you have?"
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={applying} 
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowApplicationForm(false)} 
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400"
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

export default JobDetails;