import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert, Card, Badge, ProgressBar, Row, Col } from 'react-bootstrap';
import { ENV } from '../../config/environment';

interface SimilarItem {
  resume_id?: string;
  job_id?: string;
  full_name?: string;
  title?: string;
  company?: string;
  email?: string;
  overview?: string;
  summary?: string;
  skills?: any[];
  required_skills?: any[];
  similarity_score: number;
  distance: number;
}

interface SimilarItemsResponse {
  success: boolean;
  target_resume_id?: string;
  target_job_id?: string;
  similar_resumes?: SimilarItem[];
  similar_jobs?: SimilarItem[];
  message: string;
}

interface SimilarItemsModalProps {
  show: boolean;
  onHide: () => void;
  type: 'resume' | 'job';
  itemId: string;
  itemName: string;
}

const SimilarItemsModal: React.FC<SimilarItemsModalProps> = ({
  show,
  onHide,
  type,
  itemId,
  itemName
}) => {
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && itemId) {
      fetchSimilarItems();
    }
  }, [show, itemId, type]);

  const fetchSimilarItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = type === 'resume' 
        ? '/api/search/similar-resumes'
        : '/api/search/similar-jobs';
      
      const response = await fetch(`${ENV.getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [type === 'resume' ? 'resume_id' : 'job_id']: itemId,
          limit: 5
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SimilarItemsResponse = await response.json();
      
      if (type === 'resume') {
        setSimilarItems(data.similar_resumes || []);
      } else {
        setSimilarItems(data.similar_jobs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch similar items');
      console.error('Error fetching similar items:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityBadge = (score: number) => {
    if (score >= 0.8) return <Badge bg="success">Excellent Match</Badge>;
    if (score >= 0.6) return <Badge bg="warning">Good Match</Badge>;
    if (score >= 0.4) return <Badge bg="info">Fair Match</Badge>;
    return <Badge bg="secondary">Low Match</Badge>;
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    if (score >= 0.4) return 'info';
    return 'secondary';
  };

  const formatSkills = (skills: any[]) => {
    if (!skills || !Array.isArray(skills)) return [];
    return skills.map(skill => 
      typeof skill === 'string' ? skill : skill.name || skill
    ).slice(0, 5);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          🔍 Similar {type === 'resume' ? 'Resumes' : 'Jobs'} to "{itemName}"
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading similar items...</span>
            </Spinner>
            <p className="mt-2">Finding similar {type === 'resume' ? 'resumes' : 'jobs'}...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}

        {!loading && !error && similarItems.length === 0 && (
          <Alert variant="info">
            <Alert.Heading>No Similar Items Found</Alert.Heading>
            <p>No similar {type === 'resume' ? 'resumes' : 'jobs'} were found for this item.</p>
          </Alert>
        )}

        {!loading && !error && similarItems.length > 0 && (
          <Row>
            {similarItems.map((item, index) => (
              <Col md={6} key={item.resume_id || item.job_id} className="mb-3">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="mb-0">
                        {type === 'resume' ? item.full_name : item.title}
                      </h6>
                      {getSimilarityBadge(item.similarity_score)}
                    </div>
                    
                    {type === 'resume' ? (
                      <>
                        <p className="text-muted small mb-2">{item.email}</p>
                        <p className="small mb-2">
                          {item.summary?.substring(0, 150)}...
                        </p>
                        <div className="mb-2">
                          <strong>Skills:</strong>
                          <div className="mt-1">
                            {formatSkills(item.skills || []).map((skill, i) => (
                              <Badge key={i} bg="light" text="dark" className="me-1">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-muted small mb-2">{item.company}</p>
                        <p className="small mb-2">
                          {item.overview?.substring(0, 150)}...
                        </p>
                        <div className="mb-2">
                          <strong>Required Skills:</strong>
                          <div className="mt-1">
                            {formatSkills(item.required_skills || []).map((skill, i) => (
                              <Badge key={i} bg="light" text="dark" className="me-1">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <ProgressBar
                      variant={getSimilarityColor(item.similarity_score)}
                      now={item.similarity_score * 100}
                      label={`${(item.similarity_score * 100).toFixed(1)}%`}
                      className="mb-2"
                    />
                    <small className="text-muted">
                      Distance: {item.distance.toFixed(4)}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SimilarItemsModal;
