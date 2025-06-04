'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Download, Search, Clock, Users, Building2 } from 'lucide-react';

interface Volunteer {
  name: string;
  email: string;
  organization: string;
  total_hours: number;
  log_type: string;
}

const VolunteerApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [stats, setStats] = useState({ total_volunteers: 0, total_hours: 0, total_organizations: 0 });
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  // Load stats for dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadStats();
      loadVolunteers();
    }
  }, [currentView]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/volunteers?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteers');
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Virtu Volunteer Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track volunteer hours, manage partnerships, and maintain comprehensive records 
            of community service activities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Partnership Volunteer Log
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Record agency partnership volunteer activities, track families served, 
              and manage organizational volunteer hours
            </p>
            <button
              onClick={() => setCurrentView('partnership')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Start Partnership Log
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Activity Log
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Log individual volunteer activities, track hours, and document 
              specific community service contributions
            </p>
            <button
              onClick={() => setCurrentView('activity')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
            >
              Start Activity Log
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 mr-4"
          >
            <Search className="w-5 h-5 inline mr-2" />
            View Database
          </button>
          <button
            onClick={() => setCurrentView('upload')}
            className="bg-purple-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload Forms
          </button>
        </div>
      </div>
    </div>
  );

  // Partnership Volunteer Log Form
  const PartnershipForm = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      organization: '',
      email: '',
      phone: '',
      families_served: '',
      prepared_by_first: '',
      prepared_by_last: '',
      position_title: '',
    });
    const [eventRows, setEventRows] = useState([
      { date: '', site: '', zip: '', hours: '', volunteers: '' }
    ]);

    const addEventRow = () => {
      if (eventRows.length < 11) {
        setEventRows([...eventRows, { date: '', site: '', zip: '', hours: '', volunteers: '' }]);
      }
    };

    const updateEventRow = (index: number, field: keyof typeof eventRows[0], value: string) => {
      const newRows = [...eventRows];
      newRows[index][field] = value;
      setEventRows(newRows);
    };

    const generatePDF = () => {
      const currentFormData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        organization: formData.organization,
        email: formData.email,
        phone: formData.phone,
        families_served: formData.families_served,
        prepared_by_first: formData.prepared_by_first,
        prepared_by_last: formData.prepared_by_last,
        position_title: formData.position_title,
        events: eventRows.filter(row => row.date || row.site)
      };
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Virtu Partnership Volunteer Log</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                
                body { 
                  font-family: 'Inter', Arial, sans-serif; 
                  margin: 0; 
                  padding: 30px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                }
                
                .container {
                  background: white;
                  border-radius: 15px;
                  padding: 40px;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                  max-width: 800px;
                  margin: 0 auto;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 40px;
                  border-bottom: 3px solid #667eea;
                  padding-bottom: 20px;
                }
                
                .header h1 {
                  color: #2d3748;
                  font-size: 28px;
                  font-weight: 700;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea, #764ba2);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                }
                
                .subtitle {
                  color: #718096;
                  font-size: 14px;
                  margin-top: 10px;
                }
                
                .section {
                  margin: 30px 0;
                  padding: 25px;
                  background: #f8fafc;
                  border-radius: 10px;
                  border-left: 4px solid #667eea;
                }
                
                .section h2 {
                  color: #2d3748;
                  font-size: 20px;
                  font-weight: 600;
                  margin: 0 0 20px 0;
                }
                
                .field-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 15px;
                }
                
                .field {
                  margin-bottom: 15px;
                }
                
                .field-label {
                  font-weight: 600;
                  color: #4a5568;
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 5px;
                }
                
                .field-value {
                  color: #2d3748;
                  font-size: 16px;
                  padding: 8px 12px;
                  background: white;
                  border-radius: 6px;
                  border: 1px solid #e2e8f0;
                }
                
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                
                th {
                  background: linear-gradient(135deg, #667eea, #764ba2);
                  color: white;
                  padding: 15px 12px;
                  font-weight: 600;
                  text-align: left;
                  font-size: 14px;
                }
                
                td {
                  padding: 12px;
                  border-bottom: 1px solid #e2e8f0;
                  color: #2d3748;
                }
                
                tr:nth-child(even) {
                  background-color: #f8fafc;
                }
                
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #e2e8f0;
                  text-align: center;
                  color: #718096;
                  font-size: 12px;
                }
                
                @media print {
                  body { background: white; padding: 0; }
                  .container { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Virtu Community Enhancement Group</h1>
                  <div class="subtitle">Agency Partnership Volunteer Log</div>
                  <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
                </div>
                
                <div class="section">
                  <h2>Volunteer Information</h2>
                  <div class="field-grid">
                    <div class="field">
                      <div class="field-label">Full Name</div>
                      <div class="field-value">${currentFormData.first_name} ${currentFormData.last_name}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Organization</div>
                      <div class="field-value">${currentFormData.organization}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Email Address</div>
                      <div class="field-value">${currentFormData.email}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Phone Number</div>
                      <div class="field-value">${currentFormData.phone}</div>
                    </div>
                  </div>
                  <div class="field">
                    <div class="field-label">Total Families Served</div>
                    <div class="field-value">${currentFormData.families_served} families</div>
                  </div>
                </div>
                
                <div class="section">
                  <h2>Volunteer Activities</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Zip Code</th>
                        <th>Hours</th>
                        <th>Volunteers</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${currentFormData.events.map(event => `
                        <tr>
                          <td>${new Date(event.date).toLocaleDateString()}</td>
                          <td>${event.site}</td>
                          <td>${event.zip}</td>
                          <td>${event.hours}h</td>
                          <td>${event.volunteers}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                
                <div class="section">
                  <h2>Form Completion</h2>
                  <div class="field-grid">
                    <div class="field">
                      <div class="field-label">Prepared By</div>
                      <div class="field-value">${currentFormData.prepared_by_first} ${currentFormData.prepared_by_last}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Position/Title</div>
                      <div class="field-value">${currentFormData.position_title}</div>
                    </div>
                  </div>
                </div>
                
                <div class="footer">
                  <p>Virtu Community Enhancement Group | Building Connected Communities</p>
                  <p>This document was automatically generated by the Virtu Volunteer Management System</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    const handleSubmit = async () => {
      try {
        // Validate required fields
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.organization || !formData.phone || !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
          alert('Please fill in all required fields (marked with *)');
          return;
        }

        if (!formData.families_served || isNaN(parseInt(formData.families_served))) {
          alert('Please enter a valid number for families served');
          return;
        }

        // Filter events to only include those with at least date and site
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

        console.log('Submitting partnership data:', submitData);

        const response = await fetch('/api/partnership-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        const result = await response.json();
        console.log('Server response:', result);

        if (response.ok) {
          alert('Partnership log submitted successfully!');
          setCurrentView('landing');
        } else {
          console.error('Server error:', result);
          alert(`Error submitting form: ${result.error || 'Unknown error'}\n${result.details || ''}`);
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please check your internet connection and try again.');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Agency Partnership Volunteer Log</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="example@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Number of &quot;Families&quot; Served *
                </label>
                <input
                  type="number"
                  required
                  value={formData.families_served}
                  onChange={(e) => setFormData({...formData, families_served: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Volunteer Hours</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Event Date</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Event Site</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Zip</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Total Hours Worked</th>
                        <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Total Volunteers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRows.map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) => updateEventRow(index, 'date', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={row.site}
                              onChange={(e) => updateEventRow(index, 'site', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="text"
                              value={row.zip}
                              onChange={(e) => updateEventRow(index, 'zip', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={row.hours}
                              onChange={(e) => updateEventRow(index, 'hours', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                          <td className="border border-gray-300 p-2">
                            <input
                              type="number"
                              value={row.volunteers}
                              onChange={(e) => updateEventRow(index, 'volunteers', e.target.value)}
                              className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 text-gray-900"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {eventRows.length < 11 && (
                  <button
                    type="button"
                    onClick={addEventRow}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Event Row
                  </button>
                )}
              </div>

              {/* Prepared By Fields */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Preparation</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prepared By - First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prepared_by_first}
                      onChange={(e) => setFormData({...formData, prepared_by_first: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prepared By - Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prepared_by_last}
                      onChange={(e) => setFormData({...formData, prepared_by_last: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Position/Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position_title}
                    onChange={(e) => setFormData({...formData, position_title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={generatePDF}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Activity Log Form
  const ActivityForm = () => {
    const [formData, setFormData] = useState({
      volunteer_name: '',
      email: '',
      phone: '',
      student_id: '',
      prepared_by_first: '',
      prepared_by_last: '',
      position_title: '',
    });
    const [activities, setActivities] = useState([
      { date: '', activity: '', organization: '', location: '', hours: '', description: '' }
    ]);

    const addActivity = () => {
      setActivities([...activities, { date: '', activity: '', organization: '', location: '', hours: '', description: '' }]);
    };

    const updateActivity = (index: number, field: keyof typeof activities[0], value: string) => {
      const newActivities = [...activities];
      newActivities[index][field] = value;
      setActivities(newActivities);
    };

    const generateActivityPDF = () => {
      const currentFormData = {
        volunteer_name: formData.volunteer_name,
        email: formData.email,
        phone: formData.phone,
        student_id: formData.student_id,
        prepared_by_first: formData.prepared_by_first,
        prepared_by_last: formData.prepared_by_last,
        position_title: formData.position_title,
        activities: activities.filter(activity => activity.date || activity.activity || activity.organization)
      };
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Volunteer Activity Log</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                
                body { 
                  font-family: 'Inter', Arial, sans-serif; 
                  margin: 0; 
                  padding: 30px;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  min-height: 100vh;
                }
                
                .container {
                  background: white;
                  border-radius: 15px;
                  padding: 40px;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                  max-width: 800px;
                  margin: 0 auto;
                }
                
                .header {
                  text-align: center;
                  margin-bottom: 40px;
                  border-bottom: 3px solid #10b981;
                  padding-bottom: 20px;
                }
                
                .header h1 {
                  color: #2d3748;
                  font-size: 28px;
                  font-weight: 700;
                  margin: 0;
                  background: linear-gradient(135deg, #10b981, #059669);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                }
                
                .subtitle {
                  color: #718096;
                  font-size: 14px;
                  margin-top: 10px;
                }
                
                .section {
                  margin: 30px 0;
                  padding: 25px;
                  background: #f0fdf4;
                  border-radius: 10px;
                  border-left: 4px solid #10b981;
                }
                
                .section h2 {
                  color: #2d3748;
                  font-size: 20px;
                  font-weight: 600;
                  margin: 0 0 20px 0;
                }
                
                .field-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 15px;
                }
                
                .field {
                  margin-bottom: 15px;
                }
                
                .field-label {
                  font-weight: 600;
                  color: #4a5568;
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 5px;
                }
                
                .field-value {
                  color: #2d3748;
                  font-size: 16px;
                  padding: 8px 12px;
                  background: white;
                  border-radius: 6px;
                  border: 1px solid #e2e8f0;
                }
                
                .activity-card {
                  background: white;
                  border-radius: 10px;
                  padding: 20px;
                  margin: 15px 0;
                  border: 1px solid #e2e8f0;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                
                .activity-title {
                  color: #065f46;
                  font-size: 18px;
                  font-weight: 600;
                  margin-bottom: 15px;
                  border-bottom: 2px solid #10b981;
                  padding-bottom: 10px;
                }
                
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #e2e8f0;
                  text-align: center;
                  color: #718096;
                  font-size: 12px;
                }
                
                @media print {
                  body { background: white; padding: 0; }
                  .container { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Virtu Community Enhancement Group</h1>
                  <div class="subtitle">Volunteer Activity Log (ICS 214)</div>
                  <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
                </div>
                
                <div class="section">
                  <h2>Volunteer Information</h2>
                  <div class="field-grid">
                    <div class="field">
                      <div class="field-label">Volunteer Name</div>
                      <div class="field-value">${currentFormData.volunteer_name}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Email Address</div>
                      <div class="field-value">${currentFormData.email}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Phone Number</div>
                      <div class="field-value">${currentFormData.phone}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Student ID</div>
                      <div class="field-value">${currentFormData.student_id}</div>
                    </div>
                  </div>
                </div>
                
                <div class="section">
                  <h2>Activity Details</h2>
                  ${currentFormData.activities.map((activity, index) => `
                    <div class="activity-card">
                      <div class="activity-title">Activity ${index + 1}</div>
                      <div class="field-grid">
                        <div class="field">
                          <div class="field-label">Date</div>
                          <div class="field-value">${new Date(activity.date).toLocaleDateString()}</div>
                        </div>
                        <div class="field">
                          <div class="field-label">Hours</div>
                          <div class="field-value">${activity.hours}h</div>
                        </div>
                        <div class="field">
                          <div class="field-label">Organization</div>
                          <div class="field-value">${activity.organization}</div>
                        </div>
                        <div class="field">
                          <div class="field-label">Activity Type</div>
                          <div class="field-value">${activity.activity}</div>
                        </div>
                      </div>
                      <div class="field">
                        <div class="field-label">Location</div>
                        <div class="field-value">${activity.location}</div>
                      </div>
                      <div class="field">
                        <div class="field-label">Description</div>
                        <div class="field-value">${activity.description}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <div class="section">
                  <h2>Form Completion</h2>
                  <div class="field-grid">
                    <div class="field">
                      <div class="field-label">Prepared By</div>
                      <div class="field-value">${currentFormData.prepared_by_first} ${currentFormData.prepared_by_last}</div>
                    </div>
                    <div class="field">
                      <div class="field-label">Position/Title</div>
                      <div class="field-value">${currentFormData.position_title}</div>
                    </div>
                  </div>
                </div>
                
                <div class="footer">
                  <p>Virtu Community Enhancement Group | Building Connected Communities</p>
                  <p>This document was automatically generated by the Virtu Volunteer Management System</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    const handleSubmit = async () => {
      try {
        // Validate required fields
        if (!formData.volunteer_name || !formData.email || !formData.prepared_by_first || !formData.prepared_by_last || !formData.position_title) {
          alert('Please fill in all required fields (marked with *)');
          return;
        }

        // Filter activities to only include valid ones
        const validActivities = activities.filter(activity => 
          activity.date && activity.activity && activity.organization && activity.description
        );
        
        if (validActivities.length === 0) {
          alert('Please add at least one complete activity with date, type, organization, and description');
          return;
        }

        // Validate hours in activities
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

        console.log('Submitting activity data:', submitData);

        const response = await fetch('/api/activity-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        const result = await response.json();
        console.log('Server response:', result);

        if (response.ok) {
          alert('Activity log submitted successfully!');
          setCurrentView('landing');
        } else {
          console.error('Server error:', result);
          alert(`Error submitting form: ${result.error || 'Unknown error'}\n${result.details || ''}`);
        }
      } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting form. Please check your internet connection and try again.');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Volunteer Activity Log</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.volunteer_name}
                    onChange={(e) => setFormData({...formData, volunteer_name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Details</h3>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            value={activity.date}
                            onChange={(e) => updateActivity(index, 'date', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hours *
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={activity.hours}
                            onChange={(e) => updateActivity(index, 'hours', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization *
                          </label>
                          <input
                            type="text"
                            value={activity.organization}
                            onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Type *
                          </label>
                          <select
                            value={activity.activity}
                            onChange={(e) => updateActivity(index, 'activity', e.target.value)}
                            required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          >
                            <option value="">Select Activity Type</option>
                            <option value="Community Service">Community Service</option>
                            <option value="Tutoring/Mentoring">Tutoring/Mentoring</option>
                            <option value="Environmental">Environmental</option>
                            <option value="Food Service">Food Service</option>
                            <option value="Construction/Repair">Construction/Repair</option>
                            <option value="Event Support">Event Support</option>
                            <option value="Administrative">Administrative</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={activity.location}
                            onChange={(e) => updateActivity(index, 'location', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Activity Description *
                        </label>
                        <textarea
                          value={activity.description}
                          onChange={(e) => updateActivity(index, 'description', e.target.value)}
                          required
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                          placeholder="Describe the volunteer activity performed..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addActivity}
                  className="mt-3 text-green-600 hover:text-green-800 font-medium"
                >
                  + Add Another Activity
                </button>
              </div>

              {/* Prepared By Fields */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Preparation</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prepared By - First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prepared_by_first}
                      onChange={(e) => setFormData({...formData, prepared_by_first: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prepared By - Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prepared_by_last}
                      onChange={(e) => setFormData({...formData, prepared_by_last: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Position/Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position_title}
                    onChange={(e) => setFormData({...formData, position_title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={generateActivityPDF}
                  className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Preview PDF
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Database Dashboard
  const Dashboard = () => {
    const exportPDFReport = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Virtu Volunteer Management Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                .stat { text-align: center; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
                .stat-number { font-size: 24px; font-weight: bold; color: #1f2937; }
                .stat-label { color: #6b7280; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                th { background-color: #f9fafb; font-weight: bold; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .badge-partnership { background-color: #dbeafe; color: #1e40af; }
                .badge-activity { background-color: #d1fae5; color: #065f46; }
                @media print { body { margin: 0; } .stats { display: block; } .stat { margin: 10px 0; } }
              </style>
            </head>
            <body>
              <h1>Virtu Volunteer Management Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${stats.total_volunteers}</div>
                  <div class="stat-label">Total Volunteers</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${Math.round(stats.total_hours)}</div>
                  <div class="stat-label">Total Hours</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${stats.total_organizations}</div>
                  <div class="stat-label">Organizations</div>
                </div>
              </div>
              
              <h2>Volunteer Details</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Total Hours</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  ${volunteers.map(volunteer => `
                    <tr>
                      <td>${volunteer.name}</td>
                      <td>${volunteer.email}</td>
                      <td>${volunteer.organization}</td>
                      <td>${Math.round(volunteer.total_hours || 0)}</td>
                      <td>
                        <span class="badge ${volunteer.log_type === 'partnership' ? 'badge-partnership' : 'badge-activity'}">
                          ${volunteer.log_type}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Volunteer Database</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Volunteers</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_volunteers || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-800">{Math.round(stats.total_hours || 0)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Building2 className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_organizations || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Recent Volunteers</h2>
                <button 
                  onClick={exportPDFReport}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export PDF Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Name</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Email</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Organization</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Total Hours</th>
                      <th className="border border-gray-300 p-3 text-left text-gray-900 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map((volunteer, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-3 text-gray-900">{volunteer.name}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{volunteer.email}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{volunteer.organization}</td>
                        <td className="border border-gray-300 p-3 text-gray-900">{Math.round(volunteer.total_hours || 0)}</td>
                        <td className="border border-gray-300 p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            volunteer.log_type === 'partnership' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {volunteer.log_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Upload Component with working functionality
  const UploadComponent = () => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const formData = new FormData();
      
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
          alert(`Successfully uploaded ${result.files.length} files!`);
          setUploadedFiles(prev => [...prev, ...result.files.map((f: any) => f.name)]);
        } else {
          alert(`Upload failed: ${result.error}`);
        }
      } catch (error) {
        alert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
        // Reset the input
        event.target.value = '';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Upload Completed Forms</h1>
              <button
                onClick={() => setCurrentView('landing')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </button>
            </div>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Upload Volunteer Forms
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop your completed forms here, or click to browse
                </p>
                
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileInput"
                />
                <label
                  htmlFor="fileInput"
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                >
                  {uploading ? 'Uploading...' : 'Choose Files'}
                </label>
                
                <p className="text-sm text-gray-400 mt-2">
                  Supported formats: PDF, Excel, Word documents
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Successfully Uploaded:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {uploadedFiles.map((fileName, index) => (
                      <li key={index}>• {fileName}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Upload Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ensure all required fields are completed</li>
                  <li>• Files will be automatically processed and added to the database</li>
                  <li>• You&apos;ll receive a confirmation email once processing is complete</li>
                  <li>• Maximum file size: 10MB per file</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'partnership':
        return <PartnershipForm />;
      case 'activity':
        return <ActivityForm />;
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadComponent />;
      default:
        return <LandingPage />;
    }
  };

  return renderCurrentView();
};

export default VolunteerApp;