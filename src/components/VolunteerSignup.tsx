// src/components/VolunteerSignup.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, MapPin, Heart, Clock, Shield, CheckCircle, ArrowRight, ArrowLeft, 
  Info, Calendar, Phone, Mail, AlertTriangle, Loader2,
  Star, Award, Users, Target, Save
} from 'lucide-react';

// Define static categories to avoid external dependencies that might not exist
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

const VolunteerSignup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
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

  // Mock ZIP lookup since we don't have external dependencies
  const [zipData, setZipData] = useState<any>(null);
  const [zipLoading, setZipLoading] = useState(false);

  const lookupZip = async (zip: string) => {
    if (zip.length === 5) {
      setZipLoading(true);
      // Simulate API call
      setTimeout(() => {
        // Mock data for common ZIP codes
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

  // Auto-save functionality using localStorage instead of external dependencies
  const autoSave = useCallback(async () => {
    if (Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() !== '' : 
      Array.isArray(value) ? value.length > 0 : 
      false
    )) {
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
        
        if (hoursSinceLastSave < 24) {
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
  }, [formData.zipcode]);

  // Auto-fill city and state from ZIP lookup
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
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setNearbyJobs(result.nearby_opportunities || []);
        setSubmitSuccess(true);
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

  const ErrorMessage = ({ error }: { error?: string | null }) => {
    if (!error) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>
        <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
        <span>{error}</span>
      </div>
    );
  };

  const AutoSaveIndicator = () => {
    if (isAutoSaving) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '14px' }}>
          <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
          <span>Saving...</span>
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontSize: '14px' }}>
          <Save style={{ width: '16px', height: '16px' }} />
          <span>Saved {lastSaved.toLocaleTimeString()}</span>
        </div>
      );
    }
    
    return null;
  };

  // Inline styles to avoid conflicts with main app
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #faf5ff 100%)'
    },
    header: {
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb'
    },
    headerContent: {
      maxWidth: '64rem',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#2563eb',
      margin: 0
    },
    subtitle: {
      color: '#6b7280',
      margin: '4px 0 0 0'
    },
    progressContainer: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb'
    },
    progressContent: {
      maxWidth: '64rem',
      margin: '0 auto',
      padding: '16px 24px'
    },
    stepIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    stepCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease'
    },
    stepLine: {
      width: '64px',
      height: '8px',
      borderRadius: '4px',
      transition: 'all 0.5s ease'
    },
    progressBar: {
      marginTop: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      height: '8px'
    },
    formContainer: {
      maxWidth: '64rem',
      margin: '0 auto',
      padding: '32px 24px'
    },
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    },
    formContent: {
      padding: '32px'
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '32px'
    },
    iconContainer: {
      backgroundColor: '#dbeafe',
      borderRadius: '8px',
      padding: '12px',
      marginRight: '16px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#111827',
      margin: 0
    },
    sectionDescription: {
      color: '#6b7280',
      margin: '4px 0 0 0'
    },
    inputGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '16px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff'
    },
    select: {
      width: '100%',
      padding: '16px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff'
    },
    textarea: {
      width: '100%',
      padding: '16px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff',
      resize: 'none' as const
    },
    grid: {
      display: 'grid',
      gap: '24px'
    },
    gridMd2: {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    gridMd3: {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    checkboxGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      padding: '12px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s ease'
    },
    checkbox: {
      width: '16px',
      height: '16px'
    },
    navigation: {
      backgroundColor: '#f9fafb',
      padding: '24px 32px',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 32px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      border: 'none'
    },
    buttonPrimary: {
      backgroundColor: '#2563eb',
      color: '#ffffff'
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      color: '#374151',
      border: '2px solid #d1d5db'
    },
    buttonSuccess: {
      backgroundColor: '#16a34a',
      color: '#ffffff'
    }
  };

  if (submitSuccess) {
    return (
      <div style={styles.container}>
        <div style={{ padding: '32px' }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            <div style={{ ...styles.formCard, padding: '32px', textAlign: 'center' }}>
              <div style={{ marginBottom: '24px' }}>
                <CheckCircle style={{ width: '64px', height: '64px', color: '#16a34a', margin: '0 auto 16px' }} />
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Welcome to our volunteer community!</h1>
                <p style={{ color: '#6b7280', marginBottom: '32px' }}>Your registration was successful. We're excited to have you join us in making a difference.</p>
              </div>
              
              {nearbyJobs.length > 0 && (
                <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Opportunities near you:</h2>
                  <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {nearbyJobs.slice(0, 6).map((job: any, index: number) => (
                      <div key={index} style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px 0' }}>{job.title}</h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>{job.location}</p>
                            <p style={{ fontSize: '14px', color: '#2563eb', margin: 0 }}>{job.category}</p>
                          </div>
                          {job.distance && (
                            <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>
                              {job.distance} mi
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {job.volunteers_needed} volunteers needed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => window.location.href = '/job-board'}
                  style={{ ...styles.button, ...styles.buttonPrimary, justifyContent: 'center' }}
                >
                  Browse All Opportunities
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  style={{ ...styles.button, ...styles.buttonSecondary, justifyContent: 'center' }}
                >
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Volunteer Registration</h1>
            <p style={styles.subtitle}>Join our community of changemakers</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#dbeafe', borderRadius: '8px', padding: '12px' }}>
              <Award style={{ width: '24px', height: '24px', color: '#2563eb' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressContent}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Step {currentStep} of 5</span>
            <AutoSaveIndicator />
          </div>
          <div style={styles.stepIndicator}>
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div style={{
                  ...styles.stepCircle,
                  backgroundColor: step < currentStep ? '#16a34a' : step === currentStep ? '#2563eb' : '#e5e7eb',
                  color: step <= currentStep ? '#ffffff' : '#6b7280'
                }}>
                  {step < currentStep ? <CheckCircle style={{ width: '20px', height: '20px' }} /> : step}
                </div>
                {step < 5 && (
                  <div style={{
                    ...styles.stepLine,
                    backgroundColor: step < currentStep ? '#16a34a' : '#e5e7eb'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={styles.progressBar}>
            <div style={{
              backgroundColor: '#2563eb',
              height: '8px',
              borderRadius: '4px',
              width: `${(currentStep / 5) * 100}%`,
              transition: 'all 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={styles.formContainer}>
        <div style={styles.formCard}>
          
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div style={styles.formContent}>
              <div style={styles.sectionHeader}>
                <div style={{ ...styles.iconContainer, backgroundColor: '#dbeafe' }}>
                  <User style={{ width: '32px', height: '32px', color: '#2563eb' }} />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Personal Information</h2>
                  <p style={styles.sectionDescription}>Tell us about yourself</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ ...styles.grid, ...styles.gridMd2 }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => updateFormData('first_name', e.target.value)}
                      style={styles.input}
                      placeholder="Enter your first name"
                    />
                    <ErrorMessage error={errors.first_name} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => updateFormData('last_name', e.target.value)}
                      style={styles.input}
                      placeholder="Enter your last name"
                    />
                    <ErrorMessage error={errors.last_name} />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail style={{ width: '16px', height: '16px' }} />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    style={styles.input}
                    placeholder="your.email@example.com"
                  />
                  <ErrorMessage error={errors.email} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone style={{ width: '16px', height: '16px' }} />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    style={styles.input}
                    placeholder="(555) 123-4567"
                  />
                  <ErrorMessage error={errors.phone} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar style={{ width: '16px', height: '16px' }} />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateFormData('birth_date', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div style={styles.formContent}>
              <div style={styles.sectionHeader}>
                <div style={{ ...styles.iconContainer, backgroundColor: '#dcfce7' }}>
                  <MapPin style={{ width: '32px', height: '32px', color: '#16a34a' }} />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Location & Transportation</h2>
                  <p style={styles.sectionDescription}>Help us find opportunities near you</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    style={styles.input}
                    placeholder="123 Main Street"
                  />
                  <ErrorMessage error={errors.address} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>ZIP Code *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      value={formData.zipcode}
                      onChange={(e) => updateFormData('zipcode', e.target.value)}
                      style={styles.input}
                      placeholder="12345"
                      maxLength={10}
                    />
                    {zipLoading && (
                      <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                        <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: '#2563eb' }} />
                      </div>
                    )}
                  </div>
                  <ErrorMessage error={errors.zipcode} />
                </div>

                <div style={{ ...styles.grid, ...styles.gridMd2 }}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      style={styles.input}
                      placeholder="City name"
                    />
                    <ErrorMessage error={errors.city} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>State *</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      style={styles.input}
                      placeholder="State"
                      maxLength={2}
                    />
                    <ErrorMessage error={errors.state} />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Maximum Travel Distance</label>
                  <select
                    value={formData.max_distance}
                    onChange={(e) => updateFormData('max_distance', parseInt(e.target.value))}
                    style={styles.select}
                  >
                    <option value={5}>Within 5 miles</option>
                    <option value={10}>Within 10 miles</option>
                    <option value={25}>Within 25 miles</option>
                    <option value={50}>Within 50 miles</option>
                    <option value={100}>Within 100 miles</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Transportation</label>
                  <select
                    value={formData.transportation}
                    onChange={(e) => updateFormData('transportation', e.target.value)}
                    style={styles.select}
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
            <div style={styles.formContent}>
              <div style={styles.sectionHeader}>
                <div style={{ ...styles.iconContainer, backgroundColor: '#f3e8ff' }}>
                  <Heart style={{ width: '32px', height: '32px', color: '#9333ea' }} />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Skills & Interests</h2>
                  <p style={styles.sectionDescription}>Help us match you with the right opportunities</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '32px' }}>
                <div>
                  <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                    <span>Skills</span>
                  </h3>
                  <div style={styles.checkboxGroup}>
                    {skillsOptions.map((skill) => (
                      <label key={skill} style={{
                        ...styles.checkboxLabel,
                        borderColor: formData.skills.includes(skill) ? '#2563eb' : '#e5e7eb',
                        backgroundColor: formData.skills.includes(skill) ? '#eff6ff' : '#ffffff'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          style={styles.checkbox}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                    <span>Interests</span>
                  </h3>
                  <div style={styles.checkboxGroup}>
                    {interestsOptions.map((interest) => (
                      <label key={interest} style={{
                        ...styles.checkboxLabel,
                        borderColor: formData.interests.includes(interest) ? '#9333ea' : '#e5e7eb',
                        backgroundColor: formData.interests.includes(interest) ? '#f3e8ff' : '#ffffff'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          style={styles.checkbox}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target style={{ width: '20px', height: '20px', color: '#16a34a' }} />
                    <span>Preferred Categories</span>
                  </h3>
                  <div style={styles.checkboxGroup}>
                    {VOLUNTEER_CATEGORIES.map((category) => (
                      <label key={category} style={{
                        ...styles.checkboxLabel,
                        borderColor: formData.categories_interested.includes(category) ? '#16a34a' : '#e5e7eb',
                        backgroundColor: formData.categories_interested.includes(category) ? '#dcfce7' : '#ffffff'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.categories_interested.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          style={styles.checkbox}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Experience Level</label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => updateFormData('experience_level', e.target.value)}
                    style={styles.select}
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
            <div style={styles.formContent}>
              <div style={styles.sectionHeader}>
                <div style={{ ...styles.iconContainer, backgroundColor: '#dbeafe' }}>
                  <Clock style={{ width: '32px', height: '32px', color: '#2563eb' }} />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Availability</h2>
                  <p style={styles.sectionDescription}>When are you available to volunteer?</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                {Object.keys(formData.availability).map((day) => (
                  <div key={day} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '18px', textTransform: 'capitalize', color: '#111827', margin: 0 }}>{day}</h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.availability[day as keyof typeof formData.availability].available}
                          onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                          style={{ width: '20px', height: '20px' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Available</span>
                      </label>
                    </div>
                    
                    {formData.availability[day as keyof typeof formData.availability].available && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                        {timeSlots.map((timeSlot) => (
                          <label key={timeSlot} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot) ? '#eff6ff' : '#ffffff',
                            borderColor: formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot) ? '#3b82f6' : '#d1d5db'
                          }}>
                            <input
                              type="checkbox"
                              checked={formData.availability[day as keyof typeof formData.availability].times.includes(timeSlot)}
                              onChange={() => handleTimeSlotToggle(day, timeSlot)}
                              style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: '500' }}>{timeSlot}</span>
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
            <div style={styles.formContent}>
              <div style={styles.sectionHeader}>
                <div style={{ ...styles.iconContainer, backgroundColor: '#fef2f2' }}>
                  <Shield style={{ width: '32px', height: '32px', color: '#dc2626' }} />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Emergency Contact & Consent</h2>
                  <p style={styles.sectionDescription}>Final step - safety and preferences</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield style={{ width: '20px', height: '20px' }} />
                    <span>Emergency Contact Information</span>
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Emergency Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.emergency_contact_name}
                        onChange={(e) => updateFormData('emergency_contact_name', e.target.value)}
                        style={styles.input}
                        placeholder="Full name of emergency contact"
                      />
                      <ErrorMessage error={errors.emergency_contact_name} />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Emergency Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.emergency_contact_phone}
                        onChange={(e) => updateFormData('emergency_contact_phone', e.target.value)}
                        style={styles.input}
                        placeholder="(555) 123-4567"
                      />
                      <ErrorMessage error={errors.emergency_contact_phone} />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Relationship *</label>
                      <input
                        type="text"
                        required
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => updateFormData('emergency_contact_relationship', e.target.value)}
                        style={styles.input}
                        placeholder="e.g., Spouse, Parent, Sibling, Friend"
                      />
                      <ErrorMessage error={errors.emergency_contact_relationship} />
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '24px' }}>
                  <h3 style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '16px' }}>Consent & Preferences</h3>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.background_check_consent}
                        onChange={(e) => updateFormData('background_check_consent', e.target.checked)}
                        style={{ marginTop: '4px', width: '20px', height: '20px' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          I consent to background checks as required by volunteer opportunities
                        </span>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                          Some opportunities may require background checks for safety reasons
                        </p>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.email_notifications}
                        onChange={(e) => updateFormData('email_notifications', e.target.checked)}
                        style={{ marginTop: '4px', width: '20px', height: '20px' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          📧 Send me email notifications about volunteer opportunities
                        </span>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                          We'll send you relevant opportunities and important updates
                        </p>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.sms_notifications}
                        onChange={(e) => updateFormData('sms_notifications', e.target.checked)}
                        style={{ marginTop: '4px', width: '20px', height: '20px' }}
                      />
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>
                          📱 Send me SMS notifications about urgent opportunities
                        </span>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                          Get text alerts for time-sensitive volunteer needs
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Additional Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    rows={4}
                    style={styles.textarea}
                    placeholder="Tell us anything else we should know about your volunteer interests, special accommodations needed, or other relevant information..."
                  />
                </div>

                <ErrorMessage error={errors.submit} />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={styles.navigation}>
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                opacity: currentStep === 1 ? 0.5 : 1,
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
              <span>Previous</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={autoSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={isAutoSaving}
              >
                {isAutoSaving ? (
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Save style={{ width: '16px', height: '16px' }} />
                )}
                <span>Save Progress</span>
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  style={{ ...styles.button, ...styles.buttonPrimary }}
                >
                  <span>Next</span>
                  <ArrowRight style={{ width: '20px', height: '20px' }} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    ...styles.button,
                    ...styles.buttonSuccess,
                    opacity: isSubmitting ? 0.5 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle style={{ width: '20px', height: '20px' }} />
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
  );
};

export default VolunteerSignup;