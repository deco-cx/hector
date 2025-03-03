import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Space, Input, Select, Card, 
  Tooltip, Row, Col, Divider, Empty, Form as AntForm
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, 
  InfoCircleOutlined, FileTextOutlined, CodeOutlined,
  FileImageOutlined, SoundOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { 
  ActionType, availableActions, ActionData, 
  generateActionFilename 
} from '../../../config/actionsConfig';
import JsonSchemaForm from '@rjsf/antd';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import PromptTextArea from '../components/PromptTextArea';

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
  
  // Direct update to parent
  const updateActions = (actions: ActionData[]) => {
    setFormData({ actions });
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
      title: `New ${actionConfig.label}`,
      filename: generateActionFilename(`New ${actionConfig.label}`, type, formData.actions || []),
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
      const title = newActions[index].title;
      newActions[index].filename = generateActionFilename(
        title, 
        value as ActionType, 
        formData.actions.filter((_, i) => i !== index)
      );
    } else if (field === 'title') {
      // Update title and regenerate filename
      newActions[index] = { ...newActions[index], title: value };
      newActions[index].filename = generateActionFilename(
        value, 
        newActions[index].type, 
        formData.actions.filter((_, i) => i !== index)
      );
    }
    
    updateActions(newActions);
  };

  // Handle direct prompt change
  const handlePromptChange = (index: number, value: string) => {
    if (!Array.isArray(formData.actions)) return;
    
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      config: {
        ...newActions[index].config,
        prompt: value
      }
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
    
    // If this is the prompt field, use our custom PromptTextArea component
    if (id.endsWith('_prompt') && schema.title === 'Prompt') {
      const actionIndex = editingIndex !== null ? editingIndex : -1;
      
      return (
        <div className="custom-field-template">
          <label htmlFor={id}>
            {label}
            {required ? <span className="required-indicator">*</span> : null}
          </label>
          <PromptTextArea
            value={formData || ''}
            onChange={(value) => onChange(value)}
            placeholder={schema.description || 'Enter your prompt here...'}
            rows={4}
            inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
            actions={Array.isArray(formData.actions) ? formData.actions : []}
            currentActionIndex={actionIndex}
          />
        </div>
      );
    }
    
    // For all other fields, return the default rendering
    return <div className="default-field-template">{children}</div>;
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
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {actions.map((action, index) => (
            <Card
              key={action.id}
              size="small"
              style={{ width: '100%' }}
              title={
                <Space>
                  {actionIcons[action.type]}
                  <span>{action.title}</span>
                </Space>
              }
              actions={[
                <Tooltip title={editingIndex === index ? "View action" : "Edit action"}>
                  <Button 
                    type="text" 
                    icon={editingIndex === index ? <EyeOutlined /> : <EditOutlined />} 
                    onClick={() => handleCardFlip(index)}
                  />
                </Tooltip>,
                <Tooltip title="Delete action">
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
                <Space direction="vertical" style={{ width: '100%' }}>
                  <AntForm.Item
                    label="Action Type"
                    required
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
                  >
                    <Input
                      placeholder="Enter action title"
                      value={action.title}
                      onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                    />
                  </AntForm.Item>
                  
                  <AntForm.Item
                    label="Output Filename (auto-generated)"
                    tooltip="This filename will be used to reference this action's output"
                  >
                    <Input
                      placeholder="Auto-generated filename"
                      value={action.filename}
                      disabled
                      addonAfter={<InfoCircleOutlined />}
                    />
                  </AntForm.Item>
                  
                  <Divider orientation="left">Configuration</Divider>
                  
                  {/* Special handling for prompt field */}
                  <AntForm.Item
                    label="Prompt"
                    required
                    tooltip="Use @filename.ext to reference inputs and other actions"
                  >
                    <PromptTextArea
                      value={action.config.prompt || ''}
                      onChange={(value) => handlePromptChange(index, value)}
                      inputs={Array.isArray(formData.inputs) ? formData.inputs : []}
                      actions={actions}
                      currentActionIndex={index}
                    />
                  </AntForm.Item>
                  
                  {/* Using React JSON Schema Form for other fields */}
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
                      // Merge the updated form data with the existing prompt
                      handleConfigFormChange(index, {
                        ...e.formData,
                        prompt: action.config.prompt
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
                          rows: 6
                        }
                      }
                    }}
                  />
                </Space>
              ) : (
                // View Mode
                <div>
                  <Paragraph>
                    <Text type="secondary">Type:</Text> {availableActions[action.type].label}
                  </Paragraph>
                  <Paragraph>
                    <Text type="secondary">Output:</Text> <code>{action.filename}</code>
                  </Paragraph>
                  <Paragraph ellipsis={{ rows: 2 }}>
                    <Text type="secondary">Prompt:</Text> {action.config.prompt || 'No prompt configured'}
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