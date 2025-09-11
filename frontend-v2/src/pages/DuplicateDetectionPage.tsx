import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { 
  getDuplicateStats, 
  findDuplicates, 
  removeDuplicates, 
  checkHealth,
  type DuplicateStats,
  type DuplicateGroup 
} from '../services/api/duplicateDetection';
import DuplicateStats from '../components/duplicates/DuplicateStats';
import DuplicateGroupList from '../components/duplicates/DuplicateGroupList';

const DuplicateDetectionPage: React.FC = () => {
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check service health first
      await checkHealth();

      // Load statistics
      const statsData = await getDuplicateStats();
      setStats(statsData);

      // Load duplicate groups
      const duplicatesData = await findDuplicates();
      const groups: DuplicateGroup[] = Object.entries(duplicatesData.duplicates).map(([name, resumes]) => ({
        name,
        resumes,
        count: resumes.length
      }));
      setDuplicateGroups(groups);

    } catch (err: any) {
      console.error('Error loading duplicate data:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load duplicate data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!window.confirm(`Are you sure you want to remove ${stats?.resumes_to_remove || 0} duplicate resumes? This action cannot be undone.`)) {
      return;
    }

    try {
      setRemoving(true);
      setError(null);

      const result = await removeDuplicates();
      setLastAction(`Successfully removed ${result.removed_count} duplicate resumes. Kept ${result.kept_resumes.length} unique resumes.`);
      
      // Reload data to show updated state
      await loadData();

    } catch (err: any) {
      console.error('Error removing duplicates:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to remove duplicates');
    } finally {
      setRemoving(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading duplicate detection data...</p>
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
            <h2>Duplicate Detection</h2>
            <div>
              <Button 
                variant="outline-primary" 
                onClick={handleRefresh}
                className="me-2"
                disabled={loading}
              >
                Refresh
              </Button>
              {stats && stats.resumes_to_remove > 0 && (
                <Button 
                  variant="danger" 
                  onClick={handleRemoveDuplicates}
                  disabled={removing}
                >
                  {removing ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Removing...
                    </>
                  ) : (
                    `Remove ${stats.resumes_to_remove} Duplicates`
                  )}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Error</Alert.Heading>
              {error}
            </Alert>
          )}

          {lastAction && (
            <Alert variant="success" className="mb-4">
              <Alert.Heading>Success</Alert.Heading>
              {lastAction}
            </Alert>
          )}

          {stats && (
            <Row className="mb-4">
              <Col>
                <DuplicateStats stats={stats} />
              </Col>
            </Row>
          )}

          {duplicateGroups.length > 0 ? (
            <Row>
              <Col>
                <DuplicateGroupList groups={duplicateGroups} />
              </Col>
            </Row>
          ) : (
            <Card>
              <Card.Body className="text-center">
                <h5>No Duplicates Found</h5>
                <p className="text-muted">
                  Great! No duplicate resumes were found in your database.
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DuplicateDetectionPage;
