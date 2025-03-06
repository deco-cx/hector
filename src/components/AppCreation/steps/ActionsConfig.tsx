import React, { useState } from 'react';
import { 
  Typography, Button, Space, Input, Select, Card, 
  Tooltip, Row, Col, Divider, Empty, Form,
  message, Modal, Tabs
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, 
  InfoCircleOutlined, FileTextOutlined, CodeOutlined,
  FileImageOutlined, SoundOutlined, PlayCircleOutlined,
  RobotOutlined, FileOutlined, SaveOutlined, ExperimentOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useHector } from '../../../context/HectorContext';
import { useHectorState } from '../../../context/HectorStateContext';
import AvailableVariables from '../components/AvailableVariables';
import { ActionData, ActionType, Localizable, DEFAULT_LANGUAGE, getLocalizedValue, createDefaultLocalizable, InputField } from '../../../types/types';
import { RJSFSchema } from '@rjsf/utils';
import RJSFForm from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import PromptTextArea from '../components/PromptTextArea';
import { availableActions as actionConfigs, generateActionFilename as generateFilename } from '../../../config/actionsConfig';
import { PlayAction } from '../components/PlayAction';
import { AudioPlayer } from '../components/AudioPlayer';
import { ImageVisualizer } from '../components/ImageVisualizer';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Map action types to their respective icons
const actionIcons: Record<ActionType, React.ReactNode> = {
  generateText: <FileTextOutlined />,
  generateJSON: <CodeOutlined />,
  generateImage: <FileImageOutlined />,
  generateAudio: <SoundOutlined />,
  generateVideo: <PlayCircleOutlined />,
  generateWithLora: <ExperimentOutlined />,
  readFile: <FileOutlined />,
  writeFile: <SaveOutlined />
};

interface ActionsConfigProps {
  formData: {
    inputs: Array<InputField>;
    actions: Array<ActionData>;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function ActionsConfig({ formData, setFormData }: ActionsConfigProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { service, isSDKAvailable, sdk, appConfig } = useHector();
  const selectedLanguage = appConfig?.selectedLanguage || DEFAULT_LANGUAGE;
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState<number | null>(null);
  const [form] = Form.useForm();
  
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
    const actionConfig = actionConfigs[type];
    const isFileSystemAction = actionConfig.category === 'FileSystem';
    
    const newActionData: ActionData = {
      id: uuidv4(),
      type,
      title: createDefaultLocalizable(`New ${actionConfig.label}`),
      description: createDefaultLocalizable(''),
      filename: generateFilename(
        getLocalizedValue(createDefaultLocalizable(`New ${actionConfig.label}`), DEFAULT_LANGUAGE) || `New ${actionConfig.label}`, 
        type, 
        formData.actions || []
      ),
      // For FileSystem actions, create an empty prompt that won't be used
      prompt: isFileSystemAction ? createDefaultLocalizable('') : createDefaultLocalizable(''),
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
      const actionConfig = actionConfigs[value as ActionType];
      const isFileSystemAction = actionConfig.category === 'FileSystem';
      const currentAction = newActions[index];
      const currentIsFileSystem = actionConfigs[currentAction.type].category === 'FileSystem';
      
      // Base updated action
      newActions[index] = {
        ...newActions[index],
        type: value as ActionType,
        config: { ...actionConfig.defaultProps }
      };
      
      // Handle prompt when switching between action categories
      if (isFileSystemAction !== currentIsFileSystem) {
        // If switching to FileSystem action, set empty prompt
        if (isFileSystemAction) {
          newActions[index].prompt = createDefaultLocalizable('');
        } 
        // If switching from FileSystem to AI action, create a default localizable prompt
        else if (typeof newActions[index].prompt !== 'object') {
          newActions[index].prompt = createDefaultLocalizable('');
        }
      }
      
      // Also update filename extension
      const title = getLocalizedValue(newActions[index].title, DEFAULT_LANGUAGE) || '';
      newActions[index].filename = generateFilename(
        title, 
        value as ActionType, 
        formData.actions.filter((_: ActionData, i: number) => i !== index)
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
      newActions[index].filename = generateFilename(
        titleStr, 
        newActions[index].type, 
        formData.actions.filter((_: ActionData, i: number) => i !== index)
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
      const schema: { type: "object"; properties: Record<string, any> } = {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: 'The generated prompt content'
          }
        }
      };
      
      const response = await service.executeAIGenerateObject({
        prompt: userPrompt,
        schema
      });
      
      if (response && response.content) {
        const generatedPrompt = response.content;
        if (currentPromptIndex !== null) {
          handlePromptChange(currentPromptIndex, generatedPrompt);
          message.success('Generated new prompt!');
        } else {
          message.error('No action selected for prompt generation');
        }
      } else {
        message.error('Failed to generate prompt. Please try again.');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      message.error('Failed to generate prompt: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle direct prompt change
  const handlePromptChange = (index: number, value: string | Localizable<string>) => {
    const newActions = [...formData.actions];
    
    // If the value is a string, convert it to a Localizable object
    const localizedValue = typeof value === 'string'
      ? { [selectedLanguage]: value }
      : value;
    
    newActions[index] = {
      ...newActions[index],
      prompt: localizedValue
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
    const { id, label, required, children, schema, formData, onChange, uiSchema } = props;
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [userPrompt, setUserPrompt] = useState('');
    
    // Get the field's UI options
    const fieldOptions = props.uiSchema?.[id.split('_').pop()]?.['ui:options'] || {};
    const isJsonSchemaField = id.endsWith('_schema') && schema.title === 'Schema';
    
    // Handle opening the AI prompt modal
    const handleOpenAIModal = () => {
      // Get the current action index from the editing index in the parent component
      setCurrentPromptIndex(editingIndex);
      
      // Set a different default prompt based on the field type
      if (isJsonSchemaField) {
        const actions = Array.isArray(formData.actions) ? formData.actions : [];
        const action = editingIndex !== null && editingIndex >= 0 && editingIndex < actions.length 
          ? actions[editingIndex] 
          : null;
        
        const actionTitle = action?.title || 'structured data';
        setUserPrompt(`Create a detailed JSON Schema for ${actionTitle}. The schema should define the structure, properties, types, and validation rules for ${actionTitle}. Include required fields, property descriptions, and appropriate data types.`);
      } else {
        setUserPrompt(`Generate content for ${schema.title || 'this field'}${schema.description ? ` that ${schema.description}` : ''}`);
      }
      
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
        if (isJsonSchemaField) {
          // For JSON Schema fields, use a more specific schema request
          const generationSchema: { type: "object"; properties: Record<string, any> } = {
            type: "object",
            properties: {
              jsonSchema: {
                type: "string",
                description: 'A JSON Schema definition that describes the structure, validation rules, and type information for the data.'
              }
            }
          };
          
          // Call AI service to generate the schema
          const response = await service.executeAIGenerateObject({
            prompt: userPrompt,
            schema: generationSchema
          });
          
          // Extract the result
          const result = response.jsonSchema;
          
          if (result) {
            // Attempt to parse as JSON to ensure it's valid
            try {
              // If it's valid JSON, keep it as is
              const parsedJson = JSON.parse(result);
              const finalValue = typeof parsedJson === 'string' ? parsedJson : JSON.stringify(parsedJson, null, 2);
              
              // Update the form data
              onChange(finalValue);
              
              message.success('Generated new JSON schema!');
            } catch (error) {
              // If it's not valid JSON, provide it as a string
              onChange(result);
              message.warning('Generated schema may not be valid JSON. Please review and correct if needed.');
            }
          } else {
            message.error('Failed to generate schema. Please try again with a more detailed description.');
          }
        } else {
          // For other fields, use a generic content generation
          const generationSchema: { type: "object"; properties: Record<string, any> } = {
            type: "object",
            properties: {
              newFieldValue: {
                type: "string",
                description: `The generated value for the ${schema.title || 'field'}`
              }
            }
          };
          
          // Call AI service to generate the content
          const response = await service.executeAIGenerateObject({
            prompt: userPrompt,
            schema: generationSchema
          });
          
          // Extract the result
          const result = response.newFieldValue;
          
          if (result) {
            // Update the form field
            onChange(result);
            message.success(`Generated content for ${schema.title || 'field'}!`);
          } else {
            message.error('Failed to generate content. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error generating content:', error);
        message.error('Failed to generate content: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsGenerating(false);
      }
    };
    
    // Check if this is the prompt field
    if (id.endsWith('_prompt') && schema.title === 'Prompt') {
      // Skip rendering this field if it's a FileSystem action (safer check)
      if (editingIndex !== null && Array.isArray(formData.actions) && formData.actions[editingIndex]) {
        const actionType = formData.actions[editingIndex].type as ActionType;
        // Check if this is a FileSystem action
        if (actionConfigs[actionType] && actionConfigs[actionType].category === 'FileSystem') {
          return null;
        }
      }
      
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
          {editingIndex !== null && formData.actions && formData.actions[editingIndex] && (
            <PromptTextArea
              value={formData.actions[editingIndex].prompt}
              onChange={(value) => handlePromptChange(editingIndex, value)}
              inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
              actions={Array.isArray(formData.actions) ? formData.actions.filter((_: ActionData, i: number) => i !== editingIndex) : []}
              rows={8}
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
            <Form.Item
              label="What would you like to generate?"
              required
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input.TextArea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={4}
              />
            </Form.Item>
            
            {/* Display available variables */}
            <AvailableVariables 
              inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
              actions={Array.isArray(formData.actions) ? formData.actions.slice(0, currentPromptIndex || 0) : []}
              currentActionIndex={currentPromptIndex !== null ? currentPromptIndex : 0}
              onVariableClick={(variable) => {
                setUserPrompt((prev) => prev + ' ' + variable);
              }}
            />
            
            <div style={{ marginTop: '8px', color: '#888' }}>
              <p>You can include any of the variables above in your prompt. For example: "Create a story about @child_name.md"</p>
            </div>
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
          <Form.Item
            label="What would you like to generate?"
            required
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Input.TextArea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={4}
            />
          </Form.Item>
          
          {/* Display available variables */}
          <AvailableVariables 
            inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
            actions={Array.isArray(formData.actions) ? formData.actions.slice(0, currentPromptIndex || 0) : []}
            currentActionIndex={currentPromptIndex !== null ? currentPromptIndex : 0}
            onVariableClick={(variable) => {
              setUserPrompt((prev) => prev + ' ' + variable);
            }}
          />
          
          <div style={{ marginTop: '8px', color: '#888' }}>
            <p>You can include any of the variables above in your prompt. For example: "Create a story about @child_name.md"</p>
          </div>
        </Modal>
      </div>
    );
  };

  // Ensure we have a valid actions array
  const actions = Array.isArray(formData.actions) ? formData.actions : [];

  return (
    <div>
      <Title level={4}>Configure Actions</Title>
      <Paragraph>
        Define the actions that your application will perform.
        Each action can use input fields and the results of previous actions.
      </Paragraph>

      {actions.length === 0 ? (
        <Empty 
          description="No actions added yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {actions.map((action, index) => {
            const isEditing = editingIndex === index;
            const actionType = action?.type as ActionType || 'generateText';
            const actionConfig = actionConfigs[actionType] || actionConfigs.generateText;
            
            return (
              <Card
                key={action.id || index}
                title={
                  <Space>
                    {/* Add Play button before the Edit/View toggle */}
                    <PlayAction actionIndex={index} />
                    
                    {actionIcons[actionType] || <RobotOutlined />}
                    <span>{getLocalizedValue(action.title, selectedLanguage) || 'Unnamed Action'}</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Tooltip title={isEditing ? "View Action" : "Edit Action"}>
                      <Button
                        type="text"
                        icon={isEditing ? <EyeOutlined /> : <EditOutlined />}
                        onClick={() => handleCardFlip(index)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete Action">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteAction(index)}
                      />
                    </Tooltip>
                  </Space>
                }
                className="mb-4"
              >
                {isEditing ? (
                  // Edit Mode
                  <Space direction="vertical" style={{ width: '100%', marginBottom: 0 }} size="small">
                    <Form.Item
                      label="Action Type"
                      required
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        value={action.type}
                        onChange={(value) => handleActionChange(index, 'type', value)}
                        options={Object.entries(actionConfigs).map(([type, config]) => ({
                          label: (
                            <Space>
                              {actionIcons[type as ActionType]}
                              <span>{config.label}</span>
                            </Space>
                          ),
                          value: type,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item
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
                    </Form.Item>
                    
                    <Form.Item
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
                    </Form.Item>
                    
                    <Divider orientation="left" style={{ margin: '12px 0' }}>Configuration</Divider>
                    
                    {/* Only show the prompt field for AI actions */}
                    {actionConfigs[action.type].category === 'AI' && (
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
                            value={action.prompt}
                            onChange={(value) => handlePromptChange(index, value)}
                            inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                            actions={Array.isArray(formData.actions) ? formData.actions.filter((_: ActionData, i: number) => i !== index) : []}
                            rows={8}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* AI Prompt Modal for the prompt field */}
                    <Modal
                      title="Generate with AI"
                      open={isModalVisible}
                      onOk={handleModalSubmit}
                      onCancel={handleModalCancel}
                      confirmLoading={isGenerating}
                      width={500}
                    >
                      <Form.Item
                        label="What would you like to generate?"
                        required
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                      >
                        <Input.TextArea
                          value={userPrompt}
                          onChange={(e) => setUserPrompt(e.target.value)}
                          placeholder="Enter your prompt here..."
                          rows={4}
                        />
                      </Form.Item>
                      
                      {/* Display available variables */}
                      <AvailableVariables 
                        inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                        actions={Array.isArray(formData.actions) ? formData.actions.slice(0, currentPromptIndex || 0) : []}
                        currentActionIndex={currentPromptIndex !== null ? currentPromptIndex : 0}
                        onVariableClick={(variable) => {
                          setUserPrompt((prev) => prev + ' ' + variable);
                        }}
                      />
                      
                      <div style={{ marginTop: '8px', color: '#888' }}>
                        <p>You can include any of the variables above in your prompt. For example: "Create a story about @child_name.md"</p>
                      </div>
                    </Modal>
                    
                    {/* Using React JSON Schema Form for other fields */}
                    <div className="json-schema-form-wrapper" style={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}>
                      <RJSFForm
                        schema={{
                          ...actionConfigs[action.type].schema as RJSFSchema,
                          // Remove prompt from schema since we handle it separately
                          properties: Object.fromEntries(
                            Object.entries((actionConfigs[action.type].schema as RJSFSchema).properties || {})
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
                              rows: 8,
                              // Add explicit field type identifier for the schema field
                              isJsonSchemaField: action.type === 'generateJSON'
                            }
                          }
                        }}
                        // Pass our custom field template to render the "Use AI" button
                        templates={{ 
                          FieldTemplate: CustomFieldTemplate 
                        }}
                        className="rjsf-no-margin"
                      />
                    </div>
                  </Space>
                ) : (
                  // View Mode - show details and now also show the result
                  <div>
                    <Row gutter={16}>
                      <Col span={24}>
                        <div className="mb-4">
                          <Title level={5}>Type</Title>
                          <Text>{actionConfig.label}</Text>
                        </div>
                        
                        {/* Only show prompt for AI actions, not file system actions */}
                        {actionConfig.category === 'AI' && (
                          <div className="mb-4">
                            <Title level={5}>Prompt</Title>
                            <Text>{getLocalizedValue(action.prompt, selectedLanguage) || 'No prompt specified'}</Text>
                          </div>
                        )}
                        
                        {action.description && (
                          <div className="mb-4">
                            <Title level={5}>Description</Title>
                            <Text>{getLocalizedValue(action.description, selectedLanguage) || ''}</Text>
                          </div>
                        )}
                        
                        {/* Add result display section */}
                        <Divider />
                        <div className="action-result-section">
                          <Title level={5} style={{ marginBottom: '16px', color: '#1890ff' }}>Result</Title>
                          <ResultDisplay actionIndex={index} />
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card>
            );
          })}
        </Space>
      )}

      <Divider />
      
      <Title level={5}>Add New Action</Title>
      
      {/* Group actions by category */}
      {['AI', 'FileSystem'].map((category) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <div 
            style={{ 
              background: category === 'AI' ? '#e6f7ff' : '#f6ffed', 
              borderLeft: `4px solid ${category === 'AI' ? '#1890ff' : '#52c41a'}`,
              padding: '8px 16px',
              borderRadius: '0 4px 4px 0',
              marginTop: 16,
              marginBottom: 16
            }}
          >
            <Title level={5} style={{ margin: 0 }}>{category}</Title>
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries(actionConfigs)
              .filter(([_, config]) => config.category === category)
              .map(([type, config]) => (
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
      ))}
    </div>
  );
}

/**
 * Component to display the execution result for an action
 */
function ResultDisplay({ actionIndex }: { actionIndex: number }) {
  const { appConfig } = useHectorState();
  
  if (!appConfig || !appConfig.actions || !appConfig.actions[actionIndex]) {
    return <div>Action not found</div>;
  }
  
  const action = appConfig.actions[actionIndex];
  const actionState = action.state || 'idle';
  const isLoading = actionState === 'loading';
  const isError = actionState === 'error';
  
  // Get result from execution bag
  const resultContent = appConfig.lastExecution?.bag?.[action.filename]?.textValue || '';
  const resultFilePath = appConfig.lastExecution?.bag?.[action.filename]?.path || '';
  
  // Show loading state
  if (isLoading) {
    return <div className="action-result-loading">Loading...</div>;
  }
  
  // Show error state
  if (isError) {
    return <div className="action-result-error">Error executing action</div>;
  }
  
  // For image actions, show the image visualizer component if we have a file path
  if (action.type === 'generateImage' && resultFilePath) {
    return (
      <div className="action-result-with-image">
        <div className="action-result-text" style={{ marginBottom: '10px' }}>
          <TextArea
            value={resultContent}
            placeholder="Action has not been executed yet. Click the Play button to run this action."
            autoSize={{ minRows: 2, maxRows: 4 }}
            readOnly
            style={{ 
              backgroundColor: resultContent ? '#f8f8f8' : '#f0f0f0',
            }}
          />
        </div>
        <ImageVisualizer filepath={resultFilePath} />
      </div>
    );
  }
  
  // For audio actions, show the audio player component if we have a file path
  if (action.type === 'generateAudio' && resultFilePath) {
    return (
      <div className="action-result-with-audio">
        <div className="action-result-text" style={{ marginBottom: '10px' }}>
          <TextArea
            value={resultContent}
            placeholder="Action has not been executed yet. Click the Play button to run this action."
            autoSize={{ minRows: 2, maxRows: 4 }}
            readOnly
            style={{ 
              backgroundColor: resultContent ? '#f8f8f8' : '#f0f0f0',
            }}
          />
        </div>
        <AudioPlayer filepath={resultFilePath} />
      </div>
    );
  }
  
  // Show result or empty state for other action types
  return (
    <TextArea
      value={resultContent}
      placeholder="Action has not been executed yet. Click the Play button to run this action."
      autoSize={{ minRows: 4, maxRows: 12 }}
      readOnly
      style={{ 
        backgroundColor: resultContent ? '#f8f8f8' : '#f0f0f0',
        fontFamily: action.type === 'generateJSON' ? 'monospace' : 'inherit'
      }}
    />
  );
} 