import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Table } from 'react-bootstrap';
import { ENV } from '../config/environment';

interface GapAnalysis {
  resume_id: string;
  full_name: string;
  total_gaps: number;
  total_gap_months: number;
  highest_degree: string;
  career_level: string;
  job_stability: string;
}

interface GapAnalysisSummary {
  success: boolean;
  summaries: GapAnalysis[];
  total_resumes: number;
  total_education_gaps: number;
  total_career_gaps: number;
  average_gap_duration: number;
  message: string;
}

const GapAnalysisPage: React.FC = () => {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGapAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${ENV.getGapDetectionUrl()}/api/gap-analysis/summary`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: GapAnalysisSummary = await response.json();
      setGapAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gap analysis');
      console.error('Error fetching gap analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGapAnalysis();
  }, []);

  const getStabilityBadge = (stability: string) => {
    switch (stability.toLowerCase()) {
      case 'high':
        return <Badge bg="success">High</Badge>;
      case 'medium':
        return <Badge bg="warning">Medium</Badge>;
      case 'low':
        return <Badge bg="danger">Low</Badge>;
      default:
        return <Badge bg="secondary">{stability}</Badge>;
    }
  };

  const getDegreeBadge = (degree: string) => {
    switch (degree.toLowerCase()) {
      case 'phd':
      case 'doctorate':
        return <Badge bg="primary">PhD</Badge>;
      case 'master':
      case 'masters':
        return <Badge bg="info">Master's</Badge>;
      case 'bachelor':
      case 'bachelors':
        return <Badge bg="success">Bachelor's</Badge>;
      default:
        return <Badge bg="secondary">{degree}</Badge>;
    }
  };

  const getCareerLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'senior':
        return <Badge bg="primary">Senior</Badge>;
      case 'mid':
      case 'mid-level':
        return <Badge bg="info">Mid-Level</Badge>;
      case 'junior':
      case 'entry':
        return <Badge bg="success">Junior</Badge>;
      default:
        return <Badge bg="secondary">{level}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading gap analysis...</span>
            </Spinner>
            <p className="mt-2">Loading gap analysis...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>📊 Gap Analysis Dashboard</h2>
            <Button variant="primary" onClick={fetchGapAnalysis} disabled={loading}>
              🔄 Refresh Analysis
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error Loading Gap Analysis</Alert.Heading>
              <p>{error}</p>
              <hr />
              <p className="mb-0">
                Make sure the gap detection backend is running on port 8808.
              </p>
            </Alert>
          </Col>
        </Row>
      )}

      {gapAnalysis && (
        <>
          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>📋 Total Resumes</Card.Title>
                  <h3 className="text-primary">{gapAnalysis.total_resumes}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>🎓 Education Gaps</Card.Title>
                  <h3 className="text-warning">{gapAnalysis.total_education_gaps}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>💼 Career Gaps</Card.Title>
                  <h3 className="text-danger">{gapAnalysis.total_career_gaps}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>⏱️ Avg Gap Duration</Card.Title>
                  <h3 className="text-info">{gapAnalysis.average_gap_duration.toFixed(1)} months</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Individual Resume Analysis */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5>📈 Individual Resume Analysis</h5>
                </Card.Header>
                <Card.Body>
                  {gapAnalysis.summaries.length === 0 ? (
                    <Alert variant="info">
                      <Alert.Heading>No Gap Analysis Data</Alert.Heading>
                      <p>No resumes have been analyzed for gaps yet. Upload some resumes to see gap analysis.</p>
                    </Alert>
                  ) : (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Total Gaps</th>
                          <th>Gap Duration</th>
                          <th>Highest Degree</th>
                          <th>Career Level</th>
                          <th>Job Stability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gapAnalysis.summaries.map((summary) => (
                          <tr key={summary.resume_id}>
                            <td>
                              <strong>{summary.full_name}</strong>
                              <br />
                              <small className="text-muted">ID: {summary.resume_id.slice(0, 8)}...</small>
                            </td>
                            <td>
                              {summary.total_gaps === 0 ? (
                                <Badge bg="success">No Gaps</Badge>
                              ) : (
                                <Badge bg="warning">{summary.total_gaps} Gaps</Badge>
                              )}
                            </td>
                            <td>
                              {summary.total_gap_months === 0 ? (
                                <span className="text-success">0 months</span>
                              ) : (
                                <span className="text-warning">{summary.total_gap_months} months</span>
                              )}
                            </td>
                            <td>{getDegreeBadge(summary.highest_degree)}</td>
                            <td>{getCareerLevelBadge(summary.career_level)}</td>
                            <td>{getStabilityBadge(summary.job_stability)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Instructions */}
          <Row className="mt-4">
            <Col>
              <Alert variant="info">
                <Alert.Heading>💡 How to Use Gap Analysis</Alert.Heading>
                <p>
                  Gap analysis helps identify potential issues in candidate resumes:
                </p>
                <ul>
                  <li><strong>Education Gaps:</strong> Time between educational milestones</li>
                  <li><strong>Career Gaps:</strong> Unemployment periods between jobs</li>
                  <li><strong>Job Stability:</strong> Average duration of employment</li>
                  <li><strong>Career Progression:</strong> Advancement in roles and responsibilities</li>
                </ul>
                <hr />
                <p className="mb-0">
                  To analyze more resumes, use the resume parser with gap detection enabled.
                </p>
              </Alert>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default GapAnalysisPage;
