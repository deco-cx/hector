import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Space, Modal, Progress, message, Alert, Divider, Tooltip } from 'antd';
import { TranslationOutlined, GlobalOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, getAvailableLanguages } from '../../types/i18n';
import { translateAppConfig } from '../../services/translationService';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import './LanguageSettings.css';
import { useWebdraw } from '../../context/WebdrawContext';

const { Title, Text, Paragraph } = Typography;

// Flag emoji for each language
const FLAG_EMOJI: Record<string, string> = {
  'en-US': '🇺🇸',
  'pt-BR': '🇧🇷',
};

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English',
  'pt-BR': 'Portuguese (Brazil)',
};

interface LanguageSettingsProps {
  formData: any;
  setFormData: (newData: any) => void;
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  formData,
  setFormData,
}) => {
  const { service } = useWebdraw();
  const { currentLanguage, setCurrentLanguage, setAvailableLanguages } = useLanguage();
  const [translationProgress, setTranslationProgress] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Refs to track previous values and avoid infinite loops
  const prevSupportedLanguagesRef = useRef<string[]>([]);
  const initialSetupDoneRef = useRef(false);
  
  // Get the current supported languages from the app config (with null safety)
  const supportedLanguages = formData?.supportedLanguages || [DEFAULT_LANGUAGE];
  
  // Run once on initial mount and when supportedLanguages actually changes
  useEffect(() => {
    // Skip if nothing changed (strict array equality check)
    const prevSupported = prevSupportedLanguagesRef.current;
    const supported = supportedLanguages;
    
    const areEqual = 
      prevSupported.length === supported.length && 
      prevSupported.every((lang, i) => lang === supported[i]);
    
    if (areEqual && initialSetupDoneRef.current) {
      return; // Skip if languages haven't changed and initial setup is done
    }
    
    // Set available languages and update refs
    console.log('Updating language settings with supported languages:', supported);
    setAvailableLanguages(supported);
    prevSupportedLanguagesRef.current = [...supported];
    
    // Check if current language needs to be changed
    if (!supported.includes(currentLanguage)) {
      console.log('Current language not supported, switching to default:', DEFAULT_LANGUAGE);
      setCurrentLanguage(DEFAULT_LANGUAGE);
    }
    
    // Mark initial setup as complete
    initialSetupDoneRef.current = true;
    
  }, [supportedLanguages, currentLanguage, setCurrentLanguage, setAvailableLanguages]);
  
  const startTranslation = async (sourceLang: string, targetLang: string) => {
    setIsTranslating(true);
    setTranslationProgress(0);
    
    try {
      // Set up progress tracking
      const updateProgress = (progress: number) => {
        setTranslationProgress(Math.round(progress * 100));
      };
      
      // Start with 10% progress to show activity
      updateProgress(0.1);
      
      // Simulate progress updates (in a real implementation, this would come from the translation service)
      const progressInterval = setInterval(() => {
        setTranslationProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 500);
      
      // Perform the actual translation
      const updatedConfig = await translateAppConfig(
        service,
        formData,
        sourceLang,
        targetLang
      );
      
      // Clear the interval and set to 100%
      clearInterval(progressInterval);
      setTranslationProgress(100);
      
      // Update the app config with the translated content
      setFormData(updatedConfig);
      
      // Show success message
      message.success(`Successfully translated content from ${LANGUAGE_NAMES[sourceLang]} to ${LANGUAGE_NAMES[targetLang]}`);
      
      // Short delay before closing the progress modal
      setTimeout(() => {
        setIsTranslating(false);
      }, 1000);
      
    } catch (error) {
      console.error('Translation error:', error);
      message.error(`Failed to translate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsTranslating(false);
    }
  };
  
  const addLanguage = (lang: string) => {
    // Check if language is already supported
    if (supportedLanguages.includes(lang)) {
      message.info(`${LANGUAGE_NAMES[lang]} is already supported`);
      return;
    }
    
    Modal.confirm({
      title: `Add ${LANGUAGE_NAMES[lang]} support?`,
      icon: <GlobalOutlined />,
      content: (
        <div>
          <p>Do you want to add support for {LANGUAGE_NAMES[lang]}?</p>
          <p>You can choose to:</p>
          <ul>
            <li>Add empty fields (you'll need to fill in translations manually)</li>
            <li>Translate existing content from {LANGUAGE_NAMES[currentLanguage]} (using AI)</li>
          </ul>
        </div>
      ),
      okText: 'Add Empty Fields',
      cancelText: 'Cancel',
      okButtonProps: { type: 'default' },
      onOk: () => {
        // Add the language to supported languages without translation
        const updatedConfig = {
          ...formData,
          supportedLanguages: [...supportedLanguages, lang]
        };
        
        setFormData(updatedConfig);
        message.success(`Added ${LANGUAGE_NAMES[lang]} support with empty fields`);
      },
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <Button 
            type="primary" 
            onClick={() => {
              Modal.destroyAll();
              
              // Add the language and then start translation
              const updatedConfig = {
                ...formData,
                supportedLanguages: [...supportedLanguages, lang]
              };
              
              setFormData(updatedConfig);
              startTranslation(currentLanguage, lang);
            }}
            icon={<TranslationOutlined />}
          >
            Add & Translate Content
          </Button>
          <OkBtn />
          <CancelBtn />
        </>
      ),
    });
  };
  
  const removeLanguage = (lang: string) => {
    // Prevent removing the default language
    if (lang === DEFAULT_LANGUAGE) {
      message.error(`Cannot remove ${LANGUAGE_NAMES[DEFAULT_LANGUAGE]} as it is the default language`);
      return;
    }
    
    Modal.confirm({
      title: `Remove ${LANGUAGE_NAMES[lang]} support?`,
      icon: <ExclamationCircleOutlined />,
      content: `This will remove all translations for ${LANGUAGE_NAMES[lang]} from your app. This action cannot be undone.`,
      okText: 'Remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        // Create a deep copy of the app config
        const updatedConfig = JSON.parse(JSON.stringify(formData));
        
        // Remove the language from supported languages
        updatedConfig.supportedLanguages = supportedLanguages.filter((l: string) => l !== lang);
        
        // Helper function to remove a language from a localizable field
        const removeLanguageFromField = (field: any) => {
          if (field && typeof field === 'object' && field[lang] !== undefined) {
            const newField = { ...field };
            delete newField[lang];
            return newField;
          }
          return field;
        };
        
        // Recursively process the config to remove the language
        const processObject = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return obj;
          
          // Handle arrays
          if (Array.isArray(obj)) {
            return obj.map(item => processObject(item));
          }
          
          // Handle objects
          const result: any = {};
          for (const key in obj) {
            // Check if this is a localizable field
            if (obj[key] && typeof obj[key] === 'object' && obj[key][DEFAULT_LANGUAGE] !== undefined) {
              result[key] = removeLanguageFromField(obj[key]);
            } else {
              result[key] = processObject(obj[key]);
            }
          }
          return result;
        };
        
        // Process the entire config
        const cleanedConfig = processObject(updatedConfig);
        
        // Update the app config
        setFormData(cleanedConfig);
        
        // If the current language was removed, switch to the default language
        if (currentLanguage === lang) {
          setCurrentLanguage(DEFAULT_LANGUAGE);
        }
        
        message.success(`Removed ${LANGUAGE_NAMES[lang]} support`);
      },
    });
  };
  
  // Get the list of available languages that aren't already supported
  const availableToAdd = AVAILABLE_LANGUAGES.filter(lang => !supportedLanguages.includes(lang));
  
  return (
    <div className="language-settings">
      <Card className="language-settings-card">
        <Title level={3}>Language Settings</Title>
        <Paragraph>
          Configure which languages your app supports and manage translations.
        </Paragraph>
        
        {/* Current Language Section */}
        <div className="current-language-section">
          <Title level={4}>Current Editing Language</Title>
          <Paragraph>
            Select the language you want to edit content in:
          </Paragraph>
          <LanguageToggle 
            value={currentLanguage}
            onChange={setCurrentLanguage}
            showLabel
          />
        </div>
        
        <Divider />
        
        {/* Supported Languages Section */}
        <div className="supported-languages-section">
          <Title level={4}>Supported Languages</Title>
          <Paragraph>
            Your app currently supports the following languages:
          </Paragraph>
          
          <div className="language-list">
            {supportedLanguages.map((lang: string) => (
              <div key={lang} className="language-item">
                <Space>
                  <span>{FLAG_EMOJI[lang]}</span>
                  <Text strong>{LANGUAGE_NAMES[lang]}</Text>
                  {lang === DEFAULT_LANGUAGE && (
                    <Text type="secondary">(Default)</Text>
                  )}
                </Space>
                
                {lang !== DEFAULT_LANGUAGE && (
                  <Button 
                    danger
                    size="small"
                    onClick={() => removeLanguage(lang)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <Divider />
        
        {/* Add Language Section */}
        <div className="add-language-section">
          <Title level={4}>Add Language</Title>
          <Paragraph>
            Add support for additional languages:
          </Paragraph>
          
          <Space wrap>
            {availableToAdd.map((lang: string) => (
              <Button 
                key={lang}
                onClick={() => addLanguage(lang)}
                icon={<span>{FLAG_EMOJI[lang]}</span>}
              >
                {LANGUAGE_NAMES[lang]}
              </Button>
            ))}
          </Space>
          
          {availableToAdd.length === 0 && (
            <Alert
              message="All available languages are already supported"
              type="info"
              showIcon
            />
          )}
        </div>
        
        <Divider />
        
        {/* Translation Section */}
        <div className="translation-section">
          <Title level={4}>Translation</Title>
          <Paragraph>
            Translate content between languages:
          </Paragraph>
          
          {supportedLanguages.length > 1 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="AI-Assisted Translation"
                description="Use AI to translate content from one language to another. This will translate all empty fields in the target language."
                type="info"
                showIcon
              />
              
              <Space wrap>
                {supportedLanguages.map((sourceLang: string) => (
                  supportedLanguages
                    .filter((targetLang: string) => targetLang !== sourceLang)
                    .map((targetLang: string) => (
                      <Button
                        key={`${sourceLang}-${targetLang}`}
                        onClick={() => startTranslation(sourceLang, targetLang)}
                        icon={<TranslationOutlined />}
                      >
                        {FLAG_EMOJI[sourceLang]} → {FLAG_EMOJI[targetLang]}
                      </Button>
                    ))
                ))}
              </Space>
            </Space>
          ) : (
            <Alert
              message="Add more languages to enable translation"
              type="warning"
              showIcon
            />
          )}
        </div>
      </Card>
      
      {/* Translation Progress Modal */}
      <Modal
        title="Translating Content"
        open={isTranslating}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <div style={{ textAlign: 'center' }}>
          <Progress 
            type="circle" 
            percent={translationProgress} 
            status={translationProgress < 100 ? "active" : "success"}
          />
          <div style={{ marginTop: 16 }}>
            <Text>
              {translationProgress < 100 
                ? "Translating your content using AI..." 
                : "Translation complete!"}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Export a memoized version of the component to prevent unnecessary re-renders
export default React.memo(LanguageSettings); 