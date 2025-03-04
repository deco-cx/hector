import React from 'react';
import { Card, Typography, Divider, Button, Space } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import './JSONViewer.css';

const { Title, Paragraph, Text } = Typography;

interface JSONViewerProps {
  data: any;
}

const JSONViewer: React.FC<JSONViewerProps> = ({ data }) => {
  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
  };

  const downloadJSON = () => {
    const filename = `app-config-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return (
    <Card className="json-viewer-container">
      <div className="mb-4 flex justify-between items-center">
        <Title level={4}>App Configuration JSON</Title>
        <Space>
          <Button 
            icon={<CopyOutlined />} 
            onClick={copyToClipboard}
          >
            Copy to Clipboard
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={downloadJSON}
          >
            Download JSON
          </Button>
        </Space>
      </div>
      <Divider />
      <Paragraph>
        <Text type="secondary">
          This view shows the raw JSON configuration of your app, including all language translations.
        </Text>
      </Paragraph>
      <pre 
        style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '16px',
          borderRadius: '8px',
          overflowX: 'auto',
          fontSize: '14px',
          lineHeight: '1.5',
          maxHeight: '70vh',
          border: '1px solid #e8e8e8'
        }}
      >
        {jsonString}
      </pre>
    </Card>
  );
};

export default JSONViewer; 