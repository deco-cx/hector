import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Space, Form, Input, Select, Card, 
  Tooltip, Row, Col, InputNumber, Divider, Empty 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, 
  InfoCircleOutlined, FileTextOutlined, CodeOutlined,
  FileImageOutlined, SoundOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { 
  ActionType, availableActions, ActionData, 
  generateActionFilename 
} from '../../../config/actionsConfig';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

// Map action types to their respective icons
const actionIcons: Record<ActionType, React.ReactNode> = {
  generateText: <FileTextOutlined />,
  generateJSON: <CodeOutlined />,
  generateImage: <FileImageOutlined />,
  generateAudio: <SoundOutlined />
};

interface ActionsConfigProps {
  formData: {
    actions: ActionData[];
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function ActionsConfig({ formData, setFormData }: ActionsConfigProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newAction, setNewAction] = useState(false);

  const handleActionsChange = (actions: ActionData[]) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      actions,
    }));
  };

  const handleCardFlip = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
    }
  };

  const handleAddAction = (type: ActionType) => {
    setNewAction(true);
    const actionConfig = availableActions[type];
    
    const newActionData: ActionData = {
      id: uuidv4(),
      type,
      title: `New ${actionConfig.label}`,
      filename: generateActionFilename(`New ${actionConfig.label}`, type, formData.actions),
      config: { ...actionConfig.defaultProps }
    };
    
    const newActions = [...formData.actions, newActionData];
    handleActionsChange(newActions);
    setEditingIndex(newActions.length - 1);
  };

  const handleDeleteAction = (index: number) => {
    const newActions = [...formData.actions];
    newActions.splice(index, 1);
    handleActionsChange(newActions);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleActionChange = (index: number, field: string, value: any) => {
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
    } else if (field.startsWith('config.')) {
      // Update a specific config property
      const configKey = field.split('.')[1];
      newActions[index] = {
        ...newActions[index],
        config: {
          ...newActions[index].config,
          [configKey]: value
        }
      };
    }
    
    handleActionsChange(newActions);
  };

  // Render form fields based on action type
  const renderConfigFields = (action: ActionData, index: number) => {
    const actionConfig = availableActions[action.type];
    const properties = actionConfig.schema.properties || {};
    
    return Object.entries(properties).map(([key, prop]: [string, any]) => {
      const value = action.config[key];
      const label = prop.title;
      const description = prop.description;
      
      if (key === 'schema' && action.type === 'generateJSON') {
        return (
          <Form.Item
            key={key}
            label={label}
            tooltip={description}
          >
            <TextArea
              rows={6}
              value={value}
              onChange={(e) => handleActionChange(index, `config.${key}`, e.target.value)}
              placeholder="Enter JSON schema"
            />
          </Form.Item>
        );
      }
      
      if (key === 'prompt') {
        return (
          <Form.Item
            key={key}
            label={label}
            tooltip={description}
            required={actionConfig.schema.required?.includes(key)}
          >
            <TextArea
              rows={4}
              value={value}
              onChange={(e) => handleActionChange(index, `config.${key}`, e.target.value)}
              placeholder="Enter prompt. Use @filename.ext to reference inputs and other actions."
            />
          </Form.Item>
        );
      }
      
      if (prop.type === 'number') {
        return (
          <Form.Item
            key={key}
            label={label}
            tooltip={description}
            required={actionConfig.schema.required?.includes(key)}
          >
            <InputNumber
              min={prop.minimum}
              max={prop.maximum}
              value={value}
              onChange={(val) => handleActionChange(index, `config.${key}`, val)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );
      }
      
      if (prop.enum) {
        return (
          <Form.Item
            key={key}
            label={label}
            tooltip={description}
            required={actionConfig.schema.required?.includes(key)}
          >
            <Select
              value={value}
              onChange={(val) => handleActionChange(index, `config.${key}`, val)}
              options={prop.enum.map((item: string) => ({ label: item, value: item }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );
      }
      
      return (
        <Form.Item
          key={key}
          label={label}
          tooltip={description}
          required={actionConfig.schema.required?.includes(key)}
        >
          <Input
            value={value}
            onChange={(e) => handleActionChange(index, `config.${key}`, e.target.value)}
            placeholder={`Enter ${key}`}
          />
        </Form.Item>
      );
    });
  };

  return (
    <div>
      <Title level={4}>Configure AI Actions</Title>
      <Paragraph>
        Define the AI-driven actions that your application will perform.
        Each action can use input fields and the results of previous actions.
      </Paragraph>

      {formData.actions.length === 0 ? (
        <Empty 
          description="No actions added yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {formData.actions.map((action, index) => (
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
                  <Form layout="vertical">
                    <Form.Item
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
                    </Form.Item>

                    <Form.Item
                      label="Action Title"
                      required
                      tooltip="A descriptive name for this action"
                    >
                      <Input
                        placeholder="Enter action title"
                        value={action.title}
                        onChange={(e) => handleActionChange(index, 'title', e.target.value)}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="Output Filename (auto-generated)"
                      tooltip="This filename will be used to reference this action's output"
                    >
                      <Input
                        placeholder="Auto-generated filename"
                        value={action.filename}
                        disabled
                        addonAfter={<InfoCircleOutlined />}
                      />
                    </Form.Item>
                    
                    <Divider orientation="left">Configuration</Divider>
                    
                    {renderConfigFields(action, index)}
                  </Form>
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