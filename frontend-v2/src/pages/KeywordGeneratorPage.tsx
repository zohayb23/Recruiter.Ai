import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  ListGroup,
  ListGroupItem
} from 'react-bootstrap';
import { api } from '../services/api/config';

interface KeywordRequest {
  job_title: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  industry: string;
}

interface KeywordResponse {
  boolean_query: string;
  keywords: string[];
  search_suggestions: string[];
}

const KeywordGeneratorPage: React.FC = () => {
  const [formData, setFormData] = useState<KeywordRequest>({
    job_title: '',
    required_skills: [''],
    preferred_skills: [''],
    experience_level: 'mid-level',
    industry: 'technology'
  });

  const [result, setResult] = useState<KeywordResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid-level', label: 'Mid Level (2-5 years)' },
    { value: 'senior', label: 'Senior Level (5-8 years)' },
    { value: 'executive', label: 'Executive (8+ years)' }
  ];

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' }
  ];

  const handleInputChange = (field: keyof KeywordRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (skills: string[], index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setFormData(prev => ({ ...prev, required_skills: newSkills }));
  };

  const handlePreferredSkillChange = (skills: string[], index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setFormData(prev => ({ ...prev, preferred_skills: newSkills }));
  };

  const addSkill = (skillType: 'required' | 'preferred') => {
    if (skillType === 'required') {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, '']
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferred_skills: [...prev.preferred_skills, '']
      }));
    }
  };

  const removeSkill = (skillType: 'required' | 'preferred', index: number) => {
    if (skillType === 'required') {
      setFormData(prev => ({
        ...prev,
        required_skills: prev.required_skills.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferred_skills: prev.preferred_skills.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Filter out empty skills
      const cleanRequiredSkills = formData.required_skills.filter(skill => skill.trim());
      const cleanPreferredSkills = formData.preferred_skills.filter(skill => skill.trim());

      if (cleanRequiredSkills.length === 0) {
        setError('At least one required skill is needed');
        setLoading(false);
        return;
      }

      const requestData = {
        ...formData,
        required_skills: cleanRequiredSkills,
        preferred_skills: cleanPreferredSkills
      };

      const response = await api.post('/api/search-utils/generate-keywords', requestData);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate keywords');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-search me-2"></i>
                Keyword & Boolean String Generator
              </h3>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Job Title *</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        placeholder="e.g., Software Engineer, Data Scientist"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Experience Level</Form.Label>
                      <Form.Select
                        value={formData.experience_level}
                        onChange={(e) => handleInputChange('experience_level', e.target.value)}
                      >
                        {experienceLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Industry</Form.Label>
                      <Form.Select
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      >
                        {industries.map(industry => (
                          <option key={industry.value} value={industry.value}>
                            {industry.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Required Skills * 
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-2"
                          onClick={() => addSkill('required')}
                          type="button"
                        >
                          <i className="fas fa-plus"></i>
                        </Button>
                      </Form.Label>
                      {formData.required_skills.map((skill, index) => (
                        <div key={index} className="d-flex mb-2">
                          <Form.Control
                            type="text"
                            value={skill}
                            onChange={(e) => handleSkillChange(formData.required_skills, index, e.target.value)}
                            placeholder="e.g., Python, React"
                            required={index === 0}
                          />
                          {formData.required_skills.length > 1 && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="ms-2"
                              onClick={() => removeSkill('required', index)}
                              type="button"
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          )}
                        </div>
                      ))}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Preferred Skills
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-2"
                          onClick={() => addSkill('preferred')}
                          type="button"
                        >
                          <i className="fas fa-plus"></i>
                        </Button>
                      </Form.Label>
                      {formData.preferred_skills.map((skill, index) => (
                        <div key={index} className="d-flex mb-2">
                          <Form.Control
                            type="text"
                            value={skill}
                            onChange={(e) => handlePreferredSkillChange(formData.preferred_skills, index, e.target.value)}
                            placeholder="e.g., AWS, Docker"
                          />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-2"
                            onClick={() => removeSkill('preferred', index)}
                            type="button"
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      ))}
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={loading}
                    className="px-5"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Generating Keywords...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic me-2"></i>
                        Generate Search Keywords
                      </>
                    )}
                  </Button>
                </div>
              </Form>

              {error && (
                <Alert variant="danger" className="mt-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              {result && (
                <div className="mt-4">
                  <hr />
                  <h4 className="text-primary mb-3">
                    <i className="fas fa-lightbulb me-2"></i>
                    Generated Results
                  </h4>

                  <Row>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header className="bg-success text-white">
                          <h6 className="mb-0">
                            <i className="fas fa-code me-2"></i>
                            Boolean Search Query
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <code className="bg-light p-2 rounded flex-grow-1 me-2">
                              {result.boolean_query}
                            </code>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => copyToClipboard(result.boolean_query)}
                            >
                              <i className="fas fa-copy"></i>
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header className="bg-info text-white">
                          <h6 className="mb-0">
                            <i className="fas fa-tags me-2"></i>
                            Generated Keywords
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="d-flex flex-wrap gap-1">
                            {result.keywords.map((keyword, index) => (
                              <Badge key={index} bg="primary" className="me-1 mb-1">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Card>
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0">
                        <i className="fas fa-lightbulb me-2"></i>
                        Search Suggestions
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup>
                        {result.search_suggestions.map((suggestion, index) => (
                          <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
                            {suggestion}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => copyToClipboard(suggestion)}
                            >
                              <i className="fas fa-copy"></i>
                            </Button>
                          </ListGroupItem>
                        ))}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default KeywordGeneratorPage;
