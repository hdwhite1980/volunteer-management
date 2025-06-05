import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Users, Star, CheckCircle, AlertCircle, Heart } from 'lucide-react';

const VolunteerSignup = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    skills: [],
    interests: [],
    max_distance: 25,
    transportation_available: true,
    background_check_completed: false,
    background_check_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    newsletter_opt_in: true,
    sms_opt_in: false,
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [nearbyJobs, setNearbyJobs] = useState([]);

  const skillOptions = [
    'Teaching/Tutoring', 'Food Service', 'Healthcare', 'Construction', 'Administration',
    'Event Planning', 'Fundraising', 'Marketing', 'Technology', 'Translation',
    'Childcare', 'Senior Care', 'Animal Care', 'Gardening', 'Arts & Crafts',
    'Music', 'Sports Coaching', 'Photography', 'Writing', 'Public Speaking'
  ];

  const interestOptions = [
    'Community Service', 'Education', 'Healthcare', 'Environment', 'Animal Welfare',
    'Arts & Culture', 'Sports & Recreation', 'Technology', 'Senior Services',
    'Youth Programs', 'Homelessness', 'Food Security', 'Mental Health', 'Disability Support'
  ];

  const timeSlots = ['morning', 'afternoon', 'evening'];
  const relationships = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

  const steps = [
    { number: 1, title: 'Personal Info', description: 'Basic information about you' },
    { number: 2, title: 'Location', description: 'Where you live and can volunteer' },
    { number: 3, title: 'Preferences', description: 'Your skills and interests' },
    { number: 4, title: 'Availability', description: 'When you can volunteer' },
    { number: 5, title: 'Emergency Contact', description: 'Safety information' }
  ];

  useEffect(() => {
    // Get job ID from URL params if coming from job board
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job');
    
    if (jobId) {
      // Pre-fill some preferences based on the job they're interested in
      fetchJobDetails(jobId);
    }
  }, []);

  const fetchJobDetails = async (jobId) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const job = await response.json();
        
        // Pre-fill interests and zipcode based on job
        setFormData(prev => ({
          ...prev,
          interests: job.category ? [job.category] : prev.interests,
          zipcode: job.zipcode || prev.zipcode
        }));
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

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

  const handleAvailabilityChange = (day, timeSlot, checked) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: checked
          ? [...prev.availability[day], timeSlot]
          : prev.availability[day].filter(slot => slot !== timeSlot)
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.first_name || !formData.last_name || !formData.email) {
          setError('Please fill in all required fields: First name, Last name, and Email');
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        break;
      case 2:
        if (!formData.zipcode) {
          setError('Zipcode is required');
          return false;
        }
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipcode)) {
          setError('Please enter a valid US zipcode (e.g., 12345 or 12345-6789)');
          return false;
        }
        break;
      case 3:
        if (formData.interests.length === 0) {
          setError('Please select at least one area of interest');
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
      setCurrentStep(prev => Math.min(prev + 1, 5));
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
      const response = await fetch('/api/volunteer-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setNearbyJobs(data.nearby_opportunities || []);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Registration error:', err);
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
            Welcome to the Volunteer Community!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for registering! You're all set to start making a difference in your community.
          </p>

          {nearbyJobs.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Opportunities Near You
              </h3>
              <div className="space-y-3">
                {nearbyJobs.map((job, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 flex justify-between items-center">
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">{job.title}</h4>
                      <p className="text-sm text-gray-600">{job.organization}</p>
                      {job.distance_miles && (
                        <p className="text-xs text-blue-600">{job.distance_miles.toFixed(1)} miles away</p>
                      )}
                    </div>
                    <button
                      onClick={() => window.location.href = `/jobs/${job.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/job-board'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse All Opportunities
            </button>
            <button
              onClick={() => window.location.href = '/volunteer-profile'}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              View My Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Heart className="w-12 h-12 mx-auto mb-4 text-white" />
            <h1 className="text-4xl font-bold mb-4">Join Our Volunteer Community</h1>
            <p className="text-xl text-blue-100">
              Register to discover volunteer opportunities that match your interests and schedule
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
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-3 text-blue-600" />
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Helps us find age-appropriate opportunities
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-6 h-6 mr-3 text-blue-600" />
                  Location & Travel
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>
                  
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
                    <p className="text-xs text-gray-500 mt-1">
                      Required to find opportunities near you
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Travel Distance
                    </label>
                    <select
                      value={formData.max_distance}
                      onChange={(e) => handleInputChange('max_distance', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5 miles</option>
                      <option value={10}>10 miles</option>
                      <option value={25}>25 miles</option>
                      <option value={50}>50 miles</option>
                      <option value={100}>50+ miles</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="transportation"
                        checked={formData.transportation_available}
                        onChange={(e) => handleInputChange('transportation_available', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="transportation" className="ml-2 text-sm text-gray-700">
                        I have reliable transportation
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills and Interests */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Star className="w-6 h-6 mr-3 text-blue-600" />
                  Skills & Interests
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Areas of Interest * (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {interestOptions.map((interest) => (
                        <label key={interest} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={(e) => handleArrayChange('interests', interest, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Skills & Experience (Optional)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skillOptions.map((skill) => (
                        <label key={skill} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill)}
                            onChange={(e) => handleArrayChange('skills', skill, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="background_check"
                        checked={formData.background_check_completed}
                        onChange={(e) => handleInputChange('background_check_completed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="background_check" className="ml-2 text-sm text-gray-700">
                        I have completed a background check
                      </label>
                    </div>
                    
                    {formData.background_check_completed && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Check Date
                        </label>
                        <input
                          type="date"
                          value={formData.background_check_date}
                          onChange={(e) => handleInputChange('background_check_date', e.target.value)}
                          className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Availability */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-3 text-blue-600" />
                  Availability
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Select the times when you're generally available to volunteer. This helps us match you with suitable opportunities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.keys(formData.availability).map((day) => (
                    <div key={day} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">{day}</h4>
                      <div className="space-y-2">
                        {timeSlots.map((slot) => (
                          <label key={slot} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.availability[day].includes(slot)}
                              onChange={(e) => handleAvailabilityChange(day, slot, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{slot}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is just your general availability. Each volunteer opportunity will have its own specific schedule requirements.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Emergency Contact */}
            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Users className="w-6 h-6 mr-3 text-blue-600" />
                  Emergency Contact & Preferences
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(555) 987-6543"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relationship
                      </label>
                      <select
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select relationship</option>
                        {relationships.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Communication Preferences</h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.newsletter_opt_in}
                          onChange={(e) => handleInputChange('newsletter_opt_in', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Send me email updates about new volunteer opportunities
                        </span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sms_opt_in}
                          onChange={(e) => handleInputChange('sms_opt_in', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Send me SMS alerts for urgent volunteer needs
                        </span>
                      </label>
                    </div>
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
              
              {currentStep < 5 ? (
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
                      Registering...
                    </>
                  ) : (
                    'Complete Registration'
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

export default VolunteerSignup;