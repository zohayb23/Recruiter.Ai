import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  User,
  Bot,
  MessageCircle,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  TrendingUp,
  Users,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Download,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    matchedSkills?: string[];
    jobInfo?: {
      title: string;
      company: string;
      description: string;
      mustHaveSkills: string[];
      flexibleSkills: string[];
    };
  };
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  experienceYears: number;
  skills: string[];
  summary: string;
  resumeText: string;
  work_experience: any[];
  education: any[];
}

interface JobDescription {
  title: string;
  company: string;
  description: string;
  overview?: string;
  responsibilities?: string[];
  qualifications?: string[];
  required_skills: string[];
  preferred_skills: string[];
  benefits?: string[];
}

const CandidateChatPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationAnalysis, setConversationAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobSectionExpanded, setJobSectionExpanded] = useState(true);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load candidate data
  useEffect(() => {
    const fetchCandidate = async () => {
      if (!candidateId) {
        setError('No candidate ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch candidate data
        const response = await fetch(`http://localhost:8804/api/candidates/${candidateId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch candidate');
        }
        
        const data = await response.json();
        const candidateData = data.candidate;
        
        if (!candidateData) {
          throw new Error('Candidate not found');
        }
        
        const transformedCandidate: Candidate = {
          id: candidateData.id || candidateData.resume_id,
          name: candidateData.name || candidateData.full_name,
          email: candidateData.email || 'No email provided',
          phone: candidateData.phone || 'No phone provided',
          location: candidateData.location || 'Location not specified',
          position: 'Software Developer',
          experienceYears: candidateData.experience_years || 0,
          skills: candidateData.skills || [],
          summary: candidateData.summary || '',
          resumeText: candidateData.summary || '',
          work_experience: candidateData.work_experience || [],
          education: candidateData.education || []
        };
        
        setCandidate(transformedCandidate);
        
        // Initialize conversation with welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'assistant',
          content: `Hello ${transformedCandidate.name}! I'm your AI recruitment assistant. I've reviewed your profile and I'm here to help you with any questions about the position or your background. What would you like to discuss?`,
          timestamp: new Date(),
          metadata: {
            confidence: 1.0
          }
        };
        
        setMessages([welcomeMessage]);
        
        // Auto-send initial message to get job description
        // Simulate sending an empty message to trigger job matching
        const autoResponse = await fetch('http://localhost:8804/api/candidate-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId,
            message: "Initialize conversation",
            conversationHistory: [],
            candidateData: transformedCandidate
          })
        });
        
        if (autoResponse.ok) {
          const data = await autoResponse.json();
          
          // Update job information if provided
          if (data.jobInfo) {
            setJobDescription({
              title: data.jobInfo.title,
              company: data.jobInfo.company,
              description: data.jobInfo.description,
              overview: data.jobInfo.overview || '',
              responsibilities: data.jobInfo.responsibilities || [],
              qualifications: data.jobInfo.qualifications || [],
              required_skills: data.jobInfo.mustHaveSkills || [],
              preferred_skills: data.jobInfo.flexibleSkills || [],
              benefits: data.jobInfo.benefits || []
            });
            
            // Replace the welcome message with the actual AI greeting
            const actualGreeting: ChatMessage = {
              id: 'welcome',
              type: 'assistant',
              content: data.response,
              timestamp: new Date(),
              metadata: {
                confidence: data.confidence || 0.8,
                matchedSkills: data.matchedSkills || [],
                jobInfo: data.jobInfo || null
              }
            };
            
            setMessages([actualGreeting]);
          }
        }
        
      } catch (error: any) {
        console.error('Error fetching candidate:', error);
        setError(error.message || 'Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  // Send message function
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Send message to backend for AI processing
      const response = await fetch('http://localhost:8804/api/candidate-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          message: inputMessage.trim(),
          conversationHistory: messages,
          candidateData: candidate,
          jobDescription: jobDescription
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // Check if AI response is available
      if (!data.response || data.response.includes('OpenAI API key') || data.response.includes('fallback')) {
        // Only show fallback if we get an actual error response
        if (data.response && data.response.includes('OpenAI API key')) {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'system',
            content: '⚠️ AI Assistant is currently unavailable. Please ensure the OpenAI API key is configured in the backend.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: {
          confidence: data.confidence || 0.8,
          matchedSkills: data.matchedSkills || [],
          jobInfo: data.jobInfo || null
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update job information if provided
      if (data.jobInfo) {
        setJobDescription({
          title: data.jobInfo.title,
          company: data.jobInfo.company,
          description: data.jobInfo.description,
          overview: data.jobInfo.overview || '',
          responsibilities: data.jobInfo.responsibilities || [],
          qualifications: data.jobInfo.qualifications || [],
          required_skills: data.jobInfo.mustHaveSkills || [],
          preferred_skills: data.jobInfo.flexibleSkills || [],
          benefits: data.jobInfo.benefits || []
        });
      }
      
      // Update conversation analysis
      if (data.analysis) {
        setConversationAnalysis(data.analysis);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/candidates')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Sidebar - Candidate Info */}
      <div className={`w-80 lg:w-96 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } fixed lg:relative z-50 h-full`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/candidates')}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">AI Interview</h1>
              <p className="text-sm text-blue-100">Intelligent candidate assessment</p>
            </div>
          </div>
        </div>

        {/* Candidate Profile */}
        {candidate && (
          <div className="p-6 border-b border-gray-200/50 bg-white/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                <p className="text-sm text-gray-600 font-medium">{candidate.position || 'Software Developer'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-xl border border-gray-200/50">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm text-gray-900 truncate">{candidate.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-xl border border-gray-200/50">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Phone</p>
                  <p className="text-sm text-gray-900">{candidate.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-xl border border-gray-200/50">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin size={16} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm text-gray-900">{candidate.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-xl border border-gray-200/50">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Experience</p>
                  <p className="text-sm text-gray-900">{candidate.experienceYears} years</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Position Information - Comprehensive Requirements */}
        {jobDescription && (
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-br from-blue-50 to-indigo-50">
            <button
              onClick={() => setJobSectionExpanded(!jobSectionExpanded)}
              className="w-full text-left"
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Briefcase size={18} className="text-white" />
                  </div>
                  <span>Job Position & Requirements</span>
                </div>
                <div className="text-gray-500">
                  {jobSectionExpanded ? '▼' : '▶'}
                </div>
              </h4>
            </button>
            
            {jobSectionExpanded && (
            <>
            <div className="space-y-3">
              {/* Job Title and Company */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/50 shadow-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <div>
                    <h5 className="text-xl font-bold text-gray-900">{jobDescription.title}</h5>
                    <p className="text-lg text-blue-600 font-semibold">{jobDescription.company}</p>
                  </div>
                </div>
                {jobDescription && jobDescription.description && (
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">{jobDescription.description}</p>
                )}
              </div>
              
              {/* Job Overview */}
              {jobDescription && jobDescription.overview && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <h6 className="text-sm font-semibold text-gray-800 mb-2">Job Overview:</h6>
                  <p className="text-xs text-gray-600 leading-relaxed">{jobDescription.overview}</p>
                </div>
              )}
              
              {/* Key Responsibilities */}
              {jobDescription && jobDescription.responsibilities && jobDescription.responsibilities.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <h6 className="text-sm font-semibold text-gray-800 mb-2">Key Responsibilities:</h6>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {jobDescription.responsibilities.slice(0, 5).map((responsibility, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                    {jobDescription.responsibilities.length > 5 && (
                      <li className="text-gray-500 italic">+ {jobDescription.responsibilities.length - 5} more responsibilities</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Required Qualifications */}
              {jobDescription && jobDescription.qualifications && jobDescription.qualifications.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <h6 className="text-sm font-semibold text-gray-800 mb-2">Required Qualifications:</h6>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {jobDescription.qualifications.slice(0, 4).map((qualification, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{qualification}</span>
                      </li>
                    ))}
                    {jobDescription.qualifications.length > 4 && (
                      <li className="text-gray-500 italic">+ {jobDescription.qualifications.length - 4} more qualifications</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Required Skills */}
              {jobDescription && jobDescription.required_skills && jobDescription.required_skills.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-2xl border border-red-200/50 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <h6 className="text-sm font-bold text-red-800">Required Skills</h6>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {jobDescription.required_skills.slice(0, 8).map((skill, index) => (
                      <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full font-medium shadow-sm">
                        {skill}
                      </span>
                    ))}
                    {jobDescription.required_skills.length > 8 && (
                      <span className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                        +{jobDescription.required_skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Preferred Skills */}
              {jobDescription && jobDescription.preferred_skills && jobDescription.preferred_skills.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200/50 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">+</span>
                    </div>
                    <h6 className="text-sm font-bold text-green-800">Preferred Skills</h6>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {jobDescription.preferred_skills.slice(0, 6).map((skill, index) => (
                      <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium shadow-sm">
                        {skill}
                      </span>
                    ))}
                    {jobDescription.preferred_skills.length > 6 && (
                      <span className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                        +{jobDescription.preferred_skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Benefits */}
              {jobDescription && jobDescription.benefits && jobDescription.benefits.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <h6 className="text-sm font-semibold text-yellow-800 mb-2">Benefits & Perks:</h6>
                  <div className="flex flex-wrap gap-1">
                    {jobDescription.benefits.slice(0, 4).map((benefit, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        {benefit}
                      </span>
                    ))}
                    {jobDescription.benefits.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{jobDescription.benefits.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            </>
            )}
          </div>
        )}

        {/* Conversation Analysis */}
        {conversationAnalysis && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Conversation Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Engagement Score</span>
                <span className="text-sm font-semibold text-green-600">
                  {conversationAnalysis.engagementScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Skills Matched</span>
                <span className="text-sm font-semibold text-blue-600">
                  {conversationAnalysis.skillsMatched?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Questions Asked</span>
                <span className="text-sm font-semibold text-purple-600">
                  {conversationAnalysis.questionsAsked || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button 
              onClick={() => {
                if (candidate?.file_path) {
                  window.open(`http://localhost:8804/api/resume/${candidate.id}/file`, '_blank');
                } else {
                  alert('Resume file not available');
                }
              }}
              className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FileText size={16} />
              <span>View Resume</span>
            </button>
            <button 
              onClick={() => {
                if (candidate?.file_path) {
                  const link = document.createElement('a');
                  link.href = `http://localhost:8804/api/resume/${candidate.id}/file`;
                  link.download = candidate.file_path;
                  link.click();
                } else {
                  alert('Resume file not available');
                }
              }}
              className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download size={16} />
              <span>Download Profile</span>
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the conversation?')) {
                  setMessages([{
                    id: 'welcome',
                    type: 'assistant',
                    content: `Hello ${candidate?.name}! I'm your AI recruitment assistant. I've reviewed your profile and I'm here to help you with any questions about the position or your background. What would you like to discuss?`,
                    timestamp: new Date(),
                    metadata: {
                      confidence: 1.0
                    }
                  }]);
                  setConversationAnalysis(null);
                }
              }}
              className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              <span>Reset Conversation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50/30 min-w-0">
        {/* Chat Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <User size={20} className="text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Conversation with {candidate?.name}
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  AI-powered candidate assessment and interaction
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700">AI Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-2xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <User size={18} className="text-white" />
                  ) : (
                    <Bot size={18} className="text-white" />
                  )}
                </div>
                
                {/* Message Content */}
                <div className="flex-1">
                  <div
                    className={`inline-block px-6 py-4 rounded-2xl shadow-lg ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : message.type === 'assistant'
                        ? 'bg-white text-gray-900 border border-gray-200/50'
                        : 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Bot size={16} className="text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-6 shadow-lg">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full px-6 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-200"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Send size={18} />
              <span>Send</span>
            </button>
          </div>
          
          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 font-medium mb-3">Quick start suggestions:</p>
              <div className="flex flex-wrap gap-3">
                {[
                  "Tell me about your experience",
                  "What are your key skills?",
                  "Describe a challenging project",
                  "What are your career goals?"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full hover:from-blue-100 hover:to-purple-100 hover:text-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateChatPage;
