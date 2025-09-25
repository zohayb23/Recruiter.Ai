import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge, ProgressBar, Alert, Modal } from 'react-bootstrap';
import { environment } from '../config/environment';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: string;
  test_type: string;
  test_duration_hours: number;
  winner_determined: boolean;
  winner_variant_id: string;
  total_recipients: number;
  test_recipients: number;
  remaining_recipients: number;
  created_by: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  variant_count: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

interface ABTestVariant {
  id: string;
  ab_test_id: string;
  name: string;
  subject: string;
  content: string;
  send_percentage: number;
  is_winner: boolean;
  created_at: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

interface ABTestRecipient {
  id: string;
  ab_test_id: string;
  variant_id: string;
  email: string;
  name: string;
  status: string;
  sent_at: string;
  delivered_at: string;
  opened_at: string;
  clicked_at: string;
  bounce_reason: string;
  created_at: string;
  variant_name: string;
  variant_subject: string;
}

const ABTestingPage: React.FC = () => {
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [variants, setVariants] = useState<ABTestVariant[]>([]);
  const [recipients, setRecipients] = useState<ABTestRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    test_type: 'subject',
    test_duration_hours: 24,
    variants: [
      { name: '', subject: '', content: '', send_percentage: 50 },
      { name: '', subject: '', content: '', send_percentage: 50 }
    ],
    recipient_emails: [] as string[],
    candidate_ids: [] as string[]
  });

  const massMailingUrl = environment.getMassMailingUrl();

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/ab-tests`);
      const data = await response.json();
      
      if (data.success) {
        setAbTests(data.ab_tests);
      } else {
        setError('Failed to load A/B tests');
      }
    } catch (err) {
      setError('Error loading A/B tests');
      console.error('Error loading A/B tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadABTestDetails = async (testId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/ab-tests/${testId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedTest(data.ab_test);
        setVariants(data.variants);
        setRecipients(data.recipients);
        setShowDetailsModal(true);
      } else {
        setError('Failed to load A/B test details');
      }
    } catch (err) {
      setError('Error loading A/B test details');
      console.error('Error loading A/B test details:', err);
    } finally {
      setLoading(false);
    }
  };

  const createABTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${massMailingUrl}/api/ab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTest),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('A/B test created successfully!');
        setShowCreateModal(false);
        setNewTest({
          name: '',
          description: '',
          test_type: 'subject',
          test_duration_hours: 24,
          variants: [
            { name: '', subject: '', content: '', send_percentage: 50 },
            { name: '', subject: '', content: '', send_percentage: 50 }
          ],
          recipient_emails: [],
          candidate_ids: []
        });
        loadABTests();
      } else {
        setError('Failed to create A/B test');
      }
    } catch (err) {
      setError('Error creating A/B test');
      console.error('Error creating A/B test:', err);
    } finally {
      setLoading(false);
    }
  };

  const startABTest = async (testId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/ab-tests/${testId}/start`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('A/B test started successfully!');
        loadABTests();
      } else {
        setError('Failed to start A/B test');
      }
    } catch (err) {
      setError('Error starting A/B test');
      console.error('Error starting A/B test:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendABTest = async (testId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/ab-tests/${testId}/send`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('A/B test emails sent successfully!');
        loadABTests();
      } else {
        setError('Failed to send A/B test emails');
      }
    } catch (err) {
      setError('Error sending A/B test emails');
      console.error('Error sending A/B test emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeABTest = async (testId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/ab-tests/${testId}/analyze`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`A/B test analyzed! Winner: ${data.winner.name} (${data.winner.conversion_rate.toFixed(2)}% conversion)`);
        loadABTests();
      } else {
        setError('Failed to analyze A/B test');
      }
    } catch (err) {
      setError('Error analyzing A/B test');
      console.error('Error analyzing A/B test:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendWinner = async (testId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/ab-tests/${testId}/send-winner`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Winner sent to remaining recipients successfully!');
        loadABTests();
      } else {
        setError('Failed to send winner to remaining recipients');
      }
    } catch (err) {
      setError('Error sending winner to remaining recipients');
      console.error('Error sending winner:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary', text: 'Draft' },
      running: { variant: 'warning', text: 'Running' },
      completed: { variant: 'success', text: 'Completed' },
      cancelled: { variant: 'danger', text: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const addVariant = () => {
    setNewTest({
      ...newTest,
      variants: [...newTest.variants, { name: '', subject: '', content: '', send_percentage: 50 }]
    });
  };

  const removeVariant = (index: number) => {
    if (newTest.variants.length > 2) {
      setNewTest({
        ...newTest,
        variants: newTest.variants.filter((_, i) => i !== index)
      });
    }
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const updatedVariants = [...newTest.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setNewTest({ ...newTest, variants: updatedVariants });
  };

  const addRecipientEmail = () => {
    setNewTest({
      ...newTest,
      recipient_emails: [...newTest.recipient_emails, '']
    });
  };

  const updateRecipientEmail = (index: number, value: string) => {
    const updatedEmails = [...newTest.recipient_emails];
    updatedEmails[index] = value;
    setNewTest({ ...newTest, recipient_emails: updatedEmails });
  };

  const removeRecipientEmail = (index: number) => {
    setNewTest({
      ...newTest,
      recipient_emails: newTest.recipient_emails.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">A/B Testing</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus me-2"></i>
          Create A/B Test
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

      <Card>
        <Card.Header>
          <h5 className="mb-0">A/B Tests</h5>
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
                  <th>Status</th>
                  <th>Type</th>
                  <th>Recipients</th>
                  <th>Conversion Rate</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {abTests.map((test) => (
                  <tr key={test.id}>
                    <td>
                      <div>
                        <strong>{test.name}</strong>
                        {test.description && (
                          <div className="text-muted small">{test.description}</div>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(test.status)}</td>
                    <td>
                      <Badge bg="info">{test.test_type}</Badge>
                    </td>
                    <td>{test.total_recipients}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <ProgressBar 
                          now={test.conversion_rate} 
                          max={100} 
                          style={{ width: '60px', height: '8px' }}
                          className="me-2"
                        />
                        <span>{test.conversion_rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>{new Date(test.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => loadABTestDetails(test.id)}
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        {test.status === 'draft' && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => startABTest(test.id)}
                          >
                            <i className="fas fa-play"></i>
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => sendABTest(test.id)}
                            >
                              <i className="fas fa-paper-plane"></i>
                            </Button>
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              onClick={() => analyzeABTest(test.id)}
                            >
                              <i className="fas fa-chart-line"></i>
                            </Button>
                          </>
                        )}
                        {test.status === 'running' && test.winner_determined && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => sendWinner(test.id)}
                          >
                            <i className="fas fa-trophy"></i>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create A/B Test Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create A/B Test</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="Enter test name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Type</Form.Label>
                  <Form.Select
                    value={newTest.test_type}
                    onChange={(e) => setNewTest({ ...newTest, test_type: e.target.value })}
                  >
                    <option value="subject">Subject Line</option>
                    <option value="content">Email Content</option>
                    <option value="send_time">Send Time</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Enter test description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Test Duration (Hours)</Form.Label>
              <Form.Control
                type="number"
                value={newTest.test_duration_hours}
                onChange={(e) => setNewTest({ ...newTest, test_duration_hours: parseInt(e.target.value) })}
                min="1"
                max="168"
              />
            </Form.Group>

            <h5>Variants</h5>
            {newTest.variants.map((variant, index) => (
              <Card key={index} className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Variant {index + 1}</span>
                  {newTest.variants.length > 2 && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeVariant(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Variant Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="Enter variant name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Send Percentage</Form.Label>
                        <Form.Control
                          type="number"
                          value={variant.send_percentage}
                          onChange={(e) => updateVariant(index, 'send_percentage', parseInt(e.target.value))}
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject Line</Form.Label>
                    <Form.Control
                      type="text"
                      value={variant.subject}
                      onChange={(e) => updateVariant(index, 'subject', e.target.value)}
                      placeholder="Enter subject line"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Content</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={variant.content}
                      onChange={(e) => updateVariant(index, 'content', e.target.value)}
                      placeholder="Enter email content (HTML supported)"
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            ))}

            <Button variant="outline-primary" onClick={addVariant} className="mb-3">
              <i className="fas fa-plus me-2"></i>
              Add Variant
            </Button>

            <h5>Recipients</h5>
            {newTest.recipient_emails.map((email, index) => (
              <Row key={index} className="mb-2">
                <Col md={10}>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => updateRecipientEmail(index, e.target.value)}
                    placeholder="Enter recipient email"
                  />
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => removeRecipientEmail(index)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </Col>
              </Row>
            ))}

            <Button variant="outline-primary" onClick={addRecipientEmail} className="mb-3">
              <i className="fas fa-plus me-2"></i>
              Add Recipient
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createABTest} disabled={loading}>
            {loading ? 'Creating...' : 'Create A/B Test'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* A/B Test Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>A/B Test Details: {selectedTest?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTest && (
            <div>
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Status</h6>
                      {getStatusBadge(selectedTest.status)}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Total Recipients</h6>
                      <h4>{selectedTest.total_recipients}</h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Conversion Rate</h6>
                      <h4>{selectedTest.conversion_rate.toFixed(1)}%</h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Winner Determined</h6>
                      <h4>{selectedTest.winner_determined ? 'Yes' : 'No'}</h4>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5>Variants Performance</h5>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Subject</th>
                    <th>Sent</th>
                    <th>Delivered</th>
                    <th>Opened</th>
                    <th>Clicked</th>
                    <th>Conversion</th>
                    <th>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id}>
                      <td>{variant.name}</td>
                      <td>{variant.subject}</td>
                      <td>{variant.total_sent}</td>
                      <td>{variant.delivered} ({variant.delivery_rate.toFixed(1)}%)</td>
                      <td>{variant.opened} ({variant.open_rate.toFixed(1)}%)</td>
                      <td>{variant.clicked} ({variant.click_rate.toFixed(1)}%)</td>
                      <td>{variant.conversion_rate.toFixed(1)}%</td>
                      <td>
                        {variant.is_winner && (
                          <Badge bg="success">
                            <i className="fas fa-trophy me-1"></i>
                            Winner
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h5>Recipients</h5>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Variant</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Opened</th>
                    <th>Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td>{recipient.email}</td>
                      <td>{recipient.variant_name}</td>
                      <td>
                        <Badge bg={
                          recipient.status === 'delivered' ? 'success' :
                          recipient.status === 'opened' ? 'info' :
                          recipient.status === 'clicked' ? 'primary' :
                          recipient.status === 'bounced' ? 'danger' : 'secondary'
                        }>
                          {recipient.status}
                        </Badge>
                      </td>
                      <td>{recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : '-'}</td>
                      <td>{recipient.opened_at ? new Date(recipient.opened_at).toLocaleString() : '-'}</td>
                      <td>{recipient.clicked_at ? new Date(recipient.clicked_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ABTestingPage;
