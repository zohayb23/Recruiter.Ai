import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { type DuplicateStats as DuplicateStatsType } from '../../services/api/duplicateDetection';

interface DuplicateStatsProps {
  stats: DuplicateStatsType;
}

const DuplicateStats: React.FC<DuplicateStatsProps> = ({ stats }) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Duplicate Detection Statistics</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={3}>
            <div className="text-center">
              <h3 className="text-primary">{stats.total_duplicate_names}</h3>
              <p className="text-muted mb-0">Duplicate Names</p>
              <small className="text-muted">Names with multiple resumes</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h3 className="text-warning">{stats.total_duplicate_resumes}</h3>
              <p className="text-muted mb-0">Total Duplicate Resumes</p>
              <small className="text-muted">Resumes that are duplicates</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h3 className="text-danger">{stats.resumes_to_remove}</h3>
              <p className="text-muted mb-0">Resumes to Remove</p>
              <small className="text-muted">Older duplicates to be removed</small>
            </div>
          </Col>
          <Col md={3}>
            <div className="text-center">
              <h3 className="text-success">{stats.total_duplicate_names}</h3>
              <p className="text-muted mb-0">Resumes to Keep</p>
              <small className="text-muted">Most recent of each name</small>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default DuplicateStats;
