import React, { useState } from 'react';
import { Input, Tooltip, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useHector } from '../../context/HectorContext';
import './LocalizableInput.css';

// Language flag emoji mapping
const FLAG_EMOJI: Record<string, string> = {
  'en-US': '🇺🇸',
  'pt-BR': '🇧🇷',
};

interface LocalizableInputProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  label?: string;
  maxLength?: number;
  showCount?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  enableRichText?: boolean;
}

// Component for editing localizable text values
const LocalizableInput: React.FC<LocalizableInputProps> = ({
  value = {},
  onChange,
  placeholder = 'Enter text...',
  name,
  disabled = false,
  label,
  maxLength,
  showCount = false,
  autoSize,
  enableRichText = false,
}) => {
  const [fieldLanguage, setFieldLanguage] = useState<string | null>(null);
  const { availableLanguages, editorLanguage, navigateToLanguageSettings } = useHector();
  
  // The language to edit - either the field-specific language or the global editor language
  const currentLanguage = fieldLanguage || editorLanguage;
  
  // Handle changes to the input value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const newValue = { ...value };
      newValue[currentLanguage] = e.target.value;
      onChange(newValue);
    }
  };
  
  return (
    <div className="localizable-input-container">
      {label && <div className="localizable-input-label">{label}</div>}
      
      <div className="localizable-input-wrapper">
        <Input
          value={value[currentLanguage] || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          maxLength={maxLength}
          showCount={showCount}
          className="localizable-input"
        />
        
        <div className="language-buttons">
          <Space size={4}>
            {availableLanguages.map(lang => (
              <Tooltip key={lang} title={lang}>
                <Button
                  type={lang === currentLanguage ? 'primary' : 'default'}
                  shape="circle"
                  size="small"
                  onClick={() => setFieldLanguage(lang)}
                  className={`language-flag-button ${lang === currentLanguage ? 'active' : ''}`}
                >
                  {FLAG_EMOJI[lang]}
                </Button>
              </Tooltip>
            ))}
            
            <Tooltip title="Add language">
              <Button
                type="default"
                shape="circle"
                icon={<PlusOutlined />}
                onClick={navigateToLanguageSettings}
                size="small"
                className="add-language-button"
              />
            </Tooltip>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default LocalizableInput; 