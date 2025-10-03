import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  Clock,
  User,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Zap
} from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CandidatePipeline {
  candidate_id: string;
  current_stage: string;
  stage_history: Array<{
    from_stage: string;
    to_stage: string;
    transition_reason?: string;
    recruiter_id?: string;
    timestamp: string;
  }>;
  assigned_recruiter?: string;
  priority_level: string;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  skills: string[];
  status: string;
  lastActivity: string;
}

const PipelineCRMPage: React.FC = () => {
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [candidatePipelines, setCandidatePipelines] = useState<CandidatePipeline[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateStageModal, setShowCreateStageModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch CRM pipeline data from backend
        const response = await fetch('http://localhost:8804/api/crm/pipeline');
        if (!response.ok) {
          throw new Error('Failed to fetch CRM pipeline data');
        }
        const data = await response.json();

        // Use backend data if available, otherwise fallback to mock data
        const stages = data.stages && data.stages.length > 0 ? data.stages : [
          {
            id: '1',
            name: 'Leads',
            description: 'Initial candidate leads',
            order: 1,
            color: '#8b5cf6',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Contacted',
            description: 'Candidates who have been contacted',
            order: 2,
            color: '#ef4444',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'Interested',
            description: 'Candidates showing interest',
            order: 3,
            color: '#10b981',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '4',
            name: 'Interviewing',
            description: 'Candidates in interview process',
            order: 4,
            color: '#f59e0b',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '5',
            name: 'Hired',
            description: 'Successfully hired candidates',
            order: 5,
            color: '#3b82f6',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];

        const mockCandidates: Candidate[] = [
          {
            id: '1',
            name: 'Jane Doe',
            email: 'jane.doe@email.com',
            phone: '(555) 123-4567',
            position: 'Frontend Developer',
            experience: '3 years',
            skills: ['React', 'TypeScript', 'CSS'],
            status: 'Contacted',
            lastActivity: '2025-01-25'
          },
          {
            id: '2',
            name: 'Olivia White',
            email: 'olivia.white@email.com',
            phone: '(555) 234-5678',
            position: 'Data Analyst',
            experience: '2 years',
            skills: ['Python', 'SQL', 'Tableau'],
            status: 'Interviewing',
            lastActivity: '2025-02-13'
          },
          {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike.johnson@email.com',
            phone: '(555) 345-6789',
            position: 'Project Manager',
            experience: '5 years',
            skills: ['Agile', 'Scrum', 'Leadership'],
            status: 'Interested',
            lastActivity: '2025-01-15'
          }
        ];

        const mockPipelines: CandidatePipeline[] = [
          {
            candidate_id: '1',
            current_stage: '2',
            stage_history: [
              {
                from_stage: '1',
                to_stage: '2',
                transition_reason: 'Initial contact made',
                recruiter_id: 'recruiter_1',
                timestamp: '2025-01-25T10:00:00Z'
              }
            ],
            assigned_recruiter: 'John Smith',
            priority_level: 'high',
            last_activity_date: '2025-01-25T10:00:00Z',
            created_at: '2025-01-25T10:00:00Z',
            updated_at: '2025-01-25T10:00:00Z'
          },
          {
            candidate_id: '2',
            current_stage: '4',
            stage_history: [
              {
                from_stage: '1',
                to_stage: '2',
                transition_reason: 'Contacted via LinkedIn',
                recruiter_id: 'recruiter_1',
                timestamp: '2025-02-13T09:00:00Z'
              },
              {
                from_stage: '2',
                to_stage: '3',
                transition_reason: 'Showed interest in role',
                recruiter_id: 'recruiter_1',
                timestamp: '2025-02-13T14:00:00Z'
              },
              {
                from_stage: '3',
                to_stage: '4',
                transition_reason: 'Scheduled for interview',
                recruiter_id: 'recruiter_1',
                timestamp: '2025-02-13T16:00:00Z'
              }
            ],
            assigned_recruiter: 'John Smith',
            priority_level: 'medium',
            last_activity_date: '2025-02-13T16:00:00Z',
            created_at: '2025-02-13T09:00:00Z',
            updated_at: '2025-02-13T16:00:00Z'
          }
        ];

        setPipelineStages(stages);
        setCandidates(mockCandidates);
        setCandidatePipelines(mockPipelines);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
        setError('Failed to load pipeline data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCandidatesInStage = (stageId: string) => {
    return candidatePipelines
      .filter(pipeline => pipeline.current_stage === stageId)
      .map(pipeline => candidates.find(c => c.id === pipeline.candidate_id))
      .filter(Boolean) as Candidate[];
  };

  const moveCandidateToStage = async (candidateId: string, fromStage: string, toStage: string) => {
    try {
      const response = await fetch('http://localhost:8804/api/crm/pipeline/move-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          from_stage: fromStage,
          to_stage: toStage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to move candidate');
      }

      // Update local state
      setCandidatePipelines(prev => 
        prev.map(pipeline => 
          pipeline.candidate_id === candidateId 
            ? { ...pipeline, current_stage: toStage }
            : pipeline
        )
      );

      // Refresh data
      const fetchData = async () => {
        const response = await fetch('http://localhost:8804/api/crm/pipeline');
        if (response.ok) {
          const data = await response.json();
          setPipelineStages(data.stages || []);
        }
      };
      fetchData();

    } catch (error) {
      console.error('Error moving candidate:', error);
      setError('Failed to move candidate. Please try again.');
    }
  };

  const getStageStats = () => {
    const stats = pipelineStages.map(stage => {
      const candidatesInStage = getCandidatesInStage(stage.id);
      return {
        stage,
        count: candidatesInStage.length
      };
    });
    return stats;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Development Mode Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <BarChart3 size={16} className="text-green-600" />
          </div>
          <div>
            <span className="text-green-800 font-medium">Development Mode</span>
            <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">DEV</span>
          </div>
        </div>
        <button className="text-green-700 hover:text-green-800 font-medium">
          Show Details
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline CRM</h1>
          <p className="text-gray-600 mt-1">Manage candidate pipeline stages and track progress</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddCandidateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Add Candidate</span>
          </button>
          <button
            onClick={() => setShowCreateStageModal(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Create Stage</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={16} className="text-red-600" />
            </div>
            <div>
              <span className="text-red-800 font-medium">Error</span>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {getStageStats().map(({ stage, count }) => (
          <div key={stage.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              ></div>
              <span className="text-2xl font-bold text-gray-900">{count}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-900">{stage.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Candidate Pipeline</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage, index) => {
            const candidatesInStage = getCandidatesInStage(stage.id);
            const filteredCandidates = candidatesInStage.filter(candidate =>
              candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
              candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      ></div>
                      <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {filteredCandidates.length}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredCandidates.map((candidate) => {
                      const pipeline = candidatePipelines.find(p => p.candidate_id === candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <User size={16} className="text-primary-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                                <p className="text-sm text-gray-600">{candidate.position}</p>
                              </div>
                            </div>
                            {pipeline && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(pipeline.priority_level)}`}>
                                {pipeline.priority_level}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar size={14} />
                              <span>Last activity: {candidate.lastActivity}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  +{candidate.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                <Edit size={14} />
                              </button>
                              <button className="text-green-600 hover:text-green-800 text-sm">
                                <ArrowRight size={14} />
                              </button>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock size={12} />
                              <span>{candidate.experience}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredCandidates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No candidates in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {candidatePipelines.slice(0, 5).map((pipeline, index) => {
            const candidate = candidates.find(c => c.id === pipeline.candidate_id);
            const latestTransition = pipeline.stage_history[pipeline.stage_history.length - 1];
            
            return (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Activity size={16} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{candidate?.name}</span> moved from{' '}
                    <span className="font-medium">{latestTransition?.from_stage}</span> to{' '}
                    <span className="font-medium">{latestTransition?.to_stage}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {latestTransition?.transition_reason} • {new Date(latestTransition?.timestamp || '').toLocaleDateString()}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(latestTransition?.timestamp || '').toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PipelineCRMPage;
