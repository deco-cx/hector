import React, { useRef } from 'react';
import { Input, Card } from 'antd';
import AvailableVariables from './AvailableVariables';
import { ActionData } from '../../../config/actionsConfig';

const { TextArea } = Input;

interface PromptTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  inputs: Array<{
    name: string;
    label: string;
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
  const textAreaRef = useRef<any>(null);

  const handleVariableClick = (variable: string) => {
    // Get the current cursor position
    const textArea = textAreaRef.current?.resizableTextArea?.textArea;
    if (!textArea) return;

    const selectionStart = textArea.selectionStart;
    const selectionEnd = textArea.selectionEnd;
    
    // Insert the variable at the cursor position or replace selected text
    const newValue = 
      value.substring(0, selectionStart) +
      variable +
      value.substring(selectionEnd);
    
    onChange(newValue);
    
    // Set focus back to textarea and place cursor after the inserted variable
    setTimeout(() => {
      textArea.focus();
      const newPosition = selectionStart + variable.length;
      textArea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="prompt-textarea-container">
      <TextArea
        ref={textAreaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ 
          marginBottom: 16,
          resize: 'vertical',
          minHeight: '120px',
          borderRadius: '6px'  
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
          marginBottom: 16,
          borderRadius: '6px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <AvailableVariables 
          inputs={inputs}
          actions={actions}
          currentActionIndex={currentActionIndex}
          onVariableClick={handleVariableClick}
        />
      </Card>
    </div>
  );
};

export default PromptTextArea; 