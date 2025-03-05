import React, { useState } from 'react';
import { Input, Form, Tooltip, Button, Modal, Spin, message } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import { useHector } from '../../context/HectorContext';
import { Localizable, getLocalizedValue, setLocalizedValue, hasLanguage } from '../../types/types';
import './LocalizedField.css';

// Translation service mock - to be replaced with actual SDK implementation
const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
  // Mock implementation - simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (fromLang === 'en-US' && toLang === 'pt-BR') {
        // Simulate English to Portuguese
        if (text === 'Hello') resolve('Olá');
        else if (text === 'Name') resolve('Nome');
        else resolve(`${text} (traduzido)`);
      } else if (fromLang === 'pt-BR' && toLang === 'en-US') {
        // Simulate Portuguese to English
        if (text === 'Olá') resolve('Hello');
        else if (text === 'Nome') resolve('Name');
        else resolve(`${text} (translated)`);
      } else {
        // Default fallback
        resolve(`${text} (${toLang})`);
      }
    }, 1000); // Simulate network delay
  });
};

export interface LocalizedFieldProps {
  value?: Localizable<string>;
  onChange?: (value: Localizable<string>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowTranslation?: boolean;
  type?: 'input' | 'textarea';
  rows?: number;
}

const LocalizedField: React.FC<LocalizedFieldProps> = ({
  value = {},
  onChange,
  placeholder = '',
  label,
  required = false,
  allowTranslation = true,
  type = 'input',
  rows = 4,
}) => {
  const { appConfig } = useHector();
  const selectedLanguage = appConfig?.selectedLanguage || 'en-US';
  const [fieldLanguage, setFieldLanguage] = useState(selectedLanguage);
  const [translationVisible, setTranslationVisible] = useState(false);
  const [translationSource, setTranslationSource] = useState('');
  const [translationTarget, setTranslationTarget] = useState('');
  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  
  // Get the current value for the active language
  const currentValue = getLocalizedValue(value, fieldLanguage) || '';
  
  // Get supported languages from appConfig or use a fallback
  const supportedLanguages = appConfig?.supportedLanguages || ['en-US'];
  
  // Check which languages have content
  const languagesWithContent = supportedLanguages.filter((lang: string) => 
    hasLanguage(value, lang) && getLocalizedValue(value, lang) !== ''
  );
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChange) {
      const newValue = setLocalizedValue(value, fieldLanguage, e.target.value);
      onChange(newValue);
    }
  };
  
  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setFieldLanguage(lang);
  };
  
  // Open translation modal
  const openTranslation = (sourceLang: string) => {
    const sourceText = getLocalizedValue(value, sourceLang) || '';
    if (!sourceText) {
      message.warning(`No content available in ${sourceLang} to translate from.`);
      return;
    }
    
    setTranslationSource(sourceLang);
    setTranslationTarget(fieldLanguage);
    setTranslatedText('');
    setTranslationInProgress(true);
    setTranslationVisible(true);
    
    // Call translation service
    translateText(sourceText, sourceLang, fieldLanguage)
      .then(result => {
        setTranslatedText(result);
        setTranslationInProgress(false);
      })
      .catch(error => {
        console.error('Translation error:', error);
        message.error('Failed to translate text. Please try again.');
        setTranslationInProgress(false);
      });
  };
  
  // Apply translation
  const applyTranslation = () => {
    if (onChange && translatedText) {
      const newValue = setLocalizedValue(value, fieldLanguage, translatedText);
      onChange(newValue);
      setTranslationVisible(false);
    }
  };
  
  // Render input or textarea based on type
  const renderInput = () => {
    const commonProps = {
      value: currentValue,
      onChange: handleInputChange,
      placeholder: placeholder,
    };
    
    if (type === 'textarea') {
      return <Input.TextArea rows={rows} {...commonProps} />;
    }
    
    return <Input {...commonProps} />;
  };

  return (
    <div className="localized-field">
      {label && (
        <div className="localized-field-label">
          <span className={required ? 'ant-form-item-required' : ''}>
            {label}
          </span>
        </div>
      )}
      
      <div className="localized-field-content">
        <div className="localized-field-input">
          {renderInput()}
        </div>
        
        <div className="localized-field-controls">
          <LanguageToggle
            value={fieldLanguage}
            onChange={handleLanguageChange}
            size="small"
          />
          
          {allowTranslation && languagesWithContent.length > 0 && languagesWithContent[0] !== fieldLanguage && (
            <Tooltip title={`Translate from ${languagesWithContent[0].split('-')[0].toUpperCase()}`}>
              <Button
                type="text"
                size="small"
                icon={<TranslationOutlined />}
                onClick={() => openTranslation(languagesWithContent[0])}
              />
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* Translation Modal */}
      <Modal
        title={`Translate from ${translationSource.split('-')[0].toUpperCase()} to ${translationTarget.split('-')[0].toUpperCase()}`}
        open={translationVisible}
        onOk={applyTranslation}
        onCancel={() => setTranslationVisible(false)}
        okButtonProps={{ disabled: translationInProgress }}
        okText="Apply Translation"
        cancelText="Cancel"
      >
        <div className="translation-modal-content">
          <div className="translation-source">
            <div className="translation-label">Source ({translationSource.split('-')[0].toUpperCase()}):</div>
            <div className="translation-text">{getLocalizedValue(value, translationSource)}</div>
          </div>
          
          <div className="translation-target">
            <div className="translation-label">Translation ({translationTarget.split('-')[0].toUpperCase()}):</div>
            {translationInProgress ? (
              <Spin tip="Translating..." />
            ) : (
              <Input.TextArea
                value={translatedText}
                onChange={e => setTranslatedText(e.target.value)}
                rows={4}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Form-compatible wrapper
export const FormLocalizedField: React.FC<LocalizedFieldProps & { name: string }> = ({ name, ...props }) => {
  return (
    <Form.Item name={name} label={props.label} required={props.required}>
      <LocalizedField {...props} label={undefined} />
    </Form.Item>
  );
};

export default LocalizedField; 