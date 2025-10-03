import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Download,
  Calendar,
  Briefcase,
  Play,
  AlertCircle,
  ChevronLeft,
  FileText,
  Sparkles,
  MessageCircle,
  Brain,
  BarChart3
} from 'lucide-react';
import { candidateApiService, type Candidate } from '../services/candidateApi';

interface CandidateProfilePageProps {
  candidateId?: string;
}

const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ candidateId }) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState('Question 1');

  // Fetch candidate data from API
  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let candidateData: Candidate | null = null;
        
        if (candidateId) {
          candidateData = await candidateApiService.getCandidateById(candidateId);
        } else {
          // If no specific candidate ID, get the first candidate
          const candidates = await candidateApiService.getAllCandidates();
          candidateData = candidates[0] || null;
        }
        
        if (candidateData) {
          setCandidate(candidateData);
        } else {
          // Fallback to mock data if no candidate found
          const mockCandidate: Candidate = {
            id: candidateId || '339efb55-96ed-4d86-83f5-ca29714692ad',
            name: 'Jane Doe',
            email: 'janedoe@gmail.com',
            phone: '512-123-4567',
            location: 'Austin, TX',
            status: 'Shortlisted',
            jobMatchScore: 75,
            experienceYears: '6 years',
            skills: ['Python', 'Java', 'C++', 'SQL', 'Javascript'],
            lastActivity: '2025-09-29',
            resumeId: 'res_339efb55',
            position: 'Associate Software Engineer',
            description: 'Experienced software engineer with 6+ years of experience in full-stack development. Specialized in Python, JavaScript, and cloud technologies.',
            linkedin: 'linkedin.com/in/janedoe',
            github: 'github.com/janedoe',
            videoScore: 78,
            resumeScore: 80,
            interviews: 2,
            attempts: 5,
            experience: [
              {
                title: 'Senior Software Engineer',
                company: 'Google Inc.',
                period: 'Jan 2020 - Present',
                description: [
                  'Led development of microservices architecture serving 10M+ users',
                  'Implemented machine learning models for recommendation systems',
                  'Mentored 5 junior developers and conducted code reviews'
                ],
                skills: ['Python', 'Go', 'Kubernetes', 'TensorFlow', 'GCP']
              }
            ],
            education: [
              {
                degree: 'Bachelors of Science, Computer Science',
                institution: 'University of Texas at Austin',
                period: '2016 - 2020',
                gpa: '3.8/4.0'
              }
            ],
            certifications: [
              { name: 'Product Management', issuer: 'Google', date: '9/25/24' },
              { name: 'Data Analytics', issuer: 'IBM', date: '9/15/23' },
              { name: 'Full Stack SWE', issuer: 'Google', date: '1/2/23' }
            ],
            videoInterviews: [
              {
                question: 'Tell me about a time you faced a conflict in the workplace or in a project and how you handled it.',
                duration: '3:45',
                score: 78,
                insights: [
                  'Strong technical explanation of JavaScript',
                  'Demonstrates leadership in a team project',
                  'Clear and confident communication',
                  'Problem-solving approach to conflict resolution'
                ]
              }
            ],
            uploadedDate: '2025-09-29',
            fileName: 'jane_doe_resume.pdf'
          };
          
          setCandidate(mockCandidate);
        }
      } catch (error) {
        console.error('Error fetching candidate:', error);
        setError('Failed to load candidate profile. Please check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div>
              <span className="text-red-800 font-medium">Connection Error</span>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Candidate Not Found</h3>
          <p className="text-gray-600">The requested candidate could not be found.</p>
        </div>
      </div>
    );
  }

  const skillsData = [
    { name: 'Python', percentage: 100, color: 'bg-teal-600' },
    { name: 'Java', percentage: 70, color: 'bg-orange-500' },
    { name: 'C++', percentage: 60, color: 'bg-teal-400' },
    { name: 'SQL', percentage: 50, color: 'bg-yellow-500' },
    { name: 'Javascript', percentage: 35, color: 'bg-purple-500' }
  ];

  const salaryData = [
    { label: 'our avg', value: 40, color: 'bg-pink-500' },
    { label: 'min', value: 28, color: 'bg-orange-300' },
    { label: 'avg market', value: 30, color: 'bg-teal-600' },
    { label: 'avg industry', value: 55, color: 'bg-purple-600' },
    { label: 'avg competitors', value: 35, color: 'bg-teal-400' }
  ];

  const otherApplications = [
    { title: 'Digital Sales', date: '9/25/24', status: 'Interviewing', icon: Briefcase },
    { title: 'User Analytics', date: '9/15/23', status: 'Application Received', icon: BarChart3 },
    { title: 'Front End', date: '1/2/23', status: 'Rejected', icon: FileText }
  ];

  const aiInsights = [
    { highlight: 'Strong technical explanation of JavaScript', question: '1', timestamp: '01:25', icon: FileText },
    { highlight: 'Demonstrates leadership in a team project', question: '2,3', timestamp: '01:22, 02:33', icon: Sparkles },
    { highlight: 'Clear and confident communication', question: '2', timestamp: '01:25', icon: MessageCircle },
    { highlight: 'Problem-solving approach to conflict resolution', question: '1,3', timestamp: '01:22, 02:33', icon: Brain }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management / Associate Software Engineer</h1>
          <div className="flex items-center space-x-3 mt-2">
            <h2 className="text-xl font-semibold text-gray-900">← Candidate Summary for {candidate.name}</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {candidate.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 37 Candidates */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">37</div>
          <div className="text-sm text-gray-600">Candidates</div>
        </div>

        {/* Job Match Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{candidate.jobMatchScore}%</div>
          <div className="text-sm text-gray-600">Job Match Score</div>
        </div>

        {/* Interviews */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{candidate.interviews}</div>
          <div className="text-sm text-gray-600">Interviews</div>
        </div>

        {/* Attempts */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">{candidate.attempts}</div>
          <div className="text-sm text-gray-600">Attempts</div>
        </div>

        {/* Video Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-900 mb-2">Video Score</div>
          <div className="text-lg font-bold text-gray-900 mb-2">avg score: {candidate.videoScore}%</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Q1: 70</div>
            <div>Q2: 57</div>
            <div>Q3: 90</div>
          </div>
        </div>

        {/* Resume Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-sm font-medium text-gray-900 mb-2">Resume Score</div>
          <div className="relative w-16 h-16 mx-auto mb-2">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-600"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${candidate.resumeScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600">{candidate.resumeScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Salary Benchmark */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Salary Benchmark</h3>
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option>Jan - Jun '22</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 mb-4">Full Stack Developer II</div>
            <div className="space-y-3">
              {salaryData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-xs text-gray-600">{item.label}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className={`h-4 rounded-full ${item.color}`}
                      style={{ width: `${(item.value / 60) * 100}%` }}
                    ></div>
                    {item.label === 'avg industry' && (
                      <div className="absolute -top-6 right-0 text-xs font-medium text-gray-900">
                        {item.value}k
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User size={16} className="text-gray-400" />
                <span className="text-sm text-gray-900">{candidate.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm text-gray-900">{candidate.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-sm text-gray-900">{candidate.location}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-900">{candidate.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-20">Visa Status:</span>
                <span className="text-sm text-gray-900">n/a</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-20">Level:</span>
                <span className="text-sm text-gray-900">Senior-Level</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-sm text-gray-600 w-20 mt-1">Education:</span>
                <span className="text-sm text-gray-900">{candidate.education?.[0]?.degree}, {candidate.education?.[0]?.institution}</span>
              </div>
              <div className="flex items-center space-x-4 pt-2">
                <Linkedin size={20} className="text-blue-600" />
                <Github size={20} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Action Buttons */}
        <div className="space-y-4">
          <button className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
            <Download size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Download Resume</span>
          </button>
          <button className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
            <Download size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Download Cover Letter</span>
          </button>
          <button className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3 hover:bg-yellow-100 transition-colors">
            <Download size={20} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Download Application</span>
          </button>
          <button className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
            <Calendar size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Top Skills */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills</h3>
          <div className="space-y-3">
            {skillsData.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900">{skill.name}</span>
                  <span className="text-gray-600">{skill.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${skill.color}`}
                    style={{ width: `${skill.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
          <div className="space-y-3">
            {candidate.certifications?.map((cert, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{cert.name}</div>
                  <div className="text-xs text-gray-600">{cert.date}, {cert.issuer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other Applications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Applications</h3>
          <div className="space-y-3">
            {otherApplications.map((app, index) => {
              const Icon = app.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{app.title}</div>
                    <div className="text-xs text-gray-600">{app.date}, {app.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Videos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">View Videos</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Question</span>
              <select 
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option>Question 1</option>
                <option>Question 2</option>
                <option>Question 3</option>
              </select>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              {candidate.videoInterviews?.[0]?.question}
            </div>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <Play size={24} className="text-gray-600 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-900">Highlight</th>
                <th className="text-left py-2 text-sm font-medium text-gray-900">Question</th>
                <th className="text-left py-2 text-sm font-medium text-gray-900">Time Stamp</th>
              </tr>
            </thead>
            <tbody>
              {aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        <Icon size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{insight.highlight}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-gray-600">{insight.question}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-gray-600">{insight.timestamp}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfilePage;