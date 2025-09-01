import React, { useState } from 'react';
import { Badge, Alert, Button, Collapse } from 'react-bootstrap';
import { ENV } from '../../config/environment';

const EnvironmentStatus: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const envInfo = ENV.getInfo();

  const testBackendConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${ENV.getBackendUrl()}/api/`);
      if (response.ok) {
        setTestResult('✅ Backend connection successful!');
      } else {
        setTestResult(`❌ Backend connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setTestResult(`❌ Backend connection error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Only show in development mode
  if (!ENV.isDevelopment()) {
    return null;
  }

  return (
    <Alert variant="info" className="mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>🔧 Development Mode</strong>
          <Badge 
            bg={envInfo.isDevelopment ? 'success' : 'warning'} 
            className="ms-2"
          >
            {envInfo.isDevelopment ? 'DEV' : 'PROD'}
          </Badge>
        </div>
        <Button
          variant="outline-info"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      <Collapse in={showDetails}>
        <div className="mt-3">
          <div className="row">
            <div className="col-md-6">
              <strong>Backend Connection:</strong>
              <div className="mt-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={testBackendConnection}
                  disabled={testing}
                  className="me-2"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                {testResult && (
                  <small className="d-block mt-1">{testResult}</small>
                )}
              </div>
              <div className="mt-2">
                <strong>API Base URL:</strong> {envInfo.apiBaseUrl || '(relative)'}
              </div>
              <div className="mt-1">
                <strong>Backend URL:</strong> {envInfo.backendUrl}
              </div>
            </div>
            <div className="col-md-6">
              <strong>Environment Info:</strong>
              <div className="mt-2">
                <small>
                  <div>Host: {envInfo.hostname}:{envInfo.port}</div>
                  <div>Protocol: {envInfo.protocol}</div>
                  <div>Full URL: {envInfo.href}</div>
                </small>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <small className="text-muted">
              💡 This component automatically detects your environment and connects to the appropriate backend.
              No manual configuration needed!
            </small>
          </div>
        </div>
      </Collapse>
    </Alert>
  );
};

export default EnvironmentStatus;
