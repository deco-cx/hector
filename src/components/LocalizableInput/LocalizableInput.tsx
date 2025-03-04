import React, { useState } from 'react';
import { Input, Button, Space, Tooltip, InputProps } from 'antd';
import { GlobalOutlined, PlusOutlined } from '@ant-design/icons';
import { Localizable, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '../../types/i18n';
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
  const [activeLanguage, setActiveLanguage] = useState<string>(
    defaultLanguage || availableLanguages[0] || DEFAULT_LANGUAGE
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const newValue = { ...value };
      newValue[activeLanguage] = e.target.value;
      onChange(newValue);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setActiveLanguage(lang);
  };

  const navigateToLanguageTab = () => {
    // Navigate to the language tab in AppEditor
    navigate(`/app/${appName}`, { state: { activeTab: 'languages' } });
  };

  const renderLanguageToggle = () => {
    // If only one language is available, show the default language and "+" button
    if (availableLanguages.length <= 1) {
      return (
        <div className="language-indicator">
          <Tooltip key={DEFAULT_LANGUAGE} title={DEFAULT_LANGUAGE}>
            <Button
              type="text"
              size="small"
              className="active-language"
            >
              {languageEmojis[DEFAULT_LANGUAGE] || <GlobalOutlined />}
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

    // Otherwise, show all available languages
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