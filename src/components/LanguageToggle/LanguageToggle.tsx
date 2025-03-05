import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import { useHector } from '../../context/HectorContext';
import { CheckOutlined, GlobalOutlined } from '@ant-design/icons';
import './LanguageToggle.css';
import { ActionType } from '../../context/HectorReducer';
import { useHectorDispatch } from '../../context/HectorDispatchContext';

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
  const { appConfig } = useHector();
  const dispatch = useHectorDispatch();
  
  // Get the selected language from appConfig
  const selectedLanguage = appConfig?.selectedLanguage || 'en-US';
  
  // Function to update the selected language
  const setSelectedLanguage = (lang: string) => {
    if (appConfig) {
      dispatch({ 
        type: ActionType.UPDATE_APP_LANGUAGE, 
        payload: lang 
      });
    }
  };

  // Use provided value or selectedLanguage from context
  const activeLanguage = value || selectedLanguage;
  
  // Use provided onChange or setSelectedLanguage from context
  const handleLanguageChange = onChange || setSelectedLanguage;

  // Use prop availableLanguages if provided, otherwise use context supportedLanguages
  const availableLanguages = propAvailableLanguages || appConfig?.supportedLanguages || ['en-US'];

  return (
    <div className="language-toggle">
      <Space size={size === 'small' ? 2 : 4}>
        {availableLanguages.map((lang: string) => (
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
  const { appConfig } = useHector();
  const dispatch = useHectorDispatch();
  
  // Get the selected language from appConfig
  const selectedLanguage = appConfig?.selectedLanguage || 'en-US';
  
  // Function to update the selected language
  const setSelectedLanguage = (lang: string) => {
    if (appConfig) {
      dispatch({ 
        type: ActionType.UPDATE_APP_LANGUAGE, 
        payload: lang 
      });
    }
  };
  
  // Use prop availableLanguages if provided, otherwise use context supportedLanguages
  const availableLanguages = propAvailableLanguages || appConfig?.supportedLanguages || ['en-US'];
  
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