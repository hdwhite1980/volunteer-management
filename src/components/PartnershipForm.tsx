'use client';
import React, { useState } from 'react';
import { Building2, User, Edit, Plus, Trash2, CheckCircle, FileText } from 'lucide-react';

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
    families_served: ''
  });
  
  const [events, setEvents] = useState([
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' },
    { date: '', site: '', hours_worked: '', volunteers: '' }
  ]);
  
  const [preparedBy, setPreparedBy] = useState({
    first_name: '',
    last_name: '',
    position_title: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateEvent = (index: number, field: keyof typeof events[0], value: string) => {
    const newEvents = [...events];
    newEvents[index][field] = value;
    setEvents(newEvents);
  };

  const generatePDF = async () => {
    try {
      // Import the PDF generator
      const { PDFGenerator } = await import('../utils/pdfGenerator');
      
      const pdfData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        organization: formData.organization,
        email: formData.email,
        phone: formData.phone,
        families_served: formData.families_served,
        events: events,
        prepared_by_first: preparedBy.first_name,
        prepared_by_last: preparedBy.last_name,
        position_title: preparedBy.position_title
      };
      
      PDFGenerator.generatePartnershipLogPDF(pdfData);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!formData.first_name || !formData.last_name || !formData.organization || !formData.email || !formData.phone || !formData.families_served) {
        alert('Please fill in all required fields (marked with *)');
        return;
      }

      if (!preparedBy.first_name || !preparedBy.last_name || !preparedBy.position_title) {
        alert('Please fill in all prepared by fields');
        return;
      }

      const validEvents = events.filter(event => 
        event.date || event.site || event.hours_worked || event.volunteers
      );

      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        organization: formData.organization.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        families_served: formData.families_served,
        prepared_by_first: preparedBy.first_name.trim(),
        prepared_by_last: preparedBy.last_name.trim(),
        position_title: preparedBy.position_title.trim(),
        events: validEvents
      };

      const response = await fetch('/api/partnership-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        alert('Partnership volunteer log submitted successfully!');
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
            <p className="text-blue-100">Record partnership volunteer activities and service data</p>
          </div>

          <div className="p-6">
            {/* Contact Information */}
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
                    placeholder="First Name"
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
                    placeholder="Last Name"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Organization name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@example.com"
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
                    placeholder="(000) 000-0000"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Number of "Families" Served *
                </label>
                <input
                  type="number"
                  value={formData.families_served}
                  onChange={(e) => setFormData({ ...formData, families_served: e.target.value })}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Volunteer Hours Table */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Volunteer Hours:
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 text-center">Event Date</th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 text-center">Event Site Zip</th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 text-center">Total Number of Hours Worked</th>
                      <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 text-center">Total Number of Volunteers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-1 text-center text-sm font-medium">{index + 1}.</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="date"
                            value={event.date}
                            onChange={(e) => updateEvent(index, 'date', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={event.site}
                            onChange={(e) => updateEvent(index, 'site', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1"
                            placeholder="ZIP code"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={event.hours_worked}
                            onChange={(e) => updateEvent(index, 'hours_worked', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1"
                            placeholder="Hours"
                            min="0"
                            step="0.5"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={event.volunteers}
                            onChange={(e) => updateEvent(index, 'volunteers', e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 px-1 py-1"
                            placeholder="Count"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prepared By Section */}
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
                    value={preparedBy.first_name}
                    onChange={(e) => setPreparedBy({ ...preparedBy, first_name: e.target.value })}
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
                    value={preparedBy.last_name}
                    onChange={(e) => setPreparedBy({ ...preparedBy, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Preparer's last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Position/Title *
                  </label>
                  <input
                    type="text"
                    value={preparedBy.position_title}
                    onChange={(e) => setPreparedBy({ ...preparedBy, position_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Job title or position"
                  />
                </div>
              </div>
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

export default PartnershipForm;