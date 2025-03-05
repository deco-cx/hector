import React, { useState } from 'react';
import { Input, Tooltip, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useHector } from '../../context/HectorContext';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import './LocalizableInput.css';

const { TextArea } = Input;

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
  rows = 4
}) => {
  const [isLanguagePickerVisible, setIsLanguagePickerVisible] = useState(false);
  const { availableLanguages, editorLanguage, setEditorLanguage } = useHector();
  
  // Handle changes to the textarea value
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      const newValue = { ...value };
      newValue[editorLanguage] = e.target.value;
      onChange(newValue);
    }
  };
  
  // Toggle language picker visibility
  const toggleLanguagePicker = () => {
    setIsLanguagePickerVisible(!isLanguagePickerVisible);
  };
  
  return (
    <div className="localizable-input-container">
      {label && <div className="localizable-input-label">{label}</div>}
      
      <div className="localizable-textarea-wrapper">
        <TextArea
          value={value[editorLanguage] || ''}
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
        
        <Tooltip title="Change language">
          <Button
            type="text"
            icon={<GlobalOutlined />}
            onClick={toggleLanguagePicker}
            className="language-toggle-button textarea-toggle"
          />
        </Tooltip>
      </div>
      
      {isLanguagePickerVisible && (
        <div className="language-picker">
          <LanguageToggle 
            value={editorLanguage}
            onChange={setEditorLanguage}
            availableLanguages={availableLanguages}
            showLabel
          />
        </div>
      )}
    </div>
  );
};

export default LocalizableTextArea; 