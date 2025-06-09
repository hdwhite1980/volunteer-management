// src/components/PostJob.tsx
import React, { useState } from 'react';
import {
  Plus, MapPin, Clock, AlertCircle, CheckCircle,
  ArrowRight, ArrowLeft, Shield
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

/* ─────────────────────────── Types ─────────────────────────── */
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

/* ───────────────────────── Component ───────────────────────── */
const PostJob = () => {
  /* ----- multi‑step wizard state ----- */
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);

  /* ----- category list from DB ----- */
  const { categories, loading: categoriesLoading, error: categoriesError } =
    useCategories('volunteer');

  /* ----- form data ----- */
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

  /* ----- constants ----- */
  const skillGroups: Record<string, string[]> = {
    'Administration & Documentation': [
      'Administrative',
      'Data Entry',
      'Documentation',
      'Fundraising',
      'Grant Writing / Story Collection'
    ],
    'Construction & Repair': [
      'Heavy Lifting',
      'Construction',
      'Electrical Work',
      'Plumbing',
      'HVAC',
      'Roofing',
      'Debris Removal',
      'Tarp Installation / Temporary Repairs',
      'Damage Documentation / Media Support'
    ],
    'Health & Safety': [
      'First Aid',
      'Medical Knowledge',
      'Mental Health Support',
      'Crisis Response',
      'Disability Support'
    ],
    'Community & Support': [
      'IT Support',
      'Translation',
      'Elder Care',
      'Childcare',
      'Pet Care',
      'Cleaning',
      'Shelter Support / Intake',
      'Legal Aid Navigation',
      'Phone Banking / Wellness Checks'
    ],
    'Education & Outreach': [
      'Comms & Social Media Outreach',
      'Community Awareness / Outreach',
      'Youth Education / Engagement',
      'Homework Help / Learning Support'
    ],
    Logistics: [
      'Driving',
      'Transportation Coordination',
      'Donation Sorting / Distribution',
      'Digital Support / Form Assistance',
      'Shelter Registration Assistance'
    ]
  };

  const timeCommitmentOptions = [
    'One-time event',
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'Quarterly',
    'Seasonal',
    'Ongoing',
    'Flexible',
    'Emergency Response',
    'As Needed'
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low - General opportunity' },
    { value: 'medium', label: 'Medium - Preferred timeline' },
    { value: 'high', label: 'High - Needed soon' },
    { value: 'urgent', label: 'Urgent - Immediate need' }
  ];

  /* ----- helpers ----- */
  const update = (field: keyof JobFormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleSkill = (skill: string) =>
    setFormData((prev) => ({
      ...prev,
      skills_needed: prev.skills_needed.includes(skill)
        ? prev.skills_needed.filter((s) => s !== skill)
        : [...prev.skills_needed, skill]
    }));

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return (
          formData.contact_email &&
          formData.city &&
          formData.state &&
          formData.zipcode
        );
      case 3:
        return formData.time_commitment && formData.volunteers_needed > 0;
      default:
        return true;
    }
  };

  const nextStep = () =>
    validateStep(currentStep)
      ? setCurrentStep((p) => Math.min(p + 1, 4))
      : alert('Please fill in all required fields before continuing.');

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      alert('Please complete all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        expires_at:
          formData.expires_at ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stipend_amount: formData.stipend_amount ?? null
      };
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const { job } = await res.json();
        setJobId(job.id);
        setSubmitSuccess(true);
      } else {
        const { error } = await res.json();
        alert(`Failed to post job: ${error}`);
      }
    } catch {
      alert('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----- success screen ----- */
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Job Posted Successfully!
            </h1>
            <p className="text-gray-600 mb-8">
              Your volunteer opportunity has been posted and is now live. Volunteers can
              view and apply for this position.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li>• Your opportunity is now visible to volunteers</li>
                <li>• You'll receive applications via email</li>
                <li>• You can manage applications through your dashboard</li>
                <li>
                  • The posting will expire on{' '}
                  {formData.expires_at
                    ? new Date(formData.expires_at).toLocaleDateString()
                    : 'the scheduled date'}
                </li>
              </ul>
            </div>

            <div className="flex space-x-4">
              {jobId && (
                <button
                  onClick={() => (window.location.href = `/jobs/${jobId}`)}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View Your Posting
                </button>
              )}
              <button
                onClick={() => (window.location.href = '/job-board')}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
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

  /* ----- form wizard ----- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Post Volunteer Opportunity
          </h1>
          <p className="text-gray-600">Step {currentStep} of 4</p>
        </div>
      </div>

      {/* progress bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
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
                {step < 4 && (
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

      {/* form content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* ================================================================
                STEP 1 – Basic Information
            ================================================================= */}
            {currentStep === 1 && (
              <div>
                <div className="flex items-center mb-6">
                  <Plus className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>

                <div className="space-y-4">
                  {/* title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opportunity Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => update('title', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Storm Debris Cleanup Volunteer"
                    />
                  </div>

                  {/* category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    {categoriesLoading ? (
                      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        Loading categories...
                      </div>
                    ) : categoriesError ? (
                      <div className="space-y-2">
                        <div className="text-sm text-red-600 mb-2">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Unable to load categories from database. Using default categories.
                        </div>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => update('category', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => update('category', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.category_name}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    )}
                    {formData.category &&
                      categories.find((c) => c.category_name === formD_
