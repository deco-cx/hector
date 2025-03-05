import React, { useState, useCallback, memo } from 'react';
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
  hideLanguageButtons?: boolean;
  showLanguageButtons?: boolean;
}

// Component for editing localizable text values
const LocalizableInput: React.FC<LocalizableInputProps> = memo(({
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
  hideLanguageButtons = false,
  showLanguageButtons = false,
}) => {
  const [fieldLanguage, setFieldLanguage] = useState<string | null>(null);
  const { appConfig, navigateToLanguageSettings } = useHector();
  
  // The language to edit - either the field-specific language or the global editor language
  const currentLanguage = fieldLanguage || (appConfig?.selectedLanguage || 'en-US');
  
  // Handle changes to the input value - optimized with useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const newValue = { ...value };
      newValue[currentLanguage] = e.target.value;
      onChange(newValue);
    }
  }, [onChange, value, currentLanguage]);
  
  // Memoize language button clicks
  const handleLanguageClick = useCallback((lang: string) => {
    setFieldLanguage(lang);
  }, []);
  
  // Get supported languages from appConfig or use a fallback
  const supportedLanguages = appConfig?.supportedLanguages || ['en-US'];
  
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
        
        {(showLanguageButtons && !hideLanguageButtons) && (
          <div className="language-buttons">
            <Space size={4}>
              {supportedLanguages.map((lang: string) => (
                <Tooltip key={lang} title={lang}>
                  <Button
                    type={lang === currentLanguage ? 'primary' : 'default'}
                    shape="circle"
                    size="small"
                    onClick={() => handleLanguageClick(lang)}
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
        )}
      </div>
    </div>
  );
});

export default LocalizableInput; 