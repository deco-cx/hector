import React, { useEffect, useState } from 'react';
import { Typography, Button, Form, Input, Select, Card, Tooltip, Row, Col, Space, Tabs } from 'antd';
import { PlusOutlined, MinusCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { 
  Localizable, 
  DEFAULT_LANGUAGE, 
  createLocalizable, 
  getLocalizedValue,
  InputField,
  FileContent
} from '../../../types/types';
import LocalizableInput from '../../../components/LocalizableInput/LocalizableInput';
import { useHectorState } from '../../../context/HectorStateContext';
import { useHectorDispatch } from '../../../context/HectorDispatchContext';
import { ActionType } from '../../../context/HectorReducer';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface InputsConfigProps {
  formData: {
    inputs: Array<InputField>;
    [key: string]: any;
  };
  navigateToLanguageTab?: () => void;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
}

const inputTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Select', value: 'select' },
  { label: 'File', value: 'file' },
  { label: 'Audio', value: 'audio' },
];

export function InputsConfig({ formData, navigateToLanguageTab, setFormData }: InputsConfigProps) {
  const [form] = Form.useForm();
  const { appConfig } = useHectorState();
  const dispatch = useHectorDispatch();
  
  // Track which inputs are in view mode
  const [viewModeInputs, setViewModeInputs] = useState<Record<number, boolean>>({});
  
  // Toggle view mode for a specific input
  const toggleInputViewMode = (index: number) => {
    setViewModeInputs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Handle form values change
  const onValuesChange = (changedValues: any, allValues: any) => {
    console.log("[InputsConfig] onValuesChange called with:", { 
      changedValues: JSON.stringify(changedValues, null, 2), 
      allValues: JSON.stringify(allValues, null, 2) 
    });
    
    if (changedValues.inputs && appConfig) {
      // Update each changed input individually
      changedValues.inputs.forEach((input: InputField, index: number) => {
        if (input && Object.keys(input).length > 0) {
          // Get the complete input data by merging with existing data
          const currentInput = allValues.inputs[index];
          if (currentInput) {
            console.log(`[InputsConfig] Updating input ${index}:`, currentInput);
            
            // Use UPDATE_INPUT action to update a specific input
            dispatch({
              type: ActionType.UPDATE_INPUT,
              payload: {
                index,
                input: currentInput
              }
            });
          }
        }
      });
    }
  };
  
  // Handle adding a new field
  const handleAddField = () => {
    const newInput: InputField = {
      title: createLocalizable(DEFAULT_LANGUAGE, ''),
      filename: '',
      type: 'text',
      required: false,
      placeholder: createLocalizable(DEFAULT_LANGUAGE, '')
    };
    
    console.log("Adding new field with required=false:", newInput);
    
    // Add the new input to the form
    const currentInputs = form.getFieldValue('inputs') || [];
    form.setFieldsValue({
      inputs: [...currentInputs, newInput]
    });
    
    // Use ADD_INPUT action to add a new input
    dispatch({
      type: ActionType.ADD_INPUT,
      payload: newInput
    });
    
    console.log("Added new field");
  };
  
  // Handle removing a field
  const handleRemoveField = (index: number) => {
    // Update the form
    const currentInputs = form.getFieldValue('inputs') || [];
    const newInputs = [...currentInputs];
    newInputs.splice(index, 1);
    
    form.setFieldsValue({
      inputs: newInputs
    });
    
    // Use REMOVE_INPUT action to remove an input
    dispatch({
      type: ActionType.REMOVE_INPUT,
      payload: index
    });
    
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
    
    console.log("Removed field at index:", index);
  };
  
  // Handle input value change in view mode (runtime functionality)
  const handleInputValueChange = (index: number, value: string) => {
    const input = formData.inputs[index];
    if (!input || !input.filename) return;
    
    console.log(`[InputsConfig] Setting input value for ${input.filename}:`, value);
    
    // Update the execution bag with the new value
    dispatch({
      type: ActionType.SET_INPUT_VALUE,
      payload: {
        filename: input.filename,
        content: {
          textValue: value
        }
      }
    });
  };
  
  // Get current value for an input from the execution bag
  const getInputValue = (filename: string): string => {
    if (!appConfig?.lastExecution?.bag?.[filename]?.textValue) {
      return '';
    }
    
    return appConfig.lastExecution.bag[filename].textValue || '';
  };
  
  // Initialize form with current values
  useEffect(() => {
    if (formData && Array.isArray(formData.inputs)) {
      console.log("InputsConfig useEffect - formData inputs:", JSON.stringify(formData.inputs, null, 2));
      form.setFieldsValue({ inputs: formData.inputs });
    }
  }, [formData, form]);
  
  // Debug function to log form values
  const logFormValues = () => {
    const values = form.getFieldsValue();
    console.log("Current form values:", JSON.stringify(values, null, 2));
    
    // Check what's actually in appConfig
    console.log("Current appConfig.inputs:", appConfig ? JSON.stringify(appConfig.inputs, null, 2) : "No appConfig");
  };
  
  /**
   * Component for rendering runtime inputs
   */
  function RuntimeInput({ 
    inputType, 
    filename, 
    placeholder, 
    options = [],
    onValueChange
  }: {
    inputType: string;
    filename: string;
    placeholder: string;
    options?: Array<{ value: string; label: Localizable<string> }>;
    onValueChange: (value: string) => void;
  }) {
    const { appConfig } = useHectorState();
    
    // Get current value for the input from the execution bag
    const initialValue = appConfig?.lastExecution?.bag?.[filename]?.textValue || '';
    
    // Use local state to track input value during typing
    const [localValue, setLocalValue] = useState(initialValue);
    
    // Update local state when the global state changes
    useEffect(() => {
      const currentValue = appConfig?.lastExecution?.bag?.[filename]?.textValue || '';
      setLocalValue(currentValue);
    }, [appConfig?.lastExecution?.bag?.[filename]?.textValue, filename]);
    
    // Handle local changes without triggering global updates
    const handleLocalChange = (value: string) => {
      setLocalValue(value);
    };
    
    // Update global state only when focus is lost
    const handleBlur = () => {
      if (localValue !== (appConfig?.lastExecution?.bag?.[filename]?.textValue || '')) {
        onValueChange(localValue);
      }
    };
    
    switch (inputType) {
      case 'text':
        return (
          <Input
            placeholder={placeholder}
            value={localValue}
            onChange={(e) => handleLocalChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
      
      case 'select':
        return (
          <Select
            style={{ width: '100%' }}
            placeholder={placeholder}
            value={localValue || undefined}
            onChange={(value: string) => {
              handleLocalChange(value);
              // For select, also update global state immediately since there's no blur event
              onValueChange(value);
            }}
          >
            {Array.isArray(options) && options.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {getLocalizedValue(opt.label, DEFAULT_LANGUAGE) || opt.value}
              </Select.Option>
            ))}
          </Select>
        );
      
      // For now, other input types just use a text field
      default:
        return (
          <Input
            placeholder={`Enter ${inputType} value...`}
            value={localValue}
            onChange={(e) => handleLocalChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
    }
  }
  
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
                    // View mode - Show a runtime input field that updates the execution bag
                    <div className="input-field-view">
                      <Typography.Title level={5}>
                        {getLocalizedValue(form.getFieldValue(['inputs', name, 'title']), DEFAULT_LANGUAGE)}
                      </Typography.Title>
                      
                      {form.getFieldValue(['inputs', name, 'description']) && (
                        <Typography.Paragraph>
                          {getLocalizedValue(form.getFieldValue(['inputs', name, 'description']), DEFAULT_LANGUAGE)}
                        </Typography.Paragraph>
                      )}
                      
                      <RuntimeInput
                        inputType={form.getFieldValue(['inputs', name, 'type']) || 'text'}
                        filename={form.getFieldValue(['inputs', name, 'filename']) || ''}
                        placeholder={getLocalizedValue(
                          form.getFieldValue(['inputs', name, 'placeholder']), 
                          DEFAULT_LANGUAGE
                        ) || 'Enter value...'}
                        options={form.getFieldValue(['inputs', name, 'options'])}
                        onValueChange={(value) => handleInputValueChange(name, value)}
                      />
                    </div>
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
                            <LocalizableInput 
                              placeholder="Enter field name" 
                              showLanguageButtons={true} 
                              onAddLanguage={navigateToLanguageTab}
                            />
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
                            <LocalizableInput 
                              placeholder="Enter placeholder text" 
                              onAddLanguage={navigateToLanguageTab}
                            />
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
                                
                                // Get the current input and update it
                                const currentInputs = form.getFieldValue('inputs');
                                if (currentInputs && currentInputs[name]) {
                                  // Update the form field
                                  const updatedInput = {
                                    ...currentInputs[name],
                                    required: value === true || value === 'true'
                                  };
                                  
                                  // Update the form
                                  const newInputs = [...currentInputs];
                                  newInputs[name] = updatedInput;
                                  form.setFieldsValue({ inputs: newInputs });
                                  
                                  // Dispatch the update action
                                  dispatch({
                                    type: ActionType.UPDATE_INPUT,
                                    payload: {
                                      index: name,
                                      input: updatedInput
                                    }
                                  });
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