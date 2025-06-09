// src/components/PostJob.tsx
import React, { useState } from 'react';
import {
  Plus, MapPin, Clock, AlertCircle, CheckCircle,
  ArrowRight, ArrowLeft, Shield
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

/* ───────────────────────── Types ───────────────────────── */

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

/* ───────────────────── Component ───────────────────── */

const PostJob = () => {
  /* wizard state */
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);

  /* fetch categories */
  const { categories, loading: categoriesLoading, error: categoriesError } =
    useCategories('volunteer');

  /* form data */
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

  /* static skill groups */
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

  /* ───────── Helper utilities ───────── */

  const update = (field: keyof JobFormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /** Replace only the skills that belong to a category; keep the others intact */
  const updateGroupSkills = (group: string, selected: string[]) =>
    setFormData((prev) => {
      const other = prev.skills_needed.filter(
        (s) => !skillGroups[group].includes(s)
      );
      return { ...prev, skills_needed: [...other, ...selected] };
    });

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

  /* ───────── Submit handler ───────── */

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

  /* ───────── Success screen ───────── */

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

  /* ───────────────────── Form wizard ───────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- Header ---------- */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Post Volunteer Opportunity
          </h1>
          <p className="text-gray-600">Step {currentStep} of 4</p>
        </div>
      </div>

      {/* ---------- Progress bar ---------- */}
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

      {/* ---------- Form content ---------- */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* ================================================================
                STEP 1 – Basic Information
            ================================================================= */}
            {currentStep === 1 && (
              <div>
                {/* ---------- Section header ---------- */}
                <div className="flex items-center mb-6">
                  <Plus className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>

                <div className="space-y-4">
                  {/* ---------- Title ---------- */}
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

                  {/* ---------- Category ---------- */}
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

                    {/* category description */}
                    {formData.category &&
                      categories.find((c) => c.category_name === formData.category)
                        ?.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {
                            categories.find(
                              (c) => c.category_name === formData.category
                            )?.description
                          }
                        </p>
                      )}
                  </div>

                  {/* ---------- Description ---------- */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => update('description', e.target.value)}
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the volunteer opportunity, what volunteers will do, and the impact they'll make..."
                    />
                  </div>

                  {/* ---------- Skills Needed (multi‑select per category) ---------- */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills Needed
                    </label>

                    {Object.entries(skillGroups).map(([group, skills]) => {
                      const selectedInGroup = formData.skills_needed.filter((s) =>
                        skills.includes(s)
                      );
                      return (
                        <details
                          key={group}
                          className="mb-3 border border-gray-200 rounded-lg"
                        >
                          <summary className="cursor-pointer select-none list-none py-2 px-3 bg-gray-100 font-medium flex justify-between items-center">
                            {group}
                          </summary>
                          <div className="p-3">
                            <select
                              multiple
                              size={Math.min(6, skills.length)}
                              value={selectedInGroup}
                              onChange={(e) =>
                                updateGroupSkills(
                                  group,
                                  Array.from(e.target.selectedOptions).map(
                                    (o) => o.value
                                  )
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {skills.map((skill) => (
                                <option key={skill} value={skill}>
                                  {skill}
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                              Hold Ctrl (Windows) or ⌘ (Mac) to select multiple.
                            </p>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                STEP 2 – Location & Contact
            ================================================================= */}
            {currentStep === 2 && (
              <div>
                {/* ---------- Section header ---------- */}
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Location & Contact</h2>
                </div>

                <div className="space-y-4">
                  {/* contact name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => update('contact_name', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* contact email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => update('contact_email', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* contact phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => update('contact_phone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* street address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => update('address', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* city & state */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => update('city', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => update('state', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* zipcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zipcode *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => update('zipcode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                STEP 3 – Requirements & Schedule
            ================================================================= */}
            {currentStep === 3 && (
              <div>
                {/* ---------- Section header ---------- */}
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">
                    Requirements & Schedule
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* time commitment & duration */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Commitment *
                      </label>
                      <select
                        required
                        value={formData.time_commitment}
                        onChange={(e) =>
                          update('time_commitment', e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select time commitment</option>
                        {timeCommitmentOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours per session)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={formData.duration_hours}
                        onChange={(e) =>
                          update(
                            'duration_hours',
                            parseInt(e.target.value, 10)
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* volunteers needed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Volunteers Needed *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.volunteers_needed}
                      onChange={(e) =>
                        update(
                          'volunteers_needed',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* age requirement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Requirement
                    </label>
                    <input
                      type="text"
                      value={formData.age_requirement}
                      onChange={(e) =>
                        update('age_requirement', e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 18+, All ages welcome, 16+ with parent"
                    />
                  </div>

                  {/* start & end dates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => update('start_date', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => update('end_date', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* preferred times */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Times
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_times}
                      onChange={(e) =>
                        update('preferred_times', e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Weekends, Evenings, Monday-Friday 9-5"
                    />
                  </div>

                  {/* urgency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => update('urgency', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {urgencyOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                STEP 4 – Additional Details
            ================================================================= */}
            {currentStep === 4 && (
              <div>
                {/* ---------- Section header ---------- */}
                <div className="flex items-center mb-6">
                  <Shield className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Additional Details</h2>
                </div>

                <div className="space-y-4">
                  {/* boolean toggles */}
                  <div className="space-y-3">
                    {([
                      [
                        'background_check_required',
                        'Background check required'
                      ],
                      ['training_provided', 'Training will be provided'],
                      ['flexible_schedule', 'Flexible schedule available'],
                      ['remote_possible', 'Remote work possible'],
                      [
                        'transportation_provided',
                        'Transportation provided'
                      ],
                      ['meal_provided', 'Meals provided']
                    ] as [keyof JobFormData, string][]).map(
                      ([key, label]) => (
                        <label key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData[key] as boolean}
                            onChange={(e) => update(key, e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      )
                    )}
                  </div>

                  {/* stipend */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stipend Amount (if any)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.stipend_amount ?? ''}
                      onChange={(e) =>
                        update(
                          'stipend_amount',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posting Expires On
                    </label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => update('expires_at', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to expire in 30 days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                Navigation buttons
            ================================================================= */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {/* prev */}
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* next / submit */}
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Post Opportunity</span>
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
