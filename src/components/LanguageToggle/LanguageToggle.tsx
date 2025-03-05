import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import { useHector } from '../../context/HectorContext';
import { CheckOutlined, GlobalOutlined } from '@ant-design/icons';
import './LanguageToggle.css';

// Language display names for each code
const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English',
  'pt-BR': 'Português',
};

// Flag emoji for each language
const FLAG_EMOJI: Record<string, string> = {
  'en-US': '🇺🇸',
  'pt-BR': '🇧🇷',
};

export interface LanguageToggleProps {
  onChange?: (lang: string) => void;
  value?: string;
  showLabel?: boolean;
  size?: 'small' | 'middle' | 'large';
  availableLanguages?: string[];
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  onChange,
  value,
  showLabel = false,
  size = 'middle',
  availableLanguages: propAvailableLanguages,
}) => {
  const { 
    selectedLanguage, 
    setSelectedLanguage, 
    editorLanguage, 
    setEditorLanguage,
    availableLanguages: contextAvailableLanguages 
  } = useHector();

  // Use provided value or editorLanguage from context
  const activeLanguage = value || editorLanguage;
  
  // Use provided onChange or setEditorLanguage from context
  const handleLanguageChange = onChange || setEditorLanguage;

  // Use prop availableLanguages if provided, otherwise use context availableLanguages
  const availableLanguages = propAvailableLanguages || contextAvailableLanguages;

  return (
    <div className="language-toggle">
      <Space size={size === 'small' ? 2 : 4}>
        {availableLanguages.map(lang => (
          <Tooltip key={lang} title={LANGUAGE_NAMES[lang]} placement="bottom">
            <Button
              type={lang === activeLanguage ? 'primary' : 'default'}
              shape="round"
              size={size}
              className={`language-toggle-button ${lang === activeLanguage ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang)}
              icon={<span className="language-flag">{FLAG_EMOJI[lang]}</span>}
            >
              {showLabel ? (
                <span className="language-name">{lang.split('-')[0].toUpperCase()}</span>
              ) : null}
              {lang === activeLanguage && <CheckOutlined className="language-check" />}
            </Button>
          </Tooltip>
        ))}
      </Space>
    </div>
  );
};

// App-level language toggle that changes the global language
export interface AppLanguageToggleProps {
  availableLanguages?: string[];
}

export const AppLanguageToggle: React.FC<AppLanguageToggleProps> = ({
  availableLanguages: propAvailableLanguages,
}) => {
  const { selectedLanguage, setSelectedLanguage, availableLanguages: contextAvailableLanguages } = useHector();
  
  // Use prop availableLanguages if provided, otherwise use context availableLanguages
  const availableLanguages = propAvailableLanguages || contextAvailableLanguages;
  
  return (
    <Tooltip title="Change application language">
      <Button 
        type="text" 
        icon={<GlobalOutlined />}
        onClick={() => {
          // Toggle between available languages
          const currentIndex = availableLanguages.indexOf(selectedLanguage);
          const nextIndex = (currentIndex + 1) % availableLanguages.length;
          setSelectedLanguage(availableLanguages[nextIndex]);
        }}
      >
        {selectedLanguage.split('-')[0].toUpperCase()}
      </Button>
    </Tooltip>
  );
};

export default LanguageToggle; 