// src/components/PostJob.tsx
import React, { useState } from 'react';
import { Plus, MapPin, Users, Clock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Calendar, Shield } from 'lucide-react';
// Import the custom hook (adjust path as needed)
// import { useCategories } from '@/hooks/useCategories';

// Since we can't import in this environment, I'll include the hook inline
const useCategories = (type?: 'volunteer' | 'requester', active: boolean = true) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (type) params.append('type', type);
        params.append('active', active.toString());

        const response = await fetch(`/api/categories?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        
        if (type) {
          setCategories(data);
        } else {
          setCategories([...data.volunteer, ...data.requester]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
        
        // Fallback to hardcoded categories
        if (type === 'volunteer') {
          setCategories([
            { id: 1, category_name: 'Debris Removal & Cleanup', description: 'Help remove storm debris, fallen trees, and damaged materials' },
            { id: 2, category_name: 'Structural Assessment & Repair', description: 'Assist with evaluating and repairing structural damage' },
            { id: 3, category_name: 'Home Stabilization (e.g., tarping, boarding)', description: 'Install temporary protective measures' },
            { id: 4, category_name: 'Utility Restoration Support', description: 'Support efforts to restore essential utilities' },
            { id: 5, category_name: 'Supply Distribution', description: 'Help distribute food, water, and essential supplies' },
            { id: 6, category_name: 'Warehouse Management', description: 'Organize and manage donated goods' },
            { id: 7, category_name: 'Transportation Assistance', description: 'Provide transportation for people or supplies' },
            { id: 8, category_name: 'Administrative & Office Support', description: 'Assist with data entry and administrative tasks' },
            { id: 9, category_name: 'First Aid & Medical Support', description: 'Provide basic medical care and first aid' },
            { id: 10, category_name: 'Mental Health & Emotional Support', description: 'Offer counseling and emotional support' },
            { id: 11, category_name: 'Spiritual Care', description: 'Provide spiritual comfort and support' },
            { id: 12, category_name: 'Pet Care Services', description: 'Care for displaced or injured pets' },
            { id: 13, category_name: 'Childcare & Youth Programs', description: 'Provide childcare and youth activities' },
            { id: 14, category_name: 'Senior Assistance', description: 'Help elderly residents with specific needs' },
            { id: 15, category_name: 'Multilingual & Translation Support', description: 'Provide translation services' },
            { id: 16, category_name: 'Legal Aid Assistance', description: 'Help with legal documentation and claims' },
            { id: 17, category_name: 'Volunteer Coordination', description: 'Organize and manage volunteer teams' },
            { id: 18, category_name: 'IT & Communication Support', description: 'Set up and maintain communication systems' },
            { id: 19, category_name: 'Damage Assessment & Reporting', description: 'Document and assess property damage' },
            { id: 20, category_name: 'Fundraising & Community Outreach', description: 'Organize fundraising and awareness campaigns' }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [type, active]);

  return { categories, loading, error };
};

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
  
  // Fetch categories from database
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories('volunteer');
  
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

  const skillsOptions = [
    'Teaching', 'Tutoring', 'Administrative', 'Computer Skills', 'Social Media',
    'Marketing', 'Writing', 'Photography', 'Event Planning', 'Fundraising',
    'Construction', 'Gardening', 'Cooking', 'Cleaning', 'Driving',
    'Public Speaking', 'Translation', 'Medical Knowledge', 'Legal Knowledge',
    'Accounting', 'Music', 'Art', 'Sports Coaching', 'Childcare',
    'Heavy Lifting', 'Electrical Work', 'Plumbing', 'HVAC', 'Roofing',
    'IT Support', 'Data Entry', 'Mental Health Support', 'Pet Care',
    'Elder Care', 'Disability Support', 'Crisis Response', 'First Aid',
    'Supply Chain Management', 'Logistics', 'Documentation', 'Assessment'
  ];

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

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category;
      case 2:
        return formData.contact_email && formData.city && formData.state && formData.zipcode;
      case 3:
        return formData.time_commitment && formData.volunteers_needed > 0;
      case 4:
        return true; // Optional fields
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

    try {
      // Set default expires_at if not provided
      const submitData = {
        ...formData,
        expires_at: formData.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stipend_amount: formData.stipend_amount || null
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const result = await response.json();
        setJobId(result.job.id);
        setSubmitSuccess(true);
      } else {
        const error = await response.json();
        alert(`Failed to post job: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Posted Successfully!</h1>
            <p className="text-gray-600 mb-8">
              Your volunteer opportunity has been posted and is now live. Volunteers can view and apply for this position.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li>• Your opportunity is now visible to volunteers</li>
                <li>• You'll receive applications via email</li>
                <li>• You can manage applications through your dashboard</li>
                <li>• The posting will expire on {formData.expires_at ? new Date(formData.expires_at).toLocaleDateString() : 'the scheduled date'}</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              {jobId && (
                <button
                  onClick={() => window.location.href = `/jobs/${jobId}`}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View Your Posting
                </button>
              )}
              <button
                onClick={() => window.location.href = '/job-board'}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Browse All Opportunities
              </button>
              <button
                onClick={() => window.location.href = '/'}
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
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Post Volunteer Opportunity</h1>
          <p className="text-gray-600">Step {currentStep} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step < currentStep ? 'bg-green-500 text-white' :
                  step === currentStep ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div>
                <div className="flex items-center mb-6">
                  <Plus className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opportunity Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Storm Debris Cleanup Volunteer"
                    />
                  </div>

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
                          Unable to load categories from database
                        </div>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => updateFormData('category', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.category_name}>
                              {category.category_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.category_name}>
                            {category.category_name}
                          </option>
                        ))}
                      </select>
                    )}
                    {/* Show category description if one is selected */}
                    {formData.category && categories.find(c => c.category_name === formData.category)?.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {categories.find(c => c.category_name === formData.category)?.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the volunteer opportunity, what volunteers will do, and the impact they'll make..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills Needed
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {skillsOptions.map((skill) => (
                        <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.skills_needed.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <div>
                <div className="flex items-center mb-6">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Location & Contact</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => updateFormData('contact_name', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contact_email}
                      onChange={(e) => updateFormData('contact_email', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => updateFormData('contact_phone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => updateFormData('city', e.target.value)}
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
                        onChange={(e) => updateFormData('state', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zipcode *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => updateFormData('zipcode', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements & Schedule */}
            {currentStep === 3 && (
              <div>
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Requirements & Schedule</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Commitment *
                      </label>
                      <select
                        required
                        value={formData.time_commitment}
                        onChange={(e) => updateFormData('time_commitment', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select time commitment</option>
                        {timeCommitmentOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours per session)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.duration_hours}
                        onChange={(e) => updateFormData('duration_hours', parseInt(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Volunteers Needed *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.volunteers_needed}
                      onChange={(e) => updateFormData('volunteers_needed', parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Requirement
                    </label>
                    <input
                      type="text"
                      value={formData.age_requirement}
                      onChange={(e) => updateFormData('age_requirement', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 18+, All ages welcome, 16+ with parent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => updateFormData('start_date', e.target.value)}
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
                        onChange={(e) => updateFormData('end_date', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Times
                    </label>
                    <input
                      type="text"
                      value={formData.preferred_times}
                      onChange={(e) => updateFormData('preferred_times', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Weekends, Evenings, Monday-Friday 9-5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => updateFormData('urgency', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {urgencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <div>
                <div className="flex items-center mb-6">
                  <Shield className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold">Additional Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.background_check_required}
                        onChange={(e) => updateFormData('background_check_required', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Background check required</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.training_provided}
                        onChange={(e) => updateFormData('training_provided', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Training will be provided</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.flexible_schedule}
                        onChange={(e) => updateFormData('flexible_schedule', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Flexible schedule available</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.remote_possible}
                        onChange={(e) => updateFormData('remote_possible', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Remote work possible</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.transportation_provided}
                        onChange={(e) => updateFormData('transportation_provided', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Transportation provided</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.meal_provided}
                        onChange={(e) => updateFormData('meal_provided', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Meals provided</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stipend Amount (if any)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.stipend_amount || ''}
                      onChange={(e) => updateFormData('stipend_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posting Expires On
                    </label>
                    <input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => updateFormData('expires_at', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to expire in 30 days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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