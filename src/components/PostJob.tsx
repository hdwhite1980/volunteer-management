// src/components/PostJob.tsx
import React, { useState, useEffect } from 'react';
import {
  Plus,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useZipLookup } from '@/hooks/useZipLookup';

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

  /* categories from DB */
  const { categories, loading: categoriesLoading, error: categoriesError } =
    useCategories('volunteer');

  /* ZIP lookup */
  const {
    data: zipData,
    loading: zipLoading,
    error: zipError,
    lookup,
  } = useZipLookup();

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
    expires_at: '',
  });

  /* Autofill city/state & coords when zipData arrives */
  useEffect(() => {
    if (zipData) {
      setFormData((prev) => ({
        ...prev,
        city: zipData.city,
        state: zipData.state,
        latitude: zipData.lat,
        longitude: zipData.lon,
      }));
    }
  }, [zipData]);

  /* -------- static data -------- */
  const skillGroups: Record<string, string[]> = {
    'Administration & Documentation': [
      'Administrative',
      'Data Entry',
      'Documentation',
      'Fundraising',
      'Grant Writing / Story Collection',
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
      'Damage Documentation / Media Support',
    ],
    'Health & Safety': [
      'First Aid',
      'Medical Knowledge',
      'Mental Health Support',
      'Crisis Response',
      'Disability Support',
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
      'Phone Banking / Wellness Checks',
    ],
    'Education & Outreach': [
      'Comms & Social Media Outreach',
      'Community Awareness / Outreach',
      'Youth Education / Engagement',
      'Homework Help / Learning Support',
    ],
    Logistics: [
      'Driving',
      'Transportation Coordination',
      'Donation Sorting / Distribution',
      'Digital Support / Form Assistance',
      'Shelter Registration Assistance',
    ],
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
    'As Needed',
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low - General opportunity' },
    { value: 'medium', label: 'Medium - Preferred timeline' },
    { value: 'high', label: 'High - Needed soon' },
    { value: 'urgent', label: 'Urgent - Immediate need' },
  ];

  /* -------- helpers -------- */
  const update = (field: keyof JobFormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /** replace only skills from one category, keep the rest */
  const updateGroupSkills = (group: string, selected: string[]) =>
    setFormData((prev) => {
      const remaining = prev.skills_needed.filter(
        (s) => !skillGroups[group].includes(s),
      );
      return { ...prev, skills_needed: [...remaining, ...selected] };
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
          formData.zipcode &&
          !zipLoading &&
          !zipError
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

  /* -------- submit -------- */
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
        stipend_amount: formData.stipend_amount ?? null,
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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

  /* ───────────────────── success screen ───────────────────── */
  // ... (success screen unchanged) ...

  /* ───────────────────── wizard ───────────────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      {/* ... header & progress unchanged ... */}

      {/* form content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* ================= STEP 1 ================= */}
            {/* ... step 1 unchanged ... */}

            {/* ================= STEP 2 ================= */}
            {currentStep === 2 && (
              <div>
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Location & Contact</h2>
                </div>
                <div className="space-y-4">
                  {/* contact fields unchanged */}

                  {/* city & state fields */}
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

                  {/* zipcode with lookup */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zipcode *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => {
                        update('zipcode', e.target.value);
                        lookup(e.target.value);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {zipLoading && (
                      <p className="text-xs text-gray-500 mt-1">Checking ZIP…</p>
                    )}
                    {zipError && (
                      <p className="text-xs text-red-600 mt-1">{zipError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3 & 4 ================= */}
            {/* ... steps 3 and 4 unchanged ... */}

            {/* ================= nav buttons ================= */}
            {/* ... nav buttons unchanged ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
