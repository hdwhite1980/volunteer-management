'use client';
import React, { useState } from 'react';
import { Clock, User, Edit, CheckCircle, FileText } from 'lucide-react';

interface ActivityFormProps {
  onBack: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    incident_name: '',
    date_from: '',
    date_to: '',
    time_from: '',
    time_to: '',
    prepared_by_first: '',
    prepared_by_last: '',
    position_title: ''
  });

  // Start with 2 team member rows, allow adding more
  const [teamMembers, setTeamMembers] = useState([
    { name: '', title: '', organization: '' },
    { name: '', title: '', organization: '' }
  ]);

  // Start with 3 activity rows, allow adding more
  const [activities, setActivities] = useState([
    { date_time: '', notable_activities: '' },
    { date_time: '', notable_activities: '' },
    { date_time: '', notable_activities: '' }
  ]);

  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateTeamMember = (index: number, field: keyof typeof teamMembers[0], value: string) => {
    const newTeamMembers = [...teamMembers];
    newTeamMembers[index][field] = value;
    setTeamMembers(newTeamMembers);
  };

  const updateActivity = (index: number, field: keyof typeof activities[0], value: string) => {
    const newActivities = [...activities];
    newActivities[index][field] = value;
    setActivities(newActivities);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', title: '', organization: '' }]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      const newTeamMembers = teamMembers.filter((_, i) => i !== index);
      setTeamMembers(newTeamMembers);
    }
  };

  const addActivity = () => {
    setActivities([...activities, { date_time: '', notable_activities: '' }]);
  };

  const removeActivity = (index: number) => {
    if (activities.length > 1) {
      const newActivities = activities.filter((_, i) => i !== index);
      setActivities(newActivities);
    }
  };

  const generatePDF = async () => {
    try {
      // Import the PDF generator
      const { PDFGenerator } = await import('../utils/pdfGenerator');
      
      const pdfData = {
        incident_name: formData.incident_name,
        date_from: formData.date_from,
        date_to: formData.date_to,
        time_from: formData.time_from,
        time_to: formData.time_to,
        prepared_by_first: formData.prepared_by_first,
        prepared_by_last: formData.prepared_by_last,
        position_title: formData.position_title,
        team_members: teamMembers,
        activities: activities,
        is_complete: isComplete
      };
      
      PDFGenerator.generateActivityLogPDF(pdfData);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.incident_name || !formData.date_from || !formData.date_to || 
          !formData.time_from || !formData.time_to || !formData.prepared_by_first || 
          !formData.prepared_by_last || !formData.position_title) {
        alert('Please fill in all required fields (marked with *)');
        return;
      }

      if (!isComplete) {
        alert('Please check "I am complete" to submit the form');
        return;
      }

      const validTeamMembers = teamMembers.filter(member => 
        member.name || member.title || member.organization
      );

      const validActivities = activities.filter(activity => 
        activity.date_time || activity.notable_activities
      );

      const submitData = {
        incident_name: formData.incident_name.trim(),
        date_from: formData.date_from,
        date_to: formData.date_to,
        time_from: formData.time_from,
        time_to: formData.time_to,
        prepared_by_first: formData.prepared_by_first.trim(),
        prepared_by_last: formData.prepared_by_last.trim(),
        position_title: formData.position_title.trim(),
        team_members: validTeamMembers,
        activities: validActivities,
        is_complete: isComplete
      };

      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        alert('Activity log (ICS 214) submitted successfully!');
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold mb-2 text-center">ACTIVITY LOG (ICS 214)</h1>
            <p className="text-green-100 text-center">Record incident response activities and team coordination</p>
          </div>

          <div className="p-6">
            {/* Incident Name */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-800 mb-1">
                Incident Name *
              </label>
              <input
                type="text"
                value={formData.incident_name}
                onChange={(e) => setFormData({ ...formData, incident_name: e.target.value })}
                className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                placeholder=""
              />
            </div>

            {/* Date and Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Date From *
                </label>
                <input
                  type="date"
                  value={formData.date_from}
                  onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                  className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                />
                <small className="text-gray-600">Date</small>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Date To *
                </label>
                <input
                  type="date"
                  value={formData.date_to}
                  onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                  className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                />
                <small className="text-gray-600">Date</small>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Time From *
                </label>
                <input
                  type="time"
                  value={formData.time_from}
                  onChange={(e) => setFormData({ ...formData, time_from: e.target.value })}
                  className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Time To *
                </label>
                <input
                  type="time"
                  value={formData.time_to}
                  onChange={(e) => setFormData({ ...formData, time_to: e.target.value })}
                  className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Prepared By Section */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Prepared By *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <input
                    type="text"
                    value={formData.prepared_by_first}
                    onChange={(e) => setFormData({ ...formData, prepared_by_first: e.target.value })}
                    className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                    placeholder=""
                  />
                  <small className="text-gray-600">First Name</small>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.prepared_by_last}
                    onChange={(e) => setFormData({ ...formData, prepared_by_last: e.target.value })}
                    className="w-full border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                    placeholder=""
                  />
                  <small className="text-gray-600">Last Name</small>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Your Position/Title *
                </label>
                <input
                  type="text"
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  className="w-full md:w-1/2 border-b-2 border-gray-300 px-0 py-2 bg-transparent focus:border-green-500 focus:outline-none"
                  placeholder=""
                />
              </div>
            </div>

            {/* Resources Assigned Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800">
                  Resources Assigned. List team members that worked onsite with you.
                </h3>
                <button
                  onClick={addTeamMember}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  + Add Team Member
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-12">#</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center">Name</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center">Title</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center">Organization</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member, index) => (
                      <tr key={index} className="h-10">
                        <td className="border border-gray-400 px-2 py-1 text-center text-sm font-medium">{index + 1}.</td>
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1 bg-transparent"
                            placeholder=""
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="text"
                            value={member.title}
                            onChange={(e) => updateTeamMember(index, 'title', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1 bg-transparent"
                            placeholder=""
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="text"
                            value={member.organization}
                            onChange={(e) => updateTeamMember(index, 'organization', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1 bg-transparent"
                            placeholder=""
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1 text-center">
                          {teamMembers.length > 1 && (
                            <button
                              onClick={() => removeTeamMember(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Remove team member"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Log Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800">
                  Activity Log. Complete the table. Example: 5/22/25 - 8:30AM: Met with team to develop action plans/22/25 - 9:00AM: Began unloading trucks w/ team; organizes supplies
                </h3>
                <button
                  onClick={addActivity}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  + Add Activity
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-12">#</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-1/3">Date/Time</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center">Noteable Activities</th>
                      <th className="border border-gray-400 px-2 py-2 text-xs font-bold text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity, index) => (
                      <tr key={index} className="h-10">
                        <td className="border border-gray-400 px-2 py-1 text-center text-sm font-medium">{index + 1}.</td>
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="text"
                            value={activity.date_time}
                            onChange={(e) => updateActivity(index, 'date_time', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1 bg-transparent"
                            placeholder=""
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1">
                          <input
                            type="text"
                            value={activity.notable_activities}
                            onChange={(e) => updateActivity(index, 'notable_activities', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1 bg-transparent"
                            placeholder=""
                          />
                        </td>
                        <td className="border border-gray-400 px-1 py-1 text-center">
                          {activities.length > 1 && (
                            <button
                              onClick={() => removeActivity(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                              title="Remove activity"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Completion Checkbox */}
            <div className="mb-8">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isComplete}
                  onChange={(e) => setIsComplete(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-green-600 border-2 border-gray-400"
                />
                <span className="text-sm font-bold text-gray-800">I am complete. *</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                Cancel
              </button>
              <button
                onClick={generatePDF}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                📄 Preview PDF
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
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityForm;