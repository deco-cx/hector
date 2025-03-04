import React, { useState } from 'react';
import { Input, Button, Space, Tooltip } from 'antd';
import { GlobalOutlined, PlusOutlined } from '@ant-design/icons';
import { Localizable, AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '../../types/types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useParams } from 'react-router-dom';
import './LocalizableInput.css';

const { TextArea } = Input;

export interface LocalizableTextAreaProps extends Omit<React.ComponentProps<typeof TextArea>, 'value' | 'onChange'> {
  value?: Localizable<string>;
  onChange?: (value: Localizable<string>) => void;
  defaultLanguage?: string;
  rows?: number;
  showLanguageToggle?: boolean;
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

export const LocalizableTextArea: React.FC<LocalizableTextAreaProps> = ({
  value = {},
  onChange,
  defaultLanguage,
  rows = 4,
  showLanguageToggle = true,
  ...props
}) => {
  const { availableLanguages } = useLanguage();
  const navigate = useNavigate();
  const { appName } = useParams<{ appName: string }>();
  const [activeLanguage, setActiveLanguage] = useState<string>(
    defaultLanguage || availableLanguages[0] || DEFAULT_LANGUAGE
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    if (appName) {
      navigate(`/apps/${appName}/edit/languages`);
    }
  };

  const renderLanguageToggle = () => {
    // If language toggle is disabled or only one language is available, don't show anything
    if (!showLanguageToggle || availableLanguages.length <= 1) {
      return null;
    }

    // Otherwise, show all available languages
    return (
      <div className="language-indicator" style={{ display: 'flex', alignItems: 'center' }}>
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
    <div>
      <TextArea
        {...props}
        value={value[activeLanguage] || ''}
        onChange={handleInputChange}
        rows={rows}
        style={{ 
          resize: 'vertical',
          minHeight: '120px',
          borderRadius: '6px',
          ...(props.style || {})
        }}
      />
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
        {renderLanguageToggle()}
      </div>
    </div>
  );
};

export default LocalizableTextArea; 