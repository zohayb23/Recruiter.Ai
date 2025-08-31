import React from 'react';
import {
  Container,
  Row,
  Col,
  Card
} from 'react-bootstrap';

const ExternalJobSearch: React.FC = () => {
  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="text-center shadow-lg border-0">
            <Card.Body className="py-5">
              <div className="mb-4">
                <i className="fas fa-search fa-4x text-primary mb-3"></i>
                <h2 className="text-primary mb-3">Coming Soon!</h2>
                <h4 className="text-muted mb-4">External Job Search</h4>
              </div>
              
              <div className="mb-4">
                <p className="lead text-muted mb-3">
                  We're working on integrating with major job platforms to bring you the best opportunities.
                </p>
                <p className="text-muted">
                  Soon you'll be able to search jobs from:
                </p>
              </div>

              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="p-3 border rounded">
                    <i className="fab fa-linkedin fa-2x text-primary mb-2"></i>
                    <h6>LinkedIn</h6>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="p-3 border rounded">
                    <i className="fas fa-monster fa-2x text-primary mb-2"></i>
                    <h6>Monster</h6>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="p-3 border rounded">
                    <i className="fas fa-search fa-2x text-primary mb-2"></i>
                    <h6>Indeed</h6>
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Stay tuned!</strong> We're actively working on API integrations to provide you with comprehensive job search capabilities.
              </div>

              <div className="mt-4">
                <small className="text-muted">
                  In the meantime, you can still create and manage your own job postings in the Jobs section.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ExternalJobSearch; 