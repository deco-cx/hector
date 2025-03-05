import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Switch, Space, Form, Tooltip, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, PictureOutlined, AudioOutlined } from '@ant-design/icons';
import { DEFAULT_LANGUAGE, Localizable, InputField, getLocalizedValue } from '../../types/types';
import LocalizableInput from '../../components/LocalizableInput/LocalizableInput';

const { Option } = Select;
const { TextArea } = Input;

// Input type options
const INPUT_TYPES = [
  { value: 'text', label: 'Text Field', icon: <FileTextOutlined /> },
  { value: 'select', label: 'Dropdown', icon: <FileTextOutlined /> },
  { value: 'image', label: 'Image Upload', icon: <PictureOutlined /> },
  { value: 'audio', label: 'Audio Upload', icon: <AudioOutlined /> }
];

interface InputsConfigProps {
  formData: {
    inputs: Array<InputField>;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function InputsConfig({ formData, setFormData }: InputsConfigProps) {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [form] = Form.useForm();
  
  // Generate a unique filename based on the title
  const generateFilename = (title: Localizable<string>): string => {
    // Get the title in the default language or the first available
    const titleText = title[DEFAULT_LANGUAGE] || Object.values(title)[0] || '';
    
    // Convert to lowercase, replace spaces with underscores, and remove special characters
    let filename = titleText.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Add a default extension based on content type
    filename = `${filename}.md`;
    
    // Ensure uniqueness by checking against existing filenames
    const existingFilenames = formData.inputs.map(input => input.filename);
    if (existingFilenames.includes(filename)) {
      let counter = 1;
      while (existingFilenames.includes(`${filename.replace(/\.\w+$/, '')}_${counter}${filename.match(/\.\w+$/)?.[0] || '.md'}`)) {
        counter++;
      }
      filename = `${filename.replace(/\.\w+$/, '')}_${counter}${filename.match(/\.\w+$/)?.[0] || '.md'}`;
    }
    
    return filename;
  };

  // Handle form value changes
  const onValuesChange = (changedValues: any, allValues: any) => {
    console.log('Form values changed:', JSON.stringify(changedValues, null, 2), 'All values:', JSON.stringify(allValues, null, 2));
    
    if (changedValues.editingInput) {
      const index = changedValues.editingInput.index;
      const updatedInput = { ...changedValues.editingInput };
      delete updatedInput.index;
      
      // Generate filename if title changed and no filename exists
      if (updatedInput.title && !updatedInput.filename) {
        // Use the default language title for filename generation
        const titleForFilename = typeof updatedInput.title === 'object' 
          ? updatedInput.title[DEFAULT_LANGUAGE] || Object.values(updatedInput.title)[0] 
          : updatedInput.title;
        
        updatedInput.filename = generateFilename(titleForFilename);
      }
      
      // Ensure required is a boolean
      if ('required' in updatedInput) {
        updatedInput.required = Boolean(updatedInput.required);
      }
      
      // Create a deep copy of the inputs array
      const updatedInputs = [...formData.inputs];
      
      // Ensure proper merging of localizable fields (title, placeholder)
      if (updatedInput.title && typeof updatedInput.title === 'object') {
        updatedInputs[index].title = {
          ...(typeof updatedInputs[index].title === 'object' ? updatedInputs[index].title : {}),
          ...updatedInput.title
        };
        // Remove from updatedInput to prevent double-application
        delete updatedInput.title;
      }
      
      if (updatedInput.placeholder && typeof updatedInput.placeholder === 'object') {
        updatedInputs[index].placeholder = {
          ...(typeof updatedInputs[index].placeholder === 'object' ? updatedInputs[index].placeholder : {}),
          ...updatedInput.placeholder
        };
        // Remove from updatedInput to prevent double-application
        delete updatedInput.placeholder;
      }
      
      // Update the input with remaining fields
      updatedInputs[index] = {
        ...updatedInputs[index],
        ...updatedInput
      };
      
      console.log('Updated input:', JSON.stringify(updatedInputs[index], null, 2));
      
      // Create a deep copy of the form data
      const updatedFormData = {
        ...formData,
        inputs: updatedInputs
      };
      
      console.log('Sending updated form data to parent:', JSON.stringify(updatedFormData, null, 2));
      setFormData(updatedFormData);
    }
  };

  // Handle flipping a card (toggle between view/edit)
  const handleCardFlip = (index: number) => {
    if (flippedCards.includes(index)) {
      setFlippedCards(flippedCards.filter(i => i !== index));
    } else {
      setFlippedCards([...flippedCards, index]);
      
      // Set form values for editing
      form.setFieldsValue({
        editingInput: {
          ...formData.inputs[index],
          index
        }
      });
    }
  };

  // Handle adding a new input field
  const handleAddField = () => {
    const defaultTitle: Localizable<string> = {};
    defaultTitle[DEFAULT_LANGUAGE] = `Field ${formData.inputs.length + 1}`;
    
    // Create a new input with default values
    const newInput: InputField = {
      title: defaultTitle,
      type: 'text',
      required: false,
      filename: `field_${formData.inputs.length + 1}.md`,
      placeholder: { [DEFAULT_LANGUAGE]: '' }
    };
    
    console.log('Adding new field with required=false:', newInput);
    
    // Create a complete new array and update directly
    const updatedInputs = [...(formData?.inputs || []), newInput];
    console.log('[InputsConfig] Setting updated inputs:', updatedInputs);
    
    // Update with a direct object to ensure the parent component gets the change
    setFormData({
      ...formData,
      inputs: updatedInputs
    });
    
    // Flip the new card for editing after the update is complete
    setTimeout(() => {
      const newIndex = updatedInputs.length - 1;
      console.log("Added new field, total inputs:", updatedInputs.length);
      handleCardFlip(newIndex);
    }, 50);
  };

  // Handle removing an input field
  const handleRemoveField = (index: number) => {
    const updatedInputs = [...formData.inputs];
    updatedInputs.splice(index, 1);
    setFormData({
      ...formData,
      inputs: updatedInputs
    });
    
    // Remove from flipped cards if it was flipped
    if (flippedCards.includes(index)) {
      setFlippedCards(flippedCards.filter(i => i !== index));
    }
  };

  // Helper to safely render default value
  const renderDefaultValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return 'None';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Render test input based on input type
  const renderTestInput = (input: InputField) => {
    return (
      <div className="input-preview">
        <div className="input-type-label">
          {INPUT_TYPES.find(t => t.value === input.type)?.icon} 
          {INPUT_TYPES.find(t => t.value === input.type)?.label || input.type}
        </div>
        <div className="input-details">
          <p><strong>Filename:</strong> {input.filename}</p>
          {input.description && (
            <p><strong>Description:</strong> {typeof input.description === 'object' 
              ? getLocalizedValue(input.description, DEFAULT_LANGUAGE) 
              : input.description}
            </p>
          )}
          {input.defaultValue !== undefined && (
            <p><strong>Default Value:</strong> {
              typeof input.defaultValue === 'object' 
                ? JSON.stringify(input.defaultValue)
                : String(input.defaultValue)
            }</p>
          )}
        </div>
      </div>
    );
  };

  // Debug function to log form values
  const logFormValues = () => {
    console.log('Form data:', formData);
  };

  // Render input cards
  const renderInputCards = () => {
    if (!formData.inputs || formData.inputs.length === 0) {
      return <Empty description="No input fields defined" />;
    }

    return formData.inputs.map((input, index) => {
      const isFlipped = flippedCards.includes(index);
      
      // Get the title in the current language
      const title = typeof input.title === 'object' 
        ? input.title[DEFAULT_LANGUAGE] || Object.values(input.title)[0] || ''
        : input.title || '';
      
      const inputTypeInfo = INPUT_TYPES.find(t => t.value === input.type);
      const IconComponent = inputTypeInfo?.icon || <FileTextOutlined />;
      
      return (
        <Card
          key={index}
          className={`input-card ${isFlipped ? 'flipped' : ''}`}
          style={{ marginBottom: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                {IconComponent}{' '}
                {title}
                {input.required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
              </span>
              <Space>
                <Button
                  type="text"
                  icon={isFlipped ? <EyeOutlined /> : <EditOutlined />}
                  onClick={() => handleCardFlip(index)}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveField(index)}
                />
              </Space>
            </div>
          }
        >
          {isFlipped ? (
            // Edit mode
            <Form 
              form={form} 
              layout="vertical" 
              onValuesChange={onValuesChange}
              initialValues={{
                editingInput: {
                  ...input,
                  index
                }
              }}
            >
              <Form.Item label="Title" name={['editingInput', 'title']}>
                <LocalizableInput />
              </Form.Item>
              
              <Form.Item label="Type" name={['editingInput', 'type']}>
                <Select>
                  {INPUT_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Required" name={['editingInput', 'required']} valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="Placeholder" name={['editingInput', 'placeholder']}>
                <LocalizableInput />
              </Form.Item>
              
              {input.type === 'text' && (
                <Form.Item label="Multi-line" name={['editingInput', 'multiValue']} valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}
              
              <Form.Item label="Default Value" name={['editingInput', 'defaultValue']}>
                <Input />
              </Form.Item>
              
              {input.type === 'select' && (
                <Form.Item label="Options">
                  <Tooltip title="Options are edited in a future version">
                    <Button disabled>Edit Options</Button>
                  </Tooltip>
                </Form.Item>
              )}
            </Form>
          ) : (
            // View mode
            <div className="input-view-mode">
              <div><strong>Type:</strong> {inputTypeInfo?.label || input.type}</div>
              <div><strong>Required:</strong> {input.required ? 'Yes' : 'No'}</div>
              <div><strong>Filename:</strong> <code>{input.filename}</code></div>
              {input.placeholder && (
                <div><strong>Placeholder:</strong> {
                  typeof input.placeholder === 'object' 
                    ? input.placeholder[DEFAULT_LANGUAGE] || Object.values(input.placeholder)[0] || ''
                    : input.placeholder || ''
                }</div>
              )}
            </div>
          )}
        </Card>
      );
    });
  };

  return (
    <div className="inputs-config">
      <div className="inputs-list">
        {renderInputCards()}
      </div>
      
      <Button 
        type="dashed" 
        block 
        icon={<PlusOutlined />} 
        onClick={handleAddField}
        style={{ marginTop: 16 }}
      >
        Add Input Field
      </Button>
      
      {/* Debug button - remove in production */}
      {/*<Button onClick={logFormValues} style={{ marginTop: 16 }}>Log Form Values</Button>*/}
    </div>
  );
} 