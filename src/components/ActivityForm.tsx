'use client';
import React, { useState } from 'react';
import { 
  Clock, User, Edit, Plus, Trash2, CheckCircle, 
  FileText, Home, Eye, Download 
} from 'lucide-react';

// Volunteer Categories
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

interface ActivityFormProps {
  onBack: () => void;
  onHome?: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onBack, onHome }) => {
  const [formData, setFormData] = useState({
    volunteer_name: '',
    email: '',
    phone: '',
    student_id: '',
    prepared_by_first: '',
    prepared_by_last: '',
    position_title: ''
  });
  const [activities, setActivities] = useState([
    { date: '', activity: '', organization: '', location: '', hours: '', description: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addActivity = () => {
    setActivities([...activities, { date: '', activity: '', organization: '', location: '', hours: '', description: '' }]);
  };

  const removeActivity = (index: number) => {
    if (activities.length > 1) {
      const newActivities = activities.filter((_, i) => i !== index);
      setActivities(newActivities);
    }
  };

  const updateActivity = (index: number, field: keyof typeof activities[0], value: string) => {
    const newActivities = [...activities];
    newActivities[index][field] = value;
    setActivities(newActivities);
  };

  const calculateTotalHours = () => {
    return activities.reduce((total, activity) => {
      return total + (parseFloat(activity.hours) || 0);
    }, 0);
  };

  const generatePreviewPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Activity Log - Preview</title>
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
                border-bottom: 3px solid #059669; 
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
              .activities-section {
                margin: 30px 0;
              }
              .activity-item {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
              }
              .activity-header {
                font-size: 16px;
                font-weight: bold;
                color: #059669;
                margin-bottom: 10px;
              }
              .activity-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 10px;
              }
              .total-hours {
                background: #d1fae5;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                color: #059669;
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
              <h1>📋 Activity Log (ICS 214)</h1>
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
                  <span class="info-label">Student ID:</span>
                  <span class="info-value">${formData.student_id || '[Not specified]'}</span>
                </div>
              </div>
            </div>

            <div class="activities-section">
              <h3>Activities</h3>
              ${activities.map((activity, index) => `
                <div class="activity-item">
                  <div class="activity-header">Activity ${index + 1}</div>
                  <div class="activity-grid">
                    <div>
                      <span class="info-label">Date:</span>
                      <span class="info-value">${activity.date || '[Not specified]'}</span>
                    </div>
                    <div>
                      <span class="info-label">Activity:</span>
                      <span class="info-value">${activity.activity || '[Not specified]'}</span>
                    </div>
                    <div>
                      <span class="info-label">Hours:</span>
                      <span class="info-value">${activity.hours || '0'}</span>
                    </div>
                    <div>
                      <span class="info-label">Organization:</span>
                      <span class="info-value">${activity.organization || '[Not specified]'}</span>
                    </div>
                    <div>
                      <span class="info-label">Location:</span>
                      <span class="info-value">${activity.location || '[Not specified]'}</span>
                    </div>
                  </div>
                  ${activity.description ? `
                    <div style="margin-top: 10px;">
                      <span class="info-label">Description:</span>
                      <div style="margin-top: 5px; padding: 8px; background: #f3f4f6; border-radius: 4px;">
                        ${activity.description}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            <div class="total-hours">
              Total Volunteer Hours: ${calculateTotalHours()}
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
              <p>Activity Log - Generated by VCEG Management System</p>
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
      if (!formData.volunteer_name || !formData.email || !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
        alert('Please fill in all required fields (marked with *)');
        return;
      }

      const validActivities = activities.filter(activity => 
        activity.date && activity.activity && activity.organization && activity.description
      );

      if (validActivities.length === 0) {
        alert('Please add at least one complete activity with date, type, organization, and description');
        return;
      }

      for (const activity of validActivities) {
        if (!activity.hours || isNaN(parseFloat(activity.hours))) {
          alert('Please enter valid hours for all activities');
          return;
        }
      }

      const submitData = {
        volunteer_name: formData.volunteer_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        student_id: formData.student_id?.trim() || null,
        prepared_by_first: formData.prepared_by_first.trim(),
        prepared_by_last: formData.prepared_by_last.trim(),
        position_title: formData.position_title.trim(),
        activities: validActivities.map(activity => ({
          date: activity.date,
          activity: activity.activity,
          organization: activity.organization.trim(),
          location: activity.location?.trim() || '',
          hours: activity.hours,
          description: activity.description.trim()
        }))
      };

      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        alert('Activity log submitted successfully!');
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
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold mb-2">Activity Log (ICS 214)</h1>
            <p className="text-green-100">Record individual volunteer activities and track service hours</p>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter student ID"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Activities
                </h2>
                <button
                  onClick={addActivity}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
              </div>

              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-700">Activity {index + 1}</h3>
                      {activities.length > 1 && (
                        <button
                          onClick={() => removeActivity(index)}
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
                          value={activity.date}
                          onChange={(e) => updateActivity(index, 'date', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                        <select
                          value={activity.activity}
                          onChange={(e) => updateActivity(index, 'activity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select activity type</option>
                          {VOLUNTEER_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                        <input
                          type="text"
                          value={activity.organization}
                          onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Organization name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={activity.location}
                          onChange={(e) => updateActivity(index, 'location', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Activity location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                        <input
                          type="number"
                          value={activity.hours}
                          onChange={(e) => updateActivity(index, 'hours', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Hours worked"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={activity.description}
                        onChange={(e) => updateActivity(index, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        placeholder="Describe the volunteer activity..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-800">
                  Total Volunteer Hours: {calculateTotalHours()}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

export default ActivityForm;