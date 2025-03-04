import React from 'react';
import { Card } from 'antd';
import AvailableVariables from './AvailableVariables';
import { ActionData } from '../../../config/actionsConfig';
import { Localizable, DEFAULT_LANGUAGE } from '../../../types/i18n';
import LocalizableTextArea from '../../../components/LocalizableInput/LocalizableTextArea';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PromptTextAreaProps {
  value: string | Localizable<string>;
  onChange: (value: string | Localizable<string>) => void;
  placeholder?: string;
  rows?: number;
  inputs: Array<{
    name: string;
    label: string | Localizable<string>;
    type: string;
  }>;
  actions: ActionData[];
  currentActionIndex: number;
}

const PromptTextArea: React.FC<PromptTextAreaProps> = ({
  value,
  onChange,
  placeholder = 'Enter your prompt here...',
  rows = 4,
  inputs,
  actions,
  currentActionIndex
}) => {
  // Get the editor language to use for variable insertion
  const { editorLanguage = DEFAULT_LANGUAGE } = useLanguage();
  
  // Make sure value is a Localizable object
  const localizedValue = typeof value === 'string' 
    ? { [DEFAULT_LANGUAGE]: value } 
    : value || { [DEFAULT_LANGUAGE]: '' };
  
  return (
    <div className="prompt-textarea-container">
      <LocalizableTextArea
        value={localizedValue}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{ 
          marginBottom: 16,
        }}
      />
      
      <Card 
        size="small" 
        title={
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Variable References
          </div>
        } 
        style={{ 
          marginTop: 24,
          marginBottom: 16,
          borderRadius: '6px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <AvailableVariables 
          inputs={inputs}
          actions={actions}
          currentActionIndex={currentActionIndex}
          onVariableClick={(variable) => {
            // Insert the variable at the end of the current text for the active language
            const currentText = localizedValue[editorLanguage] || '';
            const newValue = {
              ...localizedValue,
              [editorLanguage]: currentText + (currentText ? ' ' : '') + variable
            };
            
            onChange(newValue);
          }}
        />
      </Card>
    </div>
  );
};

export default PromptTextArea; 