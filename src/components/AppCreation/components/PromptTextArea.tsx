import React, { useEffect, useState } from 'react';
import { Typography, Select, Button, Space, Tag, Tooltip, Modal } from 'antd';
import { ActionData, InputField, Localizable, DEFAULT_LANGUAGE } from '../../../types/types';
import LocalizableTextArea from '../../../components/LocalizableInput/LocalizableTextArea';
import { useHector } from '../../../context/HectorContext';

interface PromptTextAreaProps {
  value: Localizable<string>;
  onChange: (value: Localizable<string> | string) => void;
  inputs?: InputField[];
  actions?: ActionData[];
  placeholder?: string;
  rows?: number;
}

const { Option } = Select;
const { Paragraph, Text } = Typography;

/**
 * Advanced text area component for editing prompts with variable insertion
 */
const PromptTextArea: React.FC<PromptTextAreaProps> = ({
  value = {},
  onChange,
  inputs = [],
  actions = [],
  placeholder = 'Type your prompt here...',
  rows = 10,
}) => {
  // Get the editor language to use for variable insertion
  const { appConfig } = useHector();
  const [currentLanguage, setCurrentLanguage] = useState<string>(appConfig?.selectedLanguage || DEFAULT_LANGUAGE);
  
  // Update currentLanguage when appConfig.selectedLanguage changes
  useEffect(() => {
    if (appConfig?.selectedLanguage) {
      setCurrentLanguage(appConfig.selectedLanguage);
    }
  }, [appConfig?.selectedLanguage]);
  
  // Make sure value is a Localizable object
  const localValue = typeof value === 'string' ? { [currentLanguage]: value } : value;
  
  // Handle changes to the textarea
  const handleChange = (newValue: Localizable<string>) => {
    onChange(newValue);
  };
  
  // Handle language change from LocalizableTextArea
  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
  };
  
  return (
    <div>
      <LocalizableTextArea
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        label="Prompt"
        maxLength={10000}
        showCount
        onLanguageChange={handleLanguageChange}
      />
      
      {/* Variable insertion UI */}
      <div style={{ marginTop: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Insert variables:
        </Text>
        <Space wrap style={{ marginTop: '4px' }}>
          {inputs.map((input) => (
            <Tag 
              key={input.filename}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const newValue = { ...localValue };
                const currentText = newValue[currentLanguage] || '';
                const variable = `{{${input.filename}}}`;
                newValue[currentLanguage] = currentText + (currentText ? ' ' : '') + variable;
                onChange(newValue);
              }}
            >
              {input.filename}
            </Tag>
          ))}
          
          {actions.map((action) => (
            <Tag
              key={action.id}
              color="purple"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const newValue = { ...localValue };
                const currentText = newValue[currentLanguage] || '';
                const variable = `{{${action.filename}}}`;
                newValue[currentLanguage] = currentText + (currentText ? ' ' : '') + variable;
                onChange(newValue);
              }}
            >
              {action.filename}
            </Tag>
          ))}
        </Space>
      </div>
    </div>
  );
};

export default PromptTextArea; 