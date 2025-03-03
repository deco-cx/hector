import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Form, Input, Select, Card, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface InputsConfigProps {
  formData: {
    inputs: Array<{
      name: string;
      type: string;
      label: string;
      required: boolean;
      placeholder?: string;
    }>;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const inputTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Email', value: 'email' },
  { label: 'Password', value: 'password' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Select', value: 'select' },
];

export function InputsConfig({ formData, setFormData }: InputsConfigProps) {
  const [form] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newField, setNewField] = useState(false);

  const handleInputsChange = (inputs: any) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      inputs,
    }));
  };

  const handleCardFlip = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
    }
  };

  const handleAddField = () => {
    setNewField(true);
    const newInputs = [...formData.inputs, { 
      name: '', 
      type: 'text', 
      label: '', 
      required: false,
      placeholder: '' 
    }];
    handleInputsChange(newInputs);
    setEditingIndex(newInputs.length - 1);
  };

  const handleDeleteField = (index: number) => {
    const newInputs = [...formData.inputs];
    newInputs.splice(index, 1);
    handleInputsChange(newInputs);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const generateUniqueFilename = (label: string, currentIndex: number): string => {
    if (!label) return '';
    
    // Convert the label to a suitable filename format
    const baseFilename = label
      .toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, '') // Remove special characters
      .slice(0, 30); // Limit length
    
    if (!baseFilename) return '';
    
    // Check for duplicates
    const isDuplicate = formData.inputs.some(
      (input, idx) => idx !== currentIndex && input.name === `${baseFilename}.md`
    );
    
    // If duplicate, add a suffix based on index
    if (isDuplicate) {
      return `${baseFilename}-${currentIndex + 1}.md`;
    }
    
    return `${baseFilename}.md`;
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    const newInputs = [...formData.inputs];
    
    // First update the field that was changed
    newInputs[index] = { ...newInputs[index], [field]: value };
    
    // If the label was changed, auto-generate the filename
    if (field === 'label') {
      newInputs[index].name = generateUniqueFilename(value, index);
    }
    
    // If the type was changed, ensure we have the correct file extension
    if (field === 'type') {
      const currentName = newInputs[index].name;
      if (currentName) {
        const baseName = currentName.split('.')[0];
        newInputs[index].name = `${baseName}.md`; // Always use .md for now
      }
    }
    
    handleInputsChange(newInputs);
  };

  // Ensure all fields have a proper filename
  useEffect(() => {
    if (formData.inputs.length > 0) {
      const updatedInputs = formData.inputs.map((input, index) => {
        if (!input.name && input.label) {
          return {
            ...input,
            name: generateUniqueFilename(input.label, index)
          };
        }
        return input;
      });
      
      // Only update if there are changes
      if (JSON.stringify(updatedInputs) !== JSON.stringify(formData.inputs)) {
        handleInputsChange(updatedInputs);
      }
    }
  }, [formData.inputs]);

  return (
    <div>
      <Title level={4}>Configure Input Fields</Title>
      <Paragraph>
        Define the input fields that your application will collect from users.
        Add fields like text inputs, numbers, or selections.
      </Paragraph>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {formData.inputs.map((input, index) => (
          <Card
            key={index}
            size="small"
            style={{ width: '100%' }}
            actions={[
              <Tooltip title={editingIndex === index ? "View field" : "Edit field"}>
                <Button 
                  type="text" 
                  icon={editingIndex === index ? <EyeOutlined /> : <EditOutlined />} 
                  onClick={() => handleCardFlip(index)}
                />
              </Tooltip>,
              <Tooltip title="Delete field">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteField(index)}
                />
              </Tooltip>
            ]}
          >
            {editingIndex === index ? (
              // Edit Mode
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form layout="vertical">
                  <Form.Item
                    label="Display Label"
                    required
                    tooltip="The label shown to users"
                  >
                    <Input
                      placeholder="Display Label (e.g., Child's Name)"
                      value={input.label}
                      onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label="Field Name (auto-generated)"
                    tooltip="This filename will be used to reference this input in other parts of the app"
                  >
                    <Input
                      placeholder="Auto-generated filename"
                      value={input.name}
                      disabled
                      addonAfter={<InfoCircleOutlined />}
                    />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Field Type"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="Select field type"
                          style={{ width: '100%' }}
                          options={inputTypes}
                          value={input.type}
                          onChange={(value) => handleFieldChange(index, 'type', value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Required"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          style={{ width: '100%' }}
                          options={[
                            { label: 'Required', value: true },
                            { label: 'Optional', value: false },
                          ]}
                          value={input.required}
                          onChange={(value) => handleFieldChange(index, 'required', value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="Placeholder Text"
                    tooltip="Text that appears in the input field when it's empty"
                  >
                    <Input
                      placeholder="Enter placeholder text"
                      value={input.placeholder || ''}
                      onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                    />
                  </Form.Item>
                </Form>
              </Space>
            ) : (
              // View Mode
              <div>
                <Space align="baseline">
                  <Title level={5} style={{ margin: 0 }}>{input.label || 'Unnamed Field'}</Title>
                  {input.required && (
                    <Tooltip title="Required field">
                      <InfoCircleOutlined style={{ color: '#ff4d4f' }} />
                    </Tooltip>
                  )}
                </Space>
                <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                  Filename: <code>{input.name || 'auto-generated'}</code> • Type: <code>{input.type}</code>
                </Paragraph>
                {input.type === 'text' && (
                  <Input placeholder={input.placeholder || "Sample text input"} disabled style={{ marginTop: 12 }} />
                )}
                {input.type === 'number' && (
                  <Input type="number" placeholder={input.placeholder || "123"} disabled style={{ marginTop: 12 }} />
                )}
                {input.type === 'textarea' && (
                  <Input.TextArea rows={2} placeholder={input.placeholder || "Sample text area"} disabled style={{ marginTop: 12 }} />
                )}
                {input.type === 'select' && (
                  <Select
                    placeholder="Select option"
                    disabled
                    style={{ width: '100%', marginTop: 12 }}
                    options={[{ label: 'Sample Option', value: 'sample' }]}
                  />
                )}
              </div>
            )}
          </Card>
        ))}

        <Button
          type="dashed"
          onClick={handleAddField}
          icon={<PlusOutlined />}
          style={{ width: '100%' }}
        >
          Add Input Field
        </Button>
      </Space>
    </div>
  );
} 