"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, Users, Calendar, Clock, Building, Mail, Phone, MapPin, Save, Search, Eye, Filter, Upload, FileSpreadsheet } from 'lucide-react';

const VCEGForms = () => {
  const [activeTab, setActiveTab] = useState('incident');
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'search'
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    type: '', // 'incident' or 'volunteer'
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [incidentForm, setIncidentForm] = useState({
    incidentName: '',
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    preparedByFirst: '',
    preparedByLast: '',
    position: '',
    resources: Array(8).fill().map(() => ({ name: '', title: '', organization: '' })),
    activities: Array(20).fill().map(() => ({ datetime: '', activity: '' }))
  });

  const [volunteerForm, setVolunteerForm] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    email: '',
    phone: '',
    familiesServed: '',
    volunteerHours: Array(11).fill().map(() => ({ 
      eventDate: '', 
      siteZip: '', 
      hoursWorked: '', 
      totalVolunteers: '' 
    }))
  });

  // Save form data to database
  const saveFormData = async (formType) => {
    setLoading(true);
    try {
      const data = formType === 'incident' ? {
        type: 'incident',
        data: incidentForm
      } : {
        type: 'volunteer',
        data: volunteerForm
      };

      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${formType === 'incident' ? 'Incident Report' : 'Volunteer Log'} saved successfully! ID: ${result.id}`);
      } else {
        throw new Error('Failed to save form data');
      }
    } catch (error) {
      alert('Error saving form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Search database
  const searchDatabase = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchFilters.type) params.append('type', searchFilters.type);
      if (searchFilters.dateFrom) params.append('dateFrom', searchFilters.dateFrom);
      if (searchFilters.dateTo) params.append('dateTo', searchFilters.dateTo);
      if (searchFilters.searchTerm) params.append('search', searchFilters.searchTerm);

      const response = await fetch(`/api/forms/search?${params}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      alert('Search error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load form data by ID
  const loadFormData = async (id) => {
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const { type, data } = await response.json();
        if (type === 'incident') {
          setIncidentForm(data);
          setActiveTab('incident');
        } else {
          setVolunteerForm(data);
          setActiveTab('volunteer');
        }
        setViewMode('form');
        alert('Form data loaded successfully!');
      }
    } catch (error) {
      alert('Error loading form: ' + error.message);
    }
  };

  // Upload and parse prefilled form data
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let parsedData = null;

      if (fileExtension === 'json') {
        const text = await file.text();
        parsedData = JSON.parse(text);
      } else if (fileExtension === 'csv') {
        const Papa = await import('papaparse');
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        parsedData = convertCSVToFormData(result.data, activeTab);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Updated to use ExcelJS instead of xlsx for security
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        const worksheet = workbook.getWorksheet(1);
        const jsonData = [];
        
        // Get headers from first row
        const headers = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value;
        });
        
        // Get data from remaining rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              if (headers[colNumber]) {
                rowData[headers[colNumber]] = cell.value;
              }
            });
            if (Object.keys(rowData).length > 0) {
              jsonData.push(rowData);
            }
          }
        });
        
        parsedData = convertCSVToFormData(jsonData, activeTab);
      } else {
        throw new Error('Unsupported file format. Please use JSON, CSV, or Excel files.');
      }

      // Apply the parsed data to the appropriate form
      if (parsedData) {
        if (activeTab === 'incident') {
          setIncidentForm({ ...incidentForm, ...parsedData });
        } else {
          setVolunteerForm({ ...volunteerForm, ...parsedData });
        }
        alert('Form data loaded successfully from file!');
      }
    } catch (error) {
      alert('Error reading file: ' + error.message);
      console.error('File upload error:', error);
    } finally {
      setLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Convert CSV/Excel data to form format
  const convertCSVToFormData = (data, formType) => {
    if (!data || data.length === 0) return null;

    const row = data[0]; // Use first row of data

    if (formType === 'incident') {
      return {
        incidentName: row['Incident Name'] || row['incidentName'] || '',
        dateFrom: row['Date From'] || row['dateFrom'] || '',
        dateTo: row['Date To'] || row['dateTo'] || '',
        timeFrom: row['Time From'] || row['timeFrom'] || '',
        timeTo: row['Time To'] || row['timeTo'] || '',
        preparedByFirst: row['First Name'] || row['preparedByFirst'] || '',
        preparedByLast: row['Last Name'] || row['preparedByLast'] || '',
        position: row['Position'] || row['position'] || '',
        // Resources and activities would need special handling for CSV
        resources: incidentForm.resources, // Keep existing
        activities: incidentForm.activities // Keep existing
      };
    } else {
      return {
        firstName: row['First Name'] || row['firstName'] || '',
        lastName: row['Last Name'] || row['lastName'] || '',
        organization: row['Organization'] || row['organization'] || '',
        email: row['Email'] || row['email'] || '',
        phone: row['Phone'] || row['phone'] || '',
        familiesServed: row['Families Served'] || row['familiesServed'] || '',
        volunteerHours: volunteerForm.volunteerHours // Keep existing
      };
    }
  };

  // Export search results to CSV
  const exportSearchResultsToCSV = async () => {
    if (searchResults.length === 0) {
      alert('No search results to export');
      return;
    }

    try {
      const Papa = await import('papaparse');
      const csvData = [];

      // Add header row
      csvData.push({
        'ID': 'ID',
        'Type': 'Type',
        'Title/Name': 'Title/Name',
        'Date': 'Date',
        'Created': 'Created',
        'Details': 'Details'
      });

      // Process each search result
      searchResults.forEach(result => {
        const row = {
          'ID': result.id,
          'Type': result.type,
          'Title/Name': result.type === 'incident' 
            ? result.data.incidentName 
            : `${result.data.firstName} ${result.data.lastName}`,
          'Date': result.type === 'incident' 
            ? result.data.dateFrom 
            : result.data.volunteerHours?.find(h => h.eventDate)?.eventDate || 'N/A',
          'Created': new Date(result.created_at).toLocaleDateString(),
          'Details': JSON.stringify(result.data, null, 2)
        };
        csvData.push(row);
      });

      const csv = Papa.unparse(csvData);
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `VCEG_SearchResults_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      alert('Error exporting search results: ' + error.message);
    }
  };

  // Export form data as CSV
  const exportToCSV = async (formType) => {
    try {
      const Papa = await import('papaparse');
      let csvData = [];

      if (formType === 'incident') {
        // Basic incident data
        const basicData = {
          'Incident Name': incidentForm.incidentName,
          'Date From': incidentForm.dateFrom,
          'Date To': incidentForm.dateTo,
          'Time From': incidentForm.timeFrom,
          'Time To': incidentForm.timeTo,
          'Prepared By First Name': incidentForm.preparedByFirst,
          'Prepared By Last Name': incidentForm.preparedByLast,
          'Position/Title': incidentForm.position,
          'Generated Date': new Date().toLocaleDateString()
        };

        csvData.push(basicData);

        // Add empty row
        csvData.push({});
        
        // Add resources header
        csvData.push({ 'Incident Name': 'RESOURCES ASSIGNED' });
        csvData.push({ 'Incident Name': 'Name', 'Date From': 'Title', 'Date To': 'Organization' });
        
        // Add resources data
        incidentForm.resources.forEach((resource, index) => {
          if (resource.name.trim()) {
            csvData.push({
              'Incident Name': resource.name,
              'Date From': resource.title,
              'Date To': resource.organization
            });
          }
        });

        // Add empty row
        csvData.push({});
        
        // Add activities header
        csvData.push({ 'Incident Name': 'ACTIVITY LOG' });
        csvData.push({ 'Incident Name': 'Date/Time', 'Date From': 'Notable Activities' });
        
        // Add activities data
        incidentForm.activities.forEach((activity, index) => {
          if (activity.datetime.trim()) {
            csvData.push({
              'Incident Name': activity.datetime,
              'Date From': activity.activity
            });
          }
        });

      } else {
        // Basic volunteer data
        const basicData = {
          'First Name': volunteerForm.firstName,
          'Last Name': volunteerForm.lastName,
          'Organization': volunteerForm.organization,
          'Email': volunteerForm.email,
          'Phone': volunteerForm.phone,
          'Families Served': volunteerForm.familiesServed,
          'Generated Date': new Date().toLocaleDateString()
        };

        csvData.push(basicData);

        // Add empty row
        csvData.push({});
        
        // Add volunteer hours header
        csvData.push({ 'First Name': 'VOLUNTEER HOURS' });
        csvData.push({ 
          'First Name': 'Event Date', 
          'Last Name': 'Site Zip', 
          'Organization': 'Hours Worked',
          'Email': 'Total Volunteers'
        });
        
        // Add volunteer hours data
        volunteerForm.volunteerHours.forEach((entry, index) => {
          if (entry.eventDate.trim()) {
            csvData.push({
              'First Name': entry.eventDate,
              'Last Name': entry.siteZip,
              'Organization': entry.hoursWorked,
              'Email': entry.totalVolunteers
            });
          }
        });
      }

      // Generate CSV
      const csv = Papa.unparse(csvData);
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 
        `VCEG_${formType === 'incident' ? 'IncidentReport' : 'VolunteerLog'}_${new Date().toISOString().slice(0,10)}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      alert('Error exporting CSV: ' + error.message);
    }
  };

  const generatePDF = async (formType) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      if (formType === 'incident') {
        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('VCEG - INCIDENT REPORT', 105, 20, { align: 'center' });
        
        // Basic Info
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        let y = 40;
        
        doc.text(`Incident Name: ${incidentForm.incidentName}`, 20, y);
        y += 8;
        doc.text(`Date From: ${incidentForm.dateFrom} | Date To: ${incidentForm.dateTo}`, 20, y);
        y += 8;
        doc.text(`Time From: ${incidentForm.timeFrom} | Time To: ${incidentForm.timeTo}`, 20, y);
        y += 8;
        doc.text(`Prepared By: ${incidentForm.preparedByFirst} ${incidentForm.preparedByLast}`, 20, y);
        y += 8;
        doc.text(`Position/Title: ${incidentForm.position}`, 20, y);
        y += 15;
        
        // Resources Section
        doc.setFont(undefined, 'bold');
        doc.text('RESOURCES ASSIGNED', 20, y);
        y += 10;
        doc.setFont(undefined, 'normal');
        
        incidentForm.resources.forEach((resource, index) => {
          if (resource.name.trim()) {
            doc.text(`${index + 1}. ${resource.name} - ${resource.title} (${resource.organization})`, 20, y);
            y += 6;
          }
        });
        
        y += 10;
        
        // Activities Section
        doc.setFont(undefined, 'bold');
        doc.text('ACTIVITY LOG', 20, y);
        y += 10;
        doc.setFont(undefined, 'normal');
        
        incidentForm.activities.forEach((activity, index) => {
          if (activity.datetime.trim()) {
            doc.text(`${activity.datetime}: ${activity.activity}`, 20, y);
            y += 6;
            if (y > 280) { // New page if needed
              doc.addPage();
              y = 20;
            }
          }
        });
        
      } else {
        // Volunteer Log PDF
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('VCEG - AGENCY PARTNERSHIP VOLUNTEER LOG', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        let y = 40;
        
        doc.text(`Name: ${volunteerForm.firstName} ${volunteerForm.lastName}`, 20, y);
        y += 8;
        doc.text(`Organization: ${volunteerForm.organization}`, 20, y);
        y += 8;
        doc.text(`Email: ${volunteerForm.email}`, 20, y);
        y += 8;
        doc.text(`Phone: ${volunteerForm.phone}`, 20, y);
        y += 8;
        doc.text(`Total Families Served: ${volunteerForm.familiesServed}`, 20, y);
        y += 15;
        
        // Volunteer Hours Section
        doc.setFont(undefined, 'bold');
        doc.text('VOLUNTEER HOURS', 20, y);
        y += 10;
        doc.setFont(undefined, 'normal');
        
        volunteerForm.volunteerHours.forEach((entry, index) => {
          if (entry.eventDate.trim()) {
            doc.text(`${index + 1}. Date: ${entry.eventDate} | Zip: ${entry.siteZip} | Hours: ${entry.hoursWorked} | Volunteers: ${entry.totalVolunteers}`, 20, y);
            y += 6;
          }
        });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 290);
      
      // Download
      const filename = formType === 'incident' 
        ? `VCEG_IncidentReport_${new Date().toISOString().slice(0,10)}.pdf`
        : `VCEG_VolunteerLog_${new Date().toISOString().slice(0,10)}.pdf`;
      
      doc.save(filename);
    } catch (error) {
      alert('Error generating PDF: ' + error.message);
      console.error('PDF generation error:', error);
    }
  };

  const clearForm = (formType) => {
    if (formType === 'incident') {
      setIncidentForm({
        incidentName: '',
        dateFrom: '',
        dateTo: '',
        timeFrom: '',
        timeTo: '',
        preparedByFirst: '',
        preparedByLast: '',
        position: '',
        resources: Array(8).fill().map(() => ({ name: '', title: '', organization: '' })),
        activities: Array(20).fill().map(() => ({ datetime: '', activity: '' }))
      });
    } else {
      setVolunteerForm({
        firstName: '',
        lastName: '',
        organization: '',
        email: '',
        phone: '',
        familiesServed: '',
        volunteerHours: Array(11).fill().map(() => ({ 
          eventDate: '', 
          siteZip: '', 
          hoursWorked: '', 
          totalVolunteers: '' 
        }))
      });
    }
  };

  const updateIncidentField = (field, value) => {
    setIncidentForm(prev => ({ ...prev, [field]: value }));
  };

  const updateIncidentArrayField = (arrayName, index, field, value) => {
    setIncidentForm(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateVolunteerField = (field, value) => {
    setVolunteerForm(prev => ({ ...prev, [field]: value }));
  };

  const updateVolunteerHours = (index, field, value) => {
    setVolunteerForm(prev => ({
      ...prev,
      volunteerHours: prev.volunteerHours.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const InputField = ({ label, value, onChange, type = "text", required = false, placeholder = "" }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        required={required}
      />
    </div>
  );

  const SearchInterface = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Search className="w-5 h-5" />
        Search Database
      </h2>

      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
          <select
            value={searchFilters.type}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Types</option>
            <option value="incident">Incident Reports</option>
            <option value="volunteer">Volunteer Logs</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
          <input
            type="date"
            value={searchFilters.dateFrom}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
          <input
            type="date"
            value={searchFilters.dateTo}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Term</label>
          <input
            type="text"
            value={searchFilters.searchTerm}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="Name, incident, organization..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={searchDatabase}
          disabled={loading}
          className="px-6 py-2 bg-purple-800 text-white rounded-md hover:bg-purple-900 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Searching...' : 'Search'}
        </button>
        
        <button
          onClick={() => setSearchFilters({ type: '', dateFrom: '', dateTo: '', searchTerm: '' })}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>

        {searchResults.length > 0 && (
          <button
            onClick={exportSearchResultsToCSV}
            className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Results CSV
          </button>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Search Results ({searchResults.length} found)
        </h3>
        
        {searchResults.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No results found. Try adjusting your search criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Title/Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{result.id}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.type === 'incident' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {result.type === 'incident' ? 'Incident' : 'Volunteer'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {result.type === 'incident' 
                        ? result.data.incidentName 
                        : `${result.data.firstName} ${result.data.lastName}`
                      }
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {result.type === 'incident' 
                        ? result.data.dateFrom 
                        : result.data.volunteerHours?.find(h => h.eventDate)?.eventDate || 'N/A'
                      }
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {new Date(result.created_at).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => loadFormData(result.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            VCEG Form Processor
          </h1>
          <p className="text-purple-200 mt-2">Professional form processing with database storage and PDF export</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('form')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'form'
                ? 'bg-white text-purple-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Create Forms
          </button>
          <button
            onClick={() => setViewMode('search')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'search'
                ? 'bg-white text-purple-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Search className="w-4 h-4" />
            Search Database
          </button>
        </div>
      </div>

      {viewMode === 'search' ? (
        <div className="max-w-6xl mx-auto px-6 py-6">
          <SearchInterface />
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="max-w-6xl mx-auto px-6 mt-6">
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('incident')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'incident'
                    ? 'bg-white text-purple-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Incident Report
              </button>
              <button
                onClick={() => setActiveTab('volunteer')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'volunteer'
                    ? 'bg-white text-purple-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Volunteer Log
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="max-w-6xl mx-auto px-6 py-6">
            {activeTab === 'incident' ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Incident Report Form
                </h2>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <InputField
                      label="Incident Name"
                      value={incidentForm.incidentName}
                      onChange={(e) => updateIncidentField('incidentName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <InputField
                    label="Date From"
                    value={incidentForm.dateFrom}
                    onChange={(e) => updateIncidentField('dateFrom', e.target.value)}
                    type="date"
                    required
                  />
                  
                  <InputField
                    label="Date To"
                    value={incidentForm.dateTo}
                    onChange={(e) => updateIncidentField('dateTo', e.target.value)}
                    type="date"
                    required
                  />
                  
                  <InputField
                    label="Time From"
                    value={incidentForm.timeFrom}
                    onChange={(e) => updateIncidentField('timeFrom', e.target.value)}
                    type="time"
                    required
                  />
                  
                  <InputField
                    label="Time To"
                    value={incidentForm.timeTo}
                    onChange={(e) => updateIncidentField('timeTo', e.target.value)}
                    type="time"
                    required
                  />
                  
                  <InputField
                    label="First Name"
                    value={incidentForm.preparedByFirst}
                    onChange={(e) => updateIncidentField('preparedByFirst', e.target.value)}
                    required
                  />
                  
                  <InputField
                    label="Last Name"
                    value={incidentForm.preparedByLast}
                    onChange={(e) => updateIncidentField('preparedByLast', e.target.value)}
                    required
                  />
                  
                  <div className="lg:col-span-2">
                    <InputField
                      label="Your Position/Title"
                      value={incidentForm.position}
                      onChange={(e) => updateIncidentField('position', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Resources Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Resources Assigned
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">List team members that worked onsite with you:</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Title</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Organization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidentForm.resources.map((resource, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={resource.name}
                                onChange={(e) => updateIncidentArrayField('resources', index, 'name', e.target.value)}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={resource.title}
                                onChange={(e) => updateIncidentArrayField('resources', index, 'title', e.target.value)}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={resource.organization}
                                onChange={(e) => updateIncidentArrayField('resources', index, 'organization', e.target.value)}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Activity Log
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Example: 5/22/25 - 8:30AM; Met with team to develop action plan
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Date/Time</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Notable Activities</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidentForm.activities.map((activity, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={activity.datetime}
                                onChange={(e) => updateIncidentArrayField('activities', index, 'datetime', e.target.value)}
                                placeholder="MM/DD/YY - HH:MM AM/PM"
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={activity.activity}
                                onChange={(e) => updateIncidentArrayField('activities', index, 'activity', e.target.value)}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json,.csv,.xlsx,.xls"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Prefilled
                    </button>
                  </div>
                  
                  <button
                    onClick={() => clearForm('incident')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear Form
                  </button>
                  
                  <button
                    onClick={() => saveFormData('incident')}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save to Database'}
                  </button>
                  
                  <button
                    onClick={() => exportToCSV('incident')}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV
                  </button>
                  
                  <button
                    onClick={() => generatePDF('incident')}
                    className="px-6 py-2 bg-purple-800 text-white rounded-md hover:bg-purple-900 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agency Partnership Volunteer Log
                </h2>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <InputField
                    label="First Name"
                    value={volunteerForm.firstName}
                    onChange={(e) => updateVolunteerField('firstName', e.target.value)}
                    required
                  />
                  
                  <InputField
                    label="Last Name"
                    value={volunteerForm.lastName}
                    onChange={(e) => updateVolunteerField('lastName', e.target.value)}
                    required
                  />
                  
                  <div className="lg:col-span-2">
                    <InputField
                      label="Organization"
                      value={volunteerForm.organization}
                      onChange={(e) => updateVolunteerField('organization', e.target.value)}
                      required
                    />
                  </div>
                  
                  <InputField
                    label="Email"
                    value={volunteerForm.email}
                    onChange={(e) => updateVolunteerField('email', e.target.value)}
                    type="email"
                    required
                    placeholder="example@example.com"
                  />
                  
                  <InputField
                    label="Phone"
                    value={volunteerForm.phone}
                    onChange={(e) => updateVolunteerField('phone', e.target.value)}
                    type="tel"
                    required
                  />
                  
                  <div className="lg:col-span-2">
                    <InputField
                      label='Total Number of "Families" Served'
                      value={volunteerForm.familiesServed}
                      onChange={(e) => updateVolunteerField('familiesServed', e.target.value)}
                      type="number"
                      required
                    />
                  </div>
                </div>

                {/* Volunteer Hours Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Volunteer Hours
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Event Date</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Event Site Zip</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Total Hours Worked</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Total Volunteers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {volunteerForm.volunteerHours.map((entry, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2 text-center">{index + 1}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="date"
                                value={entry.eventDate}
                                onChange={(e) => updateVolunteerHours(index, 'eventDate', e.target.value)}
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={entry.siteZip}
                                onChange={(e) => updateVolunteerHours(index, 'siteZip', e.target.value)}
                                placeholder="ZIP Code"
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                value={entry.hoursWorked}
                                onChange={(e) => updateVolunteerHours(index, 'hoursWorked', e.target.value)}
                                placeholder="Hours"
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                value={entry.totalVolunteers}
                                onChange={(e) => updateVolunteerHours(index, 'totalVolunteers', e.target.value)}
                                placeholder="Count"
                                className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json,.csv,.xlsx,.xls"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Prefilled
                    </button>
                  </div>
                  
                  <button
                    onClick={() => clearForm('volunteer')}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear Form
                  </button>
                  
                  <button
                    onClick={() => saveFormData('volunteer')}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save to Database'}
                  </button>
                  
                  <button
                    onClick={() => exportToCSV('volunteer')}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV
                  </button>
                  
                  <button
                    onClick={() => generatePDF('volunteer')}
                    className="px-6 py-2 bg-purple-800 text-white rounded-md hover:bg-purple-900 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VCEGForms;