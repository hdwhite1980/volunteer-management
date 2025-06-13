// Tailwind-Responsive VolunteerSignup Component
import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, MapPin, Heart, Clock, Shield, CheckCircle, ArrowRight, ArrowLeft, 
  Info, Calendar, Phone, Mail, AlertTriangle, Loader2,
  Star, Award, Users, Target, Save, Navigation, Home
} from 'lucide-react';

const VOLUNTEER_CATEGORIES = [
  'Debris Removal & Cleanup',
  'Structural Assessment & Repair',
  'Home Stabilization (e.g., tarping, boarding)',
  'Utility Restoration Support',
  'Supply Distribution',
  'Warehouse Management',
  'Transportation Assistance',
  'Administrative & Office Support',
  'First Aid & Medical Support',
  'Mental Health & Emotional Support',
  'Spiritual Care',
  'Pet Care Services',
  'Childcare & Youth Programs',
  'Senior Assistance',
  'Multilingual & Translation Support',
  'Legal Aid Assistance',
  'Volunteer Coordination',
  'IT & Communication Support',
  'Damage Assessment & Reporting',
  'Fundraising & Community Outreach'
];

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

interface RegistrationResult {
  success: boolean;
  message: string;
  volunteer: {
    id: number;
    name: string;
    email: string;
    username?: string;
    registered_at: string;
  };
  nearby_opportunities?: any[];
}

const VolunteerSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  const [zipData, setZipData] = useState<any>(null);
  const [zipLoading, setZipLoading] = useState(false);

  const lookupZip = async (zip: string) => {
    if (zip.length === 5) {
      setZipLoading(true);
      setTimeout(() => {
        const mockData: { [key: string]: { city: string; state: string } } = {
          '23505': { city: 'Norfolk', state: 'VA' },
          '23507': { city: 'Norfolk', state: 'VA' },
          '10001': { city: 'New York', state: 'NY' },
          '90210': { city: 'Beverly Hills', state: 'CA' },
          '60601': { city: 'Chicago', state: 'IL' }
        };
        setZipData(mockData[zip] || null);
        setZipLoading(false);
      }, 500);
    }
  };

  const autoSave = useCallback(async () => {
    if (Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() !== '' : 
      Array.isArray(value) ? value.length > 0 : 
      false
    )) {
      setIsAutoSaving(true);
      try {
        // Using in-memory storage for artifacts
        const draftData = {
          formData,
          currentStep,
          timestamp: new Date().toISOString()
        };
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }
  }, [formData, currentStep]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  useEffect(() => {
    if (formData.zipcode.length === 5) {
      lookupZip(formData.zipcode);
    }
  }, [formData.zipcode]);

  useEffect(() => {
    if (zipData) {
      setFormData(prev => ({
        ...prev,
        city: zipData.city,
        state: zipData.state
      }));
    }
  }, [zipData]);

  const skillsOptions = [
    'Debris Removal', 'Tree Cutting', 'Tarp Installation', 'General Construction', 'Roofing',
    'Electrical Work', 'Plumbing', 'HVAC Repair', 'Heavy Equipment Operation', 'First Aid',
    'EMT Support', 'Crisis Counseling', 'Volunteer Coordination', 'Data Entry', 'Supply Chain Management',
    'Driving', 'Inventory Management', 'Tech Support', 'Form Assistance', 'Translation',
    'Shelter Support', 'Childcare', 'Elder Care', 'Disability Support', 'Pet Care',
    'Meal Preparation', 'Hygiene Kit Distribution', 'Social Media Updates', 'Phone Banking', 'Documentation'
  ];

  const timeSlots = [
    'Early Morning (6-9 AM)', 'Morning (9-12 PM)', 'Afternoon (12-5 PM)',
    'Evening (5-8 PM)', 'Night (8-11 PM)'
  ];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        if (formData.skills.length === 0 && formData.categories_interested.length === 0) {
          newErrors.skills = 'Please select at least one skill or category';
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
      const submitData = {
        ...formData,
        interests: []
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: RegistrationResult = {
        success: true,
        message: "Welcome to our volunteer community! Your registration has been successfully submitted.",
        volunteer: {
          id: Math.floor(Math.random() * 10000),
          name: `${formData.first_name} ${formData.last_name}`,
          email: formData.email,
          username: `${formData.first_name.toLowerCase()}${formData.birth_date ? new Date(formData.birth_date).getFullYear() : '2024'}`,
          registered_at: new Date().toISOString()
        },
        nearby_opportunities: [
          {
            title: "Community Garden Cleanup",
            location: "Downtown Park",
            category: "Environmental",
            distance: "2.3",
            volunteers_needed: 15
          },
          {
            title: "Food Bank Sorting",
            location: "Community Center",
            category: "Food Distribution",
            distance: "4.1",
            volunteers_needed: 8
          }
        ]
      };
      
      setRegistrationResult(mockResult);
      setNearbyJobs(mockResult.nearby_opportunities || []);
      setSubmitSuccess(true);
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMessage = ({ error }: { error?: string | null }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  const AutoSaveIndicator = () => {
    if (isAutoSaving) {
      return (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
          <span className="sm:hidden">Saved</span>
        </div>
      );
    }
    
    return null;
  };

  if (submitSuccess && registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 p-5 sm:p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  Welcome to our volunteer community!
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mb-8">
                  {registrationResult.message}
                </p>
              </div>
              
              {/* User Information Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
                  Your Registration Details
                </h2>
                <div className="space-y-3 text-left text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600">Name:</span>
                    <span className="text-slate-900">{registrationResult.volunteer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-600">Email:</span>
                    <span className="text-slate-900 break-all">{registrationResult.volunteer.email}</span>
                  </div>
                  {registrationResult.volunteer.username && (
                    <div className="bg-blue-100 rounded-xl p-3 sm:p-4 mt-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                        <span className="font-semibold text-blue-900">Your Username:</span>
                        <span className="font-mono text-lg font-bold text-blue-900">
                          @{registrationResult.volunteer.username}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-blue-800 text-center">
                        💡 Use this username when applying for volunteer opportunities
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-600">Registered:</span>
                    <span className="text-slate-900">
                      {new Date(registrationResult.volunteer.registered_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {nearbyJobs.length > 0 && (
                <div className="text-left mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4">
                    Opportunities near you:
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {nearbyJobs.slice(0, 6).map((job: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1">
                              {job.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">
                              {job.location}
                            </p>
                            <p className="text-xs sm:text-sm text-blue-600">
                              {job.category}
                            </p>
                          </div>
                          {job.distance && (
                            <span className="text-xs text-gray-600 bg-green-100 px-2 py-1 rounded self-start">
                              {job.distance} mi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            {job.volunteers_needed} volunteers needed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/job-board'}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Browse All Opportunities
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-gray-700 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Return Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Home Button */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">
                Volunteer Registration
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Join our community of changemakers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 bg-transparent text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-colors text-sm sm:text-base"
              >
                <Navigation className="w-5 h-5" />
                <span>Home</span>
              </button>
              <div className="bg-blue-100 rounded-lg p-2 sm:p-3">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-2 sm:gap-0">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of 5
            </span>
            <AutoSaveIndicator />
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${step < currentStep ? 'bg-green-500 text-white' : 
                    step === currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step < currentStep ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                </div>
                {step < 5 && (
                  <div className={`
                    w-8 sm:w-16 h-2 rounded-full transition-all
                    ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
                <div className="bg-blue-100 rounded-lg p-2 sm:p-3">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Tell us about yourself
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => updateFormData('first_name', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your last name"
                    />
                    <ErrorMessage error={errors.last_name} />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                  />
                  <ErrorMessage error={errors.email} />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="(555) 123-4567"
                  />
                  <ErrorMessage error={errors.phone} />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateFormData('birth_date', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    💡 Your birth date helps us generate your unique username
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
                <div className="bg-green-100 rounded-lg p-2 sm:p-3">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Location & Transportation
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Help us find opportunities near you
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="12345"
                      maxLength={10}
                    />
                    {zipLoading && (
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <ErrorMessage error={errors.zipcode} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="State"
                      maxLength={2}
                    />
                    <ErrorMessage error={errors.state} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Travel Distance
                  </label>
                  <select
                    value={formData.max_distance}
                    onChange={(e) => updateFormData('max_distance', parseInt(e.target.value))}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

          {/* Step 3: Skills & Categories */}
          {currentStep === 3 && (
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
                <div className="bg-purple-100 rounded-lg p-2 sm:p-3">
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Skills & Categories
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Help us match you with the right opportunities
                  </p>
                </div>
              </div>
              
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4 text-base sm:text-lg">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span>Skills</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {skillsOptions.map((skill) => (
                      <label 
                        key={skill} 
                        className={`
                          flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all text-sm font-medium
                          ${formData.skills.includes(skill) 
                            ? 'border-blue-600 bg-blue-50 text-blue-900' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4 text-base sm:text-lg">
                    <Target className="w-5 h-5 text-green-600" />
                    <span>Preferred Categories</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {VOLUNTEER_CATEGORIES.map((category) => (
                      <label 
                        key={category} 
                        className={`
                          flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all text-sm font-medium
                          ${formData.categories_interested.includes(category) 
                            ? 'border-green-600 bg-green-50 text-green-900' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories_interested.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => updateFormData('experience_level', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
                <div className="bg-blue-100 rounded-lg p-2 sm:p-3">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Availability
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    When are you available to volunteer?
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                {Object.keys(formData.availability).map((day) => (
                  <div key={day} className="bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base sm:text-lg capitalize text-gray-900">
                        {day}
                      </h3>
                      <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availability[day as keyof typeof formData.availability].available}
                          onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Available</span>
                      </label>
                    </div>
                    
                    {formData.availability[day as keyof typeof formData.availability].available && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {timeSlots.map((timeSlot) => (
                          <label 
                            key={timeSlot} 
                            className={`
                              flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium
                              ${formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot)
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot)}
                              onChange={() => handleTimeSlotToggle(day, timeSlot)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span>{timeSlot}</span>
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
            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8 text-center sm:text-left">
                <div className="bg-red-100 rounded-lg p-2 sm:p-3">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Emergency Contact & Consent
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Final step - safety and preferences
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 sm:space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="flex items-center gap-2 font-bold text-red-900 mb-4 text-base sm:text-lg">
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
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Spouse, Parent, Sibling, Friend"
                      />
                      <ErrorMessage error={errors.emergency_contact_relationship} />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h3 className="font-bold text-blue-900 mb-4 text-base sm:text-lg">
                    Consent & Preferences
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.background_check_consent}
                        onChange={(e) => updateFormData('background_check_consent', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium">
                          I consent to background checks as required by volunteer opportunities
                        </span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          Some opportunities may require background checks for safety reasons
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.email_notifications}
                        onChange={(e) => updateFormData('email_notifications', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium">
                          📧 Send me email notifications about volunteer opportunities
                        </span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          We'll send you relevant opportunities and important updates
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sms_notifications}
                        onChange={(e) => updateFormData('sms_notifications', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium">
                          📱 Send me SMS notifications about urgent opportunities
                        </span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
                    rows={3}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us anything else we should know about your volunteer interests, special accommodations needed, or other relevant information..."
                  />
                </div>

                <ErrorMessage error={errors.submit} />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`
                  flex items-center gap-2 px-4 sm:px-8 py-3 border-2 border-gray-300 rounded-xl font-semibold transition-colors text-sm sm:text-base w-full sm:w-auto justify-center
                  ${currentStep === 1 
                    ? 'opacity-50 cursor-not-allowed text-gray-400' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={autoSave}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 bg-transparent border-none cursor-pointer text-xs sm:text-sm hover:text-gray-800 transition-colors"
                  disabled={isAutoSaving}
                >
                  {isAutoSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Progress</span>
                </button>

                {currentStep < 5 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-4 sm:px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`
                      flex items-center gap-2 px-4 sm:px-8 py-3 bg-green-600 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base w-full sm:w-auto justify-center
                      ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
                    `}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="hidden sm:inline">Complete Registration</span>
                        <span className="sm:hidden">Complete</span>
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
  );
};

export default VolunteerSignup;