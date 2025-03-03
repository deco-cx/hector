import React from 'react';
import { Typography, Radio, Space, Card } from 'antd';
import { FormOutlined, QuestionOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface TemplateSelectionProps {
  formData: {
    template: string;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const templates = [
  {
    id: 'form',
    name: 'Form',
    description: 'Create a form-based application with AI-powered responses',
    icon: <FormOutlined />,
  },
  {
    id: 'quiz',
    name: 'Quiz (Coming Soon)',
    description: 'Build an interactive quiz with AI-generated questions and answers',
    icon: <QuestionOutlined />,
    disabled: true,
  },
];

export function TemplateSelection({ formData, setFormData }: TemplateSelectionProps) {
  const handleTemplateChange = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      template: templateId,
    }));
  };

  return (
    <div>
      <Title level={4}>Choose a Template</Title>
      <Paragraph>
        Select a template that best fits your application's needs. Each template provides
        a different starting point with pre-configured settings.
      </Paragraph>

      <Radio.Group
        value={formData.template}
        onChange={e => handleTemplateChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {templates.map(template => (
            <Radio
              key={template.id}
              value={template.id}
              disabled={template.disabled}
              style={{ width: '100%' }}
            >
              <Card
                hoverable={!template.disabled}
                style={{
                  width: '100%',
                  opacity: template.disabled ? 0.5 : 1,
                  cursor: template.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <Space align="start">
                  <div style={{ fontSize: '24px' }}>{template.icon}</div>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{template.name}</Title>
                    <Paragraph style={{ margin: 0 }}>{template.description}</Paragraph>
                  </div>
                </Space>
              </Card>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
} 