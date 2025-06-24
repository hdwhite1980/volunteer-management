'use client';

import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Clock, X, RefreshCw } from 'lucide-react';

// Types for upload functionality
interface UploadedFile {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  processedDate?: string;
  status: 'processing' | 'completed' | 'no_data_found' | 'error';
  error?: string;
  uploadedBy?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  files?: any[];
  error?: string;
}

interface UploadComponentProps {
  currentUser?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  onBack: () => void;
}

const UploadComponent: React.FC<UploadComponentProps> = ({ currentUser, onBack }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [recentUploads, setRecentUploads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    processing: 0,
    completed: 0,
    no_data_found: 0,
    error: 0
  });

  // Load uploaded files on component mount
  useEffect(() => {
    loadUploadedFiles();
    // Auto-refresh every 30 seconds if there are processing files
    const interval = setInterval(() => {
      if (statusCounts.processing > 0) {
        loadUploadedFiles();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusCounts.processing]);

  const loadUploadedFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/upload', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files || []);
        updateStatusCounts(data.files || []);
      } else if (response.status === 401) {
        console.log('Upload: Authentication required');
      }
    } catch (error) {
      console.error('Upload: Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatusCounts = (files: UploadedFile[]) => {
    const counts = {
      processing: 0,
      completed: 0,
      no_data_found: 0,
      error: 0
    };
    
    files.forEach(file => {
      if (counts.hasOwnProperty(file.status)) {
        counts[file.status as keyof typeof counts]++;
      }
    });
    
    setStatusCounts(counts);
  };

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
        credentials: 'include',
        body: formData
      });

      const result: UploadResponse = await response.json();
      
      if (response.ok && result.success) {
        const fileNames = result.files?.map(f => f.name) || [`${files.length} file(s)`];
        setRecentUploads(prev => [...prev, ...fileNames]);
        
        // Show success message
        alert(`Successfully uploaded ${result.files?.length || files.length} files! OCR processing has started.`);
        
        // Refresh the file list
        setTimeout(() => {
          loadUploadedFiles();
        }, 1000);
      } else {
        alert(`Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please check your internet connection and try again.');
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'no_data_found': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'no_data_found': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Upload Volunteer Forms</h1>
                <p className="text-sm text-gray-600">
                  Submit completed forms for automatic OCR processing
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {currentUser && (
                <span className="text-sm text-gray-600">
                  Logged in as: <span className="font-medium">{currentUser.username}</span>
                </span>
              )}
              <button
                onClick={loadUploadedFiles}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Status Summary Cards */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Processing</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.processing}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">No Data Found</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.no_data_found}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Errors</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400 transition-colors bg-gray-50/50">
              <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-2xl mx-auto mb-6">
                <Upload className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Upload Volunteer Forms
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Drag and drop your completed volunteer forms here, or click to browse your files
              </p>
              
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="fileInput"
                disabled={uploading}
              />
              <label
                htmlFor="fileInput"
                className={`inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-8 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : 'Choose Files'}
              </label>
              
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: PDF, JPG, PNG (max 10MB per file)
              </p>
            </div>

            {/* Recent Uploads Success */}
            {recentUploads.length > 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-800">Recently Uploaded</h4>
                </div>
                <div className="space-y-2">
                  {recentUploads.slice(-5).map((fileName, index) => (
                    <div key={index} className="flex items-center space-x-2 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Uploaded Files</h3>
                    <p className="text-sm text-gray-600">
                      {uploadedFiles.length} files uploaded
                      {statusCounts.processing > 0 && (
                        <span className="ml-2 text-blue-600">
                          • {statusCounts.processing} still processing
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-1/4 px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Upload Date
                      </th>
                      <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-1/12 px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="w-1/3 px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Processing Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {uploadedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900 truncate" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">{file.type}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div className="whitespace-nowrap">
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(file.uploadDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(file.status)}`}>
                            {getStatusIcon(file.status)}
                            <span className="ml-1 capitalize">{file.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {file.status === 'completed' && file.processedDate && (
                            <div className="text-green-600">
                              <div className="font-medium">✓ Processing Complete</div>
                              <div className="text-xs">
                                {new Date(file.processedDate).toLocaleString()}
                              </div>
                            </div>
                          )}
                          {file.status === 'processing' && (
                            <div className="text-blue-600">
                              <div className="font-medium">🔄 Processing Document</div>
                              <div className="text-xs">AI is analyzing content...</div>
                            </div>
                          )}
                          {file.status === 'error' && file.error && (
                            <div className="text-red-600">
                              <div className="font-medium">❌ Processing Failed</div>
                              <div className="text-xs break-words">{file.error}</div>
                            </div>
                          )}
                          {file.status === 'no_data_found' && (
                            <div className="text-yellow-600">
                              <div className="font-medium">⚠️ No Data Found</div>
                              <div className="text-xs">No volunteer data detected in file</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Upload Instructions
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Ensure all required fields are completed on forms</li>
                <li>• Files will be processed using OCR technology</li>
                <li>• Data will be automatically extracted and saved</li>
                <li>• Processing typically takes 1-2 minutes per file</li>
                <li>• Maximum file size: 10MB per file</li>
                <li>• Supported formats: PDF, JPG, PNG</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                OCR Processing
              </h4>
              <p className="text-sm text-amber-700">
                Uploaded forms are processed using OpenAI's advanced OCR technology to automatically extract 
                volunteer information, hours, and activities. Extracted data is verified and added to your 
                volunteer database for easy management and reporting.
              </p>
              <div className="mt-3 text-sm text-amber-700">
                <strong>Processing Status:</strong>
                <br />• Processing: AI is analyzing your document
                <br />• Completed: Data extracted and saved successfully
                <br />• No Data Found: No volunteer data detected
                <br />• Error: Processing failed (contact support)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadComponent;