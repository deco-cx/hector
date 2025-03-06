import React from 'react';
import { Typography, Space, Tag, Tooltip, Divider } from 'antd';
import { FileTextOutlined, CodeOutlined, FileImageOutlined, SoundOutlined, PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons';
import { ActionData, ActionType, InputField, DEFAULT_LANGUAGE, getLocalizedValue, Localizable } from '../../../types/types';

const { Text } = Typography;

// Map action types to their respective icons
const actionIcons: Record<ActionType, React.ReactNode> = {
  generateText: <FileTextOutlined />,
  generateJSON: <CodeOutlined />,
  generateImage: <FileImageOutlined />,
  generateAudio: <SoundOutlined />,
  generateVideo: <PlayCircleOutlined />,
  generateWithLora: <ExperimentOutlined />,
  readFile: null,
  writeFile: null
};

// Map action types to colors for tags
const actionColors: Record<ActionType, string> = {
  generateText: 'blue',
  generateJSON: 'purple',
  generateImage: 'green',
  generateAudio: 'orange',
  generateVideo: 'magenta',
  generateWithLora: 'cyan',
  readFile: 'default',
  writeFile: 'default'
};

interface AvailableVariablesProps {
  inputs: Array<InputField>;
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
            {inputs.map((input) => {
              // Get localized title value
              const titleValue = getLocalizedValue(input.title, DEFAULT_LANGUAGE) || '';
              
              return (
                <Tooltip key={input.filename} title={`Reference: @${input.filename.replace('.md', '')}`}>
                  <Tag 
                    color="cyan" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => onVariableClick(`@${input.filename.replace('.md', '')}`)}
                  >
                    @{input.filename.replace('.md', '')} ({titleValue})
                  </Tag>
                </Tooltip>
              );
            })}
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
                  @{action.filename} ({getLocalizedValue(action.title, DEFAULT_LANGUAGE)})
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