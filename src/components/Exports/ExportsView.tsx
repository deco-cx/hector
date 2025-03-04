import React, { useState } from 'react';
import { Card, Typography, Divider, Button, Space, Tabs, Alert, Input } from 'antd';
import { CopyOutlined, DownloadOutlined, CodeOutlined, Html5Outlined, FormOutlined } from '@ant-design/icons';
import '../JSONViewer/JSONViewer.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface ExportsViewProps {
  data: any;
}

// This function will convert the app configuration to a prompt that can be used to recreate the app
const appToPrompt = (appData: any): string => {
  return `
# App Builder Prompt

Build a React app with TypeScript for an AI App Builder called "Hector" with the following specifications:

## App Details
- Name: ${appData.name ? JSON.stringify(appData.name) : '"My App"'}
- ID: ${appData.id || 'my-app-id'}
- Template: ${appData.template || 'form'}
- Style: ${appData.style || 'minimalistic'}

## Setup WebdrawSDK
First, import the SDK with:
\`\`\`typescript
import { SDK } from "https://webdraw.com/webdraw-sdk@v1"
\`\`\`
For inline usage:
\`\`\`html
<script type="module">
  import { SDK } from "https://webdraw.com/webdraw-sdk@v1"
  const sdk = SDK;
  // Your code here
</script>
\`\`\`

## App Configuration
The app should have:

### Inputs
${appData.inputs && appData.inputs.length > 0 
  ? appData.inputs.map((input: any, index: number) => 
    `${index + 1}. Input: "${JSON.stringify(input.title)}" (Type: ${input.type}, Required: ${input.required})`
  ).join('\n')
  : '- No inputs defined'}

### Actions
${appData.actions && appData.actions.length > 0
  ? appData.actions.map((action: any, index: number) => 
    `${index + 1}. Action: ${action.type} - Output: ${action.output_filename || 'unnamed'}`
  ).join('\n')
  : '- No actions defined'}

### Outputs
${appData.output && appData.output.length > 0
  ? appData.output.map((output: any, index: number) => 
    `${index + 1}. Output Type: ${output.type} - Title: ${JSON.stringify(output.title)}`
  ).join('\n')
  : '- No outputs defined'}

## Full Configuration (for reference)
\`\`\`json
${JSON.stringify(appData, null, 2)}
\`\`\`

Follow the Hector App Builder design guidelines for UI implementation, using Ant Design components and focusing on a mobile-first approach.
`;
};

const ExportsView: React.FC<ExportsViewProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('json');
  const jsonString = JSON.stringify(data, null, 2);
  const promptString = appToPrompt(data);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadFile = (content: string, fileType: string, extension: string) => {
    const filename = `app-${data.id || 'config'}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    const blob = new Blob([content], { type: fileType });
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
    <Card className="exports-view-container">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'json',
            label: <span><CodeOutlined /> JSON</span>,
            children: (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <Title level={4}>App Configuration JSON</Title>
                  <Space>
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={() => copyToClipboard(jsonString)}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={() => downloadFile(jsonString, 'application/json', 'json')}
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
              </>
            )
          },
          {
            key: 'html',
            label: <span><Html5Outlined /> HTML</span>,
            children: (
              <>
                <Alert
                  message="Feature in Development"
                  description="Export as HTML functionality is currently a work in progress. This feature will allow you to export your app as a standalone HTML file that can be hosted anywhere."
                  type="info"
                  showIcon
                  style={{ marginBottom: '20px' }}
                />
                <div className="mb-4 flex justify-between items-center">
                  <Title level={4}>Export as HTML</Title>
                  <Space>
                    <Button 
                      icon={<DownloadOutlined />} 
                      disabled
                    >
                      Download HTML
                    </Button>
                  </Space>
                </div>
                <Divider />
                <div style={{ 
                  height: '300px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px dashed #d9d9d9'
                }}>
                  <Typography.Text type="secondary">
                    HTML Export Coming Soon
                  </Typography.Text>
                </div>
              </>
            )
          },
          {
            key: 'prompt',
            label: <span><FormOutlined /> Prompt</span>,
            children: (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <Title level={4}>Export as Cursor Prompt</Title>
                  <Space>
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={() => copyToClipboard(promptString)}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={() => downloadFile(promptString, 'text/plain', 'txt')}
                    >
                      Download Prompt
                    </Button>
                  </Space>
                </div>
                <Divider />
                <Paragraph>
                  <Text type="secondary">
                    This generates a prompt that you can use with Cursor to recreate this app, including instructions on how to import the Webdraw SDK.
                  </Text>
                </Paragraph>
                <TextArea
                  value={promptString}
                  readOnly
                  style={{ 
                    height: '60vh',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    padding: '16px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e8e8e8'
                  }}
                />
              </>
            )
          }
        ]}
      />
    </Card>
  );
};

export default ExportsView; 