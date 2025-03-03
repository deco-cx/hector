import React from 'react';
import { Typography, Space, Tag, Tooltip, Divider } from 'antd';
import { FileTextOutlined, CodeOutlined, FileImageOutlined, SoundOutlined } from '@ant-design/icons';
import { ActionData, ActionType } from '../../../config/actionsConfig';

const { Text } = Typography;

// Map action types to their respective icons
const actionIcons: Record<ActionType, React.ReactNode> = {
  generateText: <FileTextOutlined />,
  generateJSON: <CodeOutlined />,
  generateImage: <FileImageOutlined />,
  generateAudio: <SoundOutlined />
};

// Map action types to colors for tags
const actionColors: Record<ActionType, string> = {
  generateText: 'blue',
  generateJSON: 'purple',
  generateImage: 'green',
  generateAudio: 'orange'
};

interface AvailableVariablesProps {
  inputs: Array<{
    name: string;
    label: string;
    type: string;
  }>;
  actions: ActionData[];
  currentActionIndex: number;
  onVariableClick: (variable: string) => void;
}

const AvailableVariables: React.FC<AvailableVariablesProps> = ({
  inputs,
  actions,
  currentActionIndex,
  onVariableClick
}) => {
  // Only display actions that come before the current one
  const availableActions = actions.slice(0, currentActionIndex);

  return (
    <div className="available-variables">
      <Text strong>Available Variables:</Text>
      <Divider style={{ margin: '8px 0' }} />
      
      {/* Display input fields */}
      {inputs && inputs.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ marginBottom: 4, display: 'block' }}>
            Input Fields:
          </Text>
          <Space wrap>
            {inputs.map((input) => (
              <Tooltip key={input.name} title={`Reference: @${input.name}`}>
                <Tag 
                  color="cyan" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onVariableClick(`@${input.name}`)}
                >
                  @{input.name} ({input.label})
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </div>
      ) : (
        <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
          No input fields available.
        </Text>
      )}
      
      {/* Display previous actions */}
      {availableActions.length > 0 ? (
        <div>
          <Text type="secondary" style={{ marginBottom: 4, display: 'block' }}>
            Previous Actions:
          </Text>
          <Space wrap>
            {availableActions.map((action) => (
              <Tooltip key={action.id} title={`Reference: @${action.filename}`}>
                <Tag 
                  color={actionColors[action.type]} 
                  icon={actionIcons[action.type]}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onVariableClick(`@${action.filename}`)}
                >
                  @{action.filename} ({action.title})
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </div>
      ) : (
        <Text type="secondary">
          No previous actions available.
        </Text>
      )}
    </div>
  );
};

export default AvailableVariables; 