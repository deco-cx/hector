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
  size?: 'small' | 'middle' | 'large';
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
 * Play button for executing actions with status indicators and result visualization
 */
export const PlayActionButton: React.FC<PlayActionButtonProps> = ({ 
  action, 
  size = 'middle' 
}) => {
  const { executionContext, sdk } = useRuntime();
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Get action status from execution context
  const status = executionContext.getActionStatus(action.id);
  
  // Define play button style variants based on action status
  const getButtonProps = () => {
    // Default props
    const props: any = {
      type: 'primary',
      shape: 'circle',
      icon: <PlayCircleOutlined />,
      size,
      disabled: !status.playable || loading
    };
    
    // If action is currently executing
    if (loading) {
      props.icon = <LoadingOutlined />;
      props.type = 'default';
    }
    // If action is processing file
    else if (processingFile) {
      props.icon = <SyncOutlined spin />;
      props.type = 'default';
      props.style = { color: '#1890ff', borderColor: '#1890ff' };
    }
    // If action has been executed successfully
    else if (status.executed && status.status === 'success') {
      props.icon = <CheckCircleOutlined />;
      props.type = 'default';
      props.style = { color: '#52c41a', borderColor: '#52c41a' };
    }
    // If action has failed
    else if (status.executed && status.status === 'error') {
      props.icon = <CloseCircleOutlined />;
      props.type = 'default';
      props.style = { color: '#ff4d4f', borderColor: '#ff4d4f' };
      props.disabled = false; // Allow retry even when not playable
    }
    // If action has circular dependency
    else if (status.hasCircularDependency) {
      props.icon = <WarningOutlined />;
      props.type = 'default';
      props.style = { color: '#faad14', borderColor: '#faad14' };
    }
    // If action is missing dependencies
    else if (status.missingDependencies && status.missingDependencies.length > 0) {
      props.icon = <QuestionCircleOutlined />;
      props.type = 'default';
      props.style = { color: '#1890ff', borderColor: '#1890ff' };
    }
    
    return props;
  };

  // Execute the action
  const executeAction = async () => {
    setLoading(true);
    setProcessingProgress(0);
    try {
      // Execute the action
      const result = await executionContext.executeAction(action, sdk);
      
      // Check if the result contains file paths that need processing
      if (result && typeof result === 'object') {
        const hasFilePaths = checkForFilePaths(result);
        
        if (hasFilePaths) {
          // If we have file paths, show the processing state
          setLoading(false);
          setProcessingFile(true);
          
          // Simulate progress for file processing
          // In a real implementation, we would poll for file availability
          startProcessingSimulation();
        } else {
          // No files to process, just show the result
          setLoading(false);
          setShowResult(true);
        }
      } else {
        // Not a complex result, just show it
        setLoading(false);
        setShowResult(true);
      }
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
      setLoading(false);
      setProcessingFile(false);
    }
  };
  
  // Check if the result contains file paths that need processing
  const checkForFilePaths = (result: any): boolean => {
    // Check direct file paths
    if (typeof result === 'string' && isFilePath(result)) {
      return true;
    }
    
    // Check object properties
    if (typeof result === 'object') {
      // Check common file properties
      const fileProps = ['filepath', 'file', 'publicUrl', 'images', 'audios', 'videos'];
      for (const prop of fileProps) {
        if (result[prop]) {
          return true;
        }
      }
      
      // Check array items
      if (Array.isArray(result)) {
        return result.some(item => typeof item === 'string' && isFilePath(item));
      }
    }
    
    return false;
  };
  
  // Check if a string is a file path
  const isFilePath = (str: string): boolean => {
    return str.match(/\.(png|jpg|jpeg|gif|md|txt|json|mp3|mp4|wav)$/i) !== null;
  };
  
  // Start simulating the file processing progress
  const startProcessingSimulation = () => {
    let progress = 0;
    const intervalId = setInterval(() => {
      progress += 10;
      setProcessingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(intervalId);
        setProcessingFile(false);
        setShowResult(true);
      }
    }, 500); // Update every 500ms
  };
  
  // Render tooltip content based on action status
  const getTooltipContent = () => {
    if (loading) {
      return 'Executing action...';
    }
    
    if (processingFile) {
      return 'Processing file. Making it publicly accessible...';
    }
    
    if (status.hasCircularDependency) {
      return `Cannot execute: Circular dependency detected: ${status.hasCircularDependency.message}`;
    }
    
    if (status.missingDependencies && status.missingDependencies.length > 0) {
      return `Missing dependencies: ${status.missingDependencies.join(', ')}`;
    }
    
    if (status.executed) {
      if (status.status === 'success') {
        return `Successfully executed ${status.executedAt ? dayjs(status.executedAt).fromNow() : ''}`;
      } else if (status.status === 'error') {
        return `Failed execution: ${getErrorMessage(status.error)}. Click to retry.`;
      }
    }
    
    if (!status.playable) {
      return 'This action cannot be played at this time';
    }
    
    return 'Click to execute this action';
  };
  
  // Render badge for attempts if there are any
  const renderAttemptsIndicator = () => {
    if (status.attempts && status.attempts > 1) {
      return (
        <Badge 
          count={status.attempts} 
          size="small"
          offset={[-2, 2]}
          style={{ backgroundColor: status.status === 'success' ? '#52c41a' : '#ff4d4f' }}
        />
      );
    }
    return null;
  };
  
  // Render result modal
  const renderResultModal = () => {
    if (!status.executed || !showResult) return null;
    
    const result = executionContext.getValue(action.id);
    const success = status.status === 'success';
    
    return (
      <Modal
        title={
          <Space>
            {success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            <Text>{action.id} Result</Text>
          </Space>
        }
        open={showResult}
        onCancel={() => setShowResult(false)}
        footer={[
          <Button key="close" onClick={() => setShowResult(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {!success && status.error ? (
          <div className="error-message">
            <Text type="danger">{getErrorMessage(status.error)}</Text>
          </div>
        ) : (
          <ResultVisualization result={result} actionName={action.id} />
        )}
        
        <div className="execution-details" style={{ marginTop: '20px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              Executed: {status.executedAt ? dayjs(status.executedAt).format('YYYY-MM-DD HH:mm:ss') : 'Unknown'}
            </Text>
            <Text type="secondary">
              Attempts: {status.attempts || 1}
            </Text>
          </Space>
        </div>
      </Modal>
    );
  };
  
  // Render file processing modal
  const renderProcessingModal = () => {
    if (!processingFile) return null;
    
    return (
      <Modal
        title="Processing File"
        open={processingFile}
        footer={null}
        closable={false}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <SyncOutlined spin style={{ fontSize: 24, color: '#1890ff', marginBottom: '16px' }} />
          <h3>Making file publicly accessible</h3>
          <p style={{ marginBottom: '20px' }}>
            This may take a few seconds. The system is:
          </p>
          <ul style={{ textAlign: 'left', marginBottom: '20px' }}>
            <li>Setting file permissions (chmod) - ~100-200ms</li>
            <li>Waiting for the file to be available - ~500ms to several seconds</li>
            <li>Preparing proper URLs for viewing</li>
          </ul>
          <Progress percent={processingProgress} status="active" />
        </div>
      </Modal>
    );
  };
  
  // Determine if we need to show a confirmation before execution
  const buttonWithConfirmation = (
    <Tooltip title={getTooltipContent()}>
      <Badge dot={status.executed && !loading && !processingFile} offset={[-2, 2]} count={renderAttemptsIndicator()}>
        {status.missingDependencies && status.missingDependencies.length > 0 ? (
          <Popconfirm
            title="Warning: Missing Dependencies"
            description={`This action depends on inputs that haven't been provided: ${status.missingDependencies.join(', ')}. Execute anyway?`}
            onConfirm={executeAction}
            okText="Execute Anyway"
            cancelText="Cancel"
          >
            <Button {...getButtonProps()} />
          </Popconfirm>
        ) : (
          <Button 
            {...getButtonProps()} 
            onClick={executeAction}
          />
        )}
      </Badge>
    </Tooltip>
  );
  
  return (
    <>
      {buttonWithConfirmation}
      {renderResultModal()}
      {renderProcessingModal()}
    </>
  );
}; 