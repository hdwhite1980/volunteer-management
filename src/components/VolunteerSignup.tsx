import React, { useState } from 'react';
import {
  User,
  MapPin,
  Heart,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

// 🔌 NEW – dynamic category hook
import { useCategories } from '@/hooks/useCategories';

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

const VolunteerSignup = () => {
  /* -------------------------------------------------- */
  /* ── Local state                                    */
  /* -------------------------------------------------- */
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);

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
      sunday: { available: false, times: [] },
    },
    max_distance: 25,
    transportation: 'own',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    background_check_consent: false,
    email_notifications: true,
    sms_notifications: false,
    notes: '',
  });

  /* -------------------------------------------------- */
  /* ── Static option lists                            */
  /* -------------------------------------------------- */
  const skillsOptions = [
    'Teaching',
    'Tutoring',
    'Administrative',
    'Computer Skills',
    'Social Media',
    'Marketing',
    'Writing',
    'Photography',
    'Event Planning',
    'Fundraising',
    'Construction',
    'Gardening',
    'Cooking',
    'Cleaning',
    'Driving',
    'Public Speaking',
    'Translation',
    'Medical Knowledge',
    'Legal Knowledge',
    'Accounting',
    'Music',
    'Art',
    'Sports Coaching',
    'Childcare',
    'Heavy Lifting',
    'Electrical Work',
    'Plumbing',
    'HVAC',
    'Roofing',
    'IT Support',
    'Data Entry',
    'Mental Health Support',
    'Pet Care',
    'Elder Care',
    'Disability Support',
    'Crisis Response',
    'First Aid',
  ];

  const interestsOptions = [
    'Working with Children',
    'Working with Seniors',
    'Working with Animals',
    'Environmental Protection',
    'Education',
    'Healthcare',
    'Arts & Culture',
    'Sports & Recreation',
    'Community Development',
    'Disaster Relief',
    'Homelessness',
    'Food Security',
    'Mental Health',
    'Technology',
    'Faith-based Work',
    'International Aid',
    'Research',
    'Advocacy',
    'Emergency Response',
    'Home Repairs',
    'Supply Distribution',
    'Transportation',
    'Legal Support',
    'Documentation Help',
    'Language Services',
    'Crisis Support',
  ];

  const timeSlots = [
    'Early Morning (6-9 AM)',
    'Morning (9-12 PM)',
    'Afternoon (12-5 PM)',
    'Evening (5-8 PM)',
    'Night (8-11 PM)',
  ];

  /* -------------------------------------------------- */
  /* ── Dynamic volunteer categories                   */
  /* -------------------------------------------------- */
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories('volunteer');

  // graceful fallback if DB is down or empty
  const fallbackCategories = [
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
    'Fundraising & Community Outreach',
  ];

  const displayedCategories =
    categoriesLoading || categoriesError ? fallbackCategories.map((name) => ({ category_name: name })) : categories;

  /* -------------------------------------------------- */
  /* ── State helpers                                  */
  /* -------------------------------------------------- */
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    updateFormData(
      'skills',
      formData.skills.includes(skill)
        ? formData.skills.filter((s) => s !== skill)
        : [...formData.skills, skill],
    );
  };

  const handleInterestToggle = (interest: string) => {
    updateFormData(
      'interests',
      formData.interests.includes(interest)
        ? formData.interests.filter((i) => i !== interest)
        : [...formData.interests, interest],
    );
  };

  const handleCategoryToggle = (category: string) => {
    updateFormData(
      'categories_interested',
      formData.categories_interested.includes(category)
        ? formData.categories_interested.filter((c) => c !== category)
        : [...formData.categories_interested, category],
    );
  };

  const handleAvailabilityChange = (day: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value,
        },
      },
    }));
  };

  const handleTimeSlotToggle = (day: string, timeSlot: string) => {
    const dayAvailability = formData.availability[day as keyof typeof formData.availability];
    const updatedTimes = dayAvailability.times.includes(timeSlot)
      ? dayAvailability.times.filter((t) => t !== timeSlot)
      : [...dayAvailability.times, timeSlot];

    handleAvailabilityChange(day, 'times', updatedTimes);
  };

  /* -------------------------------------------------- */
  /* ── Validation & navigation                        */
  /* -------------------------------------------------- */
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.first_name &&
          formData.last_name &&
          formData.email &&
          formData.phone
        );
      case 2:
        return (
          formData.address &&
          formData.city &&
          formData.state &&
          formData.zipcode
        );
      case 3:
        return (
          formData.skills.length > 0 ||
          formData.interests.length > 0 ||
          formData.categories_interested.length > 0
        );
      case 4:
        return Object.values(formData.availability).some(
          (d) => d.available && d.times.length,
        );
      case 5:
        return (
          formData.emergency_contact_name &&
          formData.emergency_contact_phone &&
          formData.emergency_contact_relationship &&
          formData.background_check_consent
        );
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    } else {
      alert('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  /* -------------------------------------------------- */
  /* ── Submit                                         */
  /* -------------------------------------------------- */
  const handleSubmit = async () => {
    if (!validateStep(5)) {
      alert('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/volunteer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw await res.json();

      const data = await res.json();
      setNearbyJobs(data.nearby_opportunities || []);
      setSubmitSuccess(true);
    } catch (err: any) {
      alert(`Registration failed: ${err?.error ?? 'Unexpected error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------------------------------------- */
  /* ── Render                                         */
  /* -------------------------------------------------- */
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to our volunteer community!
            </h1>
            <p className="text-gray-600 mb-8">
              Your registration was successful. We\'re excited to have you join us
              in making a difference.
            </p>

            {nearbyJobs.length > 0 && (
              <div className="text-left mb-8">
                <h2 className="text-xl font-semibold mb-4">Opportunities near you:</h2>
                <div className="space-y-3">
                  {nearbyJobs.slice(0, 3).map((job, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.location}</p>
                          <p className="text-sm text-blue-600">{job.category}</p>
                        </div>
                        {job.distance && (
                          <span className="text-sm text-gray-500">{job.distance} mi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => (window.location.href = '/job-board')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse All Opportunities
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Registration</h1>
          <p className="text-gray-600">Step {currentStep} of 5</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* Step 1 – Personal Info */}
            {currentStep === 1 && (
              <section>
                <div className="flex items-center mb-6">
                  <User className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => updateFormData('first_name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => updateFormData('last_name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => updateFormData('birth_date', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.email_notifications}
                        onChange={(e) => updateFormData('email_notifications', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 mt-1" />
                      <span className="text-sm">Send me email notifications about volunteer opportunities</span>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.sms_notifications}
                        onChange={(e) => updateFormData('sms_notifications', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 mt-1" />
                      <span className="text-sm">Send me SMS notifications about volunteer opportunities</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional information you'd like to share..." />
                  </div>
                </div>
              </section>
            )}

            {/* Step 2 – Location */}
            {currentStep === 2 && (
              <section>
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Location & Transportation</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => updateFormData('state', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zipcode *</label>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => updateFormData('zipcode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Travel Distance</label>
                    <select
                      value={formData.max_distance}
                      onChange={(e) => updateFormData('max_distance', parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" >
                      <option value={5}>Within 5 miles</option>
                      <option value={10}>Within 10 miles</option>
                      <option value={25}>Within 25 miles</option>
                      <option value={50}>Within 50 miles</option>
                      <option value={100}>Within 100 miles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transportation</label>
                    <select
                      value={formData.transportation}
                      onChange={(e) => updateFormData('transportation', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" >
                      <option value="own">Own Vehicle</option>
                      <option value="public">Public Transportation</option>
                      <option value="carpool">Willing to Carpool</option>
                      <option value="limited">Limited Transportation</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* Step 3 – Skills & Interests */}
            {currentStep === 3 && (
              <section>
                <div className="flex items-center mb-6">
                  <Heart className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Skills & Interests</h2>
                </div>
                <div className="space-y-6">
                  {/* Skills */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Skills</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {skillsOptions.map((skill) => (
                        <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                            className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Interests</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {interestsOptions.map((interest) => (
                        <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                            className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Categories – dynamic */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Volunteer Categories You're Interested In</h3>

                    {/* Loading / Error banners */}
                    {categoriesLoading && (
                      <div className="text-center py-2 text-gray-500">Loading categories…</div>
                    )}
                    {categoriesError && (
                      <div className="text-sm text-red-600 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" /> Unable to load categories from database. Showing defaults.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {displayedCategories.map((c: any) => (
                        <label key={c.category_name} className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded" title={c.description || ''}>
                          <input
                            type="checkbox"
                            checked={formData.categories_interested.includes(c.category_name)}
                            onChange={() => handleCategoryToggle(c.category_name)}
                            className="rounded text-blue-600 focus:ring-blue-500 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-medium">{c.category_name}</span>
                            {c.description && <p className="text-gray-500 text-xs mt-1">{c.description}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Experience level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={formData.experience_level}
                      onChange={(e) => updateFormData('experience_level', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" >
                      <option value="beginner">Beginner – New to volunteering</option>
                      <option value="some">Some Experience – 1–2 years</option>
                      <option value="experienced">Experienced – 3+ years</option>
                      <option value="expert">Expert – Leadership experience</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* Step 4 – Availability */}
            {currentStep === 4 && (
              <section>
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Availability</h2>
                </div>
                <div className="space-y-4">
                  {Object.keys(formData.availability).map((day) => (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium capitalize">{day}</h3>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.availability[day as keyof typeof formData.availability].available}
                            onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm">Available</span>
                        </label>
                      </div>
                      {formData.availability[day as keyof typeof formData.availability].available && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {timeSlots.map((slot) => (
                            <label key={slot} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.availability[day as keyof typeof formData.availability].times.includes(slot)}
                                onChange={() => handleTimeSlotToggle(day, slot)}
                                className="rounded text-blue-600 focus:ring-blue-500" />
                              <span className="text-xs">{slot}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Step 5 – Emergency & Consent */}
            {currentStep === 5 && (
              <section>
                <div className="flex items-center mb-6">
                  <Shield className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Emergency Contact & Consent</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergency_contact_name}
                      onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergency_contact_phone}
                      onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => updateFormData('emergency_contact_relationship', e.target.value)}
                      placeholder="e.g., Spouse, Parent, Sibling, Friend"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <label className="flex items-start space-x-3 pt-2 border-t border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.background_check_consent}
                      onChange={(e) => updateFormData('background_check_consent', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 mt-1" />
                    <span className="text-sm">I consent to a background check as required by volunteer roles</span>
                  </label>
                </div>
              </section>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VolunteerSignup;
