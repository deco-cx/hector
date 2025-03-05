import React, { useState } from 'react';
import { Button, Tooltip, Typography, Space, Alert } from 'antd';
import { 
  PlayCircleOutlined, 
  LoadingOutlined, 
  WarningOutlined, 
  LockOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { ActionData } from '../../types/types';
import { useRuntime } from './RuntimeContext';

const { Text } = Typography;

/**
 * Props for the PlayActionButton component
 */
interface PlayActionButtonProps {
  action: ActionData;
  onExecutionComplete?: (result: any) => void;
  onExecutionError?: (error: Error) => void;
}

/**
 * Button component for executing an action
 */
export const PlayActionButton: React.FC<PlayActionButtonProps> = ({
  action,
  onExecutionComplete,
  onExecutionError
}) => {
  const [localLoading, setLocalLoading] = useState(false);
  const { 
    executionContext, 
    executeAction, 
    isActionExecuting, 
    resetAction 
  } = useRuntime();
  
  // Get action status
  const actionStatus = executionContext.getActionStatus(action.id);
  const isExecuting = isActionExecuting(action.id) || localLoading;
  const hasError = actionStatus.status === 'error';
  
  const handleExecute = async () => {
    if (!actionStatus.playable || isExecuting) {
      return;
    }
    
    setLocalLoading(true);
    
    try {
      const result = await executeAction(action);
      
      if (onExecutionComplete) {
        onExecutionComplete(result);
      }
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
      
      if (onExecutionError && error instanceof Error) {
        onExecutionError(error);
      }
    } finally {
      setLocalLoading(false);
    }
  };
  
  const handleRetry = () => {
    resetAction(action.id);
    handleExecute();
  };
  
  // Determine button appearance based on state
  let buttonType: 'primary' | 'default' | 'dashed' | 'text' | 'link' = 'primary';
  let buttonIcon = <PlayCircleOutlined />;
  let buttonText = 'Run';
  let disabled = false;
  
  if (isExecuting) {
    buttonIcon = <LoadingOutlined />;
    buttonText = 'Running...';
    disabled = true;
  } else if (!actionStatus.playable) {
    buttonType = 'default';
    buttonIcon = <LockOutlined />;
    buttonText = 'Locked';
    disabled = true;
  } else if (hasError) {
    buttonType = 'primary';
    buttonIcon = <WarningOutlined />;
    buttonText = 'Retry';
    buttonType = 'dashed'; // Use dashed for retry
  } else if (actionStatus.status === 'success') {
    buttonType = 'dashed';
    buttonIcon = <RedoOutlined />;
    buttonText = 'Run Again';
  }
  
  // Tooltip content for locked actions
  const tooltipContent = !actionStatus.playable && actionStatus.missingDependencies?.length ? (
    <div>
      <Text>Missing dependencies:</Text>
      <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
        {actionStatus.missingDependencies.map(dep => (
          <li key={dep}>{dep}</li>
        ))}
      </ul>
    </div>
  ) : null;
  
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Tooltip 
        title={tooltipContent} 
        placement="top" 
        open={!actionStatus.playable && !!tooltipContent}
      >
        <Button
          type={buttonType}
          icon={buttonIcon}
          loading={isExecuting}
          disabled={disabled}
          onClick={hasError ? handleRetry : handleExecute}
          style={{ width: '100%' }}
        >
          {buttonText}
        </Button>
      </Tooltip>
      
      {actionStatus.executedAt && (
        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
          {hasError ? 'Failed at ' : 'Executed at '}
          {new Date(actionStatus.executedAt).toLocaleTimeString()}
          {(actionStatus.attempts ?? 0) > 1 ? ` (${actionStatus.attempts} attempts)` : ''}
        </Text>
      )}
      
      {hasError && actionStatus.error && (
        <Alert
          type="error"
          message="Execution Error"
          description={typeof actionStatus.error === 'string' 
            ? actionStatus.error 
            : actionStatus.error.message}
          showIcon
          action={
            <Button size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        />
      )}
      
      {/* Display circular dependency error if present */}
      {actionStatus.hasCircularDependency && (
        <Alert
          type="warning"
          message="Circular Dependency Detected"
          description={actionStatus.hasCircularDependency.message}
          showIcon
        />
      )}
    </Space>
  );
}; 