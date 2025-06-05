import React, { useState } from 'react';
import { Plus, Building, MapPin, Users, Clock, Star, AlertCircle, CheckCircle, Calendar, DollarSign } from 'lucide-react';

const PostJob = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    category: '',
    skills_needed: [],
    time_commitment: 'Flexible',
    duration_hours: '',
    volunteers_needed: 1,
    age_requirement: 'All ages',
    background_check_required: false,
    training_provided: false,
    start_date: '',
    end_date: '',
    flexible_schedule: true,
    preferred_times: '',
    urgency: 'normal',
    remote_possible: false,
    transportation_provided: false,
    meal_provided: false,
    stipend_amount: '',
    expires_at: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Community Service',
    'Education', 
    'Healthcare',
    'Environment',
    'Animal Welfare',
    'Arts & Culture',
    'Sports & Recreation',
    'Technology',
    'Senior Services',
    'Youth Programs',
    'Homelessness',
    'Food Security',
    'Mental Health',
    'Disability Support'
  ];

  const skillOptions = [
    'Teaching/Tutoring', 'Food Service', 'Healthcare', 'Construction', 'Administration',
    'Event Planning', 'Fundraising', 'Marketing', 'Technology', 'Translation',
    'Childcare', 'Senior Care', 'Animal Care', 'Gardening', 'Arts & Crafts',
    'Music', 'Sports Coaching', 'Photography', 'Writing', 'Public Speaking'
  ];

  const timeCommitments = [
    'One-time',
    'Weekly', 
    'Monthly',
    'Flexible',
    'Ongoing'
  ];

  const ageRequirements = [
    'All ages',
    '13+',
    '16+', 
    '18+',
    '21+'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Fill within a month', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal - Fill within 2 weeks', color: 'text-blue-600' },
    { value: 'high', label: 'High - Fill within a week', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent - Fill ASAP', color: 'text-red-600' }
  ];

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Job title, description, and organization' },
    { number: 2, title: 'Contact & Location', description: 'How volunteers can reach you' },
    { number: 3, title: 'Requirements', description: 'Skills, experience, and restrictions' },
    { number: 4, title: 'Schedule & Benefits', description: 'When and what you offer' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title || !formData.description || !formData.organization) {
          setError('Please fill in the title, description, and organization name');
          return false;
        }
        if (formData.title.length < 10) {
          setError('Job title should be at least 10 characters long');
          return false;
        }
        if (formData.description.length < 50) {
          setError('Job description should be at least 50 characters long');
          return false;
        }
        break;
      case 2:
        if (!formData.contact_name || !formData.contact_email || !formData.zipcode) {
          setError('Please fill in contact name, email, and zipcode');
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipcode)) {
          setError('Please enter a valid US zipcode (e.g., 12345 or 12345-6789)');
          return false;
        }
        break;
      case 3:
        if (!formData.category) {
          setError('Please select a category for this volunteer opportunity');
          return false;
        }
        if (formData.volunteers_needed < 1 || formData.volunteers_needed > 100) {
          setError('Number of volunteers needed must be between 1 and 100');
          return false;
        }
        break;
      default:
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const submitForm = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      // Check if user is authenticated
      const sessionResponse = await fetch('/api/auth/session');
      
      if (!sessionResponse.ok) {
        setError('You must be logged in to post a job. Please log in and try again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
          stipend_amount: formData.stipend_amount ? parseFloat(formData.stipend_amount) : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
      } else {
        setError(data.error || 'Failed to post job. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Job posting error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-gray-900">{step.title}</div>
                <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 transition-colors ${
                currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Job Posted Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your volunteer opportunity has been posted and is now visible to volunteers in your area.
          </p>

          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-left text-gray-700 space-y-2">
              <li>• Volunteers will see your posting on the job board</li>
              <li>• You'll receive email notifications when someone applies</li>
              <li>• You can review applications and contact volunteers directly</li>
              <li>• Update or close the posting when positions are filled</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = `/jobs/${success.id}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Your Posting
            </button>
            <button
              onClick={() => window.location.href = '/job-board'}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Browse All Jobs
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Post Another Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Plus className="w-12 h-12 mx-auto mb-4 text-white" />
            <h1 className="text-4xl font-bold mb-4">Post a Volunteer Opportunity</h1>
            <p className="text-xl text-green-100">
              Connect with passionate volunteers in your community
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <StepIndicator />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Building className="w-6 h-6 mr-3 text-blue-600" />
                  Basic Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Food Bank Volunteer, Reading Tutor, Beach Cleanup Helper"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Make it clear and appealing - this is what volunteers will see first
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your organization or group name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe what volunteers will be doing, why it matters, and what impact they'll have. Include any important details about the work environment or expectations."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/500+ characters - Be specific and inspiring!
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Location */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 mr-3 text-blue-600" />
                  Contact & Location
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => handleInputChange('contact_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Who volunteers should contact"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contact@organization.org"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main Street (optional if remote)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Norfolk"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select State</option>
                        <option value="VA">Virginia</option>
                        <option value="NC">North Carolina</option>
                        <option value="MD">Maryland</option>
                        {/* Add more states as needed */}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zipcode *
                      </label>
                      <input
                        type="text"
                        value={formData.zipcode}
                        onChange={(e) => handleInputChange('zipcode', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="23502"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remote_possible"
                        checked={formData.remote_possible}
                        onChange={(e) => handleInputChange('remote_possible', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remote_possible" className="ml-2 text-sm text-gray-700">
                        This position can be done remotely
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Star className="w-6 h-6 mr-3 text-blue-600" />
                  Requirements & Skills
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Volunteers Needed *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.volunteers_needed}
                        onChange={(e) => handleInputChange('volunteers_needed', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Requirement
                      </label>
                      <select
                        value={formData.age_requirement}
                        onChange={(e) => handleInputChange('age_requirement', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {ageRequirements.map(age => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Skills Needed (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skillOptions.map((skill) => (
                        <label key={skill} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.skills_needed.includes(skill)}
                            onChange={(e) => handleArrayChange('skills_needed', skill, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="background_check_required"
                        checked={formData.background_check_required}
                        onChange={(e) => handleInputChange('background_check_required', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="background_check_required" className="ml-2 text-sm text-gray-700">
                        Background check required
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="training_provided"
                        checked={formData.training_provided}
                        onChange={(e) => handleInputChange('training_provided', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="training_provided" className="ml-2 text-sm text-gray-700">
                        Training will be provided
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level
                    </label>
                    <div className="space-y-2">
                      {urgencyLevels.map((level) => (
                        <label key={level.value} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="urgency"
                            value={level.value}
                            checked={formData.urgency === level.value}
                            onChange={(e) => handleInputChange('urgency', e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className={`ml-2 text-sm ${level.color}`}>
                            {level.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Schedule & Benefits */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-blue-600" />
                  Schedule & Benefits
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Commitment
                      </label>
                      <select
                        value={formData.time_commitment}
                        onChange={(e) => handleInputChange('time_commitment', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {timeCommitments.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Hours per Session
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.duration_hours}
                        onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 4"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date (if applicable)
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Times/Schedule
                    </label>
                    <textarea
                      value={formData.preferred_times}
                      onChange={(e) => handleInputChange('preferred_times', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Saturday mornings 9 AM - 1 PM, Flexible weekday evenings, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Benefits & Perks
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="transportation_provided"
                          checked={formData.transportation_provided}
                          onChange={(e) => handleInputChange('transportation_provided', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="transportation_provided" className="ml-2 text-sm text-gray-700">
                          Transportation provided
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="meal_provided"
                          checked={formData.meal_provided}
                          onChange={(e) => handleInputChange('meal_provided', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="meal_provided" className="ml-2 text-sm text-gray-700">
                          Meals provided
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="flexible_schedule"
                          checked={formData.flexible_schedule}
                          onChange={(e) => handleInputChange('flexible_schedule', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="flexible_schedule" className="ml-2 text-sm text-gray-700">
                          Flexible scheduling
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stipend Amount (if any)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.stipend_amount}
                        onChange={(e) => handleInputChange('stipend_amount', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Posting Expires
                    </label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => handleInputChange('expires_at', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank if no expiration date
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              <div className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </div>
              
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitForm}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting Job...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;