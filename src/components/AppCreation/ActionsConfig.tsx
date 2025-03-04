import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Tooltip, Modal, Input, Radio, Form, Tabs, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, EditOutlined, EyeOutlined, BulbOutlined, RobotOutlined, PlayCircleOutlined } from '@ant-design/icons';
import FormRenderer from '../../components/FormRenderer';
import { DEFAULT_LANGUAGE, Localizable, ActionType, ActionData, InputField } from '../../types/types';
// import { useConfig } from '../../context/ConfigContext'; // Temporarily commented out
import { useRuntime } from '../../components/Runtime';
import { PlayActionButton } from '../../components/Runtime';
import { ResultVisualization } from '../../components/Runtime';
import { JSONSchema7 } from 'json-schema';

const { Text } = Typography;
const { TabPane } = Tabs;

// Action type definitions with icons and descriptions
const actionTypes: {
  [key in ActionType]: {
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
  };
} = {
  generateText: {
    icon: <EditOutlined />,
    label: 'Generate Text',
    description: 'Create text content using AI models',
    color: '#1890ff',
  },
  generateJSON: {
    icon: <InfoCircleOutlined />,
    label: 'Generate JSON',
    description: 'Create structured JSON data',
    color: '#722ed1',
  },
  generateImage: {
    icon: <EyeOutlined />,
    label: 'Generate Image',
    description: 'Create image content using DALL-E or Stable Diffusion',
    color: '#13c2c2',
  },
  generateAudio: {
    icon: <RobotOutlined />,
    label: 'Generate Audio',
    description: 'Create audio content from text',
    color: '#fa8c16',
  },
  generateVideo: {
    icon: <PlayCircleOutlined />,
    label: 'Generate Video',
    description: 'Create video content',
    color: '#eb2f96',
  }
};

interface ActionsConfigProps {
  formData: {
    inputs: Array<InputField>;
    actions: Array<ActionData>;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

// ActionsConfig component - provides UI for managing actions
export function ActionsConfig({ formData, setFormData }: ActionsConfigProps) {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  // const { config } = useConfig(); // Temporarily commented out
  const { executionContext, sdk } = useRuntime();

  // Update actions in form data
  const updateActions = (actions: ActionData[]) => {
    setFormData({ ...formData, actions });
  };

  // Handle card flip
  const handleCardFlip = (index: number) => {
    if (flippedCards.includes(index)) {
      setFlippedCards(flippedCards.filter((i) => i !== index));
    } else {
      setFlippedCards([...flippedCards, index]);
    }
  };

  // Handle adding a new action
  const handleAddAction = (type: ActionType) => {
    const newAction: ActionData = {
      id: `action_${Date.now()}`,
      type,
      title: { [DEFAULT_LANGUAGE]: "" },
      filename: "",
      prompt: { [DEFAULT_LANGUAGE]: "" },
      config: {},
    };

    updateActions([...formData.actions, newAction]);
  };

  // Handle deleting an action
  const handleDeleteAction = (index: number) => {
    const newActions = [...formData.actions];
    newActions.splice(index, 1);
    updateActions(newActions);
  };

  // Handle updating an action field
  const handleActionChange = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      [field]: value,
    };
    updateActions(newActions);
  };

  // Available variables that can be referenced in prompts
  const getAvailableVariables = () => {
    // Inputs are always available
    const variables = formData.inputs.map((input) => ({
      name: input.filename,
      type: 'input',
      title: input.title[DEFAULT_LANGUAGE] || '',
    }));

    // Add actions up to the current one
    formData.actions.forEach((action, index) => {
      if (selectedActionIndex !== null && index >= selectedActionIndex) {
        return;
      }
      // Only add actions that produce output
      if (action.id) {
        variables.push({
          name: action.id,
          type: action.type,
          title: `Action ${index + 1} Output`,
        });
      }
    });

    return variables;
  };

  // Handle generate prompt AI helper
  const handleGeneratePrompt = (index: number) => {
    if (index !== null) {
      setDescriptionInput('');
      setSelectedActionIndex(index);
      setIsModalVisible(true);
    }
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedActionIndex(null);
  };

  // Handle submit for AI generation
  const handleModalSubmit = async () => {
    if (selectedActionIndex === null || !descriptionInput) return;

    try {
      // Call AI to generate a prompt based on the description
      const action = formData.actions[selectedActionIndex];
      const variables = getAvailableVariables();
      
      // Create a system message that guides the AI
      const systemMessage = `
        You are a helpful assistant for creating AI prompts. 
        Your task is to create a prompt for ${actionTypes[action.type].label}.
        
        Available variables:
        ${variables.map(v => `- ${v.name} (${v.type}): ${v.title}`).join('\n')}
        
        Reference variables using @variable_name syntax.
        Create a concise, effective prompt based on the user's description.
      `;
      
      // Generate the prompt using AI
      const result = await sdk.ai.generateText({
        system: systemMessage,
        prompt: descriptionInput,
        temperature: 0.7
      });
      
      // Update the action with the generated prompt
      handlePromptChange(selectedActionIndex, result.text);
      
      // Close the modal
      setIsModalVisible(false);
      setSelectedActionIndex(null);
      
    } catch (error) {
      console.error('Error generating prompt:', error);
      // TODO: Show error message to user
    }
  };

  // Handle prompt text change
  const handlePromptChange = (index: number, value: string | Localizable<string>) => {
    const newActions = [...formData.actions];
    
    // If it's a string, create a localized object
    if (typeof value === 'string') {
      const localizedValue: Localizable<string> = {};
      localizedValue[DEFAULT_LANGUAGE] = value;
      newActions[index].prompt = localizedValue;
    } else {
      newActions[index].prompt = value;
    }
    
    updateActions(newActions);
  };

  // Handle configuration form changes
  const handleConfigFormChange = (index: number, formData: Record<string, any>) => {
    handleActionChange(index, 'config', formData);
  };

  // Custom field template for schema generation
  const CustomFieldTemplate = (props: any) => {
    // Check if this is the schema field for JSON generation
    const isSchemaField = 
      props.id && 
      props.id.endsWith('schema') && 
      selectedActionIndex !== null && 
      formData.actions[selectedActionIndex]?.type === 'generateJSON';
    
    // Handle opening the AI modal for schema generation
    const handleOpenAIModal = () => {
      if (selectedActionIndex !== null) {
        Modal.confirm({
          title: 'Generate Schema with AI',
          content: (
            <div>
              <p>Describe the data structure you want to create:</p>
              <Input.TextArea 
                rows={4} 
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="E.g., Create a schema for a product catalog with name, price, and category fields"
              />
            </div>
          ),
          onOk: handleModalSubmit,
          onCancel: handleModalCancel,
          okText: 'Generate',
          cancelText: 'Cancel',
        });
      }
    };
    
    return (
      <div className={props.classNames}>
        <div className="field-label">
          {props.label}
          {props.description && (
            <Tooltip title={props.description}>
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          )}
        </div>
        
        {isSchemaField && (
          <Button 
            type="default" 
            style={{ marginBottom: 8 }} 
            icon={<RobotOutlined />}
            onClick={handleOpenAIModal}
          >
            Use AI
          </Button>
        )}
        
        {props.children}
        
        {props.errors && props.errors.length > 0 && (
          <div className="field-error">
            {props.errors.map((error: string, index: number) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render action cards
  const renderActionCards = () => {
    if (!formData.actions || formData.actions.length === 0) {
      return <Empty description="No actions added yet" />;
    }

    return formData.actions.map((action, index) => {
      const isFlipped = flippedCards.includes(index);
      const actionType = actionTypes[action.type];
      const hasExecutionResult = executionContext.hasValue(action.id);
      
      // Get the localized prompt
      const prompt = typeof action.prompt === 'object' 
        ? action.prompt[DEFAULT_LANGUAGE] || Object.values(action.prompt)[0] || ''
        : action.prompt || '';
      
      return (
        <Card
          key={index}
          className={`action-card ${isFlipped ? 'flipped' : ''}`}
          style={{ marginBottom: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: actionType.color, marginRight: 8 }}>{actionType.icon}</span>
                <span>{actionType.label}</span>
              </div>
              <Space>
                {executionContext.hasValue(action.id) && (
                  <PlayActionButton action={action} />
                )}
                <Button
                  type="text"
                  icon={isFlipped ? <EyeOutlined /> : <EditOutlined />}
                  onClick={() => handleCardFlip(index)}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteAction(index)}
                />
              </Space>
            </div>
          }
        >
          <div className="card-content">
            {isFlipped ? (
              // Edit mode
              <div className="card-edit-mode">
                <Form layout="vertical">
                  <Form.Item label="Prompt">
                    <Input.TextArea
                      value={prompt}
                      onChange={(e) => handlePromptChange(index, e.target.value)}
                      rows={4}
                      placeholder="Enter prompt..."
                    />
                    <Button
                      type="link"
                      icon={<BulbOutlined />}
                      onClick={() => handleGeneratePrompt(index)}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      Get AI help with this prompt
                    </Button>
                  </Form.Item>
                  {/* Action type specific configuration */}
                  {action.type && (
                    <div className="action-specific-config">
                      <FormRenderer
                        schema={getSchemaForActionType(action.type)}
                        formData={action.config || {}}
                        onChange={(formData: Record<string, any>) => handleConfigFormChange(index, formData)}
                        customTemplates={{ FieldTemplate: CustomFieldTemplate }}
                      />
                    </div>
                  )}
                </Form>
              </div>
            ) : (
              // View mode
              <div className="card-view-mode">
                {hasExecutionResult ? (
                  // Show execution result
                  <ResultVisualization 
                    result={executionContext.getValue(action.id)} 
                    actionName={action.id} 
                  />
                ) : (
                  // Show action summary
                  <>
                    <div className="prompt-preview">
                      <Text strong>Prompt:</Text>
                      <Text ellipsis={{ tooltip: prompt }}>
                        {prompt || <Text type="secondary">No prompt defined</Text>}
                      </Text>
                    </div>
                    {action.config && (
                      <div className="config-preview">
                        <Text strong>Configuration:</Text>
                        <ul>
                          {Object.entries(action.config).map(([key, value]) => (
                            <li key={key}>
                              <Text>{key}: </Text>
                              <Text code>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      );
    });
  };

  // Get schema for action type
  function getSchemaForActionType(type: ActionType): JSONSchema7 {
    switch (type) {
      case 'generateText':
        return {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              title: 'Model',
              enum: ['Best', 'Fast', 'anthropic:claude-3-7-sonnet-latest', 'openai:gpt-4'],
              default: 'Best',
            },
            temperature: {
              type: 'number',
              title: 'Temperature',
              minimum: 0,
              maximum: 1,
              default: 0.7,
            },
            maxTokens: {
              type: 'number',
              title: 'Max Tokens',
              minimum: 100,
              maximum: 4000,
              default: 1000,
            },
          },
        } as JSONSchema7;
      case 'generateJSON':
        return {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              title: 'Model',
              enum: ['Best', 'Fast', 'anthropic:claude-3-7-sonnet-latest', 'openai:gpt-4'],
              default: 'Best',
            },
            temperature: {
              type: 'number',
              title: 'Temperature',
              minimum: 0,
              maximum: 1,
              default: 0.7,
            },
            schema: {
              type: 'string',
              title: 'JSON Schema',
              format: 'textarea',
            },
          },
        } as JSONSchema7;
      case 'generateImage':
        return {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              title: 'Model',
              enum: ['SDXL', 'Stable Diffusion 3', 'DALL-E 3'],
              default: 'SDXL',
            },
            size: {
              type: 'string',
              title: 'Size',
              enum: ['1024x1024', '512x512', '256x256'],
              default: '1024x1024',
            },
            n: {
              type: 'integer',
              title: 'Number of Images',
              minimum: 1,
              maximum: 4,
              default: 1,
            },
          },
        } as JSONSchema7;
      case 'generateAudio':
        return {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              title: 'Model',
              enum: ['elevenlabs', 'openai:tts'],
              default: 'elevenlabs',
            },
            voice: {
              type: 'string',
              title: 'Voice',
              enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
              default: 'alloy',
            },
          },
        } as JSONSchema7;
      case 'generateVideo':
        return {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              title: 'Model',
              enum: ['Best', 'Fast', 'anthropic:claude-3-7-sonnet-latest', 'openai:gpt-4'],
              default: 'Best',
            },
            temperature: {
              type: 'number',
              title: 'Temperature',
              minimum: 0,
              maximum: 1,
              default: 0.7,
            },
            schema: {
              type: 'string',
              title: 'JSON Schema',
              format: 'textarea',
            },
          },
        } as JSONSchema7;
      default:
        return {
          type: 'object',
          properties: {},
        } as JSONSchema7;
    }
  }

  return (
    <div className="actions-config">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Actions" key="1">
          <div className="actions-list">{renderActionCards()}</div>
          
          <div className="add-action-section">
            <Text strong style={{ marginBottom: 8, display: 'block' }}>
              Add Action
            </Text>
            <Space wrap>
              {Object.entries(actionTypes).map(([type, info]) => (
                <Card
                  key={type}
                  className="add-action-card"
                  hoverable
                  style={{ width: 200, textAlign: 'center', borderColor: info.color }}
                  onClick={() => handleAddAction(type as ActionType)}
                >
                  <div style={{ color: info.color, fontSize: 24, marginBottom: 8 }}>{info.icon}</div>
                  <div style={{ fontWeight: 'bold' }}>{info.label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{info.description}</div>
                </Card>
              ))}
            </Space>
          </div>
        </TabPane>
      </Tabs>
      
      <Modal
        title="Generate Prompt with AI"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okButtonProps={{ disabled: !descriptionInput }}
      >
        <p>Describe what you want to create, and AI will generate a prompt for you.</p>
        <p>Available variables: {getAvailableVariables().map(v => `@${v.name}`).join(', ')}</p>
        <Input.TextArea
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          placeholder="E.g., Create a story about a child's adventure using their name"
          rows={4}
        />
      </Modal>
    </div>
  );
} 