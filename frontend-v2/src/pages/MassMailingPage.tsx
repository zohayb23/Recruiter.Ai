import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Spinner, 
  Badge, 
  Form, 
  InputGroup, 
  Tabs, 
  Tab, 
  ListGroup, 
  Modal, 
  ProgressBar, 
  Dropdown,
  Table,
  ButtonGroup
} from 'react-bootstrap';
import { ENV } from '../config/environment';
import './MassMailingPage.css';

// Types
interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  status: string;
  created_by: string;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Vendor {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  resume_file?: string;
  parsed_data?: any;
  skills: string[];
  experience_level: string;
  created_at: string;
  updated_at: string;
}

interface CampaignCreate {
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  scheduled_at?: string;
  recipient_emails: string[];
  candidate_ids: string[];
}

const MassMailingPage: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Campaign creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState<CampaignCreate>({
    name: '',
    subject: '',
    content: '',
    recipient_emails: [],
    candidate_ids: []
  });
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Vendor upload state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    resume_file: null as File | null
  });

  // Load data on component mount
  useEffect(() => {
    loadCampaigns();
    loadTemplates();
    loadVendors();
  }, []);

  // API functions
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ENV.getMassMailingUrl()}/api/campaigns`);
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setError('Failed to load campaigns');
      }
    } catch (err) {
      setError('Failed to connect to mass mailing service');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${ENV.getMassMailingUrl()}/api/email-templates`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await fetch(`${ENV.getMassMailingUrl()}/api/vendors`);
      const data = await response.json();
      
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const createCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ENV.getMassMailingUrl()}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setNewCampaign({
          name: '',
          subject: '',
          content: '',
          recipient_emails: [],
          candidate_ids: []
        });
        loadCampaigns();
      } else {
        setError('Failed to create campaign');
      }
    } catch (err) {
      setError('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const createVendor = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', newVendor.name);
      formData.append('email', newVendor.email);
      formData.append('company', newVendor.company);
      formData.append('phone', newVendor.phone);
      if (newVendor.resume_file) {
        formData.append('resume_file', newVendor.resume_file);
      }

      const response = await fetch(`${ENV.getMassMailingUrl()}/api/vendors`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowVendorModal(false);
        setNewVendor({
          name: '',
          email: '',
          company: '',
          phone: '',
          resume_file: null
        });
        loadVendors();
      } else {
        setError('Failed to create vendor');
      }
    } catch (err) {
      setError('Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setNewCampaign({
      ...newCampaign,
      subject: template.subject,
      content: template.content,
      template_id: template.id
    });
    setShowTemplateModal(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary', text: 'Draft' },
      scheduled: { variant: 'warning', text: 'Scheduled' },
      sending: { variant: 'info', text: 'Sending' },
      sent: { variant: 'success', text: 'Sent' },
      paused: { variant: 'warning', text: 'Paused' },
      cancelled: { variant: 'danger', text: 'Cancelled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getDeliveryRate = (campaign: Campaign) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round((campaign.delivered_count / campaign.total_recipients) * 100);
  };

  const getOpenRate = (campaign: Campaign) => {
    if (campaign.delivered_count === 0) return 0;
    return Math.round((campaign.opened_count / campaign.delivered_count) * 100);
  };

  const getClickRate = (campaign: Campaign) => {
    if (campaign.delivered_count === 0) return 0;
    return Math.round((campaign.clicked_count / campaign.delivered_count) * 100);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-envelope-open-text me-2"></i>
                Mass Mailing & Vendor Sourcing
              </h2>
              <p className="text-muted mb-0">
                Manage bulk email campaigns and vendor submissions
              </p>
            </div>
            <div>
              <ButtonGroup>
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                  disabled={loading}
                >
                  <i className="fas fa-plus me-2"></i>
                  New Campaign
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={() => setShowVendorModal(true)}
                  disabled={loading}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Add Vendor
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'campaigns')}
            className="mb-4"
          >
            <Tab eventKey="campaigns" title="Campaigns">
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-bullhorn me-2"></i>
                      Email Campaigns
                    </h5>
                    <Badge bg="info">{campaigns.length} campaigns</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading campaigns...</p>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                      <h5>No campaigns yet</h5>
                      <p className="text-muted">Create your first email campaign to get started</p>
                      <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus me-2"></i>
                        Create Campaign
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th>Status</th>
                          <th>Recipients</th>
                          <th>Delivery Rate</th>
                          <th>Open Rate</th>
                          <th>Click Rate</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id}>
                            <td>
                              <div>
                                <strong>{campaign.name}</strong>
                                <br />
                                <small className="text-muted">{campaign.subject}</small>
                              </div>
                            </td>
                            <td>{getStatusBadge(campaign.status)}</td>
                            <td>
                              <Badge bg="secondary">{campaign.total_recipients}</Badge>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <ProgressBar 
                                  now={getDeliveryRate(campaign)} 
                                  style={{ width: '60px', height: '8px' }}
                                  variant="success"
                                />
                                <span className="ms-2 small">{getDeliveryRate(campaign)}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <ProgressBar 
                                  now={getOpenRate(campaign)} 
                                  style={{ width: '60px', height: '8px' }}
                                  variant="info"
                                />
                                <span className="ms-2 small">{getOpenRate(campaign)}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <ProgressBar 
                                  now={getClickRate(campaign)} 
                                  style={{ width: '60px', height: '8px' }}
                                  variant="warning"
                                />
                                <span className="ms-2 small">{getClickRate(campaign)}%</span>
                              </div>
                            </td>
                            <td>
                              <small>
                                {new Date(campaign.created_at).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  <i className="fas fa-ellipsis-v"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item>
                                    <i className="fas fa-eye me-2"></i>
                                    View Details
                                  </Dropdown.Item>
                                  <Dropdown.Item>
                                    <i className="fas fa-edit me-2"></i>
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item>
                                    <i className="fas fa-chart-bar me-2"></i>
                                    Analytics
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Item className="text-danger">
                                    <i className="fas fa-trash me-2"></i>
                                    Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="templates" title="Templates">
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-file-alt me-2"></i>
                      Email Templates
                    </h5>
                    <Badge bg="info">{templates.length} templates</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {templates.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                      <h5>No templates yet</h5>
                      <p className="text-muted">Create email templates for faster campaign creation</p>
                    </div>
                  ) : (
                    <Row>
                      {templates.map((template) => (
                        <Col md={6} lg={4} key={template.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">{template.name}</h6>
                                <Badge bg="secondary" className="small">
                                  {template.category}
                                </Badge>
                              </div>
                              <p className="text-muted small mb-2">
                                {template.subject}
                              </p>
                              <div 
                                className="small text-muted mb-3"
                                style={{ 
                                  maxHeight: '60px', 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                dangerouslySetInnerHTML={{ 
                                  __html: template.content.substring(0, 100) + '...' 
                                }}
                              />
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="w-100"
                                onClick={() => handleTemplateSelect(template)}
                              >
                                <i className="fas fa-plus me-2"></i>
                                Use Template
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="vendors" title="Vendors">
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-users me-2"></i>
                      Vendor Submissions
                    </h5>
                    <Badge bg="info">{vendors.length} vendors</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  {vendors.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fas fa-users fa-3x text-muted mb-3"></i>
                      <h5>No vendors yet</h5>
                      <p className="text-muted">Vendors can submit their resumes through the portal</p>
                      <Button variant="primary" onClick={() => setShowVendorModal(true)}>
                        <i className="fas fa-user-plus me-2"></i>
                        Add Vendor
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Company</th>
                          <th>Skills</th>
                          <th>Experience</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((vendor) => (
                          <tr key={vendor.id}>
                            <td>
                              <strong>{vendor.name}</strong>
                            </td>
                            <td>{vendor.email}</td>
                            <td>{vendor.company}</td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {vendor.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} bg="secondary" className="small">
                                    {skill}
                                  </Badge>
                                ))}
                                {vendor.skills.length > 3 && (
                                  <Badge bg="light" text="dark" className="small">
                                    +{vendor.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge bg="info" className="text-capitalize">
                                {vendor.experience_level}
                              </Badge>
                            </td>
                            <td>
                              <small>
                                {new Date(vendor.created_at).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                  <i className="fas fa-ellipsis-v"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item>
                                    <i className="fas fa-eye me-2"></i>
                                    View Resume
                                  </Dropdown.Item>
                                  <Dropdown.Item>
                                    <i className="fas fa-envelope me-2"></i>
                                    Send Email
                                  </Dropdown.Item>
                                  <Dropdown.Item>
                                    <i className="fas fa-user-plus me-2"></i>
                                    Add to CRM
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>

          {/* Create Campaign Modal */}
          <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="fas fa-plus me-2"></i>
                Create New Campaign
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Campaign Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter campaign name"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Template</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Select template"
                          value={selectedTemplate?.name || ''}
                          readOnly
                        />
                        <Button 
                          variant="outline-secondary"
                          onClick={() => setShowTemplateModal(true)}
                        >
                          <i className="fas fa-search"></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Subject Line</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter email subject"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    placeholder="Enter email content (HTML supported)"
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Recipient Emails</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter email addresses (one per line)"
                    value={newCampaign.recipient_emails.join('\n')}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign, 
                      recipient_emails: e.target.value.split('\n').filter(email => email.trim())
                    })}
                  />
                  <Form.Text className="text-muted">
                    Enter one email address per line
                  </Form.Text>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={createCampaign} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Create Campaign
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Template Selection Modal */}
          <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="fas fa-file-alt me-2"></i>
                Select Email Template
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {templates.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                  <h5>No templates available</h5>
                  <p className="text-muted">Create templates first to use them in campaigns</p>
                </div>
              ) : (
                <ListGroup>
                  {templates.map((template) => (
                    <ListGroup.Item 
                      key={template.id}
                      action
                      onClick={() => handleTemplateSelect(template)}
                      className="d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <h6 className="mb-1">{template.name}</h6>
                        <p className="mb-1 text-muted">{template.subject}</p>
                        <small className="text-muted">
                          {template.content.substring(0, 100)}...
                        </small>
                      </div>
                      <Badge bg="secondary">{template.category}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Modal.Body>
          </Modal>

          {/* Add Vendor Modal */}
          <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="fas fa-user-plus me-2"></i>
                Add New Vendor
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter vendor name"
                        value={newVendor.name}
                        onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email address"
                        value={newVendor.email}
                        onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter company name"
                        value={newVendor.company}
                        onChange={(e) => setNewVendor({...newVendor, company: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Enter phone number"
                        value={newVendor.phone}
                        onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Resume File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewVendor({...newVendor, resume_file: file});
                      }
                    }}
                  />
                  <Form.Text className="text-muted">
                    Upload resume file (PDF, DOC, DOCX)
                  </Form.Text>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowVendorModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={createVendor} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Add Vendor
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default MassMailingPage;
