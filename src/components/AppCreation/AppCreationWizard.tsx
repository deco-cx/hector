import React, { useState } from 'react';
import { Steps, Card, Button } from 'antd';
import { ActionsConfig as ActionsConfigStep } from './steps/ActionsConfig';
import { OutputConfig } from './steps/OutputConfig';
import { InputField, createDefaultLocalizable } from '../../types/types';

// Mock components to be implemented later
const TemplateSelection = () => (
  <div>Template Selection Component (To be implemented)</div>
);

const StyleGuide = () => (
  <div>Style Guide Component (To be implemented)</div>
);

const InputsConfig = () => (
  <div>Inputs Configuration Component (To be implemented)</div>
);

const steps = [
  {
    title: 'Template',
    description: 'Choose a template',
  },
  {
    title: 'Style Guide',
    description: 'Define visual style',
  },
  {
    title: 'Inputs',
    description: 'Define input fields',
  },
  {
    title: 'Actions',
    description: 'Configure AI actions',
  },
  {
    title: 'Output',
    description: 'Configure output format',
  },
];

const AppCreationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(3); // Start at the Actions step for testing
  const [formData, setFormData] = useState({
    template: 'form',
    style: 'minimalistic',
    inputs: [
      { 
        filename: 'child_name.md', 
        type: 'text' as const, 
        title: createDefaultLocalizable('Child Name'),
        required: true
      },
      { 
        filename: 'age.md', 
        type: 'text' as const, 
        title: createDefaultLocalizable('Age'),
        required: false
      }
    ] as InputField[],
    actions: [],
    output: [],
  });

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <TemplateSelection />;
      case 1:
        return <StyleGuide />;
      case 2:
        return <InputsConfig />;
      case 3:
        return <ActionsConfigStep formData={formData} setFormData={setFormData} />;
      case 4:
        return <OutputConfig formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
      <Card>
        {renderStepContent()}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 0 && (
            <Button onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary">
              Save App
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AppCreationWizard; 