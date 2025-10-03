import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Form, InputGroup, Tabs, Tab, ListGroup, Modal, ProgressBar, Dropdown } from 'react-bootstrap';
import { ENV } from '../config/environment';
import './PipelineCRMPage.css';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

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

interface RecruiterNote {
  id: string;
  candidate_id: string;
  recruiter_id: string;
  content: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface CandidateTag {
  id: string;
  candidate_id: string;
  tag_name: string;
  tag_color: string;
  created_by: string;
  created_at: string;
}

interface PipelineAnalytics {
  total_candidates: number;
  stage_distribution: Record<string, number>;
  average_stage_times: Record<string, string>;
  total_notes: number;
  total_interactions: number;
  total_tags: number;
}

// Draggable Candidate Card Component
interface DraggableCandidateCardProps {
  candidate: CandidatePipeline;
  onCandidateClick: (candidateId: string) => void;
  onStageTransition: (candidateId: string, newStage: string) => void;
  pipelineStages: PipelineStage[];
}

const DraggableCandidateCard: React.FC<DraggableCandidateCardProps> = ({
  candidate,
  onCandidateClick,
  onStageTransition,
  pipelineStages
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.candidate_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 cursor-pointer candidate-card ${isDragging ? 'shadow-lg dragging' : ''}`}
      onClick={() => onCandidateClick(candidate.candidate_id)}
      {...attributes}
      {...listeners}
    >
      <Card.Body className="p-2">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div className="d-flex align-items-center">
            <i className="fas fa-grip-vertical text-muted me-2 drag-handle" style={{ fontSize: '0.8rem' }}></i>
            <small className="fw-bold">
              {candidate.candidate_id.substring(0, 8)}...
            </small>
          </div>
          <Badge 
            size="sm" 
            bg={getPriorityBadgeColor(candidate.priority_level)}
            className="priority-badge"
          >
            {candidate.priority_level}
          </Badge>
        </div>
        <small className="text-muted">
          {candidate.assigned_recruiter || 'Unassigned'}
        </small>
        <div className="mt-1">
          <Dropdown>
            <Dropdown.Toggle 
              size="sm" 
              variant="outline-secondary"
              className="w-100"
              onClick={(e) => e.stopPropagation()}
            >
              Move to...
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {pipelineStages
                .filter(s => s.id !== candidate.current_stage)
                .map((targetStage) => (
                  <Dropdown.Item
                    key={targetStage.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageTransition(candidate.candidate_id, targetStage.id);
                    }}
                  >
                    {targetStage.name}
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Card.Body>
    </Card>
  );
};

const PipelineCRMPage: React.FC = () => {
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [candidatePipelines, setCandidatePipelines] = useState<CandidatePipeline[]>([]);
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidateNotes, setCandidateNotes] = useState<RecruiterNote[]>([]);
  const [candidateTags, setCandidateTags] = useState<CandidateTag[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('#007bff');
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedCandidate, setDraggedCandidate] = useState<CandidatePipeline | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load pipeline stages
  const loadPipelineStages = async () => {
    try {
      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/pipeline-stages`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPipelineStages(data.stages);
    } catch (err) {
      console.error('Error loading pipeline stages:', err);
    }
  };

  // Load candidate pipelines
  const loadCandidatePipelines = async () => {
    try {
      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCandidatePipelines(data.pipelines);
    } catch (err) {
      console.error('Error loading candidate pipelines:', err);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/pipeline-analytics`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Load candidate details
  const loadCandidateDetails = async (candidateId: string) => {
    try {
      // Load notes
      const notesResponse = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines/${candidateId}/notes`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setCandidateNotes(notesData.notes);
      }

      // Load tags
      const tagsResponse = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines/${candidateId}/tags`);
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setCandidateTags(tagsData.tags);
      }
    } catch (err) {
      console.error('Error loading candidate details:', err);
    }
  };

  // Create candidate pipeline
  const createCandidatePipeline = async (candidateId: string) => {
    try {
      const pipelineData = {
        candidate_id: candidateId,
        current_stage: 'applied',
        stage_history: [{
          from_stage: 'new',
          to_stage: 'applied',
          transition_reason: 'Initial application',
          recruiter_id: 'current_user',
          timestamp: new Date().toISOString()
        }],
        assigned_recruiter: 'current_user',
        priority_level: 'medium',
        last_activity_date: new Date().toISOString()
      };

      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipelineData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      await loadCandidatePipelines();
      await loadAnalytics();
    } catch (err) {
      console.error('Error creating candidate pipeline:', err);
    }
  };

  // Add note
  const addNote = async () => {
    if (!selectedCandidate || !newNote.trim()) return;

    try {
      const noteData = {
        recruiter_id: 'current_user',
        content: newNote,
        note_type: 'general',
        is_private: false
      };

      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines/${selectedCandidate}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      setNewNote('');
      await loadCandidateDetails(selectedCandidate);
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  // Add tag
  const addTag = async () => {
    if (!selectedCandidate || !newTag.trim()) return;

    try {
      const tagData = {
        tag_name: newTag,
        tag_color: newTagColor,
        created_by: 'current_user'
      };

      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines/${selectedCandidate}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      setNewTag('');
      await loadCandidateDetails(selectedCandidate);
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  // Transition candidate stage
  const transitionCandidateStage = async (candidateId: string, newStage: string) => {
    try {
      const currentPipeline = candidatePipelines.find(cp => cp.candidate_id === candidateId);
      if (!currentPipeline) return;

      const transitionData = {
        candidate_id: candidateId,
        from_stage: currentPipeline.current_stage,
        to_stage: newStage,
        transition_reason: `Moved to ${newStage}`,
        recruiter_id: 'current_user',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${ENV.getPipelineCRMUrl()}/api/candidate-pipelines/${candidateId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transitionData)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      await loadCandidatePipelines();
      await loadAnalytics();
    } catch (err) {
      console.error('Error transitioning candidate:', err);
    }
  };

  // Drag and drop event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const candidate = candidatePipelines.find(cp => cp.candidate_id === active.id);
    setDraggedCandidate(candidate || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedCandidate(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Check if we're dropping on a stage (not another candidate)
    const targetStage = pipelineStages?.find(stage => stage.id === over.id);
    if (targetStage) {
      const candidateId = active.id as string;
      const currentCandidate = candidatePipelines.find(cp => cp.candidate_id === candidateId);
      
      if (currentCandidate && currentCandidate.current_stage !== targetStage.id) {
        // Perform the transition
        await transitionCandidateStage(candidateId, targetStage.id);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add visual feedback during drag over
    const { active, over } = event;
    // You can add visual feedback here if needed
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadPipelineStages(),
          loadCandidatePipelines(),
          loadAnalytics()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get candidates in a specific stage
  const getCandidatesInStage = (stageId: string) => {
    return candidatePipelines?.filter(cp => cp.current_stage === stageId) || [];
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>🎯 Candidate CRM & Pipeline</h2>
              <p className="text-muted">Manage candidates through the recruitment pipeline with notes, tags, and tracking</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => {
                loadCandidatePipelines();
                loadAnalytics();
              }}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : '🔄 Refresh'}
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'pipeline')}
        className="mb-4"
      >
        <Tab eventKey="pipeline" title="📊 Pipeline View">
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Drag & Drop:</strong> Drag candidate cards between stages to move them through the pipeline. 
            You can also use the "Move to..." dropdown for quick transitions.
          </Alert>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <Row>
              {pipelineStages && pipelineStages.length > 0 ? pipelineStages.map((stage) => {
                const candidatesInStage = getCandidatesInStage(stage.id);
                return (
                  <Col md={2} key={stage.id} className="mb-3">
                    <Card className="h-100">
                      <Card.Header 
                        className="text-white stage-header" 
                        style={{ backgroundColor: stage.color }}
                        id={stage.id}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">{stage.name}</h6>
                          <Badge bg="light" text="dark">
                            {candidatesInStage.length}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-2">
                        <div 
                          style={{ minHeight: '200px' }}
                          className="drop-zone"
                        >
                          <SortableContext 
                            items={candidatesInStage.map(c => c.candidate_id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {candidatesInStage.map((candidate) => (
                              <DraggableCandidateCard
                                key={candidate.candidate_id}
                                candidate={candidate}
                                onCandidateClick={(candidateId) => {
                                  setSelectedCandidate(candidateId);
                                  loadCandidateDetails(candidateId);
                                  setShowCandidateModal(true);
                                }}
                                onStageTransition={transitionCandidateStage}
                                pipelineStages={pipelineStages}
                              />
                            ))}
                          </SortableContext>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              }) : (
                <Col md={12} className="text-center">
                  <Card>
                    <Card.Body>
                      <p className="text-muted">No pipeline stages found. Loading...</p>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
            
            <DragOverlay>
              {draggedCandidate ? (
                <Card className="shadow-lg" style={{ opacity: 0.8 }}>
                  <Card.Body className="p-2">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <small className="fw-bold">
                        {draggedCandidate.candidate_id.substring(0, 8)}...
                      </small>
                      <Badge 
                        size="sm" 
                        bg={getPriorityBadgeColor(draggedCandidate.priority_level)}
                      >
                        {draggedCandidate.priority_level}
                      </Badge>
                    </div>
                    <small className="text-muted">
                      {draggedCandidate.assigned_recruiter || 'Unassigned'}
                    </small>
                  </Card.Body>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Tab>

        <Tab eventKey="analytics" title="📈 Analytics">
          {analytics && (
            <Row>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-primary">{analytics.total_candidates}</h3>
                    <p className="mb-0">Total Candidates</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-success">{analytics.total_notes}</h3>
                    <p className="mb-0">Total Notes</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-info">{analytics.total_tags}</h3>
                    <p className="mb-0">Total Tags</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <h3 className="text-warning">{analytics.total_interactions}</h3>
                    <p className="mb-0">Total Interactions</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {analytics && (
            <Row className="mt-4">
              <Col>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Stage Distribution</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {Object.entries(analytics.stage_distribution).map(([stageId, count]) => {
                        const stage = pipelineStages?.find(s => s.id === stageId);
                        return (
                          <Col md={2} key={stageId} className="text-center">
                            <div 
                              className="p-3 rounded text-white mb-2"
                              style={{ backgroundColor: stage?.color || '#6c757d' }}
                            >
                              <h4 className="mb-0">{count}</h4>
                            </div>
                            <small>{stage?.name || stageId}</small>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Tab>
      </Tabs>

      {/* Candidate Detail Modal */}
      <Modal show={showCandidateModal} onHide={() => setShowCandidateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Candidate Details: {selectedCandidate?.substring(0, 8)}...
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="notes" className="mb-3">
            <Tab eventKey="notes" title="📝 Notes">
              <div className="mb-3">
                <InputGroup>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button variant="primary" onClick={addNote}>
                    Add Note
                  </Button>
                </InputGroup>
              </div>
              
              <ListGroup>
                {candidateNotes.map((note) => (
                  <ListGroup.Item key={note.id}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="mb-1">{note.content}</p>
                        <small className="text-muted">
                          {note.note_type} • {new Date(note.created_at).toLocaleString()}
                        </small>
                      </div>
                      <Badge bg="secondary">{note.recruiter_id}</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>

            <Tab eventKey="tags" title="🏷️ Tags">
              <div className="mb-3">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Tag name..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                  <Form.Control
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    style={{ width: '60px' }}
                  />
                  <Button variant="primary" onClick={addTag}>
                    Add Tag
                  </Button>
                </InputGroup>
              </div>
              
              <div className="d-flex flex-wrap gap-2">
                {candidateTags.map((tag) => (
                  <Badge 
                    key={tag.id}
                    style={{ 
                      backgroundColor: tag.tag_color,
                      fontSize: '0.9em',
                      padding: '0.5em 0.8em'
                    }}
                  >
                    {tag.tag_name}
                  </Badge>
                ))}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCandidateModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PipelineCRMPage;
