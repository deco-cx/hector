import React, { useState, useEffect } from 'react';
import { Input, Tooltip, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useHector } from '../../context/HectorContext';
import './LocalizableInput.css';

const { TextArea } = Input;

// Language flag emoji mapping
const FLAG_EMOJI: Record<string, string> = {
  'en-US': '🇺🇸',
  'pt-BR': '🇧🇷',
};

interface LocalizableTextAreaProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  label?: string;
  maxLength?: number;
  showCount?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  rows?: number;
  onLanguageChange?: (language: string) => void;
}

// Component for editing localizable text values in a textarea
const LocalizableTextArea: React.FC<LocalizableTextAreaProps> = ({
  value = {},
  onChange,
  placeholder = 'Enter text...',
  name,
  disabled = false,
  label,
  maxLength,
  showCount = false,
  autoSize = { minRows: 4, maxRows: 8 },
  rows = 4,
  onLanguageChange
}) => {
  const [fieldLanguage, setFieldLanguage] = useState<string | null>(null);
  const { appConfig, navigateToLanguageSettings } = useHector();
  
  // The language to edit - either the field-specific language or the global editor language
  const currentLanguage = fieldLanguage || (appConfig?.selectedLanguage || 'en-US');
  
  // Get supported languages from appConfig or use a fallback
  const supportedLanguages = appConfig?.supportedLanguages || ['en-US'];
  
  // Handle changes to the textarea value
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      const newValue = { ...value };
      newValue[currentLanguage] = e.target.value;
      onChange(newValue);
    }
  };

  // Handle language change and notify parent component
  const handleLanguageChange = (lang: string) => {
    setFieldLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };
  
  // Notify parent of initial language and when language changes
  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(currentLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);
  
  return (
    <div className="localizable-input-container">
      {label && <div className="localizable-input-label">{label}</div>}
      
      <div className="localizable-textarea-wrapper">
        <TextArea
          value={value[currentLanguage] || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          name={name}
          maxLength={maxLength}
          showCount={showCount}
          autoSize={autoSize}
          rows={rows}
          className="localizable-textarea"
        />
        
        <div className="language-buttons">
          <Space size={4} direction="vertical">
            {supportedLanguages.map((lang: string) => (
              <Tooltip key={lang} title={lang}>
                <Button
                  type={lang === currentLanguage ? 'primary' : 'default'}
                  shape="circle"
                  size="small"
                  onClick={() => handleLanguageChange(lang)}
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

export default LocalizableTextArea; 