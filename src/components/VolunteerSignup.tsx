// src/components/VolunteerSignup.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, MapPin, Heart, Clock, Shield, CheckCircle, ArrowRight, ArrowLeft, 
  Info, Upload, Calendar, MapIcon, Phone, Mail, AlertTriangle, Loader2,
  Star, Award, Users, Target, Save, RefreshCw
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useZipLookup } from '../hooks/useZipLookup';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  skills: string[];
  interests: string[];
  categories_interested: string[];
  experience_level: string;
  availability: {
    monday: { available: boolean; times: string[] };
    tuesday: { available: boolean; times: string[] };
    wednesday: { available: boolean; times: string[] };
    thursday: { available: boolean; times: string[] };
    friday: { available: boolean; times: string[] };
    saturday: { available: boolean; times: string[] };
    sunday: { available: boolean; times: string[] };
  };
  max_distance: number;
  transportation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  background_check_consent: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

interface NearbyJob {
  id: number;
  title: string;
  category: string;
  location: string;
  distance: number | null;
  volunteers_needed: number;
  start_date?: string;
  end_date?: string;
  description?: string;
}

const VolunteerSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [nearbyJobs, setNearbyJobs] = useState<NearbyJob[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Load categories dynamically
  const { categories: volunteerCategories, loading: categoriesLoading } = useCategories('volunteer');
  
  // ZIP lookup hook
  const { data: zipData, loading: zipLoading, error: zipError, lookup: lookupZip } = useZipLookup();
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    skills: [],
    interests: [],
    categories_interested: [],
    experience_level: 'beginner',
    availability: {
      monday: { available: false, times: [] },
      tuesday: { available: false, times: [] },
      wednesday: { available: false, times: [] },
      thursday: { available: false, times: [] },
      friday: { available: false, times: [] },
      saturday: { available: false, times: [] },
      sunday: { available: false, times: [] }
    },
    max_distance: 25,
    transportation: 'own',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    background_check_consent: false,
    email_notifications: true,
    sms_notifications: false,
    notes: ''
  });

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (Object.keys(formData).some(key => formData[key as keyof FormData] !== '')) {
      setIsAutoSaving(true);
      try {
        localStorage.setItem('volunteer_signup_draft', JSON.stringify({
          formData,
          currentStep,
          timestamp: new Date().toISOString()
        }));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }
  }, [formData, currentStep]);

  // Load saved draft on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('volunteer_signup_draft');
      if (saved) {
        const { formData: savedData, currentStep: savedStep, timestamp } = JSON.parse(saved);
        const saveTime = new Date(timestamp);
        const now = new Date();
        const hoursSinceLastSave = (now.getTime() - saveTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24) { // Only restore if less than 24 hours old
          if (window.confirm('We found a saved draft from your previous session. Would you like to continue where you left off?')) {
            setFormData(savedData);
            setCurrentStep(savedStep);
            setLastSaved(saveTime);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load saved draft:', error);
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Handle ZIP code lookup
  useEffect(() => {
    if (formData.zipcode.length === 5) {
      lookupZip(formData.zipcode);
    }
  }, [formData.zipcode, lookupZip]);

  // Auto-fill city and state from ZIP lookup
  useEffect(() => {
    if (zipData && !zipError) {
      setFormData(prev => ({
        ...prev,
        city: zipData.city,
        state: zipData.state
      }));
    }
  }, [zipData, zipError]);

  const skillsOptions = [
    'Teaching', 'Tutoring', 'Administrative', 'Computer Skills', 'Social Media',
    'Marketing', 'Writing', 'Photography', 'Event Planning', 'Fundraising',
    'Construction', 'Gardening', 'Cooking', 'Cleaning', 'Driving',
    'Public Speaking', 'Translation', 'Medical Knowledge', 'Legal Knowledge',
    'Accounting', 'Music', 'Art', 'Sports Coaching', 'Childcare'
  ];

  const interestsOptions = [
    'Working with Children', 'Working with Seniors', 'Working with Animals',
    'Environmental Protection', 'Education', 'Healthcare', 'Arts & Culture',
    'Sports & Recreation', 'Community Development', 'Disaster Relief',
    'Homelessness', 'Food Security', 'Mental Health', 'Technology',
    'Faith-based Work', 'International Aid', 'Research', 'Advocacy'
  ];

  const timeSlots = [
    'Early Morning (6-9 AM)', 'Morning (9-12 PM)', 'Afternoon (12-5 PM)',
    'Evening (5-8 PM)', 'Night (8-11 PM)'
  ];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: keyof FormData, value: any): string | null => {
    switch (field) {
      case 'first_name':
      case 'last_name':
        return !value?.trim() ? 'This field is required' : null;
      case 'email':
        if (!value?.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
      case 'phone':
        if (!value?.trim()) return 'Phone number is required';
        const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
        return !phoneRegex.test(value.replace(/\D/g, '')) ? 'Please enter a valid phone number' : null;
      case 'zipcode':
        if (!value?.trim()) return 'ZIP code is required';
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return !zipRegex.test(value) ? 'Please enter a valid ZIP code' : null;
      case 'address':
      case 'city':
      case 'state':
        return !value?.trim() ? 'This field is required' : null;
      case 'emergency_contact_name':
      case 'emergency_contact_phone':
      case 'emergency_contact_relationship':
        return !value?.trim() ? 'Emergency contact information is required' : null;
      default:
        return null;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        ['first_name', 'last_name', 'email', 'phone'].forEach(field => {
          const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        });
        break;
      case 2:
        ['address', 'city', 'state', 'zipcode'].forEach(field => {
          const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        });
        break;
      case 3:
        if (formData.skills.length === 0 && formData.interests.length === 0 && formData.categories_interested.length === 0) {
          newErrors.skills = 'Please select at least one skill, interest, or category';
          isValid = false;
        }
        break;
      case 4:
        const hasAvailability = Object.values(formData.availability).some(day => day.available);
        if (!hasAvailability) {
          newErrors.availability = 'Please select at least one day when you\'re available';
          isValid = false;
        }
        break;
      case 5:
        ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'].forEach(field => {
          const error = validateField(field as keyof FormData, formData[field as keyof FormData]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        });
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSkillToggle = (skill: string) => {
    const current = formData.skills;
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    updateFormData('skills', updated);
  };

  const handleInterestToggle = (interest: string) => {
    const current = formData.interests;
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    updateFormData('interests', updated);
  };

  const handleCategoryToggle = (category: string) => {
    const current = formData.categories_interested;
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    updateFormData('categories_interested', updated);
  };

  const handleAvailabilityChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }));
  };

  const handleTimeSlotToggle = (day: string, timeSlot: string) => {
    const dayAvailability = formData.availability[day as keyof typeof formData.availability];
    const currentTimes = dayAvailability.times;
    const updated = currentTimes.includes(timeSlot)
      ? currentTimes.filter(t => t !== timeSlot)
      : [...currentTimes, timeSlot];
    
    handleAvailabilityChange(day, 'times', updated);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      autoSave();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/volunteer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setNearbyJobs(result.nearby_opportunities || []);
        setSubmitSuccess(true);
        // Clear saved draft on successful submission
        localStorage.removeItem('volunteer_signup_draft');
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div className="relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible transition-all duration-200 z-10 group-hover:opacity-100 group-hover:visible whitespace-nowrap">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  const ErrorMessage = ({ error }: { error?: string | null }) => {
    if (!error) return null;
    return (
      <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  const AutoSaveIndicator = () => {
    if (isAutoSaving) {
      return (
        <div className="flex items-center space-x-2 text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <Save className="w-4 h-4" />
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </div>
      );
    }
    
    return null;
  };

  const ProgressBar = () => (
    <div className="bg-white border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {currentStep} of 5</span>
          <AutoSaveIndicator />
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                step < currentStep ? 'bg-green-500 text-white transform scale-110' :
                step === currentStep ? 'bg-blue-500 text-white animate-pulse' :
                'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 5 && (
                <div className={`w-16 h-2 mx-2 rounded-full transition-all duration-500 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-12 text-center">
                <div className="animate-bounce mb-6">
                  <CheckCircle className="w-20 h-20 text-white mx-auto" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">Welcome to our volunteer community!</h1>
                <p className="text-green-100 text-lg max-w-2xl mx-auto">
                  Your registration was successful. We're excited to have you join us in making a difference in our community.
                </p>
              </div>
              
              <div className="p-8">
                {nearbyJobs.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <MapIcon className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-semibold text-gray-900">Opportunities near you</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {nearbyJobs.slice(0, 6).map((job, index) => (
                        <div key={index} className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-100 rounded-lg p-3">
                              <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            {job.distance && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                                {job.distance} mi
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">{job.location}</p>
                          <div className="flex items-center justify-between">
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                              {job.category}
                            </span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" />
                              <span>{job.volunteers_needed} needed</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.location.href = '/job-board'}
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="w-5 h-5 group-hover:animate-spin" />
                      <span>Browse All Opportunities</span>
                    </div>
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-gray-100 text-gray-700 py-4 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                  >
                    Return Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Volunteer Registration
              </h1>
              <p className="text-gray-600 mt-1">Join our community of changemakers</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar />

      {/* Form Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="bg-blue-100 rounded-lg p-3 mr-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600">Tell us about yourself</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => updateFormData('first_name', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your first name"
                      />
                      <ErrorMessage error={errors.first_name} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => updateFormData('last_name', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your last name"
                      />
                      <ErrorMessage error={errors.last_name} />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="your.email@example.com"
                    />
                    <ErrorMessage error={errors.email} />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="(555) 123-4567"
                    />
                    <ErrorMessage error={errors.phone} />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date of Birth</span>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <Tooltip content="This helps us match you with age-appropriate volunteer opportunities">
                          <div></div>
                        </Tooltip>
                      </div>
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => updateFormData('birth_date', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="bg-green-100 rounded-lg p-3 mr-4">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Location & Transportation</h2>
                    <p className="text-gray-600">Help us find opportunities near you</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="123 Main Street"
                    />
                    <ErrorMessage error={errors.address} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.zipcode}
                        onChange={(e) => updateFormData('zipcode', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="12345"
                        maxLength={10}
                      />
                      {zipLoading && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                    <ErrorMessage error={errors.zipcode || zipError} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="City name"
                      />
                      <ErrorMessage error={errors.city} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => updateFormData('state', e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="State"
                        maxLength={2}
                      />
                      <ErrorMessage error={errors.state} />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                      <span>Maximum Travel Distance</span>
                      <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <Tooltip content="We'll show you opportunities within this distance from your location">
                          <div></div>
                        </Tooltip>
                      </div>
                    </label>
                    <select
                      value={formData.max_distance}
                      onChange={(e) => updateFormData('max_distance', parseInt(e.target.value))}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value={5}>Within 5 miles</option>
                      <option value={10}>Within 10 miles</option>
                      <option value={25}>Within 25 miles</option>
                      <option value={50}>Within 50 miles</option>
                      <option value={100}>Within 100 miles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transportation
                    </label>
                    <select
                      value={formData.transportation}
                      onChange={(e) => updateFormData('transportation', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="own">Own Vehicle</option>
                      <option value="public">Public Transportation</option>
                      <option value="carpool">Willing to Carpool</option>
                      <option value="limited">Limited Transportation</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills & Interests */}
            {currentStep === 3 && (
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="bg-purple-100 rounded-lg p-3 mr-4">
                    <Heart className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Skills & Interests</h2>
                    <p className="text-gray-600">Help us match you with the right opportunities</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span>Skills</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skillsOptions.map((skill) => (
                        <label key={skill} className="group flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className="text-sm font-medium group-hover:text-blue-700 transition-colors">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-red-600" />
                      <span>Interests</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {interestsOptions.map((interest) => (
                        <label key={interest} className="group flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                          />
                          <span className="text-sm font-medium group-hover:text-purple-700 transition-colors">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Target className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">Preferred Categories</h3>
                      {categoriesLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categoriesLoading ? (
                        <div className="col-span-full flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <span className="ml-2 text-gray-600">Loading categories...</span>
                        </div>
                      ) : (
                        volunteerCategories.map((category) => (
                          <label key={category.id} className="group flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                            <input
                              type="checkbox"
                              checked={formData.categories_interested.includes(category.category_name)}
                              onChange={() => handleCategoryToggle(category.category_name)}
                              className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium group-hover:text-green-700 transition-colors">{category.category_name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={formData.experience_level}
                      onChange={(e) => updateFormData('experience_level', e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="beginner">🌱 Beginner - New to volunteering</option>
                      <option value="some">🌿 Some Experience - 1-2 years</option>
                      <option value="experienced">🌳 Experienced - 3+ years</option>
                      <option value="expert">🏆 Expert - Leadership experience</option>
                    </select>
                  </div>

                  <ErrorMessage error={errors.skills} />
                </div>
              </div>
            )}

            {/* Step 4: Availability */}
            {currentStep === 4 && (
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="bg-blue-100 rounded-lg p-3 mr-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Availability</h2>
                    <p className="text-gray-600">When are you available to volunteer?</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {Object.keys(formData.availability).map((day) => (
                    <div key={day} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg capitalize text-gray-900">{day}</h3>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.availability[day as keyof typeof formData.availability].available}
                            onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5"
                          />
                          <span className="text-sm font-medium">Available</span>
                        </label>
                      </div>
                      
                      {formData.availability[day as keyof typeof formData.availability].available && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 animate-fadeIn">
                          {timeSlots.map((timeSlot) => (
                            <label key={timeSlot} className="group flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                              <input
                                type="checkbox"
                                checked={formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot)}
                                onChange={() => handleTimeSlotToggle(day, timeSlot)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                              <span className="text-xs font-medium group-hover:text-blue-700 transition-colors">{timeSlot}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <ErrorMessage error={errors.availability} />
                </div>
              </div>
            )}

            {/* Step 5: Emergency Contact & Consent */}
            {currentStep === 5 && (
              <div className="p-8">
                <div className="flex items-center mb-8">
                  <div className="bg-red-100 rounded-lg p-3 mr-4">
                    <Shield className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Emergency Contact & Consent</h2>
                    <p className="text-gray-600">Final step - safety and preferences</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <h3 className="font-bold text-red-900 mb-4 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Emergency Contact Information</span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emergency Contact Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.emergency_contact_name}
                          onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Full name of emergency contact"
                        />
                        <ErrorMessage error={errors.emergency_contact_name} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emergency Contact Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.emergency_contact_phone}
                          onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="(555) 123-4567"
                        />
                        <ErrorMessage error={errors.emergency_contact_phone} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Relationship *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.emergency_contact_relationship}
                          onChange={(e) => updateFormData('emergency_contact_relationship', e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Spouse, Parent, Sibling, Friend"
                        />
                        <ErrorMessage error={errors.emergency_contact_relationship} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="font-bold text-blue-900 mb-4">Consent & Preferences</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.background_check_consent}
                          onChange={(e) => updateFormData('background_check_consent', e.target.checked)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5"
                        />
                        <div>
                          <span className="text-sm font-medium group-hover:text-blue-700 transition-colors">
                            I consent to background checks as required by volunteer opportunities
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            Some opportunities may require background checks for safety reasons
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.email_notifications}
                          onChange={(e) => updateFormData('email_notifications', e.target.checked)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5"
                        />
                        <div>
                          <span className="text-sm font-medium group-hover:text-blue-700 transition-colors">
                            📧 Send me email notifications about volunteer opportunities
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            We'll send you relevant opportunities and important updates
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.sms_notifications}
                          onChange={(e) => updateFormData('sms_notifications', e.target.checked)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-5 h-5"
                        />
                        <div>
                          <span className="text-sm font-medium group-hover:text-blue-700 transition-colors">
                            📱 Send me SMS notifications about urgent opportunities
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            Get text alerts for time-sensitive volunteer needs
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      rows={4}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Tell us anything else we should know about your volunteer interests, special accommodations needed, or other relevant information..."
                    />
                  </div>

                  <ErrorMessage error={errors.submit} />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={autoSave}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                    disabled={isAutoSaving}
                  >
                    {isAutoSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span className="text-sm">Save Progress</span>
                  </button>

                  {currentStep < 5 ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Complete Registration</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default VolunteerSignup;