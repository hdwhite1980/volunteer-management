'use client';
import React, { useState } from 'react';
import { 
  Clock, User, Edit, Plus, Trash2, CheckCircle, 
  FileText, Home, Eye, Download 
} from 'lucide-react';

// Partnership Categories
const PARTNERSHIP_CATEGORIES = [
  'Community Outreach & Engagement',
  'Educational Programs & Workshops',
  'Disaster Preparedness Training',
  'Resource Development & Management',
  'Fundraising & Grant Writing',
  'Event Planning & Coordination',
  'Media Relations & Communications',
  'Volunteer Recruitment & Training',
  'Inter-Agency Collaboration',
  'Policy Development & Advocacy',
  'Research & Data Analysis',
  'Technology Integration & Support',
  'Mental Health & Wellness Programs',
  'Environmental Sustainability',
  'Cultural Competency & Inclusion'
];

interface PartnershipFormProps {
  onBack: () => void;
  onHome?: () => void;
}

const PartnershipForm: React.FC<PartnershipFormProps> = ({ onBack, onHome }) => {
  const [formData, setFormData] = useState({
    volunteer_name: '',
    email: '',
    phone: '',
    organization: '',
    partnership_coordinator: '',
    prepared_by_first: '',
    prepared_by_last: '',
    position_title: ''
  });
  
  const [partnerships, setPartnerships] = useState([
    { 
      date: '', 
      activity: '', 
      partner_organization: '', 
      location: '', 
      hours: '', 
      description: '',
      impact_metrics: ''
    }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const addPartnership = () => {
    setPartnerships([...partnerships, { 
      date: '', 
      activity: '', 
      partner_organization: '', 
      location: '', 
      hours: '', 
      description: '',
      impact_metrics: ''
    }]);
  };

  const removePartnership = (index: number) => {
    if (partnerships.length > 1) {
      const newPartnerships = partnerships.filter((_, i) => i !== index);
      setPartnerships(newPartnerships);
    }
  };

  const updatePartnership = (index: number, field: keyof typeof partnerships[0], value: string) => {
    const newPartnerships = [...partnerships];
    newPartnerships[index][field] = value;
    setPartnerships(newPartnerships);
  };

  const calculateTotalHours = () => {
    return partnerships.reduce((total, partnership) => {
      return total + (parseFloat(partnership.hours) || 0);
    }, 0);
  };

  const generatePreviewPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Partnership Volunteer Log - Preview</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #374151; 
                line-height: 1.6;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                padding-bottom: 20px; 
                border-bottom: 3px solid #2563eb; 
              }
              .header h1 { 
                color: #1f2937; 
                font-size: 24px; 
                margin-bottom: 5px; 
              }
              .info-section {
                margin: 20px 0;
                padding: 15px;
                background: #f9fafb;
                border-radius: 8px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 10px;
              }
              .info-item {
                padding: 8px;
              }
              .info-label {
                font-weight: bold;
                color: #374151;
                display: block;
                margin-bottom: 3px;
              }
              .info-value {
                color: #6b7280;
              }
              .partnerships-section {
                margin: 30px 0;
              }
              .partnership-item {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
              }
              .partnership-header {
                font-size: 16px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
              }
              .partnership-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 10px;
              }
              .total-hours {
                background: #dbeafe;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                color: #2563eb;
                margin: 20px 0;
              }
              .prepared-by {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🤝 Partnership Volunteer Log (ICS 214A)</h1>
              <p>Volunteer Community Engagement Group</p>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>

            <div class="info-section">
              <h3>Volunteer Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${formData.volunteer_name || '[Not specified]'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${formData.email || '[Not specified]'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${formData.phone || '[Not specified]'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Organization:</span>
                  <span class="info-value">${formData.organization || '[Not specified]'}</span>
                </div>
              </div>
            </div>

            <div class="partnerships-section">
              <h3>Partnership Activities</h3>
              ${partnerships.map((partnership, index) => `
                <div class="partnership-item">
                  <div class="partnership-header">Partnership Activity ${index + 1}</div>
                  <div class="partnership-grid">
                    <div>
                      <span class="info-label">Date:</span>
                      <span class="info-value">${partnership.date || '[Not specified]'}</span>
                    </div>
                    <div>
                      <span class="info-label">Activity:</span>
                      <span class="info-value">${partnership.activity || '[Not specified]'}</span>
                    </div>
                    <div>
                      <span class="info-label">Hours:</span>
                      <span class="info-value">${partnership.hours || '0'}</span>
                    </div>
                    <div>
                      <span class="info-label">Partner Org:</span>
                      <span class="info-value">${partnership.partner_organization || '[Not specified]'}</span>
                    </div>
                    <div>
                      <span class="info-label">Location:</span>
                      <span class="info-value">${partnership.location || '[Not specified]'}</span>
                    </div>
                  </div>
                  ${partnership.description ? `
                    <div style="margin-top: 10px;">
                      <span class="info-label">Description:</span>
                      <div style="margin-top: 5px; padding: 8px; background: #f3f4f6; border-radius: 4px;">
                        ${partnership.description}
                      </div>
                    </div>
                  ` : ''}
                  ${partnership.impact_metrics ? `
                    <div style="margin-top: 10px;">
                      <span class="info-label">Impact Metrics:</span>
                      <div style="margin-top: 5px; padding: 8px; background: #f0fdf4; border-radius: 4px;">
                        ${partnership.impact_metrics}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            <div class="total-hours">
              Total Partnership Hours: ${calculateTotalHours()}
            </div>

            <div class="prepared-by">
              <h3>Prepared By</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${formData.prepared_by_first || '[First]'} ${formData.prepared_by_last || '[Last]'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Position/Title:</span>
                  <span class="info-value">${formData.position_title || '[Not specified]'}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>This is a preview document. Please review all information before final submission.</p>
              <p>Partnership Volunteer Log - Generated by VCEG Management System</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.volunteer_name || !formData.email || !formData.organization || 
          !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
        alert('Please fill in all required fields (marked with *)');
        return;
      }

      const validPartnerships = partnerships.filter(partnership => 
        partnership.date && partnership.activity && partnership.partner_organization && partnership.description
      );

      if (validPartnerships.length === 0) {
        alert('Please add at least one complete partnership activity with date, type, partner organization, and description');
        return;
      }

      for (const partnership of validPartnerships) {
        if (!partnership.hours || isNaN(parseFloat(partnership.hours))) {
          alert('Please enter valid hours for all partnership activities');
          return;
        }
      }

      const submitData = {
        volunteer_name: formData.volunteer_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        organization: formData.organization.trim(),
        partnership_coordinator: formData.partnership_coordinator?.trim() || null,
        prepared_by_first: formData.prepared_by_first.trim(),
        prepared_by_last: formData.prepared_by_last.trim(),
        position_title: formData.position_title.trim(),
        partnerships: validPartnerships.map(partnership => ({
          date: partnership.date,
          activity: partnership.activity,
          partner_organization: partnership.partner_organization.trim(),
          location: partnership.location?.trim() || '',
          hours: partnership.hours,
          description: partnership.description.trim(),
          impact_metrics: partnership.impact_metrics?.trim() || ''
        }))
      };

      const response = await fetch('/api/partnership-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        alert('Partnership log submitted successfully!');
        onBack();
      } else {
        const result = await response.json();
        alert(`Error submitting form: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting form. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold mb-2">Partnership Volunteer Log (ICS 214A)</h1>
            <p className="text-blue-100">Record partnership activities and collaborative volunteer efforts</p>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Volunteer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volunteer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.volunteer_name}
                    onChange={(e) => setFormData({ ...formData, volunteer_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization *
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your organization name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partnership Coordinator
                  </label>
                  <input
                    type="text"
                    value={formData.partnership_coordinator}
                    onChange={(e) => setFormData({ ...formData, partnership_coordinator: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name of partnership coordinator (if applicable)"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Partnership Activities
                </h2>
                <button
                  onClick={addPartnership}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Partnership
                </button>
              </div>

              <div className="space-y-4">
                {partnerships.map((partnership, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-700">Partnership Activity {index + 1}</h3>
                      {partnerships.length > 1 && (
                        <button
                          onClick={() => removePartnership(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={partnership.date}
                          onChange={(e) => updatePartnership(index, 'date', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                        <select
                          value={partnership.activity}
                          onChange={(e) => updatePartnership(index, 'activity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select partnership activity</option>
                          {PARTNERSHIP_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Organization</label>
                        <input
                          type="text"
                          value={partnership.partner_organization}
                          onChange={(e) => updatePartnership(index, 'partner_organization', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Partner organization name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={partnership.location}
                          onChange={(e) => updatePartnership(index, 'location', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Partnership activity location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                        <input
                          type="number"
                          value={partnership.hours}
                          onChange={(e) => updatePartnership(index, 'hours', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Hours worked"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={partnership.description}
                          onChange={(e) => updatePartnership(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Describe the partnership activity and collaboration..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Impact Metrics</label>
                        <textarea
                          value={partnership.impact_metrics}
                          onChange={(e) => updatePartnership(index, 'impact_metrics', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="Quantifiable outcomes, people served, resources shared, etc."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-800">
                  Total Partnership Hours: {calculateTotalHours()}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Prepared By
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.prepared_by_first}
                    onChange={(e) => setFormData({ ...formData, prepared_by_first: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Preparer's first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.prepared_by_last}
                    onChange={(e) => setFormData({ ...formData, prepared_by_last: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Preparer's last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position/Title *
                  </label>
                  <input
                    type="text"
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Job title or position"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4">
                {onHome && (
                  <button
                    onClick={onHome}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                )}
                <button
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={generatePreviewPDF}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit Log
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipForm;