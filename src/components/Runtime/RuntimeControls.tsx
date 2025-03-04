import React from 'react';
import { Card, Button, Space, Typography, Badge, Divider } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useRuntime } from './RuntimeContext';
import { ActionStatus } from './ExecutionContext';
import { ExecutionPill } from './ExecutionPill';

const { Text, Title } = Typography;

/**
 * Props for the RuntimeControls component
 */
interface RuntimeControlsProps {
  title?: string;
}

/**
 * Controls for the runtime environment
 */
export const RuntimeControls: React.FC<RuntimeControlsProps> = ({ 
  title = 'Runtime Controls' 
}) => {
  const { executionContext } = useRuntime();
  
  // Reset the execution context
  const handleReset = () => {
    // Confirm reset with the user
    if (window.confirm('This will reset all test input values and execution results. Continue?')) {
      // Reset each value individually to trigger proper updates
      const values = executionContext.getValues();
      Object.keys(values).forEach(key => {
        executionContext.setValue(key, undefined);
      });
    }
  };
  
  // Get runtime stats
  const getRuntimeStats = () => {
    // Get all action statuses
    const allStatuses = Object.values(executionContext.getAllExecutionMeta());
    
    // Count executed, error, and success actions
    const executed = allStatuses.filter(meta => meta.executedAt).length;
    const errors = allStatuses.filter(meta => meta.status === 'error').length;
    
    return { executed, errors };
  };
  
  const { executed, errors } = getRuntimeStats();
  
  return (
    <Card
      title={
        <Space>
          <ExperimentOutlined />
          <Text strong>{title}</Text>
        </Space>
      }
      size="small"
      className="runtime-controls-card"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div className="execution-history">
          <ExecutionPill />
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="runtime-actions">
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
            >
              Reset All
            </Button>
          </Space>
        </div>
        
        <div className="runtime-stats">
          <RuntimeInfoDisplay 
            executed={executed} 
            errors={errors} 
          />
        </div>
      </Space>
    </Card>
  );
};

/**
 * Props for the RuntimeInfoDisplay component
 */
interface RuntimeInfoDisplayProps {
  executed: number;
  errors: number;
}

/**
 * Display for runtime information
 */
export const RuntimeInfoDisplay: React.FC<RuntimeInfoDisplayProps> = ({ 
  executed, 
  errors 
}) => {
  return (
    <div className="runtime-info-display" style={{ marginTop: '8px' }}>
      <Space size="large">
        <Badge count={executed} showZero color="#1890ff" overflowCount={999}>
          <div style={{ minWidth: '80px' }}>
            <Text type="secondary">
              <ClockCircleOutlined /> Executed
            </Text>
          </div>
        </Badge>
        
        <Badge count={errors} showZero color="#ff4d4f" overflowCount={999}>
          <div style={{ minWidth: '80px' }}>
            <Text type="secondary">
              <ClockCircleOutlined /> Failed
            </Text>
          </div>
        </Badge>
      </Space>
    </div>
  );
}; 