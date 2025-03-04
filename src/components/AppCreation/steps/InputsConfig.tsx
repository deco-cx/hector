import React, { useEffect, useState } from 'react';
import { Typography, Button, Form, Input, Select, Card, Tooltip, Row, Col, Space, Tabs } from 'antd';
import { PlusOutlined, MinusCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { 
  Localizable, 
  DEFAULT_LANGUAGE, 
  createLocalizable, 
  getLocalizedValue,
  InputField
} from '../../../types/types';
import LocalizableInput from '../../../components/LocalizableInput/LocalizableInput';
import { useRuntime } from '../../../components/Runtime/RuntimeContext';
import { InputTest } from '../../../components/Runtime/InputTest';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface InputsConfigProps {
  formData: {
    inputs: Array<InputField>;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const inputTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Select', value: 'select' },
  { label: 'File', value: 'file' },
  { label: 'Audio', value: 'audio' },
];

export function InputsConfig({ formData, setFormData }: InputsConfigProps) {
  const [form] = Form.useForm();
  const runtime = useRuntime();
  
  // Track which inputs are in view mode
  const [viewModeInputs, setViewModeInputs] = useState<Record<number, boolean>>({});
  
  // Toggle view mode for a specific input
  const toggleInputViewMode = (index: number) => {
    setViewModeInputs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Generate a filename from the title
  const generateFilename = (title: Localizable<string>): string => {
    const displayTitle = getLocalizedValue(title, DEFAULT_LANGUAGE) || '';
    
    const baseFilename = displayTitle
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
    
    return baseFilename ? `${baseFilename}.md` : '';
  };
  
  // Handle form values change
  const onValuesChange = (changedValues: any, allValues: any) => {
    console.log("onValuesChange called with:", { 
      changedValues: JSON.stringify(changedValues, null, 2), 
      allValues: JSON.stringify(allValues, null, 2) 
    });
    
    if (changedValues.inputs) {
      // Process each changed input
      const newInputs = allValues.inputs.map((input: InputField, index: number) => {
        const newInput = { ...input };
        
        // Generate filename from title if it doesn't exist or has been reset
        if ((!newInput.filename || newInput.filename === '') && newInput.title) {
          newInput.filename = generateFilename(newInput.title);
        }
        
        // Ensure required is properly set as boolean
        if (newInput.required !== undefined) {
          newInput.required = newInput.required === true || String(newInput.required) === 'true';
        }
        
        return newInput;
      });
      
      setFormData((prev: any) => ({
        ...prev,
        inputs: newInputs
      }));
    }
  };
  
  // Handle adding a new field
  const handleAddField = () => {
    const currentInputs = form.getFieldValue('inputs') || [];
    const newInput = {
      title: createLocalizable(DEFAULT_LANGUAGE, ''),
      filename: '',
      type: 'text',
      required: false,
      placeholder: createLocalizable(DEFAULT_LANGUAGE, '')
    };
    
    console.log("Adding new field with required=false:", newInput);
    
    // Update the form directly
    form.setFieldsValue({
      inputs: [...currentInputs, newInput]
    });
    
    // Trigger the onValuesChange handler to update parent state
    onValuesChange(
      { inputs: [...currentInputs, newInput] },
      { inputs: [...currentInputs, newInput] }
    );
    
    console.log("Added new field, total inputs:", currentInputs.length + 1);
  };
  
  // Handle removing a field
  const handleRemoveField = (index: number) => {
    const currentInputs = form.getFieldValue('inputs') || [];
    const newInputs = [...currentInputs];
    newInputs.splice(index, 1);
    
    // Update the form directly
    form.setFieldsValue({
      inputs: newInputs
    });
    
    // Trigger the onValuesChange handler to update parent state
    onValuesChange(
      { inputs: newInputs },
      { inputs: newInputs }
    );
    
    // Clean up viewModeInputs state
    setViewModeInputs(prev => {
      const newViewModes = { ...prev };
      delete newViewModes[index];
      return Object.fromEntries(
        Object.entries(newViewModes).map(([key, value]) => {
          const keyNum = parseInt(key);
          return [keyNum > index ? keyNum - 1 : keyNum, value];
        })
      );
    });
    
    console.log("Removed field, total inputs:", newInputs.length);
  };
  
  // Initialize form with current values
  useEffect(() => {
    if (formData && Array.isArray(formData.inputs)) {
      console.log("InputsConfig useEffect - formData inputs:", JSON.stringify(formData.inputs, null, 2));
      
      // Log each input's required field value
      formData.inputs.forEach((input, index) => {
        console.log(`Input ${index} initial required value:`, input.required, typeof input.required);
      });
      
      form.setFieldsValue({ inputs: formData.inputs });
    }
  }, [formData, form]);
  
  // Add a new function to log values before form submission
  const logFormValues = () => {
    const values = form.getFieldsValue();
    console.log("Current form values:", JSON.stringify(values, null, 2));
    
    // Check the required field specifically
    if (values.inputs) {
      values.inputs.forEach((input: any, index: number) => {
        console.log(`Form input ${index} required value:`, input.required, typeof input.required);
      });
    }
    
    // Check what's actually in formData
    console.log("Current formData.inputs:", JSON.stringify(formData.inputs, null, 2));
  };
  
  return (
    <div>
      <Title level={4}>Input Fields</Title>
      <Paragraph className="text-gray-500 mb-4">
        Define the input fields that users will need to fill in before generating content.
        Click the edit/view toggle to switch between configuring inputs and filling them in.
      </Paragraph>
      
      {/* Add a button to log form values for debugging */}
      <Button onClick={logFormValues} style={{ marginBottom: '16px' }}>
        Debug: Log Form Values
      </Button>
      
      <Form 
        form={form}
        onValuesChange={onValuesChange}
        layout="vertical"
        initialValues={{ inputs: formData.inputs || [] }}
      >
        <Form.List name="inputs">
          {(fields) => (
            <div className="space-y-4">
              {fields.map(({ key, name, ...restField }) => {
                // Log the current field values from the form for debugging
                const currentField = form.getFieldValue(['inputs', name]);
                const currentRequired = currentField ? currentField.required : undefined;
                console.log(`Rendering field ${name}, required value:`, currentRequired, typeof currentRequired);
                
                const isViewMode = viewModeInputs[name] === true;
                
                return (
                <Card 
                  key={key} 
                  className="input-field-card"
                  title={
                    <Space>
                      {getLocalizedValue(form.getFieldValue(['inputs', name, 'title']), DEFAULT_LANGUAGE) || 'New Field'}
                    </Space>
                  }
                  extra={
                    <Space>
                      <Tooltip title={isViewMode ? "Edit Field" : "View Field"}>
                        <Button 
                          type="text" 
                          icon={isViewMode ? <EditOutlined /> : <EyeOutlined />} 
                          onClick={() => toggleInputViewMode(name)}
                        />
                      </Tooltip>
                      {!isViewMode && (
                        <Tooltip title="Remove Field">
                          <Button 
                            type="text" 
                            danger 
                            icon={<MinusCircleOutlined />} 
                            onClick={() => handleRemoveField(name)}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  }
                >
                  {isViewMode ? (
                    // View mode - Show the InputTest component to fill values
                    <InputTest 
                      input={form.getFieldValue(['inputs', name])} 
                    />
                  ) : (
                    // Edit mode - Show the configuration form
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'title']}
                            label="Field Name"
                            rules={[{ required: true, message: 'Field name is required' }]}
                          >
                            <LocalizableInput placeholder="Enter field name" />
                          </Form.Item>
                        </Col>
                        
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            label="Field Type"
                            rules={[{ required: true, message: 'Field type is required' }]}
                          >
                            <Select placeholder="Select field type">
                              {inputTypes.map(type => (
                                <Select.Option key={type.value} value={type.value}>
                                  {type.label}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'placeholder']}
                            label="Placeholder"
                          >
                            <LocalizableInput placeholder="Enter placeholder text" />
                          </Form.Item>
                        </Col>
                        
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'required']}
                            label="Required"
                            valuePropName="value"
                          >
                            <Select
                              onChange={(value) => {
                                console.log(`Required value changed for field ${name}:`, value, typeof value);
                                // Directly modify the form field to ensure it's set properly
                                const currentInputs = form.getFieldValue('inputs');
                                if (currentInputs && currentInputs[name]) {
                                  console.log('Before update, current value:', currentInputs[name].required);
                                  currentInputs[name].required = value === true || value === 'true';
                                  console.log('After update, new value:', currentInputs[name].required);
                                  form.setFieldsValue({ inputs: currentInputs });
                                }
                              }}
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'filename']}
                        label="File Name"
                        extra="Auto-generated from field name. Will be used to reference this field in actions."
                      >
                        <Input disabled />
                      </Form.Item>
                    </>
                  )}
                </Card>
              )})}
              
              <Button 
                type="dashed" 
                onClick={handleAddField} 
                block 
                icon={<PlusOutlined />}
              >
                Add Field
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
    </div>
  );
} 