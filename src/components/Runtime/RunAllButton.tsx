import React, { useState } from 'react';
import { Button, Tooltip, Space, Typography, Modal, Progress, List } from 'antd';
import { 
  PlayCircleOutlined, 
  LoadingOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { ActionData } from '../../types/types';
import { useRuntime } from './RuntimeContext';
import { executeAction } from './actionExecutor';

const { Text, Title } = Typography;

/**
 * Props for the RunAllButton component
 */
interface RunAllButtonProps {
  onComplete?: () => void;
}

/**
 * RunAllButton component manages the execution of all playable actions
 */
export const RunAllButton: React.FC<RunAllButtonProps> = ({ onComplete }) => {
  const { executionContext, actions, sdk } = useRuntime();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(-1);
  const [results, setResults] = useState<{[key: string]: { success: boolean; error?: string }}>({});
  
  // Get playable actions
  const playableActions = executionContext.getPlayableActions(actions);
  
  // Function to execute all playable actions
  const executeAll = async () => {
    if (playableActions.length === 0) return;
    
    // Reset state
    setLoading(true);
    setModalVisible(true);
    setCurrentActionIndex(-1);
    setResults({});
    
    // Execute each action in sequence
    for (let i = 0; i < playableActions.length; i++) {
      const action = playableActions[i];
      setCurrentActionIndex(i);
      
      try {
        // Update execution metadata
        executionContext.updateExecutionMeta(action.id, {
          status: 'executing',
          executedAt: new Date()
        });
        
        // Execute the action
        const result = await executeAction(action, executionContext, sdk);
        
        // Store the result
        executionContext.setValue(action.filename, result.result);
        
        // Update execution metadata
        executionContext.updateExecutionMeta(action.id, {
          status: 'completed',
          executedAt: new Date(),
          error: undefined,
          duration: result.duration
        });
        
        // Update local results
        setResults(prev => ({
          ...prev,
          [action.id]: { success: true }
        }));
      } catch (error) {
        console.error(`Error executing action ${action.id}:`, error);
        
        // Mark the action as failed
        const errorMessage = error instanceof Error 
          ? error 
          : new Error(typeof error === 'string' ? error : 'Unknown error');
        
        executionContext.markActionFailed(action.id, errorMessage);
        
        // Update local results
        setResults(prev => ({
          ...prev,
          [action.id]: { 
            success: false, 
            error: errorMessage.message
          }
        }));
      }
    }
    
    setLoading(false);
    
    // Call the completion callback
    if (onComplete) {
      onComplete();
    }
  };
  
  // Calculate progress percentage
  const progressPercent = currentActionIndex >= 0 
    ? Math.round((currentActionIndex / playableActions.length) * 100)
    : 0;
  
  return (
    <>
      <Tooltip title={`Run ${playableActions.length} available actions in sequence`}>
        <Button 
          type="primary" 
          icon={loading ? <LoadingOutlined /> : <PlayCircleOutlined />} 
          onClick={executeAll}
          disabled={playableActions.length === 0 || loading}
          loading={loading}
        >
          Run All ({playableActions.length})
        </Button>
      </Tooltip>
      
      <Modal
        title="Executing Actions"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={5}>Progress</Title>
            <Progress 
              percent={progressPercent} 
              status={loading ? 'active' : 'normal'} 
              format={() => `${currentActionIndex + 1}/${playableActions.length}`}
            />
          </div>
          
          <div>
            <Title level={5}>Action Results</Title>
            <List
              bordered
              dataSource={playableActions}
              renderItem={(action, index) => {
                let icon = <PauseCircleOutlined style={{ color: '#d9d9d9' }} />;
                let status = <Text type="secondary">Pending</Text>;
                
                if (index < currentActionIndex || (index === currentActionIndex && !loading)) {
                  if (results[action.id]?.success) {
                    icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
                    status = <Text type="success">Completed</Text>;
                  } else {
                    icon = <CloseCircleOutlined style={{ color: '#f5222d' }} />;
                    status = (
                      <Tooltip title={results[action.id]?.error}>
                        <Text type="danger">Failed</Text>
                      </Tooltip>
                    );
                  }
                } else if (index === currentActionIndex) {
                  icon = <LoadingOutlined style={{ color: '#1890ff' }} />;
                  status = <Text type="warning">Executing...</Text>;
                }
                
                return (
                  <List.Item
                    style={{ 
                      backgroundColor: index === currentActionIndex ? '#f0f8ff' : 'transparent',
                      padding: '8px 16px'
                    }}
                  >
                    <Space>
                      {icon}
                      <div>
                        <div>
                          <Text strong>{action.title 
                            ? (typeof action.title === 'object' 
                              ? Object.values(action.title)[0] 
                              : action.title)
                            : action.id}
                          </Text>
                        </div>
                        <Space size="small">
                          <Text type="secondary">Output: {action.filename}</Text>
                          {status}
                        </Space>
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}; 