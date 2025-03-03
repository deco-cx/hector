import React, { useEffect } from 'react';
import { Typography, Button, Form, Input, Select, Card, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface InputField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

interface InputsConfigProps {
  formData: {
    inputs: InputField[];
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
  
  // Initialize form with formData when it changes
  useEffect(() => {
    if (Array.isArray(formData.inputs)) {
      form.setFieldsValue({ inputs: formData.inputs });
    } else {
      form.setFieldsValue({ inputs: [] });
    }
  }, [form, formData.inputs]);
  
  // Function to generate a unique filename based on label
  const generateFilename = (label: string) => {
    if (!label) return '';
    
    const baseFilename = label
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
    
    return baseFilename ? `${baseFilename}.md` : '';
  };
  
  // Direct update to parent
  const updateInputs = (updatedInputs: InputField[]) => {
    setFormData({ inputs: updatedInputs });
  };
  
  // Handle form values change
  const onValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.inputs) {
      const updatedInputs = allValues.inputs?.map((input: InputField) => {
        if (input && input.label) {
          return {
            ...input,
            name: generateFilename(input.label)
          };
        }
        return input;
      }).filter(Boolean) || [];
      
      // Update form and parent
      form.setFieldsValue({ inputs: updatedInputs });
      updateInputs(updatedInputs);
    }
  };
  
  // Add a new field
  const handleAddField = () => {
    const newInputs = [
      ...(Array.isArray(formData.inputs) ? formData.inputs : []),
      {
        label: '',
        name: '',
        type: 'text',
        required: false,
        placeholder: ''
      }
    ];
    
    updateInputs(newInputs);
  };
  
  // Remove a field
  const handleRemoveField = (index: number) => {
    if (!Array.isArray(formData.inputs)) return;
    
    const newInputs = [...formData.inputs];
    newInputs.splice(index, 1);
    updateInputs(newInputs);
  };

  return (
    <div>
      <Title level={4}>Configure Input Fields</Title>
      <Paragraph>
        Define the input fields that your application will collect from users.
        Add fields like text inputs, numbers, or selections.
      </Paragraph>

      <Form 
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        autoComplete="off"
      >
        <Form.List name="inputs">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card 
                  key={key} 
                  style={{ marginBottom: 16 }}
                  title={
                    <Form.Item
                      {...restField}
                      name={[name, 'label']}
                      noStyle
                    >
                      <Input 
                        placeholder="Field Label" 
                        style={{ fontWeight: 'bold' }}
                        bordered={false}
                      />
                    </Form.Item>
                  }
                  extra={
                    <Tooltip title="Delete field">
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => {
                          remove(name);
                          handleRemoveField(index);
                        }}
                      />
                    </Tooltip>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        label="Label"
                        name={[name, 'label']}
                        rules={[{ required: true, message: 'Please enter a label' }]}
                      >
                        <Input placeholder="Display Label (e.g., Child's Name)" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        label="Field Type"
                        name={[name, 'type']}
                        initialValue="text"
                      >
                        <Select
                          placeholder="Select field type"
                          options={inputTypes}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        label="Placeholder Text"
                        name={[name, 'placeholder']}
                      >
                        <Input placeholder="Enter placeholder text" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        label="Required"
                        name={[name, 'required']}
                        initialValue={false}
                      >
                        <Select
                          options={[
                            { label: 'Required', value: true },
                            { label: 'Optional', value: false },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    {...restField}
                    label="Filename (auto-generated)"
                    name={[name, 'name']}
                  >
                    <Input disabled placeholder="Auto-generated filename" />
                  </Form.Item>
                </Card>
              ))}
              
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    handleAddField();
                  }}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Field
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
} 