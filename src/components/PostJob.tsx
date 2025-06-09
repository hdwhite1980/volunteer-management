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

const PostJob = () => {
  /* ───────── State ───────── */
  const [currentStep, setCurrentStep]   = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);

  /* categories from DB */
  const { categories, loading: categoriesLoading, error: categoriesError } =
    useCategories('volunteer');

  /* form data */
  const [formData, setFormData] = useState<JobFormData>({
    title: '', description: '', category: '',
    contact_name: '', contact_email: '', contact_phone: '',
    address: '', city: '', state: '', zipcode: '',
    skills_needed: [], time_commitment: '', duration_hours: 1,
    volunteers_needed: 1, age_requirement: '',
    background_check_required: false, training_provided: false,
    start_date: '', end_date: '', flexible_schedule: false,
    preferred_times: '', urgency: 'medium', remote_possible: false,
    transportation_provided: false, meal_provided: false, expires_at: ''
  });

  /* ───────── Constants ───────── */
  const skillGroups: Record<string, string[]> = {
    'Administration & Documentation': [
      'Administrative', 'Data Entry', 'Documentation',
      'Fundraising', 'Grant Writing / Story Collection'
    ],
    'Construction & Repair': [
      'Heavy Lifting', 'Construction', 'Electrical Work',
      'Plumbing', 'HVAC', 'Roofing', 'Debris Removal',
      'Tarp Installation / Temporary Repairs',
      'Damage Documentation / Media Support'
    ],
    'Health & Safety': [
      'First Aid', 'Medical Knowledge', 'Mental Health Support',
      'Crisis Response', 'Disability Support'
    ],
    'Community & Support': [
      'IT Support', 'Translation', 'Elder Care', 'Childcare',
      'Pet Care', 'Cleaning', 'Shelter Support / Intake',
      'Legal Aid Navigation', 'Phone Banking / Wellness Checks'
    ],
    'Education & Outreach': [
      'Comms & Social Media Outreach', 'Community Awareness / Outreach',
      'Youth Education / Engagement', 'Homework Help / Learning Support'
    ],
    'Logistics': [
      'Driving', 'Transportation Coordination',
      'Donation Sorting / Distribution',
      'Digital Support / Form Assistance',
      'Shelter Registration Assistance'
    ]
  };

  const timeCommitmentOptions = [
    'One-time event', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly',
    'Seasonal', 'Ongoing', 'Flexible', 'Emergency Response', 'As Needed'
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Low - General opportunity' },
    { value: 'medium', label: 'Medium - Preferred timeline' },
    { value: 'high', label: 'High - Needed soon' },
    { value: 'urgent', label: 'Urgent - Immediate need' }
  ];

  /* ───────── Helpers ───────── */
  const updateFormData = (field: keyof JobFormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const toggleSkill = (skill: string) =>
    setFormData(prev => ({
      ...prev,
      skills_needed: prev.skills_needed.includes(skill)
        ? prev.skills_needed.filter(s => s !== skill)
        : [...prev.skills_needed, skill]
    }));

  const validateStep = (step: number) => {
    switch (step) {
      case 1: return !!(formData.title && formData.description && formData.category);
      case 2: return !!(
        formData.contact_email && formData.city && formData.state && formData.zipcode
      );
      case 3: return !!(formData.time_commitment && formData.volunteers_needed > 0);
      default: return true;
    }
  };

  const nextStep = () =>
    validateStep(currentStep)
      ? setCurrentStep(prev => Math.min(prev + 1, 4))
      : alert('Please fill in all required fields before continuing.');

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  /* ───────── Submit handler (unchanged) ───────── */
  const handleSubmit = async () => { /* … unchanged … */ };

  /* ───────── Success screen (unchanged) ───────── */
  if (submitSuccess) { /* … unchanged … */ }

  /* ───────── JSX ───────── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header and progress bar (unchanged) */}

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
                  {/* title, category, description (unchanged) */}

                  {/* ---------- Skills Needed (grouped) ---------- */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills Needed
                    </label>

                    {Object.entries(skillGroups).map(([group, skills]) => (
                      <details
                        key={group}
                        className="mb-3 border border-gray-200 rounded-lg"
                      >
                        <summary className="cursor-pointer select-none list-none py-2 px-3 bg-gray-100 font-medium flex justify-between items-center">
                          {group}
                        </summary>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 p-3">
                          {skills.map(skill => (
                            <label
                              key={skill}
                              className="
                                w-1/2 md:w-1/3
                                flex items-center gap-2
                                text-sm whitespace-nowrap cursor-pointer
                              "
                            >
                              <input
                                type="checkbox"
                                checked={formData.skills_needed.includes(skill)}
                                onChange={() => toggleSkill(skill)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              {skill}
                            </label>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                STEP 2 – Location & Contact  (unchanged)
            ================================================================= */}
            {currentStep === 2 && (
              /* … paste the full, unchanged Step 2 JSX here … */
              <> {/* Step 2 content from previous version */} </>
            )}

            {/* ================================================================
                STEP 3 – Requirements & Schedule  (unchanged)
            ================================================================= */}
            {currentStep === 3 && (
              <> {/* Step 3 content from previous version */} </>
            )}

            {/* ================================================================
                STEP 4 – Additional Details  (unchanged)
            ================================================================= */}
            {currentStep === 4 && (
              <> {/* Step 4 content from previous version */} </>
            )}

            {/* navigation buttons (unchanged) */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

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
