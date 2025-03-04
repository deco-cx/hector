import React, { useState } from 'react';
import { Button, Tooltip, Popconfirm, Badge, Typography, Space, Modal, Progress } from 'antd';
import { PlayCircleOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, 
         WarningOutlined, QuestionCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { ActionData } from '../../types/types';
import { useRuntime } from './RuntimeContext';
import { ResultVisualization } from './ResultVisualization';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configure dayjs
dayjs.extend(relativeTime);

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
 * Gets error message from Error or string
 */
const getErrorMessage = (error: Error | string | undefined): string => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message || 'Error without message';
};

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
  
  // Determine button state
  let buttonText = 'Run';
  let disabled = !actionStatus.playable || isExecuting;
  let buttonClass = 'action-button';
  
  if (isExecuting) {
    buttonText = 'Running...';
    buttonClass += ' loading';
  } else if (hasError) {
    buttonText = 'Retry';
    buttonClass += ' error';
  } else if (actionStatus.status === 'success') {
    buttonText = 'Run Again';
    buttonClass += ' success';
  } else if (!actionStatus.playable) {
    buttonText = 'Locked';
    buttonClass += ' disabled';
  }
  
  return (
    <div className="play-action-button-container">
      <button
        className={buttonClass}
        disabled={disabled}
        onClick={hasError ? handleRetry : handleExecute}
      >
        {buttonText}
      </button>
      
      {actionStatus.executedAt && (
        <span className="execution-time">
          {hasError ? 'Failed at ' : 'Executed at '}
          {new Date(actionStatus.executedAt).toLocaleTimeString()}
        </span>
      )}
      
      {hasError && actionStatus.error && (
        <div className="error-message">
          {typeof actionStatus.error === 'string' 
            ? actionStatus.error 
            : actionStatus.error.message}
        </div>
      )}
      
      {!actionStatus.playable && actionStatus.missingDependencies && actionStatus.missingDependencies.length > 0 && (
        <div className="missing-dependencies">
          Missing dependencies: {actionStatus.missingDependencies.join(', ')}
        </div>
      )}
    </div>
  );
}; 