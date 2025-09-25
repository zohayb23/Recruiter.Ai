import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge, Alert, Modal, Accordion } from 'react-bootstrap';
import { environment } from '../config/environment';

interface SegmentationRule {
  field: string;
  operator: string;
  value: any;
  logical_operator?: string;
}

interface Segmentation {
  id: string;
  name: string;
  description: string;
  rules: SegmentationRule[];
  created_by: string;
  created_at: string;
  updated_at: string;
  recipient_count: number;
}

interface RecipientProfile {
  id: string;
  email: string;
  name: string;
  company: string;
  location: string;
  skills: string[];
  experience_years: number;
  job_title: string;
  industry: string;
  salary_range: string;
  education_level: string;
  last_engagement: string;
  engagement_score: number;
  created_at: string;
  updated_at: string;
}

interface SegmentationFields {
  fields: string[];
  operators: string[];
  field_descriptions: Record<string, string>;
  operator_descriptions: Record<string, string>;
}

const SegmentationPage: React.FC = () => {
  const [segmentations, setSegmentations] = useState<Segmentation[]>([]);
  const [recipientProfiles, setRecipientProfiles] = useState<RecipientProfile[]>([]);
  const [segmentationFields, setSegmentationFields] = useState<SegmentationFields | null>(null);
  const [selectedSegmentation, setSelectedSegmentation] = useState<Segmentation | null>(null);
  const [segmentationRecipients, setSegmentationRecipients] = useState<RecipientProfile[]>([]);
  const [segmentationStats, setSegmentationStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newSegmentation, setNewSegmentation] = useState({
    name: '',
    description: '',
    rules: [
      {
        field: 'experience_years',
        operator: 'greater_equal',
        value: 5,
        logical_operator: 'AND'
      }
    ]
  });

  const massMailingUrl = environment.getMassMailingUrl();

  useEffect(() => {
    loadSegmentations();
    loadRecipientProfiles();
    loadSegmentationFields();
  }, []);

  const loadSegmentations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/segmentations`);
      const data = await response.json();
      
      if (data.success) {
        setSegmentations(data.segmentations);
      } else {
        setError('Failed to load segmentations');
      }
    } catch (err) {
      setError('Error loading segmentations');
      console.error('Error loading segmentations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipientProfiles = async () => {
    try {
      const response = await fetch(`${massMailingUrl}/api/recipient-profiles`);
      const data = await response.json();
      
      if (data.success) {
        setRecipientProfiles(data.profiles);
      }
    } catch (err) {
      console.error('Error loading recipient profiles:', err);
    }
  };

  const loadSegmentationFields = async () => {
    try {
      const response = await fetch(`${massMailingUrl}/api/segmentation/fields`);
      const data = await response.json();
      
      if (data.success) {
        setSegmentationFields(data);
      }
    } catch (err) {
      console.error('Error loading segmentation fields:', err);
    }
  };

  const createSegmentation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${massMailingUrl}/api/segmentations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSegmentation),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Segmentation created successfully!');
        setShowCreateModal(false);
        setNewSegmentation({
          name: '',
          description: '',
          rules: [
            {
              field: 'experience_years',
              operator: 'greater_equal',
              value: 5,
              logical_operator: 'AND'
            }
          ]
        });
        loadSegmentations();
      } else {
        setError('Failed to create segmentation');
      }
    } catch (err) {
      setError('Error creating segmentation');
      console.error('Error creating segmentation:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentationRecipients = async (segmentationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/segmentations/${segmentationId}/recipients`);
      const data = await response.json();
      
      if (data.success) {
        setSegmentationRecipients(data.recipients);
        setShowRecipientsModal(true);
      } else {
        setError('Failed to get segmentation recipients');
      }
    } catch (err) {
      setError('Error getting segmentation recipients');
      console.error('Error getting segmentation recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentationStats = async (segmentationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/segmentations/${segmentationId}/stats`);
      const data = await response.json();
      
      if (data.success) {
        setSegmentationStats(data.statistics);
        setShowStatsModal(true);
      } else {
        setError('Failed to get segmentation statistics');
      }
    } catch (err) {
      setError('Error getting segmentation statistics');
      console.error('Error getting segmentation statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setNewSegmentation({
      ...newSegmentation,
      rules: [
        ...newSegmentation.rules,
        {
          field: 'experience_years',
          operator: 'greater_equal',
          value: 5,
          logical_operator: 'AND'
        }
      ]
    });
  };

  const removeRule = (index: number) => {
    if (newSegmentation.rules.length > 1) {
      setNewSegmentation({
        ...newSegmentation,
        rules: newSegmentation.rules.filter((_, i) => i !== index)
      });
    }
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updatedRules = [...newSegmentation.rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setNewSegmentation({ ...newSegmentation, rules: updatedRules });
  };

  const getOperatorOptions = (field: string) => {
    if (!segmentationFields) return [];
    
    const numericFields = ['experience_years', 'engagement_score'];
    const textFields = ['email', 'name', 'company', 'location', 'job_title', 'industry', 'salary_range', 'education_level'];
    const arrayFields = ['skills'];
    
    if (numericFields.includes(field)) {
      return ['equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_null', 'is_not_null'];
    } else if (arrayFields.includes(field)) {
      return ['contains', 'in', 'not_in', 'is_null', 'is_not_null'];
    } else {
      return ['equals', 'contains', 'starts_with', 'ends_with', 'in', 'not_in', 'is_null', 'is_not_null'];
    }
  };

  const getValueInputType = (field: string, operator: string) => {
    if (operator === 'is_null' || operator === 'is_not_null') {
      return 'hidden';
    }
    
    const numericFields = ['experience_years', 'engagement_score'];
    if (numericFields.includes(field)) {
      return 'number';
    }
    
    if (operator === 'in' || operator === 'not_in') {
      return 'text'; // For comma-separated values
    }
    
    return 'text';
  };

  const parseValue = (value: string, field: string, operator: string) => {
    if (operator === 'in' || operator === 'not_in') {
      return value.split(',').map(v => v.trim());
    }
    
    const numericFields = ['experience_years', 'engagement_score'];
    if (numericFields.includes(field)) {
      return parseFloat(value) || 0;
    }
    
    return value;
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Advanced Segmentation</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus me-2"></i>
          Create Segmentation
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Segmentations</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Recipients</th>
                      <th>Rules</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentations.map((segmentation) => (
                      <tr key={segmentation.id}>
                        <td>
                          <strong>{segmentation.name}</strong>
                        </td>
                        <td>
                          <div className="text-muted small">
                            {segmentation.description || 'No description'}
                          </div>
                        </td>
                        <td>
                          <Badge bg="info">{segmentation.recipient_count}</Badge>
                        </td>
                        <td>
                          <Badge bg="secondary">{segmentation.rules.length} rules</Badge>
                        </td>
                        <td>{new Date(segmentation.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => {
                                setSelectedSegmentation(segmentation);
                                setShowDetailsModal(true);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => getSegmentationRecipients(segmentation.id)}
                            >
                              <i className="fas fa-users"></i>
                            </Button>
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => getSegmentationStats(segmentation.id)}
                            >
                              <i className="fas fa-chart-bar"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recipient Profiles</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <h4>{recipientProfiles.length}</h4>
                <p className="text-muted">Total Profiles</p>
              </div>
              
              <div className="small">
                <strong>Recent Profiles:</strong>
                {recipientProfiles.slice(0, 5).map((profile) => (
                  <div key={profile.id} className="d-flex justify-content-between align-items-center py-1">
                    <span>{profile.name}</span>
                    <Badge bg="light" text="dark">{profile.company}</Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Segmentation Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Segmentation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Segmentation Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newSegmentation.name}
                    onChange={(e) => setNewSegmentation({ ...newSegmentation, name: e.target.value })}
                    placeholder="Enter segmentation name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={newSegmentation.description}
                    onChange={(e) => setNewSegmentation({ ...newSegmentation, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5>Segmentation Rules</h5>
            {newSegmentation.rules.map((rule, index) => (
              <Card key={index} className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Rule {index + 1}</span>
                  {newSegmentation.rules.length > 1 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeRule(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Field</Form.Label>
                        <Form.Select
                          value={rule.field}
                          onChange={(e) => updateRule(index, 'field', e.target.value)}
                        >
                          {segmentationFields?.fields.map(field => (
                            <option key={field} value={field}>
                              {field} - {segmentationFields.field_descriptions[field]}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Operator</Form.Label>
                        <Form.Select
                          value={rule.operator}
                          onChange={(e) => updateRule(index, 'operator', e.target.value)}
                        >
                          {getOperatorOptions(rule.field).map(operator => (
                            <option key={operator} value={operator}>
                              {operator} - {segmentationFields?.operator_descriptions[operator]}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Value</Form.Label>
                        <Form.Control
                          type={getValueInputType(rule.field, rule.operator)}
                          value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                          onChange={(e) => updateRule(index, 'value', parseValue(e.target.value, rule.field, rule.operator))}
                          placeholder={
                            rule.operator === 'in' || rule.operator === 'not_in' 
                              ? "Comma-separated values" 
                              : "Enter value"
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Logic</Form.Label>
                        <Form.Select
                          value={rule.logical_operator}
                          onChange={(e) => updateRule(index, 'logical_operator', e.target.value)}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}

            <Button variant="outline-primary" onClick={addRule} className="mb-3">
              <i className="fas fa-plus me-2"></i>
              Add Rule
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createSegmentation} disabled={loading}>
            {loading ? 'Creating...' : 'Create Segmentation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Segmentation Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Segmentation Details: {selectedSegmentation?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSegmentation && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Total Recipients</h6>
                      <h4>{selectedSegmentation.recipient_count}</h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Rules Count</h6>
                      <h4>{selectedSegmentation.rules.length}</h4>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5>Segmentation Rules</h5>
              <Accordion>
                {selectedSegmentation.rules.map((rule, index) => (
                  <Accordion.Item key={index} eventKey={index.toString()}>
                    <Accordion.Header>
                      Rule {index + 1}: {rule.field} {rule.operator} {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={3}>
                          <strong>Field:</strong><br />
                          {rule.field} - {segmentationFields?.field_descriptions[rule.field]}
                        </Col>
                        <Col md={3}>
                          <strong>Operator:</strong><br />
                          {rule.operator} - {segmentationFields?.operator_descriptions[rule.operator]}
                        </Col>
                        <Col md={3}>
                          <strong>Value:</strong><br />
                          {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                        </Col>
                        <Col md={3}>
                          <strong>Logic:</strong><br />
                          {rule.logical_operator}
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Recipients Modal */}
      <Modal show={showRecipientsModal} onHide={() => setShowRecipientsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Segmentation Recipients</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Skills</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {segmentationRecipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td>{recipient.name}</td>
                  <td>{recipient.email}</td>
                  <td>{recipient.company}</td>
                  <td>{recipient.location}</td>
                  <td>{recipient.experience_years} years</td>
                  <td>
                    {recipient.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} bg="light" text="dark" className="me-1">{skill}</Badge>
                    ))}
                    {recipient.skills.length > 3 && <span>+{recipient.skills.length - 3}</span>}
                  </td>
                  <td>
                    <Badge bg={recipient.engagement_score > 0.7 ? 'success' : recipient.engagement_score > 0.4 ? 'warning' : 'danger'}>
                      {(recipient.engagement_score * 100).toFixed(0)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRecipientsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Statistics Modal */}
      <Modal show={showStatsModal} onHide={() => setShowStatsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Segmentation Statistics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {segmentationStats && (
            <div>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Total Recipients</h6>
                      <h4>{segmentationStats.total_recipients}</h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Cached Count</h6>
                      <h4>{segmentationStats.cached_count}</h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Match Rate</h6>
                      <h4>{((segmentationStats.total_recipients / recipientProfiles.length) * 100).toFixed(1)}%</h4>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <h6>Company Distribution</h6>
                  {Object.entries(segmentationStats.company_distribution).map(([company, count]) => (
                    <div key={company} className="d-flex justify-content-between">
                      <span>{company}</span>
                      <Badge bg="info">{count as number}</Badge>
                    </div>
                  ))}
                </Col>
                <Col md={6}>
                  <h6>Location Distribution</h6>
                  {Object.entries(segmentationStats.location_distribution).map(([location, count]) => (
                    <div key={location} className="d-flex justify-content-between">
                      <span>{location}</span>
                      <Badge bg="info">{count as number}</Badge>
                    </div>
                  ))}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SegmentationPage;
