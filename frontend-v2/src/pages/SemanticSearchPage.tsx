import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Form, InputGroup, Tabs, Tab, ListGroup, Modal, ProgressBar } from 'react-bootstrap';
import { ENV } from '../config/environment';
import SimilarItemsModal from '../components/search/SimilarItemsModal';

interface SearchResult {
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
  work_experience?: any[];
  responsibilities?: any[];
  similarity_score: number;
  distance: number;
}

interface SearchResponse {
  success: boolean;
  results: {
    query: string;
    search_type: string;
    resumes: SearchResult[];
    jobs: SearchResult[];
    total_results: number;
  };
  message: string;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  results_count: number;
  search_type: string;
}

const SemanticSearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('both');
  const [searchLimit, setSearchLimit] = useState(10);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarItemType, setSimilarItemType] = useState<'resume' | 'job'>('resume');
  const [similarItemId, setSimilarItemId] = useState('');
  const [similarItemName, setSimilarItemName] = useState('');

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('semanticSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save search to history
  const saveToHistory = (query: string, results: SearchResponse) => {
    const newSearch: SearchHistory = {
      id: Date.now().toString(),
      query,
      timestamp: new Date().toISOString(),
      results_count: results.results.total_results,
      search_type: results.results.search_type
    };
    
    const updatedHistory = [newSearch, ...searchHistory.slice(0, 9)]; // Keep last 10 searches
    setSearchHistory(updatedHistory);
    localStorage.setItem('semanticSearchHistory', JSON.stringify(updatedHistory));
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${ENV.getApiBaseUrl()}/api/search/semantic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          type: searchType,
          limit: searchLimit
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      setSearchResults(data);
      saveToHistory(searchQuery, data);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform search');
      console.error('Error performing semantic search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
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
    ).slice(0, 5); // Show max 5 skills
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('semanticSearchHistory');
  };

  const showSimilarItems = (type: 'resume' | 'job', id: string, name: string) => {
    setSimilarItemType(type);
    setSimilarItemId(id);
    setSimilarItemName(name);
    setShowSimilarModal(true);
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>🔍 Semantic Search</h2>
              <p className="text-muted">Search resumes and jobs using natural language with AI-powered semantic understanding</p>
            </div>
            <Button 
              variant="outline-primary" 
              onClick={() => setShowHistory(true)}
              disabled={searchHistory.length === 0}
            >
              📚 Search History ({searchHistory.length})
            </Button>
          </div>
        </Col>
      </Row>

      {/* Search Form */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Search Query</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="e.g., 'Python developer with machine learning experience'"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={loading}
                        />
                        <Button 
                          variant="primary" 
                          onClick={performSearch}
                          disabled={loading || !searchQuery.trim()}
                        >
                          {loading ? <Spinner size="sm" /> : '🔍 Search'}
                        </Button>
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Use natural language to describe what you're looking for
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Search Type</Form.Label>
                      <Form.Select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        disabled={loading}
                      >
                        <option value="both">Both Resumes & Jobs</option>
                        <option value="resumes">Resumes Only</option>
                        <option value="jobs">Jobs Only</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Results Limit</Form.Label>
                      <Form.Select
                        value={searchLimit}
                        onChange={(e) => setSearchLimit(Number(e.target.value))}
                        disabled={loading}
                      >
                        <option value={5}>5 results</option>
                        <option value={10}>10 results</option>
                        <option value={20}>20 results</option>
                        <option value={50}>50 results</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Search Error</Alert.Heading>
              <p>{error}</p>
            </Alert>
          </Col>
        </Row>
      )}

      {searchResults && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    Search Results for: "{searchResults.results.query}"
                  </h5>
                  <div>
                    <Badge bg="primary" className="me-2">
                      {searchResults.results.total_results} Total Results
                    </Badge>
                    <Badge bg="info">
                      {searchResults.results.search_type} Search
                    </Badge>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || 'results')}
                  className="mb-3"
                >
                  <Tab eventKey="results" title={`📊 All Results (${searchResults.results.total_results})`}>
                    <Row>
                      {/* Resume Results */}
                      {searchResults.results.resumes.length > 0 && (
                        <Col md={6}>
                          <h6 className="text-primary mb-3">
                            👥 Resumes ({searchResults.results.resumes.length})
                          </h6>
                          {searchResults.results.resumes.map((resume, index) => (
                            <Card key={resume.resume_id} className="mb-3">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0">{resume.full_name}</h6>
                                  {getSimilarityBadge(resume.similarity_score)}
                                </div>
                                <p className="text-muted small mb-2">{resume.email}</p>
                                <p className="small mb-2">
                                  {resume.summary?.substring(0, 150)}...
                                </p>
                                <div className="mb-2">
                                  <strong>Skills:</strong>
                                  <div className="mt-1">
                                    {formatSkills(resume.skills || []).map((skill, i) => (
                                      <Badge key={i} bg="light" text="dark" className="me-1">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <ProgressBar
                                  variant={getSimilarityColor(resume.similarity_score)}
                                  now={resume.similarity_score * 100}
                                  label={`${(resume.similarity_score * 100).toFixed(1)}%`}
                                  className="mb-2"
                                />
                                <small className="text-muted">
                                  Distance: {resume.distance.toFixed(4)}
                                </small>
                                <div className="mt-2">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => showSimilarItems('resume', resume.resume_id!, resume.full_name!)}
                                  >
                                    🔍 Find Similar
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </Col>
                      )}

                      {/* Job Results */}
                      {searchResults.results.jobs.length > 0 && (
                        <Col md={6}>
                          <h6 className="text-success mb-3">
                            💼 Jobs ({searchResults.results.jobs.length})
                          </h6>
                          {searchResults.results.jobs.map((job, index) => (
                            <Card key={job.job_id} className="mb-3">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0">{job.title}</h6>
                                  {getSimilarityBadge(job.similarity_score)}
                                </div>
                                <p className="text-muted small mb-2">{job.company}</p>
                                <p className="small mb-2">
                                  {job.overview?.substring(0, 150)}...
                                </p>
                                <div className="mb-2">
                                  <strong>Required Skills:</strong>
                                  <div className="mt-1">
                                    {formatSkills(job.required_skills || []).map((skill, i) => (
                                      <Badge key={i} bg="light" text="dark" className="me-1">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <ProgressBar
                                  variant={getSimilarityColor(job.similarity_score)}
                                  now={job.similarity_score * 100}
                                  label={`${(job.similarity_score * 100).toFixed(1)}%`}
                                  className="mb-2"
                                />
                                <small className="text-muted">
                                  Distance: {job.distance.toFixed(4)}
                                </small>
                                <div className="mt-2">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => showSimilarItems('job', job.job_id!, job.title!)}
                                  >
                                    🔍 Find Similar
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </Col>
                      )}

                      {searchResults.results.total_results === 0 && (
                        <Col>
                          <Alert variant="info">
                            <Alert.Heading>No Results Found</Alert.Heading>
                            <p>Try adjusting your search query or search type.</p>
                          </Alert>
                        </Col>
                      )}
                    </Row>
                  </Tab>

                  <Tab eventKey="resumes" title={`👥 Resumes (${searchResults.results.resumes.length})`}>
                    {searchResults.results.resumes.length > 0 ? (
                      <Row>
                        {searchResults.results.resumes.map((resume) => (
                          <Col md={6} key={resume.resume_id} className="mb-3">
                            <Card>
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0">{resume.full_name}</h6>
                                  {getSimilarityBadge(resume.similarity_score)}
                                </div>
                                <p className="text-muted small mb-2">{resume.email}</p>
                                <p className="small mb-2">
                                  {resume.summary?.substring(0, 200)}...
                                </p>
                                <div className="mb-2">
                                  <strong>Skills:</strong>
                                  <div className="mt-1">
                                    {formatSkills(resume.skills || []).map((skill, i) => (
                                      <Badge key={i} bg="light" text="dark" className="me-1">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <ProgressBar
                                  variant={getSimilarityColor(resume.similarity_score)}
                                  now={resume.similarity_score * 100}
                                  label={`${(resume.similarity_score * 100).toFixed(1)}%`}
                                />
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Alert variant="info">No resume results found.</Alert>
                    )}
                  </Tab>

                  <Tab eventKey="jobs" title={`💼 Jobs (${searchResults.results.jobs.length})`}>
                    {searchResults.results.jobs.length > 0 ? (
                      <Row>
                        {searchResults.results.jobs.map((job) => (
                          <Col md={6} key={job.job_id} className="mb-3">
                            <Card>
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0">{job.title}</h6>
                                  {getSimilarityBadge(job.similarity_score)}
                                </div>
                                <p className="text-muted small mb-2">{job.company}</p>
                                <p className="small mb-2">
                                  {job.overview?.substring(0, 200)}...
                                </p>
                                <div className="mb-2">
                                  <strong>Required Skills:</strong>
                                  <div className="mt-1">
                                    {formatSkills(job.required_skills || []).map((skill, i) => (
                                      <Badge key={i} bg="light" text="dark" className="me-1">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <ProgressBar
                                  variant={getSimilarityColor(job.similarity_score)}
                                  now={job.similarity_score * 100}
                                  label={`${(job.similarity_score * 100).toFixed(1)}%`}
                                />
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Alert variant="info">No job results found.</Alert>
                    )}
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Search History Modal */}
      <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📚 Search History</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {searchHistory.length === 0 ? (
            <Alert variant="info">No search history available.</Alert>
          ) : (
            <ListGroup>
              {searchHistory.map((search) => (
                <ListGroup.Item key={search.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{search.query}</strong>
                    <br />
                    <small className="text-muted">
                      {new Date(search.timestamp).toLocaleString()} • 
                      {search.results_count} results • 
                      {search.search_type} search
                    </small>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(search.query);
                      setSearchType(search.search_type);
                      setShowHistory(false);
                    }}
                  >
                    🔄 Use
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-danger" onClick={clearHistory}>
            🗑️ Clear History
          </Button>
          <Button variant="secondary" onClick={() => setShowHistory(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Similar Items Modal */}
      <SimilarItemsModal
        show={showSimilarModal}
        onHide={() => setShowSimilarModal(false)}
        type={similarItemType}
        itemId={similarItemId}
        itemName={similarItemName}
      />

      {/* Help Section */}
      <Row className="mt-4">
        <Col>
          <Alert variant="info">
            <Alert.Heading>💡 How to Use Semantic Search</Alert.Heading>
            <p>
              Semantic search uses AI to understand the meaning behind your queries, not just keywords:
            </p>
            <ul>
              <li><strong>Natural Language:</strong> "Find a Python developer with machine learning experience"</li>
              <li><strong>Skills-Based:</strong> "React developer with 5+ years experience"</li>
              <li><strong>Role-Based:</strong> "Senior software engineer at a startup"</li>
              <li><strong>Industry-Specific:</strong> "Data scientist in healthcare"</li>
            </ul>
            <hr />
            <p className="mb-0">
              <strong>Similarity Scores:</strong> Higher scores indicate better matches based on semantic understanding.
            </p>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default SemanticSearchPage;
