import React, { useState } from 'react';
import { Steps, Card, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useWebdraw } from '../../providers/WebdrawProvider';
import { AppConfig } from '../../types/webdraw';
import { TemplateSelection } from './steps/TemplateSelection';
import { StyleGuide } from './steps/StyleGuide';
import { InputsConfig } from './steps/InputsConfig';
import { ActionsConfig } from './steps/ActionsConfig';
import { OutputConfig } from './steps/OutputConfig';

const steps = [
  {
    title: 'Template',
    description: 'Choose a starting point',
  },
  {
    title: 'Style',
    description: 'Define the look and feel',
  },
  {
    title: 'Inputs',
    description: 'Configure data collection',
  },
  {
    title: 'Actions',
    description: 'Set up AI operations',
  },
  {
    title: 'Output',
    description: 'Define the results format',
  },
];

export function AppCreationWizard() {
  const navigate = useNavigate();
  const { service } = useWebdraw();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<AppConfig, 'id' | 'name'>>({
    template: '',
    style: '',
    inputs: [],
    actions: [],
    output: {
      format: 'text',
      type: 'html',
      files: [],
      enableMarkdown: false,
      enableSyntaxHighlighting: false,
      maxLength: 1000,
    },
  });

  const stepComponents = [
    <TemplateSelection key="template" formData={formData} setFormData={setFormData} />,
    <StyleGuide key="style" formData={formData} setFormData={setFormData} />,
    <InputsConfig key="inputs" formData={formData} setFormData={setFormData} />,
    <ActionsConfig key="actions" formData={formData} setFormData={setFormData} />,
    <OutputConfig key="output" formData={formData} setFormData={setFormData} />,
  ];

  const next = () => {
    setCurrentStep(current => current + 1);
  };

  const prev = () => {
    setCurrentStep(current => current - 1);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Generate a unique ID for the app
      const appId = `app_${Date.now()}`;
      const appConfig: AppConfig = {
        id: appId,
        name: 'New App', // TODO: Add name input field
        ...formData as Omit<AppConfig, 'id' | 'name'>,
      };

      await service?.saveApp(appId, appConfig);
      message.success('App created successfully!');
      navigate('/');
    } catch (error) {
      message.error('Failed to create app. Please try again.');
      console.error('Error creating app:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return !!formData.template;
      case 1:
        return !!formData.style;
      case 2:
        return Array.isArray(formData.inputs) && formData.inputs.length > 0;
      case 3:
        return Array.isArray(formData.actions) && formData.actions.length > 0;
      case 4:
        return !!formData.output?.type;
      default:
        return false;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 24 }}
        />
        <div style={{ minHeight: 400, padding: '20px 0' }}>
          {stepComponents[currentStep]}
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 0 && (
            <Button onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button
              type="primary"
              onClick={next}
              disabled={!isStepValid()}
              style={{ marginLeft: 'auto' }}
            >
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!isStepValid()}
              style={{ marginLeft: 'auto' }}
            >
              Create App
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
} 