import React, { useState } from 'react';
import { Card, Button, Input, Select, Switch, Space, Form, Tooltip, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, PictureOutlined, AudioOutlined } from '@ant-design/icons';
import { DEFAULT_LANGUAGE, Localizable, InputField } from '../../types/types';
import { useRuntime } from '../../components/Runtime';

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
  const { executionContext } = useRuntime();

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
    if (changedValues.editingInput) {
      const index = changedValues.editingInput.index;
      const updatedInput = { ...changedValues.editingInput };
      delete updatedInput.index;
      
      // Generate filename if title changed
      if (updatedInput.title && !updatedInput.filename) {
        updatedInput.filename = generateFilename(updatedInput.title);
      }
      
      // Update the input at the specified index
      const updatedInputs = [...formData.inputs];
      updatedInputs[index] = {
        ...updatedInputs[index],
        ...updatedInput
      };
      
      setFormData({ ...formData, inputs: updatedInputs });
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
    // Create a default title
    const defaultTitle: Localizable<string> = {};
    defaultTitle[DEFAULT_LANGUAGE] = `Field ${formData.inputs.length + 1}`;
    
    // Create a new input with default values
    const newInput: InputField = {
      title: defaultTitle,
      type: 'text',
      required: false,
      filename: generateFilename(defaultTitle)
    };
    
    // Add the new input to the form data
    setFormData({
      ...formData,
      inputs: [...formData.inputs, newInput]
    });
    
    // Flip the new card for editing
    const newIndex = formData.inputs.length;
    handleCardFlip(newIndex);
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

  // Handle input value change during testing
  const handleTestInputChange = (input: InputField, value: any) => {
    if (executionContext) {
      executionContext.setValue(input.filename, value);
    }
  };

  // Helper to safely render default value
  const renderDefaultValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Render test input based on input type
  const renderTestInput = (input: InputField) => {
    const value = executionContext.getValue(input.filename) || input.defaultValue || '';

    switch (input.type) {
      case 'text':
        return input.multiValue ? (
          <TextArea
            value={value}
            onChange={(e) => handleTestInputChange(input, e.target.value)}
            placeholder={
              typeof input.placeholder === 'object'
                ? input.placeholder[DEFAULT_LANGUAGE] || ''
                : input.placeholder || ''
            }
            rows={4}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => handleTestInputChange(input, e.target.value)}
            placeholder={
              typeof input.placeholder === 'object'
                ? input.placeholder[DEFAULT_LANGUAGE] || ''
                : input.placeholder || ''
            }
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => handleTestInputChange(input, val)}
            style={{ width: '100%' }}
            placeholder={
              typeof input.placeholder === 'object'
                ? input.placeholder[DEFAULT_LANGUAGE] || ''
                : input.placeholder || ''
            }
          >
            {input.options?.map((option) => (
              <Option key={option.value} value={option.value}>
                {typeof option.label === 'object'
                  ? option.label[DEFAULT_LANGUAGE] || ''
                  : option.label}
              </Option>
            ))}
          </Select>
        );

      case 'image':
        return (
          <div>
            {value && (
              <div style={{ marginBottom: '10px' }}>
                <img 
                  src={typeof value === 'object' ? value.filepath || value.base64 : value} 
                  alt={typeof input.title === 'object' ? input.title[DEFAULT_LANGUAGE] || '' : input.title || ''}
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    handleTestInputChange(input, {
                      filename: file.name,
                      base64: reader.result,
                      filepath: URL.createObjectURL(file)
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        );

      case 'audio':
        return (
          <div>
            {value && typeof value === 'object' && (value.filepath || value.base64) && (
              <div style={{ marginBottom: '10px' }}>
                <audio 
                  src={value.filepath || value.base64} 
                  controls 
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    handleTestInputChange(input, {
                      filename: file.name,
                      base64: reader.result,
                      filepath: URL.createObjectURL(file)
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleTestInputChange(input, e.target.value)}
            placeholder={
              typeof input.placeholder === 'object'
                ? input.placeholder[DEFAULT_LANGUAGE] || ''
                : input.placeholder || ''
            }
          />
        );
    }
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
              <Form.Item label="Title" name={['editingInput', 'title', DEFAULT_LANGUAGE]}>
                <Input />
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
              
              <Form.Item label="Placeholder" name={['editingInput', 'placeholder', DEFAULT_LANGUAGE]}>
                <Input />
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