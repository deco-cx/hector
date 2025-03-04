import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Space, Input, Select, Card, 
  Tooltip, Row, Col, Divider, Empty, Form as AntForm,
  message, Modal
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, 
  InfoCircleOutlined, FileTextOutlined, CodeOutlined,
  FileImageOutlined, SoundOutlined, PlayCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { 
  ActionType, availableActions, ActionData, 
  generateActionFilename, createDefaultLocalizable
} from '../../../config/actionsConfig';
import JsonSchemaForm from '@rjsf/antd';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import PromptTextArea from '../components/PromptTextArea';
import { useWebdraw } from '../../../context/WebdrawContext';
import AvailableVariables from '../components/AvailableVariables';
import { Localizable, DEFAULT_LANGUAGE, getLocalizedValue } from '../../../types/i18n';
import { useLanguage } from '../../../contexts/LanguageContext';

const { Title, Paragraph, Text } = Typography;

// Map action types to their respective icons
const actionIcons: Record<ActionType, React.ReactNode> = {
  generateText: <FileTextOutlined />,
  generateJSON: <CodeOutlined />,
  generateImage: <FileImageOutlined />,
  generateAudio: <SoundOutlined />,
  generateVideo: <PlayCircleOutlined />
};

interface ActionsConfigProps {
  formData: {
    inputs: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
    }>;
    actions: ActionData[];
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function ActionsConfig({ formData, setFormData }: ActionsConfigProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { service, isSDKAvailable } = useWebdraw();
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number | null>(null);
  const { editorLanguage } = useLanguage();
  
  // Direct update to parent
  const updateActions = (actions: ActionData[]) => {
    setFormData({ ...formData, actions });
  };

  const handleCardFlip = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
    }
  };

  const handleAddAction = (type: ActionType) => {
    const actionConfig = availableActions[type];
    
    const newActionData: ActionData = {
      id: uuidv4(),
      type,
      title: createDefaultLocalizable(`New ${actionConfig.label}`),
      description: createDefaultLocalizable(''),
      filename: generateActionFilename(
        getLocalizedValue(createDefaultLocalizable(`New ${actionConfig.label}`), DEFAULT_LANGUAGE) || `New ${actionConfig.label}`, 
        type, 
        formData.actions || []
      ),
      prompt: createDefaultLocalizable(''),
      config: { ...actionConfig.defaultProps }
    };
    
    const currentActions = Array.isArray(formData.actions) ? [...formData.actions] : [];
    const newActions = [...currentActions, newActionData];
    
    updateActions(newActions);
    
    // Set editing to the new action after state update
    setTimeout(() => {
      setEditingIndex(newActions.length - 1);
    }, 0);
  };

  const handleDeleteAction = (index: number) => {
    if (!Array.isArray(formData.actions)) return;
    
    const newActions = [...formData.actions];
    newActions.splice(index, 1);
    updateActions(newActions);
    
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleActionChange = (index: number, field: string, value: any) => {
    if (!Array.isArray(formData.actions)) return;
    
    const newActions = [...formData.actions];
    
    if (field === 'type') {
      // When changing action type, update with new default props
      const actionConfig = availableActions[value as ActionType];
      newActions[index] = {
        ...newActions[index],
        type: value as ActionType,
        config: { ...actionConfig.defaultProps }
      };
      
      // Also update filename extension
      const title = getLocalizedValue(newActions[index].title, DEFAULT_LANGUAGE) || '';
      newActions[index].filename = generateActionFilename(
        title, 
        value as ActionType, 
        formData.actions.filter((_, i) => i !== index)
      );
    } else if (field === 'title') {
      // Update title as a Localizable object and regenerate filename
      const localizedTitle = typeof newActions[index].title === 'object'
        ? { ...newActions[index].title, [DEFAULT_LANGUAGE]: value }
        : { [DEFAULT_LANGUAGE]: value };
        
      newActions[index] = { 
        ...newActions[index], 
        title: localizedTitle 
      };
      
      // Use the updated title for the filename
      const titleStr = value || '';
      newActions[index].filename = generateActionFilename(
        titleStr, 
        newActions[index].type, 
        formData.actions.filter((_, i) => i !== index)
      );
    }
    
    updateActions(newActions);
  };

  // Handle AI Modal for generating prompt
  const handleGeneratePrompt = (index: number) => {
    if (!isSDKAvailable) {
      message.error('Webdraw SDK is not available');
      return;
    }
    
    setCurrentPromptIndex(index);
    
    const actionType = formData.actions[index]?.type as ActionType;
    const promptSuggestion = `Write a creative prompt that will ${
      actionType === 'generateText' ? 'generate text' : 
      actionType === 'generateImage' ? 'generate an image' : 
      actionType === 'generateJSON' ? 'generate structured data' : 
      'generate content'
    }`;
    
    setUserPrompt(promptSuggestion);
    setIsModalVisible(true);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setCurrentPromptIndex(null);
  };
  
  // Handle modal submit for main actions
  const handleModalSubmit = async () => {
    if (!isSDKAvailable) {
      message.error('Webdraw SDK is not available');
      setIsModalVisible(false);
      return;
    }
    
    if (!userPrompt.trim()) {
      message.error('Please enter a prompt');
      return;
    }
    
    setIsGenerating(true);
    setIsModalVisible(false);
    
    try {
      // Generate content using AI
      const result = await service.executeAIGeneration(userPrompt);
      
      // If we have a current prompt index, update that action's prompt
      if (currentPromptIndex !== null && formData.actions && formData.actions[currentPromptIndex]) {
        // Get the current editor language
        const { editorLanguage = DEFAULT_LANGUAGE } = useLanguage();
        
        // Get the current action
        const currentAction = formData.actions[currentPromptIndex];
        
        // Create or update the Localizable value, preserving other languages
        const currentPrompt = typeof currentAction.prompt === 'object' 
          ? currentAction.prompt 
          : { [DEFAULT_LANGUAGE]: currentAction.prompt || '' };
          
        const localizedValue = {
          ...currentPrompt,
          [editorLanguage]: result
        };
        
        handlePromptChange(currentPromptIndex, localizedValue);
        setCurrentPromptIndex(null);
      }
      
      message.success('AI content generated successfully');
    } catch (error) {
      console.error('Error generating content with AI:', error);
      message.error('Failed to generate content with AI');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle direct prompt change
  const handlePromptChange = (index: number, value: string | Localizable<string>) => {
    if (!Array.isArray(formData.actions)) return;
    
    const newActions = [...formData.actions];
    
    // Ensure the value is a Localizable object
    const promptValue = typeof value === 'string' 
      ? { [DEFAULT_LANGUAGE]: value } 
      : value;
    
    newActions[index] = {
      ...newActions[index],
      prompt: promptValue // Update the prompt directly on action, not in config
    };
    updateActions(newActions);
  };

  // Handle JSON Schema Form submission
  const handleConfigFormChange = (index: number, newFormData: any) => {
    if (!Array.isArray(formData.actions)) return;
    
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      config: newFormData
    };
    updateActions(newActions);
  };

  // Custom field template for JsonSchemaForm to handle the prompt field specially
  const CustomFieldTemplate = (props: any) => {
    const { id, label, required, children, schema, formData, onChange } = props;
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [userPrompt, setUserPrompt] = useState('');
    
    // Access the editing index and current action type directly from parent scope
    const currentActionIndex = editingIndex !== null ? editingIndex : -1;
    
    // Get the actual action object directly from the parent component state
    const actionsList = Array.isArray(formData.actions) ? formData.actions : [];
    const currentAction = currentActionIndex >= 0 && currentActionIndex < actionsList.length 
      ? actionsList[currentActionIndex] 
      : null;

    // Handle opening the AI prompt modal
    const handleOpenAIModal = () => {
      // Set a default prompt suggestion based on the field
      setUserPrompt(`Generate content for ${schema.title || 'this field'}${schema.description ? ` that ${schema.description}` : ''}`);
      setIsModalVisible(true);
    };
    
    // Handle modal cancel
    const handleModalCancel = () => {
      setIsModalVisible(false);
    };
    
    // Handle modal submit and AI generation
    const handleModalSubmit = async () => {
      if (!isSDKAvailable) {
        message.error('Webdraw SDK is not available');
        setIsModalVisible(false);
        return;
      }
      
      if (!userPrompt.trim()) {
        message.error('Please enter a prompt');
        return;
      }
      
      setIsGenerating(true);
      setIsModalVisible(false);
      
      try {
        // Use regular generateText
        const result = await service.executeAIGeneration(userPrompt);
        
        // For prompt fields, update the action's prompt
        if (id.endsWith('_prompt') && schema.title === 'Prompt' && currentActionIndex !== null && currentAction) {
          // Get the current editor language
          const { editorLanguage = DEFAULT_LANGUAGE } = useLanguage();
          
          // Create or update the Localizable value, preserving other languages
          const currentPrompt = typeof currentAction.prompt === 'object' 
            ? currentAction.prompt 
            : { [DEFAULT_LANGUAGE]: currentAction.prompt || '' };
            
          const localizedValue = {
            ...currentPrompt,
            [editorLanguage]: result
          };
          
          handlePromptChange(currentActionIndex, localizedValue);
        } else {
          // For other fields, use the default onChange
          onChange(result);
        }
        
        message.success('AI content generated successfully');
      } catch (error) {
        console.error('Error generating content with AI:', error);
        message.error('Failed to generate content with AI');
      } finally {
        setIsGenerating(false);
      }
    };
    
    // Check if this is the prompt field, use our custom PromptTextArea component
    if (id.endsWith('_prompt') && schema.title === 'Prompt') {
      return (
        <div className="custom-field-template">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label htmlFor={id}>
              {label}
              {required ? <span className="required-indicator">*</span> : null}
            </label>
            <Button 
              type="primary" 
              size="small"
              icon={<RobotOutlined />} 
              onClick={handleOpenAIModal}
              loading={isGenerating}
            >
              Use AI
            </Button>
          </div>
          
          {/* If we need a prompt, we should use the action's prompt property, not a value in the form data */}
          {currentAction && (
            <PromptTextArea
              value={currentAction.prompt}
              onChange={(value) => handlePromptChange(currentActionIndex, value)}
              placeholder={schema.description || 'Enter your prompt here...'}
              rows={4}
              inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
              actions={Array.isArray(formData.actions) ? formData.actions : []}
              currentActionIndex={currentActionIndex}
            />
          )}
          
          {/* Main AI-driven action modal */}
          <Modal
            title="Generate with AI"
            open={isModalVisible}
            onOk={handleModalSubmit}
            onCancel={handleModalCancel}
            confirmLoading={isGenerating}
            width={500}
          >
            <AntForm.Item
              label="What would you like to generate?"
              required
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input.TextArea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe what you want the AI to generate..."
                rows={4}
                autoFocus
              />
            </AntForm.Item>
            
            <div className="available-variables-wrapper" style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Available Variables (click to insert):
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                <AvailableVariables 
                  inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                  actions={Array.isArray(formData.actions) ? formData.actions.slice(0, currentPromptIndex || 0) : []}
                  currentActionIndex={currentPromptIndex || 0}
                  onVariableClick={(variable) => {
                    setUserPrompt(prev => `${prev} ${variable}`.trim());
                  }}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              You can include any of the above variables in your prompt. For example: "Create a story about @child_name.md who dreams of becoming a @career.md"
            </p>
          </Modal>
        </div>
      );
    }
    
    // For all other fields, add the "Use AI" button to the label
    return (
      <div className="default-field-template" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label htmlFor={id}>
            {label}
            {required ? <span className="required-indicator">*</span> : null}
          </label>
          {(schema.type === 'string' && !schema.enum) && (
            <Button 
              type="primary" 
              size="small"
              icon={<RobotOutlined />} 
              onClick={handleOpenAIModal}
              loading={isGenerating}
            >
              Use AI
            </Button>
          )}
        </div>
        {children}
        
        {/* Main AI-driven action modal */}
        <Modal
          title="Generate with AI"
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={handleModalCancel}
          confirmLoading={isGenerating}
          width={500}
        >
          <AntForm.Item
            label="What would you like to generate?"
            required
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Input.TextArea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Describe what you want the AI to generate..."
              rows={4}
              autoFocus
            />
          </AntForm.Item>
          
          <div className="available-variables-wrapper" style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Available Variables (click to insert):
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
              <AvailableVariables 
                inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                actions={Array.isArray(formData.actions) ? formData.actions.slice(0, currentPromptIndex || 0) : []}
                currentActionIndex={currentPromptIndex || 0}
                onVariableClick={(variable) => {
                  setUserPrompt(prev => `${prev} ${variable}`.trim());
                }}
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            You can include any of the above variables in your prompt. For example: "Create a story about @child_name.md who dreams of becoming a @career.md"
          </p>
        </Modal>
      </div>
    );
  };

  // Ensure we have a valid actions array
  const actions = Array.isArray(formData.actions) ? formData.actions : [];

  return (
    <div>
      <Title level={4}>Configure AI Actions</Title>
      <Paragraph>
        Define the AI-driven actions that your application will perform.
        Each action can use input fields and the results of previous actions.
      </Paragraph>

      {actions.length === 0 ? (
        <Empty 
          description="No actions added yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {actions.map((action, index) => (
            <Card
              key={action.id}
              size="small"
              style={{ width: '100%', marginBottom: '16px' }}
              bodyStyle={{ padding: '12px' }}
              title={
                <Space>
                  {actionIcons[action.type]}
                  <span>{getLocalizedValue(action.title, DEFAULT_LANGUAGE)}</span>
                </Space>
              }
              actions={[
                <Tooltip title={editingIndex === index ? "View action" : "Edit action"} key="edit">
                  <Button 
                    type="text" 
                    icon={editingIndex === index ? <EyeOutlined /> : <EditOutlined />} 
                    onClick={() => handleCardFlip(index)}
                  />
                </Tooltip>,
                <Tooltip title="Delete action" key="delete">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteAction(index)}
                  />
                </Tooltip>
              ]}
            >
              {editingIndex === index ? (
                // Edit Mode
                <Space direction="vertical" style={{ width: '100%', marginBottom: 0 }} size="small">
                  <AntForm.Item
                    label="Action Type"
                    required
                    style={{ marginBottom: 12 }}
                  >
                    <Select
                      value={action.type}
                      onChange={(value) => handleActionChange(index, 'type', value)}
                      options={Object.entries(availableActions).map(([type, config]) => ({
                        label: (
                          <Space>
                            {actionIcons[type as ActionType]}
                            <span>{config.label}</span>
                          </Space>
                        ),
                        value: type,
                      }))}
                    />
                  </AntForm.Item>

                  <AntForm.Item
                    label="Action Title"
                    required
                    tooltip="A descriptive name for this action"
                    style={{ marginBottom: 12 }}
                  >
                    <Input
                      placeholder="Enter action title"
                      value={getLocalizedValue(action.title, DEFAULT_LANGUAGE)}
                      onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                    />
                  </AntForm.Item>
                  
                  <AntForm.Item
                    label="Output Filename (auto-generated)"
                    tooltip="This filename will be used to reference this action's output"
                    style={{ marginBottom: 12 }}
                  >
                    <Input
                      placeholder="Auto-generated filename"
                      value={action.filename}
                      disabled
                      addonAfter={<InfoCircleOutlined />}
                    />
                  </AntForm.Item>
                  
                  <Divider orientation="left" style={{ margin: '12px 0' }}>Configuration</Divider>
                  
                  {/* Special handling for prompt field */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', marginRight: 8 }}>Prompt</span>
                        <span className="ant-form-item-required" style={{ marginRight: 8 }}>*</span>
                        <Tooltip title="Use @filename.ext to reference inputs and other actions">
                          <InfoCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
                        </Tooltip>
                      </div>
                      <Button 
                        type="primary" 
                        size="middle"
                        icon={<RobotOutlined />} 
                        onClick={() => handleGeneratePrompt(index)}
                        loading={isGenerating}
                      >
                        Use AI
                      </Button>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <PromptTextArea
                        value={getLocalizedValue(action.prompt, DEFAULT_LANGUAGE) || ''}
                        onChange={(value) => handlePromptChange(index, value)}
                        inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                        actions={actions}
                        currentActionIndex={index}
                        rows={5} // Increased rows for more space
                      />
                    </div>
                  </div>
                  
                  {/* AI Prompt Modal for the prompt field */}
                  <Modal
                    title="Generate with AI"
                    open={isModalVisible}
                    onOk={handleModalSubmit}
                    onCancel={handleModalCancel}
                    confirmLoading={isGenerating}
                    width={500}
                  >
                    <AntForm.Item
                      label="What would you like to generate?"
                      required
                      labelCol={{ span: 24 }}
                      wrapperCol={{ span: 24 }}
                    >
                      <Input.TextArea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="Describe what you want the AI to generate..."
                        rows={4}
                        autoFocus
                      />
                    </AntForm.Item>
                    
                    <div className="available-variables-wrapper" style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Available Variables (click to insert):
                      </div>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                        <AvailableVariables 
                          inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                          actions={actions.slice(0, index)}
                          currentActionIndex={index}
                          onVariableClick={(variable) => {
                            setUserPrompt(prev => `${prev} ${variable}`.trim());
                          }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      You can include any of the above variables in your prompt. For example: "Create a story about @child_name.md who dreams of becoming a @career.md"
                    </p>
                  </Modal>
                  
                  {/* Using React JSON Schema Form for other fields */}
                  <div className="json-schema-form-wrapper" style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}>
                    <JsonSchemaForm
                      schema={{
                        ...availableActions[action.type].schema as RJSFSchema,
                        // Remove prompt from schema since we handle it separately
                        properties: Object.fromEntries(
                          Object.entries((availableActions[action.type].schema as RJSFSchema).properties || {})
                            .filter(([key]) => key !== 'prompt')
                        )
                      }}
                      formData={{
                        ...action.config,
                        // Exclude prompt from formData since we handle it separately
                        prompt: undefined
                      }}
                      validator={validator}
                      onChange={(e) => {
                        // Don't include prompt in the config since it's stored directly on the action
                        handleConfigFormChange(index, {
                          ...e.formData
                        });
                      }}
                      uiSchema={{
                        // Customize UI as needed
                        "ui:submitButtonOptions": {
                          norender: true, // Hide submit button
                        },
                        // Custom UI for specific fields
                        schema: {
                          "ui:widget": "textarea",
                          "ui:options": {
                            rows: 8
                          }
                        }
                      }}
                      // Pass our custom field template to render the "Use AI" button
                      templates={{ FieldTemplate: CustomFieldTemplate }}
                      className="rjsf-no-margin"
                    />
                  </div>
                </Space>
              ) : (
                // View Mode
                <div style={{ padding: '0 0 8px 0' }}>
                  <Paragraph style={{ marginBottom: '8px' }}>
                    <Text type="secondary">Type:</Text> {availableActions[action.type].label}
                  </Paragraph>
                  <Paragraph style={{ marginBottom: '8px' }}>
                    <Text type="secondary">Output:</Text> <code>{action.filename}</code>
                  </Paragraph>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: '0' }}>
                    <Text type="secondary">Prompt:</Text> {getLocalizedValue(action.prompt, DEFAULT_LANGUAGE) || 'No prompt configured'}
                  </Paragraph>
                </div>
              )}
            </Card>
          ))}
        </Space>
      )}

      <Divider />
      
      <Title level={5}>Add New Action</Title>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {Object.entries(availableActions).map(([type, config]) => (
          <Col xs={12} sm={6} key={type}>
            <Card
              hoverable
              style={{ textAlign: 'center' }}
              onClick={() => handleAddAction(type as ActionType)}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {actionIcons[type as ActionType]}
              </div>
              <div>{config.label}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
} 