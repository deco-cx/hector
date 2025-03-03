import React from 'react';
import { Typography, Radio, Space, Card, theme } from 'antd';
import { BgColorsOutlined, CodeOutlined, CrownOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

interface StyleGuideProps {
  formData: {
    style: string;
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const styles = [
  {
    id: 'minimalistic',
    name: 'Minimalistic',
    description: 'Clean and simple design with focus on content',
    icon: <CodeOutlined />,
    preview: {
      primary: '#1890ff',
      background: '#ffffff',
      border: '#f0f0f0',
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional interface with a professional look',
    icon: <BgColorsOutlined />,
    preview: {
      primary: '#52c41a',
      background: '#fafafa',
      border: '#d9d9d9',
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold colors',
    icon: <CrownOutlined />,
    preview: {
      primary: '#722ed1',
      background: '#f6f6f6',
      border: '#e8e8e8',
    },
  },
];

export function StyleGuide({ formData, setFormData }: StyleGuideProps) {
  const { token } = useToken();

  const handleStyleChange = (styleId: string) => {
    console.log('Style changing to:', styleId);
    
    // The problem is that we're returning a new object with only the style field
    // Let's log the full formData to see what we're working with
    console.log('Current formData in StyleGuide:', {
      id: formData.id,
      name: formData.name,
      style: formData.style,
      template: formData.template
    });
    
    // Update using the complete formData object to preserve all fields
    setFormData({
      ...formData,  // Keep all existing properties
      style: styleId // Update only the style
    });
  };

  return (
    <div>
      <Title level={4}>Choose a Style</Title>
      <Paragraph>
        Select a visual theme for your application. This will determine the colors,
        typography, and overall look and feel.
      </Paragraph>

      <Radio.Group
        value={formData.style}
        onChange={e => handleStyleChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {styles.map(style => (
            <Radio key={style.id} value={style.id} style={{ width: '100%' }}>
              <Card hoverable style={{ width: '100%' }}>
                <Space align="start">
                  <div
                    style={{
                      fontSize: '24px',
                      color: style.preview.primary,
                      padding: token.padding,
                      background: style.preview.background,
                      border: `1px solid ${style.preview.border}`,
                      borderRadius: token.borderRadius,
                    }}
                  >
                    {style.icon}
                  </div>
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{style.name}</Title>
                    <Paragraph style={{ margin: 0 }}>{style.description}</Paragraph>
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