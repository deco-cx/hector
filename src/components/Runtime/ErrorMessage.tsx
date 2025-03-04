import React from 'react';
import { Alert, Button, Space, Typography, Collapse } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

/**
 * Props for the ErrorMessage component
 */
export interface ErrorMessageProps {
  error: {
    message: string;
    details?: any;
  };
  onRetry?: () => void;
}

/**
 * ErrorMessage component displays error details with a retry option
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  return (
    <Alert
      type="error"
      message={
        <div>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            {error.message}
          </div>
          
          {error.details && (
            <Collapse ghost size="small">
              <Panel header="Show details" key="1">
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                    {typeof error.details === 'object' 
                      ? JSON.stringify(error.details, null, 2) 
                      : String(error.details)}
                  </pre>
                </div>
              </Panel>
            </Collapse>
          )}
          
          {onRetry && (
            <div style={{ marginTop: '8px' }}>
              <Button 
                type="primary" 
                danger 
                icon={<ReloadOutlined />} 
                onClick={onRetry}
                size="small"
              >
                Retry Action
              </Button>
            </div>
          )}
        </div>
      }
      style={{ marginBottom: '16px' }}
    />
  );
}; 