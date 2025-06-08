// src/components/PostJob.tsx
import React, { useState } from 'react';
import {
  Plus,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

/* ------------------------ types ------------------------- */
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

/* --------------------- component ------------------------ */
const PostJob = () => {
  /* ---- wizard state ---- */
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);

  /* ---- dynamic categories ---- */
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories('volunteer');

  const fallbackCategories = [
    { id: 1, category_name: 'Debris Removal & Cleanup', description: 'Help remove storm debris, fallen trees, and damaged materials' },
    { id: 2, category_name: 'Structural Assessment & Repair', description: 'Assist with evaluating and repairing structural damage' },
    { id: 3, category_name: 'Home Stabilization (e.g., tarping, boarding)', description: 'Install temporary protective measures' },
    // … (trimmed for brevity, include all 20 like earlier)
    { id: 20, category_name: 'Fundraising & Community Outreach', description: 'Organize fundraising and awareness campaigns' },
  ];
  const displayedCategories =
    categoriesLoading || categoriesError ? fallbackCategories : categories;

  /* ---- form data ---- */
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
    expires_at: '',
  });

  /* ---- static option lists ---- */
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
    'Supply Chain Management',
    'Logistics',
    'Documentation',
    'Assessment',
  ];

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
    'As Needed',
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low - General opportunity' },
    { value: 'medium', label: 'Medium - Preferred timeline' },
    { value: 'high', label: 'High - Needed soon' },
    { value: 'urgent', label: 'Urgent - Immediate need' },
  ];

  /* ---- helpers ---- */
  const updateFormData = (field: keyof JobFormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSkillToggle = (skill: string) => {
    updateFormData(
      'skills_needed',
      formData.skills_needed.includes(skill)
        ? formData.skills_needed.filter((s) => s !== skill)
        : [...formData.skills_needed, skill],
    );
  };

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
      ? setCurrentStep((s) => Math.min(s + 1, 4))
      : alert('Please fill in all required fields before continuing.');
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  /* ---- submit ---- */
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      alert('Please complete all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const submitBody = {
        ...formData,
        expires_at:
          formData.expires_at ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stipend_amount: formData.stipend_amount ?? null,
      };
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitBody),
      });
      if (!res.ok) throw await res.json();
      const data = await res.json();
      setJobId(data.job.id);
      setSubmitSuccess(true);
    } catch (err: any) {
      alert(`Failed to post job: ${err?.error ?? 'Unexpected error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- success view ---- */
  if (submitSuccess)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Job Posted Successfully!</h1>
            <p className="text-gray-600 mb-8">
              Your volunteer opportunity is live. Volunteers can now view and apply.
            </p>
            <div className="flex space-x-3 justify-center">
              {jobId && (
                <button
                  onClick={() => (window.location.href = `/jobs/${jobId}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  View Posting
                </button>
              )}
              <button
                onClick={() => (window.location.href = '/job-board')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Browse Jobs
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  /* ------------------ form view ------------------ */
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Post Volunteer Opportunity</h1>
          <p className="text-gray-600">Step {currentStep} of 4</p>
        </div>
      </header>

      {/* progress bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s < currentStep
                      ? 'bg-green-500 text-white'
                      : s === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < currentStep ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      s < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8">
            {/* Step 1: Basic */}
            {currentStep === 1 && (
              <section>
                <div className="flex items-center mb-6">
                  <Plus className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                <div className="space-y-4">
                  <input
                    aria-label="Opportunity Title"
                    placeholder="Title *"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                  {/* Category select */}
                  {categoriesLoading ? (
                    <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-500">
                      Loading categories…
                    </div>
                  ) : (
                    <>
                      {categoriesError && (
                        <p className="text-sm text-red-600 flex items-center mb-1">
                          <AlertCircle className="w-4 h-4 mr-1" /> Unable to load categories — using defaults
                        </p>
                      )}
                      <select
                        aria-label="Category"
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select category *</option>
                        {displayedCategories.map((c: any) => (
                          <option key={c.id} value={c.category_name}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                      {/* Category description */}
                      {formData.category &&
                        displayedCategories.find((c: any) => c.category_name === formData.category)?.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {
                              displayedCategories.find((c: any) => c.category_name === formData.category)?.description
                            }
                          </p>
                        )}
                    </>
                  )}

                  {/* Description */}
                  <textarea
                    aria-label="Description"
                    placeholder="Describe the opportunity *"
                    rows={6}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                  {/* Skills */}
                  <div>
                    <h3 className="font-medium mb-2">Skills Needed</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                      {skillsOptions.map((s) => (
                        <label key={s} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.skills_needed.includes(s)}
                            onChange={() => handleSkillToggle(s)}
                            className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <section>
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Location & Contact</h2>
                </div>
                <div className="space-y-4">
                  {/* contact fields */}
                  {[
                    { key: 'contact_name', label: 'Contact Name', type: 'text' },
                    { key: 'contact_email', label: 'Contact Email *', type: 'email', required: true },
                    { key: 'contact_phone', label: 'Contact Phone', type: 'tel' },
                    { key: 'address', label: 'Street Address', type: 'text' },
                    { key: 'city', label: 'City *', type: 'text', required: true },
                    { key: 'state', label: 'State *', type: 'text', required: true },
                    { key: 'zipcode', label: 'Zipcode *', type: 'text', required: true },
                  ].map((f) => (
                    <input
                      key={f.key}
                      aria-label={f.label}
                      placeholder={f.label}
                      required={f.required}
                      type={f.type}
                      value={formData[f.key as keyof JobFormData] as string}
                      onChange={(e) => updateFormData(f.key as keyof JobFormData, e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  ))}
                </div>
              </section>
            )}

            {/* Step 3: Requirements & Schedule */}
            {currentStep === 3 && (
              <section>
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Requirements & Schedule</h2>
                </div>
                <div className="space-y-4">
                  {/* time commitment */}
                  <select
                    aria-label="Time Commitment"
                    required
                    value={formData.time_commitment}
                    onChange={(e) => updateFormData('time_commitment', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select time commitment *</option>
                    {timeCommitmentOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>

                  <input
                    aria-label="Duration Hours"
                    type="number"
                    min={1}
                    max={24}
                    value={formData.duration_hours}
                    onChange={(e) => updateFormData('duration_hours', parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Duration (hours per session)" />

                  <input
                    aria-label="Volunteers Needed"
                    type="number"
                    min={1}
                    value={formData.volunteers_needed}
                    onChange={(e) => updateFormData('volunteers_needed', parseInt(e.target.value))}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of Volunteers Needed *" />

                  <input
                    aria-label="Age Requirement"
                    placeholder="Age Requirement (optional)"
                    value={formData.age_requirement}
                    onChange={(e) => updateFormData('age_requirement', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                  {/* dates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'start_date', label: 'Start Date' },
                      { key: 'end_date', label: 'End Date' },
                    ].map((d) => (
                      <input
                        key={d.key}
                        aria-label={d.label}
                        type="date"
                        value={formData[d.key as keyof JobFormData] as string}
                        onChange={(e) => updateFormData(d.key as keyof JobFormData, e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    ))}
                  </div>

                  <input
                    aria-label="Preferred Times"
                    placeholder="Preferred Times (e.g., Weekends, Evenings)"
                    value={formData.preferred_times}
                    onChange={(e) => updateFormData('preferred_times', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                  {/* urgency */}
                  <select
                    aria-label="Urgency"
                    value={formData.urgency}
                    onChange={(e) => updateFormData('urgency', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    {urgencyOptions.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <section>
                <div className="flex items-center mb-6">
                  <Shield className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Additional Details</h2>
                </div>
                <div className="space-y-4">
                  {[
                    ['background_check_required', 'Background check required'],
                    ['training_provided', 'Training provided'],
                    ['flexible_schedule', 'Flexible schedule'],
                    ['remote_possible', 'Remote work possible'],
                    ['transportation_provided', 'Transportation provided'],
                    ['meal_provided', 'Meals provided'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof JobFormData] as boolean}
                        onChange={(e) => updateFormData(key as keyof JobFormData, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}

                  <input
                    aria-label="Stipend Amount"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Stipend Amount (optional)"
                    value={formData.stipend_amount ?? ''}
                    onChange={(e) =>
                      updateFormData(
                        'stipend_amount',
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                  <input
                    aria-label="Expires At"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => updateFormData('expires_at', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-500">Leave blank to expire in 30 days.</p>
                </div>
              </section>
            )}

            {/* nav buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <ArrowLeft className="w-4 h-4" /> <span>Previous</span>
              </button>
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <span>Next</span> <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Posting…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> <span>Post Opportunity</span>
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

export default PostJob;
