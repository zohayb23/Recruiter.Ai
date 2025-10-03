import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge, Alert, Modal, Accordion, Tabs, Tab } from 'react-bootstrap';
import { ENV } from '../config/environment';

interface AutomationTrigger {
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  delay_minutes?: number;
}

interface AutomationAction {
  action_type: string;
  action_config: Record<string, any>;
  template_id?: string;
  subject?: string;
  content?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  conditions: Array<Record<string, any>>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AutomationCampaign {
  id: string;
  name: string;
  description: string;
  rules: AutomationRule[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  rule_count: number;
  execution_count: number;
}

interface AutomationExecution {
  id: string;
  campaign_id: string;
  rule_id: string;
  recipient_id: string;
  trigger_type: string;
  trigger_data: Record<string, any>;
  action_type: string;
  action_data: Record<string, any>;
  status: string;
  scheduled_at: string;
  executed_at: string;
  error_message: string;
  created_at: string;
  email: string;
  name: string;
  rule_name: string;
  campaign_name: string;
}

interface AutomationFields {
  triggers: string[];
  actions: string[];
  conditions: string[];
  trigger_descriptions: Record<string, string>;
  action_descriptions: Record<string, string>;
}

const AutomationPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [automationFields, setAutomationFields] = useState<AutomationFields | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<AutomationCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExecutionsModal, setShowExecutionsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    is_active: true,
    rules: [
      {
        name: 'Welcome Email',
        description: 'Send welcome email to new recipients',
        trigger: {
          trigger_type: 'segmentation_added',
          trigger_conditions: {
            segmentation_id: 'welcome_segment'
          },
          delay_minutes: 0
        },
        action: {
          action_type: 'send_email',
          action_config: {},
          subject: 'Welcome to Our Platform!',
          content: '<h1>Welcome {name}!</h1><p>Thank you for joining our platform!</p>'
        },
        conditions: [],
        is_active: true
      }
    ]
  });

  const massMailingUrl = ENV.getMassMailingUrl();

  useEffect(() => {
    loadCampaigns();
    loadExecutions();
    loadAutomationFields();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/automation/campaigns`);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setError('Failed to load automation campaigns');
      }
    } catch (err) {
      setError('Error loading automation campaigns');
      console.error('Error loading automation campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch(`${massMailingUrl}/api/automation/executions`);
      const data = await response.json();
      
      if (data.success) {
        setExecutions(data.executions);
      }
    } catch (err) {
      console.error('Error loading automation executions:', err);
    }
  };

  const loadAutomationFields = async () => {
    try {
      const response = await fetch(`${massMailingUrl}/api/automation/fields`);
      const data = await response.json();
      
      if (data.success) {
        setAutomationFields(data);
      }
    } catch (err) {
      console.error('Error loading automation fields:', err);
    }
  };

  const createCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${massMailingUrl}/api/automation/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Automation campaign created successfully!');
        setShowCreateModal(false);
        setNewCampaign({
          name: '',
          description: '',
          is_active: true,
          rules: [
            {
              name: 'Welcome Email',
              description: 'Send welcome email to new recipients',
              trigger: {
                trigger_type: 'segmentation_added',
                trigger_conditions: {
                  segmentation_id: 'welcome_segment'
                },
                delay_minutes: 0
              },
              action: {
                action_type: 'send_email',
                action_config: {},
                subject: 'Welcome to Our Platform!',
                content: '<h1>Welcome {name}!</h1><p>Thank you for joining our platform!</p>'
              },
              conditions: [],
              is_active: true
            }
          ]
        });
        loadCampaigns();
      } else {
        setError('Failed to create automation campaign');
      }
    } catch (err) {
      setError('Error creating automation campaign');
      console.error('Error creating automation campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutomation = async (triggerType: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${massMailingUrl}/api/automation/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_type: triggerType,
          trigger_data: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Automation triggered: ${data.triggered_executions} executions`);
        loadExecutions();
      } else {
        setError('Failed to trigger automation');
      }
    } catch (err) {
      setError('Error triggering automation');
      console.error('Error triggering automation:', err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setNewCampaign({
      ...newCampaign,
      rules: [
        ...newCampaign.rules,
        {
          name: 'New Rule',
          description: 'New automation rule',
          trigger: {
            trigger_type: 'email_opened',
            trigger_conditions: {},
            delay_minutes: 0
          },
          action: {
            action_type: 'send_email',
            action_config: {},
            subject: 'New Email',
            content: '<h1>New Email</h1><p>This is a new automated email.</p>'
          },
          conditions: [],
          is_active: true
        }
      ]
    });
  };

  const removeRule = (index: number) => {
    if (newCampaign.rules.length > 1) {
      setNewCampaign({
        ...newCampaign,
        rules: newCampaign.rules.filter((_, i) => i !== index)
      });
    }
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updatedRules = [...newCampaign.rules];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedRules[index][parent][child] = value;
    } else {
      updatedRules[index][field] = value;
    }
    setNewCampaign({ ...newCampaign, rules: updatedRules });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'warning',
      'executing': 'info',
      'completed': 'success',
      'failed': 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Campaign Automation</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus me-2"></i>
          Create Automation
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

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'campaigns')} className="mb-4">
        <Tab eventKey="campaigns" title="Automation Campaigns">
          <Row>
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Automation Campaigns</h5>
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
                          <th>Rules</th>
                          <th>Executions</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id}>
                            <td>
                              <strong>{campaign.name}</strong>
                            </td>
                            <td>
                              <div className="text-muted small">
                                {campaign.description || 'No description'}
                              </div>
                            </td>
                            <td>
                              <Badge bg="info">{campaign.rule_count}</Badge>
                            </td>
                            <td>
                              <Badge bg="secondary">{campaign.execution_count}</Badge>
                            </td>
                            <td>
                              <Badge bg={campaign.is_active ? 'success' : 'danger'}>
                                {campaign.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td>{new Date(campaign.created_at).toLocaleDateString()}</td>
                            <td>
                              <div className="btn-group" role="group">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setShowDetailsModal(true);
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCampaign(campaign);
                                    setShowExecutionsModal(true);
                                  }}
                                >
                                  <i className="fas fa-history"></i>
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
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => triggerAutomation('email_opened')}
                      disabled={loading}
                    >
                      <i className="fas fa-envelope-open me-2"></i>
                      Trigger Email Opened
                    </Button>
                    <Button 
                      variant="outline-success" 
                      onClick={() => triggerAutomation('email_clicked')}
                      disabled={loading}
                    >
                      <i className="fas fa-mouse-pointer me-2"></i>
                      Trigger Email Clicked
                    </Button>
                    <Button 
                      variant="outline-info" 
                      onClick={() => triggerAutomation('time_based')}
                      disabled={loading}
                    >
                      <i className="fas fa-clock me-2"></i>
                      Trigger Time-Based
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      onClick={() => triggerAutomation('manual')}
                      disabled={loading}
                    >
                      <i className="fas fa-hand-pointer me-2"></i>
                      Trigger Manual
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="executions" title="Executions">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Automation Executions</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Rule</th>
                    <th>Recipient</th>
                    <th>Trigger</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Executed</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((execution) => (
                    <tr key={execution.id}>
                      <td>{execution.campaign_name}</td>
                      <td>{execution.rule_name}</td>
                      <td>
                        <div>
                          <strong>{execution.name}</strong>
                          <br />
                          <small className="text-muted">{execution.email}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info">{execution.trigger_type}</Badge>
                      </td>
                      <td>
                        <Badge bg="secondary">{execution.action_type}</Badge>
                      </td>
                      <td>{getStatusBadge(execution.status)}</td>
                      <td>
                        {execution.executed_at 
                          ? new Date(execution.executed_at).toLocaleString()
                          : 'Not executed'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Create Automation Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create Automation Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5>Automation Rules</h5>
            {newCampaign.rules.map((rule, index) => (
              <Card key={index} className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Rule {index + 1}</span>
                  {newCampaign.rules.length > 1 && (
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
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rule Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={rule.name}
                          onChange={(e) => updateRule(index, 'name', e.target.value)}
                          placeholder="Enter rule name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          type="text"
                          value={rule.description}
                          onChange={(e) => updateRule(index, 'description', e.target.value)}
                          placeholder="Enter description"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Trigger Type</Form.Label>
                        <Form.Select
                          value={rule.trigger.trigger_type}
                          onChange={(e) => updateRule(index, 'trigger.trigger_type', e.target.value)}
                        >
                          {automationFields?.triggers.map(trigger => (
                            <option key={trigger} value={trigger}>
                              {trigger} - {automationFields.trigger_descriptions[trigger]}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Action Type</Form.Label>
                        <Form.Select
                          value={rule.action.action_type}
                          onChange={(e) => updateRule(index, 'action.action_type', e.target.value)}
                        >
                          {automationFields?.actions.map(action => (
                            <option key={action} value={action}>
                              {action} - {automationFields.action_descriptions[action]}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delay (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          value={rule.trigger.delay_minutes}
                          onChange={(e) => updateRule(index, 'trigger.delay_minutes', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {rule.action.action_type === 'send_email' && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Subject</Form.Label>
                          <Form.Control
                            type="text"
                            value={rule.action.subject}
                            onChange={(e) => updateRule(index, 'action.subject', e.target.value)}
                            placeholder="Enter email subject"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Content</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={rule.action.content}
                            onChange={(e) => updateRule(index, 'action.content', e.target.value)}
                            placeholder="Enter email content (HTML supported)"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
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
          <Button variant="primary" onClick={createCampaign} disabled={loading}>
            {loading ? 'Creating...' : 'Create Automation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Campaign Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Campaign Details: {selectedCampaign?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCampaign && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Total Rules</h6>
                      <h4>{selectedCampaign.rule_count}</h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <h6>Total Executions</h6>
                      <h4>{selectedCampaign.execution_count}</h4>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h5>Automation Rules</h5>
              <Accordion>
                {selectedCampaign.rules.map((rule, index) => (
                  <Accordion.Item key={index} eventKey={index.toString()}>
                    <Accordion.Header>
                      {rule.name}: {rule.trigger.trigger_type} → {rule.action.action_type}
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={6}>
                          <strong>Trigger:</strong><br />
                          Type: {rule.trigger.trigger_type}<br />
                          Delay: {rule.trigger.delay_minutes} minutes
                        </Col>
                        <Col md={6}>
                          <strong>Action:</strong><br />
                          Type: {rule.action.action_type}<br />
                          {rule.action.subject && `Subject: ${rule.action.subject}`}
                        </Col>
                      </Row>
                      {rule.description && (
                        <div className="mt-2">
                          <strong>Description:</strong> {rule.description}
                        </div>
                      )}
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

      {/* Executions Modal */}
      <Modal show={showExecutionsModal} onHide={() => setShowExecutionsModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Campaign Executions: {selectedCampaign?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Recipient</th>
                <th>Trigger</th>
                <th>Action</th>
                <th>Status</th>
                <th>Executed</th>
              </tr>
            </thead>
            <tbody>
              {executions
                .filter(execution => execution.campaign_id === selectedCampaign?.id)
                .map((execution) => (
                  <tr key={execution.id}>
                    <td>{execution.rule_name}</td>
                    <td>
                      <div>
                        <strong>{execution.name}</strong>
                        <br />
                        <small className="text-muted">{execution.email}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">{execution.trigger_type}</Badge>
                    </td>
                    <td>
                      <Badge bg="secondary">{execution.action_type}</Badge>
                    </td>
                    <td>{getStatusBadge(execution.status)}</td>
                    <td>
                      {execution.executed_at 
                        ? new Date(execution.executed_at).toLocaleString()
                        : 'Not executed'
                      }
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExecutionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AutomationPage;
