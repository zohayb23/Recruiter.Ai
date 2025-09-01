import React, { useState } from 'react';
import { Badge, Alert, Button, Collapse } from 'react-bootstrap';
import { ENV } from '../../config/environment';

const EnvironmentStatus: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const envInfo = ENV.getInfo();
  const backendUrl = ENV.getBackendUrl();

  const testBackendConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection...');
    
    try {
      const response = await fetch(`${backendUrl}/api/health`);
      if (response.ok) {
        setConnectionStatus('success');
        setConnectionMessage('✅ Backend connection successful!');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(`❌ Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <Badge bg="primary" className="me-2">DEV</Badge>
          <strong>Development Mode</strong>
          <span className="ms-2 text-muted">
            {envInfo.isDevelopment ? 'Connected to Cloud Backend' : 'Connected to Local Backend'}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline-info"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      <Collapse in={isExpanded}>
        <div className="mt-3">
          <div className="row">
            <div className="col-md-6">
              <strong>Environment Info:</strong>
              <ul className="list-unstyled mt-2">
                <li><strong>Host:</strong> {envInfo.hostname}:{envInfo.port}</li>
                <li><strong>Protocol:</strong> {envInfo.protocol}</li>
                <li><strong>Mode:</strong> {envInfo.isDevelopment ? 'Development' : 'Production'}</li>
              </ul>
            </div>
            <div className="col-md-6">
              <strong>Backend Connection:</strong>
              <ul className="list-unstyled mt-2">
                <li><strong>API Base:</strong> {envInfo.apiBaseUrl || 'Relative (Netlify Proxy)'}</li>
                <li><strong>Backend URL:</strong> {envInfo.backendUrl}</li>
                <li>
                  <Button
                    size="sm"
                    variant={connectionStatus === 'testing' ? 'warning' : 
                            connectionStatus === 'success' ? 'success' : 
                            connectionStatus === 'error' ? 'danger' : 'outline-secondary'}
                    onClick={testBackendConnection}
                    disabled={connectionStatus === 'testing'}
                    className="mt-1"
                  >
                    {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          
          {connectionMessage && (
            <Alert variant={connectionStatus === 'success' ? 'success' : 
                          connectionStatus === 'error' ? 'danger' : 'info'} 
                   className="mt-2 mb-0">
              {connectionMessage}
            </Alert>
          )}
          
          <div className="mt-3">
            <small className="text-muted">
              💡 <strong>Development Mode:</strong> Your frontend is connected to the cloud backend at {backendUrl}. 
              This ensures you always have the latest data while developing locally.
            </small>
          </div>
        </div>
      </Collapse>
    </Alert>
  );
};

export default EnvironmentStatus;
