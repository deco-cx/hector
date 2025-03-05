import React, { useState } from 'react';
import { Badge, Button, Modal, List, Typography, Space, Tag, Tooltip } from 'antd';
import { HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useHector } from '../../context/HectorContext';
import { formatDistanceToNow } from 'date-fns';

const { Text, Title } = Typography;

interface Execution {
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  actionCount: number;
}

/**
 * ExecutionPill component for showing execution history
 */
export const ExecutionPill: React.FC = () => {
  const { executionContext } = useHector();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Get last execution time from the context
  const lastExecution = executionContext?.getLastExecutionTime?.() || null;
  
  // This would be replaced with actual history data from the backend
  const executionHistory: Execution[] = [
    {
      timestamp: lastExecution || new Date().toISOString(),
      status: 'success',
      actionCount: 3
    },
    // More executions would be fetched from storage
  ];
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'partial': return 'orange';
      default: return 'blue';
    }
  };
  
  const openModal = () => {
    setModalVisible(true);
  };
  
  const closeModal = () => {
    setModalVisible(false);
  };
  
  const loadExecution = (timestamp: string) => {
    // This would load a specific execution state
    console.log('Loading execution from:', timestamp);
    closeModal();
  };
  
  return (
    <>
      <Tooltip title="View execution history">
        <Button 
          onClick={openModal}
          icon={<HistoryOutlined />}
          type="text"
          className="execution-pill"
        >
          <Space>
            <ClockCircleOutlined />
            <Text>{lastExecution ? formatTimestamp(lastExecution) : 'No executions yet'}</Text>
          </Space>
        </Button>
      </Tooltip>
      
      <Modal
        title="Execution History"
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <List
          itemLayout="horizontal"
          dataSource={executionHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  key="load" 
                  type="link" 
                  onClick={() => loadExecution(item.timestamp)}
                >
                  Load
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text>{new Date(item.timestamp).toLocaleString()}</Text>
                    <Tag color={getStatusColor(item.status)}>
                      {item.status}
                    </Tag>
                  </Space>
                }
                description={`${item.actionCount} actions executed`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}; 