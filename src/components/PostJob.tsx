import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Clock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Calendar, Shield, Star, Zap, Target, Globe, Heart, Award, Sparkles } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useZipLookup } from '@/hooks/useZipLookup';

interface JobFormData {
  title: string;
  description: string;
  category: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  skills_needed: string[];
  time_commitment: string;
  duration_hours: number;
  volunteers_needed: number;
  age_requirement: string;
  background_check_required: boolean;
  training_provided: boolean;
  start_date: string;
  end_date: string;
  flexible_schedule: boolean;
  preferred_times: string;
  urgency: string;
  remote_possible: boolean;
  transportation_provided: boolean;
  meal_provided: boolean;
  stipend_amount?: number;
  expires_at: string;
}

const PostJob = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSkillsCount, setSelectedSkillsCount] = useState(0);

  // Use the hooks
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories('volunteer');
  const { data: zipData, loading: zipLoading, error: zipError, lookup } = useZipLookup();
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    category: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    skills_needed: [],
    time_commitment: '',
    duration_hours: 1,
    volunteers_needed: 1,
    age_requirement: '',
    background_check_required: false,
    training_provided: false,
    start_date: '',
    end_date: '',
    flexible_schedule: false,
    preferred_times: '',
    urgency: 'medium',
    remote_possible: false,
    transportation_provided: false,
    meal_provided: false,
    expires_at: ''
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setSelectedSkillsCount(formData.skills_needed.length);
  }, [formData.skills_needed]);

  // Auto-fill city/state when ZIP data arrives
  useEffect(() => {
    if (zipData) {
      setFormData(prev => ({
        ...prev,
        city: zipData.city,
        state: zipData.state,
        latitude: zipData.lat,
        longitude: zipData.lon,
      }));
    }
  }, [zipData]);

  // Use categories from hook
  const categoryOptions = categories.map(cat => cat.category_name);

  const skillGroups: Record<string, string[]> = {
    'Administration & Documentation': [
      'Administrative', 'Data Entry', 'Documentation', 'Fundraising', 'Grant Writing / Story Collection'
    ],
    'Construction & Repair': [
      'Heavy Lifting', 'Construction', 'Electrical Work', 'Plumbing', 'HVAC', 'Roofing', 'Debris Removal', 'Tarp Installation / Temporary Repairs', 'Damage Documentation / Media Support'
    ],
    'Health & Safety': [
      'First Aid', 'Medical Knowledge', 'Mental Health Support', 'Crisis Response', 'Disability Support'
    ],
    'Community & Support': [
      'IT Support', 'Translation', 'Elder Care', 'Childcare', 'Pet Care', 'Cleaning', 'Shelter Support / Intake', 'Legal Aid Navigation', 'Phone Banking / Wellness Checks'
    ],
    'Education & Outreach': [
      'Comms & Social Media Outreach', 'Community Awareness / Outreach', 'Youth Education / Engagement', 'Homework Help / Learning Support'
    ],
    'Logistics': [
      'Driving', 'Transportation Coordination', 'Donation Sorting / Distribution', 'Digital Support / Form Assistance', 'Shelter Registration Assistance'
    ]
  };

  const timeCommitmentOptions = [
    'One-time event', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly',
    'Seasonal', 'Ongoing', 'Flexible'
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low - General opportunity', color: 'bg-gray-100 text-gray-700', icon: Calendar },
    { value: 'medium', label: 'Medium - Preferred timeline', color: 'bg-blue-100 text-blue-700', icon: Clock },
    { value: 'high', label: 'High - Needed soon', color: 'bg-orange-100 text-orange-700', icon: Target },
    { value: 'urgent', label: 'Urgent - Immediate need', color: 'bg-red-100 text-red-700', icon: Zap }
  ];

  const stepInfo = [
    { icon: Sparkles, title: 'Basic Info', desc: 'Tell us about your opportunity' },
    { icon: MapPin, title: 'Location', desc: 'Where will volunteers help?' },
    { icon: Users, title: 'Requirements', desc: 'What do you need?' },
    { icon: Award, title: 'Final Details', desc: 'Add the finishing touches' }
  ];

  const updateFormData = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    const current = formData.skills_needed;
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    updateFormData('skills_needed', updated);
  };

  const updateGroupSkills = (group: string, selected: string[]) => {
    setFormData(prev => {
      const remaining = prev.skills_needed.filter(
        s => !skillGroups[group].includes(s)
      );
      return { ...prev, skills_needed: [...remaining, ...selected] };
    });
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return formData.contact_email && formData.city && formData.state && formData.zipcode && !zipLoading && !zipError;
      case 3:
        return formData.time_commitment && formData.volunteers_needed > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      alert('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      alert('Please complete all required fields.');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setJobId(12345);
    }, 2000);
  };

  const getCompletionPercentage = () => {
    const totalFields = 10; // Approximate number of key fields
    let completed = 0;
    if (formData.title) completed++;
    if (formData.description) completed++;
    if (formData.category) completed++;
    if (formData.contact_email) completed++;
    if (formData.city) completed++;
    if (formData.state) completed++;
    if (formData.zipcode) completed++;
    if (formData.time_commitment) completed++;
    if (formData.volunteers_needed > 0) completed++;
    if (formData.urgency) completed++;
    
    return Math.round((completed / totalFields) * 100);
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center transform animate-in slide-in-from-bottom-4 duration-700">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full animate-ping"></div>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-in zoom-in duration-500" />
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Opportunity Posted!
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Your volunteer opportunity is now live and ready to inspire change in your community.
            </p>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8 border border-green-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                What happens next?
              </h3>
              <div className="grid gap-3 text-left">
                {[
                  'Your opportunity is now visible to passionate volunteers',
                  'Applications will arrive directly in your inbox',
                  'Track and manage responses through your dashboard',
                  `Posting expires on ${formData.expires_at ? new Date(formData.expires_at).toLocaleDateString() : 'the scheduled date'}`
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              {jobId && (
                <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  View Your Posting
                </button>
              )}
              <button className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Browse Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Opportunity
              </h1>
              <p className="text-gray-600 mt-1">Step {currentStep} of 4 • {getCompletionPercentage()}% Complete</p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{selectedSkillsCount} skills selected</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Target className="w-4 h-4" />
                <span>{formData.volunteers_needed} volunteers needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {stepInfo.map((step, index) => {
              const stepNumber = index + 1;
              const StepIcon = step.icon;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              
              return (
                <div key={stepNumber} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
                      isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 animate-pulse' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 hidden sm:block">{step.desc}</p>
                    </div>
                  </div>
                  {stepNumber < 4 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                      stepNumber < currentStep ? 'bg-green-400' : 'bg-gray-200'
                    }`}>
                      {stepNumber < currentStep && (
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-in slide-in-from-left duration-700"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Form Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className={`bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Tell Us About Your Opportunity</h2>
                    <p className="text-gray-600">Create an inspiring opportunity that will attract passionate volunteers</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Opportunity Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="e.g., Help Build Community Gardens That Feed Families"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Category *
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300 appearance-none bg-white"
                        disabled={categoriesLoading}
                      >
                        <option value="">
                          {categoriesLoading ? 'Loading categories...' : 'Choose the best category for your opportunity'}
                        </option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                      </div>
                    </div>
                    {categoriesError && (
                      <p className="text-xs text-red-600 mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Error loading categories: {categoriesError}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      rows={6}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300 resize-none"
                      placeholder="Paint a compelling picture of your volunteer opportunity. What will volunteers do? What impact will they make? What makes this opportunity special and meaningful?"
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-gray-500">Make it inspiring and detailed</p>
                      <p className="text-xs text-gray-400">{formData.description.length} characters</p>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Skills & Expertise Needed
                    </label>
                    <div className="space-y-4">
                      {Object.entries(skillGroups).map(([groupName, skills]) => {
                        const selectedSkillsInGroup = formData.skills_needed.filter(skill => 
                          skills.includes(skill)
                        );
                        
                        return (
                          <div key={groupName} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                              <Star className="w-4 h-4 mr-2 text-yellow-500" />
                              {groupName}
                              {selectedSkillsInGroup.length > 0 && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  {selectedSkillsInGroup.length} selected
                                </span>
                              )}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {skills.map((skill) => {
                                const isSelected = formData.skills_needed.includes(skill);
                                return (
                                  <label key={skill} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSkillToggle(skill)}
                                      className="rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className={`text-sm transition-colors ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                      {skill}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      Select all skills that would be helpful - volunteers can filter by their abilities
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Location & Contact Details</h2>
                    <p className="text-gray-600">Help volunteers find you and get in touch</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => updateFormData('contact_name', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                        placeholder="Your name or organization contact"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contact_email}
                        onChange={(e) => updateFormData('contact_email', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData('contact_phone', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="123 Community Street"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                        placeholder="City name"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => updateFormData('state', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                        placeholder="State"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Zipcode *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.zipcode}
                        onChange={(e) => {
                          updateFormData('zipcode', e.target.value);
                          if (/^\d{5}$/.test(e.target.value)) {
                            lookup(e.target.value);
                          }
                        }}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 group-hover:border-gray-300"
                        placeholder="12345"
                      />
                      {zipLoading && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                          Looking up ZIP code...
                        </p>
                      )}
                      {zipError && (
                        <p className="text-xs text-red-600 mt-2 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {zipError}
                        </p>
                      )}
                      {zipData && (
                        <p className="text-xs text-green-600 mt-2 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Found: {zipData.city}, {zipData.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements & Schedule */}
            {currentStep === 3 && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Requirements & Schedule</h2>
                    <p className="text-gray-600">Set expectations and timeline for volunteers</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Time Commitment *
                      </label>
                      <select
                        required
                        value={formData.time_commitment}
                        onChange={(e) => updateFormData('time_commitment', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300 appearance-none bg-white"
                      >
                        <option value="">How often do you need help?</option>
                        {timeCommitmentOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Duration (hours per session)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={formData.duration_hours}
                          onChange={(e) => updateFormData('duration_hours', parseInt(e.target.value))}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                          hours
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Number of Volunteers Needed *
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => updateFormData('volunteers_needed', Math.max(1, formData.volunteers_needed - 1))}
                        className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.volunteers_needed}
                          onChange={(e) => updateFormData('volunteers_needed', parseInt(e.target.value))}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-center text-lg font-semibold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => updateFormData('volunteers_needed', formData.volunteers_needed + 1)}
                        className="w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Age Requirement
                    </label>
                    <input
                      type="text"
                      value={formData.age_requirement}
                      onChange={(e) => updateFormData('age_requirement', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="e.g., 18+, All ages welcome, 16+ with parent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => updateFormData('start_date', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => updateFormData('end_date', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Preferred Times
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_times}
                      onChange={(e) => updateFormData('preferred_times', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-300"
                      placeholder="e.g., Weekends, Evenings, Monday-Friday 9-5"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Priority Level
                    </label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {urgencyOptions.map((option) => {
                        const IconComponent = option.icon;
                        const isSelected = formData.urgency === option.value;
                        return (
                          <label key={option.value} className="cursor-pointer">
                            <input
                              type="radio"
                              name="urgency"
                              value={option.value}
                              checked={isSelected}
                              onChange={(e) => updateFormData('urgency', e.target.value)}
                              className="sr-only"
                            />
                            <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                              isSelected 
                                ? 'border-blue-500 ' + option.color + ' transform scale-105' 
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <IconComponent className={`w-5 h-5 ${isSelected ? '' : 'text-gray-400'}`} />
                                <span className={`font-medium ${isSelected ? '' : 'text-gray-700'}`}>
                                  {option.label}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Additional Details</h2>
                    <p className="text-gray-600">Add the finishing touches to attract the right volunteers</p>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Opportunity Features
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { key: 'background_check_required', label: 'Background check required', icon: Shield },
                        { key: 'training_provided', label: 'Training will be provided', icon: Star },
                        { key: 'flexible_schedule', label: 'Flexible schedule available', icon: Clock },
                        { key: 'remote_possible', label: 'Remote work possible', icon: Globe },
                        { key: 'transportation_provided', label: 'Transportation provided', icon: MapPin },
                        { key: 'meal_provided', label: 'Meals provided', icon: Heart }
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isChecked = formData[item.key as keyof JobFormData] as boolean;
                        return (
                          <label key={item.key} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 cursor-pointer transition-colors group">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => updateFormData(item.key as keyof JobFormData, e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <IconComponent className={`w-5 h-5 transition-colors ${isChecked ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-sm transition-colors ${isChecked ? 'text-blue-700 font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Stipend Amount (if any)
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.stipend_amount || ''}
                          onChange={(e) => updateFormData('stipend_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 group-hover:border-gray-300"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Posting Expires On
                      </label>
                      <input
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => updateFormData('expires_at', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 group-hover:border-gray-300"
                      />
                      <p className="text-xs text-gray-500 mt-2">Leave blank to expire in 30 days</p>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      Opportunity Summary
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><span className="font-medium">Title:</span> {formData.title || 'Not specified'}</p>
                        <p><span className="font-medium">Category:</span> {formData.category || 'Not specified'}</p>
                        <p><span className="font-medium">Location:</span> {[formData.city, formData.state].filter(Boolean).join(', ') || 'Not specified'}</p>
                        <p><span className="font-medium">Volunteers needed:</span> {formData.volunteers_needed}</p>
                      </div>
                      <div className="space-y-2">
                        <p><span className="font-medium">Time commitment:</span> {formData.time_commitment || 'Not specified'}</p>
                        <p><span className="font-medium">Duration:</span> {formData.duration_hours} hours</p>
                        <p><span className="font-medium">Skills selected:</span> {formData.skills_needed.length}</p>
                        <p><span className="font-medium">Priority:</span> {urgencyOptions.find(u => u.value === formData.urgency)?.label.split(' - ')[0] || 'Medium'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Navigation Buttons */}
            <div className="flex justify-between items-center mt-10 pt-8 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-3 px-8 py-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Previous</span>
              </button>

              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                  ></div>
                </div>
                <span>{Math.round((currentStep / 4) * 100)}%</span>
              </div>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="font-medium">Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-75 transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="font-medium">Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Create Opportunity</span>
                      <Sparkles className="w-5 h-5" />
                    </>
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