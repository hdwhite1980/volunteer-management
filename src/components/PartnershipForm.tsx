'use client';
import React, { useState } from 'react';
import { Clock, User, Edit, Plus, Trash2, CheckCircle } from 'lucide-react';

interface PartnershipFormProps {
  onBack: () => void;
}

const PartnershipForm: React.FC<PartnershipFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    organization: '',
    email: '',
    phone: '',
    families_served: '',
    prepared_by_first: '',
    prepared_by_last: '',
    position_title: ''
  });
  const [eventRows, setEventRows] = useState([
    { date: '', site: '', zip: '', hours: '', volunteers: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addEventRow = () => {
    setEventRows([...eventRows, { date: '', site: '', zip: '', hours: '', volunteers: '' }]);
  };

  const removeEventRow = (index: number) => {
    if (eventRows.length > 1) {
      const newRows = eventRows.filter((_, i) => i !== index);
      setEventRows(newRows);
    }
  };

  const updateEventRow = (index: number, field: keyof typeof eventRows[0], value: string) => {
    const newRows = [...eventRows];
    newRows[index][field] = value;  
    setEventRows(newRows);
  };

  const calculateTotalHours = () => {
    return eventRows.reduce((total, row) => {
      if (row.hours && row.volunteers) {
        return total + (parseInt(row.hours) * parseInt(row.volunteers));
      }
      return total;
    }, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.organization || !formData.phone || !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
        alert('Please fill in all required fields (marked with *)');
        return;
      }

      if (!formData.families_served || isNaN(parseInt(formData.families_served))) {
        alert('Please enter a valid number for families served');
        return;
      }

      const validEvents = eventRows.filter(row => row.date && row.site);

      if (validEvents.length === 0) {
        alert('Please add at least one event with a date and site location');
        return;
      }

      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        organization: formData.organization.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        families_served: parseInt(formData.families_served),
        prepared_by_first: formData.prepared_by_first.trim(),
        prepared_by_last: formData.prepared_by_last.trim(),
        position_title: formData.position_title.trim(),
        events: validEvents
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
            <h1 className="text-2xl font-bold mb-2">Agency Partnership Volunteer Log</h1>
            <p className="text-blue-100">Record organizational volunteer activities and track families served</p>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
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
                    placeholder="Enter organization name"
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
                    Phone *
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
                    Families Served *
                  </label>
                  <input
                    type="number"
                    value={formData.families_served}
                    onChange={(e) => setFormData({ ...formData, families_served: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of families served"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Event Details
                </h2>
                <button
                  onClick={addEventRow}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>

              <div className="space-y-4">
                {eventRows.map((row, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-700">Event {index + 1}</h3>
                      {eventRows.length > 1 && (
                        <button
                          onClick={() => removeEventRow(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateEventRow(index, 'date', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                        <input
                          type="text"
                          value={row.site}
                          onChange={(e) => updateEventRow(index, 'site', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Event location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={row.zip}
                          onChange={(e) => updateEventRow(index, 'zip', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ZIP"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                        <input
                          type="number"
                          value={row.hours}
                          onChange={(e) => updateEventRow(index, 'hours', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Hours"
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers</label>
                        <input
                          type="number"
                          value={row.volunteers}
                          onChange={(e) => updateEventRow(index, 'volunteers', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Count"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-800">
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

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                Cancel
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
  );
};

export default PartnershipForm;