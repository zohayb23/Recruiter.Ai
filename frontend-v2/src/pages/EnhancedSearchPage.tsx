import React, { useState, useEffect } from 'react';
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
  ListGroupItem,
  ProgressBar,
  Tabs,
  Tab
} from 'react-bootstrap';
import { api } from '../services/api/config';

interface CategorizationResponse {
  skill_categories: Array<{
    category: string;
    skills: string[];
    count: number;
  }>;
  location_categories: Array<{
    category: string;
    locations: string[];
    count: number;
  }>;
  experience_categories: Array<{
    category: string;
    levels: string[];
    count: number;
  }>;
}

interface SearchFilters {
  skills: string[];
  locations: string[];
  experience_levels: string[];
  keywords: string;
}

const EnhancedSearchPage: React.FC = () => {
  const [categorization, setCategorization] = useState<CategorizationResponse | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    skills: [],
    locations: [],
    experience_levels: [],
    keywords: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('skills');

  useEffect(() => {
    loadCategorization();
  }, []);

  const loadCategorization = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/search-utils/categorize-results', {
        search_query: '',
        filters: {}
      });
      setCategorization(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load categorization');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleLocation = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const toggleExperience = (level: string) => {
    setFilters(prev => ({
      ...prev,
      experience_levels: prev.experience_levels.includes(level)
        ? prev.experience_levels.filter(e => e !== level)
        : [...prev.experience_levels, level]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      skills: [],
      locations: [],
      experience_levels: [],
      keywords: ''
    });
  };

  const getActiveFiltersCount = () => {
    return filters.skills.length + filters.locations.length + filters.experience_levels.length + (filters.keywords ? 1 : 0);
  };

  const getTotalCount = () => {
    if (!categorization) return 0;
    return (
      categorization.skill_categories.reduce((sum, cat) => sum + cat.count, 0) +
      categorization.location_categories.reduce((sum, cat) => sum + cat.count, 0) +
      categorization.experience_categories.reduce((sum, cat) => sum + cat.count, 0)
    );
  };

  const getFilteredCount = () => {
    // This would be calculated based on actual filtered results
    // For now, return a mock calculation
    const baseCount = getTotalCount();
    const filterMultiplier = Math.max(0.1, 1 - (getActiveFiltersCount() * 0.1));
    return Math.round(baseCount * filterMultiplier);
  };

  if (loading && !categorization) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading search categories...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">
                <i className="fas fa-filter me-2"></i>
                Enhanced Search & Categorization
              </h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Search Keywords</Form.Label>
                    <Form.Control
                      type="text"
                      value={filters.keywords}
                      onChange={(e) => handleFilterChange('keywords', e.target.value)}
                      placeholder="Enter job title, skills, or keywords..."
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={clearAllFilters}
                    className="w-100"
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear All Filters
                  </Button>
                </Col>
              </Row>

              {getActiveFiltersCount() > 0 && (
                <Alert variant="info" className="mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Active Filters:</strong> {getActiveFiltersCount()} filters applied
                  <div className="mt-2">
                    {filters.skills.length > 0 && (
                      <div className="mb-1">
                        <strong>Skills:</strong> {filters.skills.map(skill => (
                          <Badge key={skill} bg="primary" className="me-1">{skill}</Badge>
                        ))}
                      </div>
                    )}
                    {filters.locations.length > 0 && (
                      <div className="mb-1">
                        <strong>Locations:</strong> {filters.locations.map(location => (
                          <Badge key={location} bg="success" className="me-1">{location}</Badge>
                        ))}
                      </div>
                    )}
                    {filters.experience_levels.length > 0 && (
                      <div className="mb-1">
                        <strong>Experience:</strong> {filters.experience_levels.map(level => (
                          <Badge key={level} bg="warning" className="me-1">{level}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Alert>
              )}

              <Row className="mb-3">
                <Col>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Total Results: <strong>{getTotalCount()}</strong></span>
                    <span>Filtered Results: <strong>{getFilteredCount()}</strong></span>
                  </div>
                  <ProgressBar
                    now={(getFilteredCount() / getTotalCount()) * 100}
                    className="mt-1"
                    variant="primary"
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {categorization && (
            <Card className="shadow-sm">
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || 'skills')}
                  className="mb-3"
                >
                  <Tab eventKey="skills" title={`Skills (${categorization.skill_categories.length})`}>
                    <Row>
                      {categorization.skill_categories.map((category, index) => (
                        <Col md={6} lg={4} key={index} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-info text-white">
                              <h6 className="mb-0">{category.category}</h6>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <small className="text-muted">
                                  {category.count} results found
                                </small>
                              </div>
                              <div className="d-flex flex-wrap gap-1">
                                {category.skills.map((skill, skillIndex) => (
                                  <Badge
                                    key={skillIndex}
                                    bg={filters.skills.includes(skill) ? "primary" : "light"}
                                    text={filters.skills.includes(skill) ? "white" : "dark"}
                                    className="cursor-pointer"
                                    onClick={() => toggleSkill(skill)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Tab>

                  <Tab eventKey="locations" title={`Locations (${categorization.location_categories.length})`}>
                    <Row>
                      {categorization.location_categories.map((category, index) => (
                        <Col md={6} lg={4} key={index} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-success text-white">
                              <h6 className="mb-0">{category.category}</h6>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <small className="text-muted">
                                  {category.count} results found
                                </small>
                              </div>
                              <div className="d-flex flex-wrap gap-1">
                                {category.locations.map((location, locIndex) => (
                                  <Badge
                                    key={locIndex}
                                    bg={filters.locations.includes(location) ? "success" : "light"}
                                    text={filters.locations.includes(location) ? "white" : "dark"}
                                    className="cursor-pointer"
                                    onClick={() => toggleLocation(location)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {location}
                                  </Badge>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Tab>

                  <Tab eventKey="experience" title={`Experience (${categorization.experience_categories.length})`}>
                    <Row>
                      {categorization.experience_categories.map((category, index) => (
                        <Col md={6} lg={4} key={index} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-warning text-dark">
                              <h6 className="mb-0">{category.category}</h6>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <small className="text-muted">
                                  {category.count} results found
                                </small>
                              </div>
                              <div className="d-flex flex-wrap gap-1">
                                {category.levels.map((level, levelIndex) => (
                                  <Badge
                                    key={levelIndex}
                                    bg={filters.experience_levels.includes(level) ? "warning" : "light"}
                                    text={filters.experience_levels.includes(level) ? "dark" : "dark"}
                                    className="cursor-pointer"
                                    onClick={() => toggleExperience(level)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {level}
                                  </Badge>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Tab>
                </Tabs>

                <div className="text-center mt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-5"
                    disabled={getActiveFiltersCount() === 0}
                  >
                    <i className="fas fa-search me-2"></i>
                    Search with Current Filters
                    {getActiveFiltersCount() > 0 && (
                      <Badge bg="light" text="dark" className="ms-2">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default EnhancedSearchPage;
