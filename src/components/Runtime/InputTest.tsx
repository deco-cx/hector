import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, Upload, Button, Typography, Card, Space, Divider } from 'antd';
import { UploadOutlined, FileTextOutlined, PictureOutlined, SoundOutlined } from '@ant-design/icons';
import { InputField } from '../../types/types';
import { useRuntime } from './RuntimeContext';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

/**
 * Props for the InputTest component
 */
interface InputTestProps {
  input: InputField;
}

/**
 * InputTest component renders appropriate input field based on type
 */
export const InputTest: React.FC<InputTestProps> = ({ input }) => {
  const { executionContext, sdk } = useRuntime();
  const [value, setValue] = useState<any>(executionContext.getValue(input.filename) || input.defaultValue || '');
  
  // Save execution state with debounce
  const saveExecutionState = useCallback(
    async (newValue: any) => {
      if (sdk) {
        try {
          // Set the value in the context
          executionContext.setValue(input.filename, newValue);
          
          // Save to filesystem with debounce
          const timeoutId = setTimeout(async () => {
            await executionContext.saveExecutionState(sdk);
          }, 500);
          
          return () => clearTimeout(timeoutId);
        } catch (error) {
          console.error('Failed to save execution state:', error);
        }
      }
    },
    [executionContext, sdk, input.filename]
  );
  
  // Handle value changes
  const handleValueChange = useCallback(
    (newValue: any) => {
      setValue(newValue);
      saveExecutionState(newValue);
    },
    [saveExecutionState]
  );
  
  // Update the execution context when value changes
  useEffect(() => {
    if (value !== undefined) {
      executionContext.setValue(input.filename, value);
    }
  }, [value, input.filename, executionContext]);
  
  // Sync with execution context values
  useEffect(() => {
    const contextValue = executionContext.getValue(input.filename);
    if (contextValue !== undefined && contextValue !== value) {
      setValue(contextValue);
    }
  }, [executionContext, input.filename, value]);
  
  // Get localized title and placeholder
  const title = typeof input.title === 'object' 
    ? Object.values(input.title)[0] 
    : input.title;
  
  const placeholder = input.placeholder 
    ? (typeof input.placeholder === 'object' 
      ? Object.values(input.placeholder)[0] 
      : input.placeholder)
    : `Enter ${title}`;
  
  // Render appropriate input based on type
  const renderInput = () => {
    switch (input.type) {
      case 'text':
        return input.multiValue 
          ? (
            <TextArea
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={placeholder}
              rows={4}
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={placeholder}
            />
          );
        
      case 'select':
        return (
          <Select
            style={{ width: '100%' }}
            value={value}
            onChange={(val) => handleValueChange(val)}
            placeholder={placeholder}
          >
            {input.options?.map((option) => (
              <Option 
                key={option.value} 
                value={option.value}
              >
                {typeof option.label === 'object' 
                  ? Object.values(option.label)[0] 
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
                  alt={title}
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </div>
            )}
            <Upload
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                  handleValueChange({
                    filepath: URL.createObjectURL(file),
                    base64: reader.result,
                    filename: file.name
                  });
                };
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </div>
        );
        
      case 'audio':
        return (
          <div>
            {value && (
              <div style={{ marginBottom: '10px' }}>
                <audio 
                  src={typeof value === 'object' ? value.filepath || value.base64 : value} 
                  controls
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <Upload
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                  handleValueChange({
                    filepath: URL.createObjectURL(file),
                    base64: reader.result,
                    filename: file.name
                  });
                };
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Select Audio</Button>
            </Upload>
          </div>
        );
        
      case 'file':
        return (
          <div>
            {value && (
              <div style={{ marginBottom: '10px' }}>
                <Text>{typeof value === 'object' ? value.filename : value}</Text>
              </div>
            )}
            <Upload
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                  handleValueChange({
                    filepath: URL.createObjectURL(file),
                    base64: reader.result,
                    filename: file.name,
                    content: reader.result
                  });
                };
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </div>
        );
        
      default:
        return <Input value={value} onChange={(e) => handleValueChange(e.target.value)} placeholder={placeholder} />;
    }
  };
  
  // Get icon based on input type
  const getInputIcon = () => {
    switch (input.type) {
      case 'image':
        return <PictureOutlined />;
      case 'audio':
        return <SoundOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };
  
  return (
    <Card
      title={
        <Space>
          {getInputIcon()}
          <Text strong>{title}</Text>
          {input.required && <Text type="danger">*</Text>}
        </Space>
      }
      size="small"
      className="input-test-card"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {input.description && (
          <Text type="secondary">
            {typeof input.description === 'object' 
              ? Object.values(input.description)[0] 
              : input.description}
          </Text>
        )}
        
        <div className="input-test-field">
          {renderInput()}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Output: <code>{input.filename}</code>
          </Text>
          
          {value && (
            <Button 
              size="small" 
              danger 
              onClick={() => handleValueChange('')}
            >
              Clear
            </Button>
          )}
        </div>
      </Space>
    </Card>
  );
}; 