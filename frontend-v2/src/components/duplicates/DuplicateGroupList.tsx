import React, { useState } from 'react';
import { Card, Accordion, Badge, Button, Row, Col } from 'react-bootstrap';
import { type DuplicateGroup } from '../../services/api/duplicateDetection';
import ResumeComparison from './ResumeComparison';

interface DuplicateGroupListProps {
  groups: DuplicateGroup[];
}

const DuplicateGroupList: React.FC<DuplicateGroupListProps> = ({ groups }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const handleToggleGroup = (groupName: string) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getMostRecentResume = (resumes: DuplicateGroup['resumes']) => {
    return resumes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const getOlderResumes = (resumes: DuplicateGroup['resumes']) => {
    const sorted = resumes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted.slice(1);
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Duplicate Groups ({groups.length})</h5>
        <small className="text-muted">Click on a group to view and compare duplicate resumes</small>
      </Card.Header>
      <Card.Body>
        <Accordion activeKey={expandedGroup || ''}>
          {groups.map((group) => {
            const mostRecent = getMostRecentResume(group.resumes);
            const olderResumes = getOlderResumes(group.resumes);
            
            return (
              <Accordion.Item key={group.name} eventKey={group.name}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div>
                      <strong>{group.name}</strong>
                      <Badge bg="warning" className="ms-2">
                        {group.count} resumes
                      </Badge>
                    </div>
                    <div className="text-muted">
                      <small>
                        Most recent: {formatDate(mostRecent.created_at)}
                      </small>
                    </div>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="border-success">
                        <Card.Header className="bg-success text-white">
                          <h6 className="mb-0">
                            ✅ Keep (Most Recent)
                            <Badge bg="light" text="dark" className="ms-2">
                              {formatDate(mostRecent.created_at)}
                            </Badge>
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <ResumeComparison resume={mostRecent} />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="border-danger">
                        <Card.Header className="bg-danger text-white">
                          <h6 className="mb-0">
                            ❌ Remove ({olderResumes.length} older)
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          {olderResumes.map((resume, index) => (
                            <div key={resume.resume_id} className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <Badge bg="secondary">
                                  {formatDate(resume.created_at)}
                                </Badge>
                                <small className="text-muted">
                                  ID: {resume.resume_id.substring(0, 8)}...
                                </small>
                              </div>
                              <ResumeComparison resume={resume} compact />
                            </div>
                          ))}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Card.Body>
    </Card>
  );
};

export default DuplicateGroupList;
