import React, { useState } from 'react';
import { Input, Button, Space, Tooltip, InputProps } from 'antd';
import { GlobalOutlined, PlusOutlined } from '@ant-design/icons';
import { Localizable, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '../../types/types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useParams } from 'react-router-dom';
import './LocalizableInput.css';

export interface LocalizableInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: Localizable<string>;
  onChange?: (value: Localizable<string>) => void;
  defaultLanguage?: string;
}

const languageEmojis: Record<string, string> = {
  'en-US': '🇺🇸',
  'es-ES': '🇪🇸',
  'fr-FR': '🇫🇷',
  'de-DE': '🇩🇪',
  'it-IT': '🇮🇹',
  'pt-BR': '🇧🇷',
  'zh-CN': '🇨🇳',
  'ja-JP': '🇯🇵',
  'ko-KR': '🇰🇷',
  'ru-RU': '🇷🇺',
};

export const LocalizableInput: React.FC<LocalizableInputProps> = ({
  value = {},
  onChange,
  defaultLanguage,
  ...props
}) => {
  const { availableLanguages } = useLanguage();
  const navigate = useNavigate();
  const { appName } = useParams<{ appName: string }>();
  
  // Initialize with default language, first available language, or fallback
  const initialLanguage = defaultLanguage || 
    (availableLanguages.length > 0 ? availableLanguages[0] : DEFAULT_LANGUAGE);
  
  const [activeLanguage, setActiveLanguage] = useState<string>(initialLanguage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // Create a deep copy of the value object to ensure we don't lose other language values
      const newValue = { ...value };
      
      // Set the value for the current active language
      newValue[activeLanguage] = e.target.value;
      
      console.log('LocalizableInput updating value:', newValue);
      onChange(newValue);
    }
  };

  const handleLanguageChange = (lang: string) => {
    // Log current value before switching language
    console.log('Changing language from', activeLanguage, 'to', lang);
    console.log('Current value before language change:', { ...value });
    
    // Set the active language
    setActiveLanguage(lang);
  };

  const navigateToLanguageTab = () => {
    // Navigate to the language tab in AppEditor
    navigate(`/app/${appName}`, { state: { activeTab: 'languages' } });
  };

  const renderLanguageToggle = () => {
    // If only one language is available, just show it with a "+" button
    if (availableLanguages.length <= 1) {
      return (
        <div className="language-indicator">
          <Tooltip key={availableLanguages[0] || DEFAULT_LANGUAGE} title={availableLanguages[0] || DEFAULT_LANGUAGE}>
            <Button
              type="text"
              size="small"
              className="active-language"
            >
              {languageEmojis[availableLanguages[0] || DEFAULT_LANGUAGE] || <GlobalOutlined />}
            </Button>
          </Tooltip>
          <Tooltip title="Add more languages">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={navigateToLanguageTab}
            />
          </Tooltip>
        </div>
      );
    }

    // Otherwise, show only the supported languages for this app
    return (
      <div className="language-indicator">
        {availableLanguages.map((lang: string) => (
          <Tooltip key={lang} title={lang}>
            <Button
              type="text"
              size="small"
              onClick={() => handleLanguageChange(lang)}
              className={activeLanguage === lang ? 'active-language' : ''}
            >
              {languageEmojis[lang] || <GlobalOutlined />}
            </Button>
          </Tooltip>
        ))}
      </div>
    );
  };

  // Log current value to help debugging
  console.log('Rendering LocalizableInput', { 
    activeLanguage, 
    value,
    currentValue: value[activeLanguage] || ''
  });

  return (
    <div className="localizable-input-container">
      <Input
        {...props}
        value={value[activeLanguage] || ''}
        onChange={handleInputChange}
        suffix={renderLanguageToggle()}
      />
    </div>
  );
};

export default LocalizableInput; 