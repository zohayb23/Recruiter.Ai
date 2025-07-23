import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card
} from 'react-bootstrap';
import { searchExternalJobs } from '../../services/api/externalJobs';

const ExternalJobSearch: React.FC = () => {
  // Search Parameters State
  const [searchParams, setSearchParams] = useState({
    query: '',
    location: '',
    full_time: false,
    part_time: false,
    contract: false,
    permanent: false,
    page: 1,
    results_per_page: 10
  });

  // Results State
  const [searchResults, setSearchResults] = useState<any>({
    count: 0,
    results: []
  });

  // Loading State
  const [isLoading, setIsLoading] = useState(false);

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Search
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await searchExternalJobs(searchParams);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
    }
    setIsLoading(false);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Filters Column */}
        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>Search Filters</Card.Header>
            <Card.Body>
              <Form>
                {/* Basic Search */}
                <Form.Group className="mb-3">
                  <Form.Label>Keywords</Form.Label>
                  <Form.Control
                    type="text"
                    name="query"
                    value={searchParams.query}
                    onChange={handleInputChange}
                    placeholder="e.g. Software Engineer"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={searchParams.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Austin, TX"
                  />
                </Form.Group>

                {/* Employment Type */}
                <Form.Group className="mb-3">
                  <Form.Label>Employment Type</Form.Label>
                  <div>
                    <Form.Check
                      type="checkbox"
                      label="Full Time"
                      name="full_time"
                      checked={searchParams.full_time}
                      onChange={handleInputChange}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Part Time"
                      name="part_time"
                      checked={searchParams.part_time}
                      onChange={handleInputChange}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Contract"
                      name="contract"
                      checked={searchParams.contract}
                      onChange={handleInputChange}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Permanent"
                      name="permanent"
                      checked={searchParams.permanent}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-100"
                >
                  {isLoading ? 'Searching...' : 'Search Jobs'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Results Column */}
        <Col md={9}>
          <Card>
            <Card.Header>
              Found {searchResults.count} Jobs
            </Card.Header>
            <Card.Body>
              {searchResults.results.map((job: any) => (
                <Card key={job.id} className="mb-3">
                  <Card.Body>
                    <Card.Title>{job.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {job.company.display_name}
                    </Card.Subtitle>
                    <Card.Text>
                      <i className="fas fa-map-marker-alt me-2"></i>
                      {job.location.display_name}
                      {job.salary_min && job.salary_max && (
                        <div className="text-success">
                          <i className="fas fa-money-bill me-2"></i>
                          ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                        </div>
                      )}
                    </Card.Text>
                    <Card.Text>{job.description}</Card.Text>
                    <Button
                      variant="outline-primary"
                      href={job.redirect_url}
                      target="_blank"
                    >
                      Apply Now
                    </Button>
                  </Card.Body>
                  <Card.Footer className="text-muted">
                    Posted: {new Date(job.created).toLocaleDateString()}
                  </Card.Footer>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ExternalJobSearch; 