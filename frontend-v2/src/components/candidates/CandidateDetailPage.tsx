import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { CandidateStatus } from '../../types/api';

interface TimelineEvent {
  id: string;
  type: 'note' | 'status_change' | 'interview' | 'email' | 'call';
  title: string;
  description: string;
  date: string;
  user: {
    name: string;
    avatar: string;
  };
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  currentRole: string;
  experience: number;
  education: string;
  skills: string[];
  status: CandidateStatus;
  appliedDate: string;
  lastContact: string;
  summary: string;
  workHistory: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  timeline: TimelineEvent[];
}

// Mock data - will be replaced with API call
const mockCandidate: Candidate = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  linkedIn: 'https://linkedin.com/in/johndoe',
  currentRole: 'Senior Software Engineer',
  experience: 8,
  education: 'MS Computer Science',
  skills: ['React', 'Node.js', 'Python', 'AWS', 'TypeScript', 'Docker'],
  status: CandidateStatus.SCREENING,
  appliedDate: '2024-03-10',
  lastContact: '2024-03-15',
  summary: 'Experienced software engineer with a strong background in full-stack development and cloud technologies. Proven track record of delivering scalable solutions and mentoring junior developers.',
  workHistory: [
    {
      company: 'Tech Corp',
      role: 'Senior Software Engineer',
      duration: '2020 - Present',
      description: 'Led development of microservices architecture, improving system scalability by 300%.',
    },
    {
      company: 'StartupCo',
      role: 'Software Engineer',
      duration: '2018 - 2020',
      description: 'Developed and maintained multiple client-facing applications using React and Node.js.',
    },
  ],
  timeline: [
    {
      id: '1',
      type: 'status_change',
      title: 'Status Updated',
      description: 'Changed status from New to Screening',
      date: '2024-03-15T10:30:00',
      user: {
        name: 'Sarah Wilson',
        avatar: 'https://example.com/avatar1.jpg',
      },
    },
    {
      id: '2',
      type: 'note',
      title: 'Screening Call Notes',
      description: 'Candidate showed strong technical knowledge and great communication skills. Recommended for technical interview.',
      date: '2024-03-15T11:00:00',
      user: {
        name: 'Sarah Wilson',
        avatar: 'https://example.com/avatar1.jpg',
      },
    },
  ],
};

const getStatusColor = (status: CandidateStatus): string => {
  const statusColors = {
    [CandidateStatus.NEW]: 'info',
    [CandidateStatus.SCREENING]: 'warning',
    [CandidateStatus.INTERVIEWING]: 'primary',
    [CandidateStatus.OFFERED]: 'secondary',
    [CandidateStatus.HIRED]: 'success',
    [CandidateStatus.REJECTED]: 'danger',
  };
  return statusColors[status] || 'secondary';
};

const getEventIcon = (type: TimelineEvent['type']): string => {
  const icons = {
    note: 'fa-sticky-note',
    status_change: 'fa-exchange-alt',
    interview: 'fa-calendar-check',
    email: 'fa-envelope',
    call: 'fa-phone',
  };
  return icons[type] || 'fa-circle';
};

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // TODO: Replace with actual API call and loading state
  const isLoading = false;
  const error = null;
  const candidate = mockCandidate;

  const handleAddNote = () => {
    if (newNote.trim()) {
      // TODO: Implement note adding logic
      console.log('Adding note:', newNote);
      setNewNote('');
      setShowNoteModal(false);
    }
  };

  const handleStatusChange = (newStatus: CandidateStatus) => {
    // TODO: Implement status change logic
    console.log('Changing status to:', newStatus);
    setShowStatusModal(false);
  };

  if (isLoading) {
    return <LoadingState message="Loading candidate details..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load candidate details" />;
  }

  if (!candidate) {
    return <ErrorState message="Candidate not found" />;
  }

  return (
    <div className="container-fluid">
      {/* Back Button */}
      <button
        className="btn btn-link text-gray-600 mb-3 px-0"
        onClick={() => navigate('/candidates')}
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Back to Candidates
      </button>

      {/* Header Card */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center mb-3">
                <h2 className="h3 mb-0 text-gray-800 mr-3">{candidate.name}</h2>
                <span className={`badge bg-${getStatusColor(candidate.status)}`}>
                  {candidate.status}
                </span>
              </div>
              <div className="text-gray-600 mb-3">
                <p className="mb-1">
                  <i className="fas fa-briefcase mr-2"></i>
                  {candidate.currentRole}
                </p>
                <p className="mb-1">
                  <i className="fas fa-envelope mr-2"></i>
                  {candidate.email}
                </p>
                <p className="mb-1">
                  <i className="fas fa-phone mr-2"></i>
                  {candidate.phone}
                </p>
                <p className="mb-1">
                  <i className="fab fa-linkedin mr-2"></i>
                  <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer">
                    LinkedIn Profile
                  </a>
                </p>
              </div>
              <div className="mb-3">
                {candidate.skills.map((skill) => (
                  <span key={skill} className="badge bg-primary me-2">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <button
                className="btn btn-primary mb-2 w-100"
                onClick={() => setShowStatusModal(true)}
              >
                <i className="fas fa-exchange-alt mr-2"></i>
                Update Status
              </button>
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => setShowNoteModal(true)}
              >
                <i className="fas fa-sticky-note mr-2"></i>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'communication' ? 'active' : ''}`}
            onClick={() => setActiveTab('communication')}
          >
            Communication
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Profile Tab */}
        <div className={`tab-pane fade ${activeTab === 'profile' ? 'show active' : ''}`}>
          <div className="row">
            <div className="col-lg-8">
              {/* Summary */}
              <div className="card shadow mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Summary</h6>
                </div>
                <div className="card-body">
                  <p className="text-gray-600">{candidate.summary}</p>
                </div>
              </div>

              {/* Work History */}
              <div className="card shadow mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Work History</h6>
                </div>
                <div className="card-body">
                  {candidate.workHistory.map((work, index) => (
                    <div key={index} className="mb-4">
                      <h5 className="text-gray-800">{work.role}</h5>
                      <p className="text-primary mb-2">{work.company}</p>
                      <p className="text-gray-600 mb-2">
                        <i className="fas fa-calendar mr-2"></i>
                        {work.duration}
                      </p>
                      <p className="text-gray-600">{work.description}</p>
                      {index < candidate.workHistory.length - 1 && <hr />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {/* Quick Stats */}
              <div className="card shadow mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 font-weight-bold text-primary">Quick Stats</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <p className="mb-1 text-gray-600">
                      <i className="fas fa-calendar mr-2"></i>
                      Applied: {formatDistanceToNow(new Date(candidate.appliedDate), { addSuffix: true })}
                    </p>
                    <p className="mb-1 text-gray-600">
                      <i className="fas fa-clock mr-2"></i>
                      Last Contact: {formatDistanceToNow(new Date(candidate.lastContact), { addSuffix: true })}
                    </p>
                    <p className="mb-1 text-gray-600">
                      <i className="fas fa-briefcase mr-2"></i>
                      Experience: {candidate.experience} years
                    </p>
                    <p className="mb-1 text-gray-600">
                      <i className="fas fa-graduation-cap mr-2"></i>
                      Education: {candidate.education}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Tab */}
        <div className={`tab-pane fade ${activeTab === 'timeline' ? 'show active' : ''}`}>
          <div className="card shadow">
            <div className="card-body">
              <div className="timeline">
                {candidate.timeline.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-item-content">
                      <span className="tag" style={{ background: event.type === 'status_change' ? '#ff9800' : '#1976d2' }}>
                        <i className={`fas ${getEventIcon(event.type)} mr-2`}></i>
                        {event.title}
                      </span>
                      <time>{format(new Date(event.date), 'MMM d, yyyy h:mm a')}</time>
                      <p>{event.description}</p>
                      <div className="text-gray-600">
                        <img
                          src={event.user.avatar}
                          alt={event.user.name}
                          className="avatar-sm rounded-circle mr-2"
                        />
                        {event.user.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Communication Tab */}
        <div className={`tab-pane fade ${activeTab === 'communication' ? 'show active' : ''}`}>
          <div className="card shadow">
            <div className="card-body">
              <div className="mb-4">
                <button className="btn btn-primary mr-2">
                  <i className="fas fa-envelope mr-2"></i>
                  Send Email
                </button>
                <button className="btn btn-outline-primary mr-2">
                  <i className="fas fa-phone mr-2"></i>
                  Log Call
                </button>
                <button className="btn btn-outline-primary">
                  <i className="fas fa-calendar-plus mr-2"></i>
                  Schedule Interview
                </button>
              </div>
              
              {/* Communication History */}
              <div className="timeline">
                {candidate.timeline
                  .filter(event => ['email', 'call', 'interview'].includes(event.type))
                  .map((event) => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-item-content">
                        <span className="tag" style={{ background: '#1976d2' }}>
                          <i className={`fas ${getEventIcon(event.type)} mr-2`}></i>
                          {event.title}
                        </span>
                        <time>{format(new Date(event.date), 'MMM d, yyyy h:mm a')}</time>
                        <p>{event.description}</p>
                        <div className="text-gray-600">
                          <img
                            src={event.user.avatar}
                            alt={event.user.name}
                            className="avatar-sm rounded-circle mr-2"
                          />
                          {event.user.name}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <div
        className={`modal fade ${showNoteModal ? 'show' : ''}`}
        style={{ display: showNoteModal ? 'block' : 'none' }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Note</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowNoteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <textarea
                className="form-control"
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note..."
              ></textarea>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <div
        className={`modal fade ${showStatusModal ? 'show' : ''}`}
        style={{ display: showStatusModal ? 'block' : 'none' }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Update Status</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowStatusModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="list-group">
                {Object.values(CandidateStatus).map((status) => (
                  <button
                    key={status}
                    className={`list-group-item list-group-item-action ${
                      candidate.status === status ? 'active' : ''
                    }`}
                    onClick={() => handleStatusChange(status)}
                  >
                    <span className={`badge bg-${getStatusColor(status)} me-2`}>
                      {status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      {(showNoteModal || showStatusModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

export default CandidateDetailPage; 