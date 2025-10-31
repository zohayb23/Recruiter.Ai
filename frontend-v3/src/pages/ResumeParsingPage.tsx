import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Loader2,
  Users,
  Clock,
  BarChart3,
  RefreshCw,
  Plus,
  FileUp
} from 'lucide-react';

// Single Resume Parsing Interfaces
interface ParsedResume {
  resume_id: string;
  full_name: string;
  contact: {
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  education: any[];
  work_experience: any[];
  skills: any[];
  summary: string;
  certifications: any[];
  languages: any[];
  file_path: string;
  created_at: string;
}

// Bulk Resume Parsing Interfaces
interface BulkParsedResume {
  filename: string;
  resume_id: string;
  full_name: string;
  status: 'success' | 'error';
  error?: string;
}

interface BulkParseResult {
  message: string;
  total_files: number;
  successful: number;
  failed: number;
  results: BulkParsedResume[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

const ResumeParsingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single Resume Parsing State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedResume | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Resume Parsing State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkParseResult, setBulkParseResult] = useState<BulkParseResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Single Resume Parsing Functions
  const handleSingleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (!['pdf', 'doc', 'docx'].includes(extension || '')) {
        setSingleError('Only PDF, DOC, and DOCX files are supported');
        return;
      }
      setSelectedFile(file);
      setSingleError(null);
      setParseResult(null);
    }
  };

  const handleSingleParse = async () => {
    if (!selectedFile) {
      setSingleError('Please select a file to upload');
      return;
    }

    setIsParsing(true);
    setSingleError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8804/api/resume-parser/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse resume');
      }

      const result: ParsedResume = await response.json();
      setParseResult(result);
      setSelectedFile(null);
      
      if (singleFileInputRef.current) {
        singleFileInputRef.current.value = '';
      }
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : 'An error occurred during parsing');
    } finally {
      setIsParsing(false);
    }
  };

  // Bulk Resume Parsing Functions
  const handleBulkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles = files.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'doc', 'docx'].includes(extension || '');
    });

    if (validFiles.length !== files.length) {
      setBulkError('Only PDF, DOC, and DOCX files are supported');
      return;
    }

    if (validFiles.length > 50) {
      setBulkError('Maximum 50 files allowed per upload');
      return;
    }

    setSelectedFiles(validFiles);
    setBulkError(null);
    setBulkParseResult(null);
  };

  const handleBulkParse = async () => {
    if (selectedFiles.length === 0) {
      setBulkError('Please select files to upload');
      return;
    }

    setIsBulkUploading(true);
    setBulkError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:8804/api/resume-parser/bulk-parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to parse resumes');
      }

      const result: BulkParseResult = await response.json();
      setBulkParseResult(result);
      setSelectedFiles([]);
      
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = '';
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'An error occurred during bulk parsing');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    if (activeTab === 'single') {
      const file = files[0];
      if (file) {
        const extension = file.name.toLowerCase().split('.').pop();
        if (!['pdf', 'doc', 'docx'].includes(extension || '')) {
          setSingleError('Only PDF, DOC, and DOCX files are supported');
          return;
        }
        setSelectedFile(file);
        setSingleError(null);
        setParseResult(null);
      }
    } else {
      const validFiles = files.filter(file => {
        const extension = file.name.toLowerCase().split('.').pop();
        return ['pdf', 'doc', 'docx'].includes(extension || '');
      });

      if (validFiles.length !== files.length) {
        setBulkError('Only PDF, DOC, and DOCX files are supported');
        return;
      }

      if (validFiles.length > 50) {
        setBulkError('Maximum 50 files allowed per upload');
        return;
      }

      setSelectedFiles(validFiles);
      setBulkError(null);
      setBulkParseResult(null);
    }
  };

  const removeBulkFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const clearAll = () => {
    if (activeTab === 'single') {
      setSelectedFile(null);
      setParseResult(null);
      setSingleError(null);
      if (singleFileInputRef.current) {
        singleFileInputRef.current.value = '';
      }
    } else {
      setSelectedFiles([]);
      setBulkParseResult(null);
      setBulkError(null);
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = '';
      }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Resume Parsing</h1>
            <p className="text-blue-100 text-lg">Parse individual resumes or upload multiple resumes at once using AI</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <FileText size={32} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('single')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileUp size={16} />
                <span>Single Resume</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bulk'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Upload size={16} />
                <span>Bulk Upload (Up to 50)</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Single Resume Parsing Tab */}
          {activeTab === 'single' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Single Resume</h3>
                <p className="text-gray-600">Select one PDF, DOC, or DOCX file for parsing</p>
              </div>

              {/* Single File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={singleFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleSingleFileSelect}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <FileUp size={24} className="text-blue-600" />
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedFile ? selectedFile.name : 'Drag & drop a file here'}
                    </p>
                    <p className="text-gray-600">or click to browse files</p>
                  </div>
                  
                  <button
                    onClick={() => singleFileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              </div>

              {/* Single File Error */}
              {singleError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="text-red-700">{singleError}</span>
                </div>
              )}

              {/* Selected Single File */}
              {selectedFile && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Single Parse Button */}
              {selectedFile && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSingleParse}
                    disabled={isParsing}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Parsing...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={20} />
                        <span>Parse Resume</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Single Parse Result */}
              {parseResult && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Parsing Result</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>Completed at {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Candidate Information</h4>
                        <p className="text-blue-800"><strong>Name:</strong> {parseResult.full_name}</p>
                        <p className="text-blue-800"><strong>Email:</strong> {parseResult.contact.email || 'Not provided'}</p>
                        <p className="text-blue-800"><strong>Phone:</strong> {parseResult.contact.phone || 'Not provided'}</p>
                        {parseResult.contact.linkedin && (
                          <p className="text-blue-800"><strong>LinkedIn:</strong> {parseResult.contact.linkedin}</p>
                        )}
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Experience</h4>
                        <p className="text-green-800"><strong>Work Experience:</strong> {parseResult.work_experience.length} positions</p>
                        <p className="text-green-800"><strong>Education:</strong> {parseResult.education.length} entries</p>
                        <p className="text-green-800"><strong>Skills:</strong> {parseResult.skills.length} skills</p>
                        <p className="text-green-800"><strong>Certifications:</strong> {parseResult.certifications.length} certifications</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900 mb-2">File Information</h4>
                        <p className="text-purple-800"><strong>Resume ID:</strong> {parseResult.resume_id}</p>
                        <p className="text-purple-800"><strong>File Path:</strong> {parseResult.file_path}</p>
                        <p className="text-purple-800"><strong>Parsed:</strong> {new Date(parseResult.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Skills Preview */}
                    {parseResult.skills && parseResult.skills.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">Extracted Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {parseResult.skills.slice(0, 10).map((skill: any, index: number) => (
                            <span key={index} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
                              {skill.name || skill}
                            </span>
                          ))}
                          {parseResult.skills.length > 10 && (
                            <span className="px-3 py-1 bg-yellow-300 text-yellow-900 rounded-full text-sm">
                              +{parseResult.skills.length - 10} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Work Experience Preview */}
                    {parseResult.work_experience && parseResult.work_experience.length > 0 && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-indigo-900 mb-2">Work Experience Preview</h4>
                        <div className="space-y-2">
                          {parseResult.work_experience.slice(0, 3).map((exp: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <p className="font-medium text-indigo-900">{exp.title || exp.position || 'Position'}</p>
                              <p className="text-sm text-indigo-700">{exp.company || 'Company'}</p>
                              {exp.duration && <p className="text-xs text-indigo-600">{exp.duration}</p>}
                            </div>
                          ))}
                          {parseResult.work_experience.length > 3 && (
                            <p className="text-sm text-indigo-700 italic">
                              +{parseResult.work_experience.length - 3} more positions
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {parseResult.summary && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Full Summary</h4>
                        <div className="text-gray-700 max-h-96 overflow-y-auto">
                          <p className="whitespace-pre-wrap leading-relaxed">{parseResult.summary}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        <button
                          onClick={clearAll}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Parse Another
                        </button>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <RefreshCw size={16} />
                          <span>Start Over</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {
                          // Navigate to candidate details page using React Router
                          navigate(`/candidate-details/${parseResult.resume_id}`);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Eye size={16} />
                        <span>View Candidate Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk Resume Parsing Tab */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Multiple Resumes</h3>
                <p className="text-gray-600">Select up to 50 PDF, DOC, or DOCX files for bulk processing</p>
              </div>

              {/* Bulk File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  selectedFiles.length > 0
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleBulkFileSelect}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload size={24} className="text-blue-600" />
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drag & drop files here'}
                    </p>
                    <p className="text-gray-600">or click to browse files</p>
                  </div>
                  
                  <button
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose Files
                  </button>
                </div>
              </div>

              {/* Bulk Error */}
              {bulkError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="text-red-700">{bulkError}</span>
                </div>
              )}

              {/* Selected Bulk Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
                    <button
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1"
                    >
                      <Trash2 size={16} />
                      <span>Clear All</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText size={20} className="text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBulkFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Parse Button */}
              {selectedFiles.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleBulkParse}
                    disabled={isBulkUploading}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isBulkUploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Parse {selectedFiles.length} Resume{selectedFiles.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Bulk Parse Results */}
              {bulkParseResult && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Processing Results</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>Completed at {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText size={24} className="text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{bulkParseResult.total_files}</p>
                          <p className="text-sm text-gray-600">Total Files</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle size={24} className="text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-green-600">{bulkParseResult.successful}</p>
                          <p className="text-sm text-gray-600">Successful</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <XCircle size={24} className="text-red-600" />
                        <div>
                          <p className="text-2xl font-bold text-red-600">{bulkParseResult.failed}</p>
                          <p className="text-sm text-gray-600">Failed</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <BarChart3 size={24} className="text-purple-600" />
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {bulkParseResult.total_files > 0 ? Math.round((bulkParseResult.successful / bulkParseResult.total_files) * 100) : 0}%
                          </p>
                          <p className="text-sm text-gray-600">Success Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Detailed Results</h4>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {bulkParseResult.results.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {result.status === 'success' ? (
                              <CheckCircle size={20} className="text-green-600" />
                            ) : (
                              <XCircle size={20} className="text-red-600" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{result.filename}</p>
                              {result.status === 'success' && (
                                <p className="text-sm text-gray-600">Parsed as: {result.full_name}</p>
                              )}
                              {result.status === 'error' && result.error && (
                                <p className="text-sm text-red-600">Error: {result.error}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              result.status === 'success' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {result.status}
                            </span>
                            {result.status === 'success' && (
                              <button className="p-1 text-gray-400 hover:text-blue-600">
                                <Eye size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={clearAll}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Clear Results
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <RefreshCw size={16} />
                      <span>Parse More</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How Resume Parsing Works</h3>
        <div className="space-y-2 text-blue-800">
          <p>• Upload PDF, DOC, or DOCX resume files for AI-powered parsing</p>
          <p>• Single upload: Process one resume at a time with detailed results</p>
          <p>• Bulk upload: Process up to 50 resumes simultaneously</p>
          <p>• AI extracts and structures information from each resume</p>
          <p>• Parsed data is automatically stored in the Milvus database</p>
          <p>• All parsed resumes will appear in the Candidates page</p>
        </div>
      </div>
    </div>
  );
};

export default ResumeParsingPage;