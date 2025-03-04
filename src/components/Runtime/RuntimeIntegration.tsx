import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tabs, Typography, Space, Empty } from 'antd';
import { AppstoreOutlined, PlayCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRuntime } from './RuntimeContext';
import { RuntimeControls } from './RuntimeControls';
import { PlayActionButton } from './PlayActionButton';
import { InputTest } from './InputTest';
import { ResultVisualization } from './ResultVisualization';
import { ActionData, InputField, DEFAULT_LANGUAGE } from '../../types/types';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

/**
 * Props for the EnhancedActionCard component
 */
interface EnhancedActionCardProps {
  action: ActionData;
  active?: boolean;
}

/**
 * EnhancedActionCard component with runtime capabilities
 */
export const EnhancedActionCard: React.FC<EnhancedActionCardProps> = ({ 
  action, 
  active 
}) => {
  const { executionContext } = useRuntime();
  const [showResult, setShowResult] = useState(false);
  
  // Get action status
  const status = executionContext.getActionStatus(action.id);
  
  // Get result if available
  const result = executionContext.getValue(action.id);
  const hasResult = status.executed && result !== undefined;
  
  // Handle result toggle
  const toggleResult = () => {
    setShowResult(!showResult);
  };
  
  return (
    <div className="action-card-wrapper">
      <div className="action-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="action-card-title">
          <Text strong>{action.title ? action.title[DEFAULT_LANGUAGE] : `Action ${action.id}`}</Text>
        </div>
        
        <div className="action-card-controls">
          <PlayActionButton action={action} />
        </div>
      </div>
      
      {hasResult && (
        <div className="action-card-result" style={{ marginTop: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <ResultVisualization 
                result={result} 
                actionName={action.title ? action.title[DEFAULT_LANGUAGE] : action.id} 
                title="Result" 
              />
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

/**
 * Props for the InputTestPanel component
 */
interface InputTestPanelProps {
  inputs: InputField[];
}

/**
 * InputTestPanel component for testing inputs
 */
export const InputTestPanel: React.FC<InputTestPanelProps> = ({ inputs }) => {
  if (!inputs || inputs.length === 0) {
    return (
      <Empty description="No inputs available for testing" />
    );
  }
  
  return (
    <Row gutter={[16, 16]}>
      {inputs.map(input => (
        <Col key={input.filename} xs={24} sm={12} lg={8} xl={6}>
          <InputTest input={input} />
        </Col>
      ))}
    </Row>
  );
};

/**
 * Props for the RuntimePanel component
 */
interface RuntimePanelProps {
  inputs: InputField[];
  actions: ActionData[];
}

/**
 * RuntimePanel component for displaying runtime information and controls
 */
export const RuntimePanel: React.FC<RuntimePanelProps> = ({ 
  inputs, 
  actions 
}) => {
  const [activeTab, setActiveTab] = useState<string>('inputs');
  
  return (
    <Card className="runtime-panel" style={{ marginBottom: '20px' }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: '20px' }}
      >
        <TabPane 
          tab={
            <Space>
              <AppstoreOutlined />
              <span>Inputs</span>
            </Space>
          } 
          key="inputs"
        >
          <InputTestPanel inputs={inputs} />
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <PlayCircleOutlined />
              <span>Actions</span>
            </Space>
          } 
          key="actions"
        >
          <Row gutter={[16, 16]}>
            {actions.map(action => (
              <Col key={action.id} xs={24} sm={12} lg={8}>
                <Card size="small" title={action.title ? action.title[DEFAULT_LANGUAGE] : `Action ${action.id}`}>
                  <EnhancedActionCard action={action} />
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <InfoCircleOutlined />
              <span>Info</span>
            </Space>
          } 
          key="info"
        >
          <div className="runtime-info">
            <Title level={4}>Runtime Information</Title>
            <p>
              This panel shows information about the current runtime environment, 
              including execution statistics and dependencies.
            </p>
            
            {/* Additional runtime info can be added here */}
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

/**
 * RuntimeSidebar component for displaying runtime controls
 */
export const RuntimeSidebar: React.FC = () => {
  return (
    <div className="runtime-sidebar">
      <RuntimeControls />
    </div>
  );
}; 