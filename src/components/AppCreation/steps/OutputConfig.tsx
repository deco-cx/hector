import React from 'react';
import { Typography, Form, Input, Select, Card, Space, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface OutputConfigProps {
  formData: {
    output: {
      format: string;
      template: string;
      enableMarkdown: boolean;
      enableSyntaxHighlighting: boolean;
      maxLength: number;
    };
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const outputFormats = [
  { label: 'Plain Text', value: 'text' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' },
  { label: 'JSON', value: 'json' },
];

export function OutputConfig({ formData, setFormData }: OutputConfigProps) {
  const handleOutputChange = (changedValues: any, allValues: any) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      output: allValues,
    }));
  };

  return (
    <div>
      <Title level={4}>Configure Output Format</Title>
      <Paragraph>
        Define how the AI's responses should be formatted and displayed in your application.
      </Paragraph>

      <Card>
        <Form
          layout="vertical"
          initialValues={formData.output}
          onValuesChange={handleOutputChange}
        >
          <Form.Item
            name="format"
            label="Output Format"
            tooltip={{
              title: 'Select the primary format for AI responses',
              icon: <InfoCircleOutlined />,
            }}
            rules={[{ required: true, message: 'Please select an output format' }]}
          >
            <Select options={outputFormats} />
          </Form.Item>

          <Form.Item
            name="template"
            label="Output Template"
            tooltip={{
              title: 'Define a template for structuring the AI response. Use {response} to reference the AI output.',
              icon: <InfoCircleOutlined />,
            }}
          >
            <TextArea
              rows={4}
              placeholder="Example: Here's what I found: {response}"
            />
          </Form.Item>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item
              name="maxLength"
              label="Maximum Response Length"
              tooltip={{
                title: 'Maximum number of characters in the AI response',
                icon: <InfoCircleOutlined />,
              }}
              rules={[
                { required: true, message: 'Please set a maximum length' },
                {
                  type: 'number',
                  min: 100,
                  max: 10000,
                  message: 'Length must be between 100 and 10000 characters',
                },
              ]}
            >
              <Input type="number" min={100} max={10000} />
            </Form.Item>

            <Card size="small" title="Advanced Options">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name="enableMarkdown"
                  valuePropName="checked"
                  label="Enable Markdown Support"
                  tooltip={{
                    title: 'Allow markdown formatting in responses',
                    icon: <InfoCircleOutlined />,
                  }}
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="enableSyntaxHighlighting"
                  valuePropName="checked"
                  label="Enable Syntax Highlighting"
                  tooltip={{
                    title: 'Highlight code blocks in responses',
                    icon: <InfoCircleOutlined />,
                  }}
                >
                  <Switch />
                </Form.Item>
              </Space>
            </Card>
          </Space>
        </Form>
      </Card>
    </div>
  );
} 