import React from 'react';
import { Card, Switch, Button, Space, Typography, Badge, Divider } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, ClockCircleOutlined, ExperimentOutlined, SettingOutlined } from '@ant-design/icons';
import { useRuntime } from './RuntimeContext';
import { ActionStatus } from './ExecutionContext';

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
  const { 
    isRuntimeMode, 
    setRuntimeMode, 
    executionContext
  } = useRuntime();
  
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
        <div className="runtime-mode-toggle">
          <RuntimeModeToggle 
            isRuntimeMode={isRuntimeMode} 
            setRuntimeMode={setRuntimeMode} 
          />
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div className="runtime-actions">
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
              disabled={!isRuntimeMode}
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
 * Props for the RuntimeModeToggle component
 */
interface RuntimeModeToggleProps {
  isRuntimeMode: boolean;
  setRuntimeMode: (isRuntime: boolean) => void;
}

/**
 * Toggle for switching between config and runtime modes
 */
export const RuntimeModeToggle: React.FC<RuntimeModeToggleProps> = ({ 
  isRuntimeMode, 
  setRuntimeMode 
}) => {
  return (
    <div className="runtime-mode-toggle-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Space>
        <Text strong>Mode:</Text>
        <Text>{isRuntimeMode ? 'Runtime' : 'Configuration'}</Text>
      </Space>
      
      <Switch
        checked={isRuntimeMode}
        onChange={setRuntimeMode}
        checkedChildren={<PlayCircleOutlined />}
        unCheckedChildren={<SettingOutlined />}
      />
    </div>
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