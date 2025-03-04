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
  // Get the unique action types from the app configuration
  const actionTypes = appData.actions ? [...new Set(appData.actions.map((action: any) => action.type))] : [];
  
  // Generate specific SDK implementation examples for each action type
  const sdkImplementationExamples = actionTypes.map((type: any) => {
    switch (type) {
      case 'generateText':
        return `
### Text Generation (${type})
\`\`\`javascript
async function generateText(prompt, inputs, previousOutputs, config) {
  // Process references in the prompt
  const processedPrompt = prompt.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
    return inputs[filename] || previousOutputs[filename] || match;
  });
  
  // Call the SDK
  const result = await SDK.ai.generateText({
    prompt: processedPrompt,
    model: config.model || "Best",
    temperature: config.temperature || 0.7,
    maxTokens: config.maxTokens || 1000
  });
  
  return result.text;
}
\`\`\``;
      case 'generateJSON':
        return `
### JSON Generation (${type})
\`\`\`javascript
async function generateJSON(prompt, inputs, previousOutputs, config) {
  // Process references in the prompt
  const processedPrompt = prompt.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
    return inputs[filename] || previousOutputs[filename] || match;
  });
  
  // Parse the schema
  let schema;
  try {
    schema = JSON.parse(config.schema);
  } catch (error) {
    console.error("Error parsing schema:", error);
    throw new Error("Invalid schema format");
  }
  
  // Call the SDK
  const result = await SDK.ai.generateObject({
    prompt: processedPrompt,
    model: config.model || "Best",
    temperature: config.temperature || 0.7,
    schema: schema
  });
  
  return result.object;
}
\`\`\``;
      case 'generateImage':
        return `
### Image Generation (${type})
\`\`\`javascript
async function generateImage(prompt, inputs, previousOutputs, config) {
  // Process references in the prompt
  const processedPrompt = prompt.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
    return inputs[filename] || previousOutputs[filename] || match;
  });
  
  // Call the SDK
  const result = await SDK.ai.generateImage({
    prompt: processedPrompt,
    model: config.model || "SDXL",
    size: config.size || "1024x1024",
    n: config.n || 1
  });
  
  return result.images[0]; // Return the first image URL
}
\`\`\``;
      case 'generateAudio':
        return `
### Audio Generation (${type})
\`\`\`javascript
async function generateAudio(prompt, inputs, previousOutputs, config) {
  // Process references in the prompt
  const processedPrompt = prompt.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
    return inputs[filename] || previousOutputs[filename] || match;
  });
  
  // Call the SDK
  const result = await SDK.ai.generateAudio({
    prompt: processedPrompt,
    model: config.model || "elevenlabs"
  });
  
  return result.audios[0]; // Return the first audio URL
}
\`\`\``;
      case 'generateVideo':
        return `
### Video Generation (${type})
\`\`\`javascript
async function generateVideo(prompt, inputs, previousOutputs, config) {
  // Process references in the prompt
  const processedPrompt = prompt.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
    return inputs[filename] || previousOutputs[filename] || match;
  });
  
  // Call the SDK
  const result = await SDK.ai.generateVideo({
    prompt: processedPrompt,
    model: config.model || "runway"
  });
  
  return result.video; // Return the video URL
}
\`\`\``;
      default:
        return `
### Unknown Action Type (${type})
This action type doesn't have a direct SDK implementation example.`;
    }
  }).join('\n');

  // Create a sample executeAction function
  const executeActionFn = `
\`\`\`javascript
// Unified action execution function
async function executeAction(action, inputs, previousResults) {
  const prompt = action.prompt.EN || action.prompt;
  const processedPrompt = prompt.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
    return inputs[filename] || previousResults[filename] || match;
  });
  
  const config = action.config || {};
  
  switch (action.type) {
    case 'generateText':
      const textResult = await SDK.ai.generateText({
        prompt: processedPrompt,
        model: config.model || "Best",
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000
      });
      return textResult.text;
      
    case 'generateJSON':
      const jsonResult = await SDK.ai.generateObject({
        prompt: processedPrompt,
        model: config.model || "Best",
        schema: typeof config.schema === 'string' ? JSON.parse(config.schema) : config.schema,
        temperature: config.temperature || 0.7
      });
      return jsonResult.object;
      
    case 'generateImage':
      const imageResult = await SDK.ai.generateImage({
        prompt: processedPrompt,
        model: config.model || "SDXL",
        size: config.size || "1024x1024",
        n: config.n || 1
      });
      return imageResult.images[0];
      
    case 'generateAudio':
      const audioResult = await SDK.ai.generateAudio({
        prompt: processedPrompt,
        model: config.model || "elevenlabs"
      });
      return audioResult.audios[0];
      
    case 'generateVideo':
      const videoResult = await SDK.ai.generateVideo({
        prompt: processedPrompt,
        model: config.model || "runway"
      });
      return videoResult.video;
      
    default:
      throw new Error(\`Unsupported action type: \${action.type}\`);
  }
}
\`\`\``;

  // Generate a Vue HTML template example
  let vueExample = '';
  if (appData.id) {
    const appName = (appData.name && typeof appData.name === 'object') 
      ? appData.name.EN || Object.values(appData.name)[0]
      : appData.name || 'Exported App';
    
    vueExample = `
## Standalone HTML+Vue Example

Here's a complete example of how to implement this app using Vue.js and the Webdraw SDK:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <!-- Import Vue.js -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <!-- Import Ant Design Vue -->
  <link rel="stylesheet" href="https://unpkg.com/ant-design-vue@3.2.20/dist/antd.min.css">
  <script src="https://unpkg.com/ant-design-vue@3.2.20/dist/antd.min.js"></script>
  <!-- Import Webdraw SDK -->
  <script type="module">
    import { SDK } from "https://webdraw.com/webdraw-sdk@v1";
    window.SDK = SDK;
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f0f2f5;
    }
    
    .app-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .input-section {
      background-color: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .output-section {
      background-color: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .content {
      white-space: pre-line;
      line-height: 1.6;
    }
    
    .loading-container {
      text-align: center;
      padding: 40px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="app-container">
      <div class="header">
        <h1>{{ appConfig.name }}</h1>
        <p>Created with Hector AI App Builder</p>
      </div>
      
      <div class="input-section">
        <h2>Input Information</h2>
        
        <a-form :model="formState" layout="vertical">
          <a-form-item 
            v-for="(input, index) in appConfig.inputs" 
            :key="index"
            :label="input.title.EN || input.title"
            :name="input.filename"
            :rules="[{ required: input.required, message: 'This field is required' }]"
          >
            <a-input 
              v-if="input.type === 'text'"
              v-model:value="formState[input.filename]"
              :placeholder="input.placeholder?.EN || input.placeholder || ''"
            />
            <a-textarea
              v-if="input.type === 'textarea'"
              v-model:value="formState[input.filename]"
              :placeholder="input.placeholder?.EN || input.placeholder || ''"
              :rows="4"
            />
            <a-upload
              v-if="input.type === 'image'"
              list-type="picture-card"
              :before-upload="beforeUpload"
              @change="handleChange"
            >
              <div v-if="!formState[input.filename]">
                <div style="margin-top: 8px">Upload</div>
              </div>
            </a-upload>
          </a-form-item>
          
          <a-form-item>
            <a-button 
              type="primary" 
              :loading="loading"
              @click="generateContent"
              block
            >
              Generate Content
            </a-button>
          </a-form-item>
        </a-form>
      </div>
      
      <div v-if="loading" class="loading-container">
        <a-spin tip="Generating content...">
          <div class="content" />
        </a-spin>
      </div>
      
      <div v-if="hasOutput && !loading" class="output-section">
        <template v-if="outputType === 'Story'">
          <h2>{{ output.title }}</h2>
          <img v-if="output.backgroundImage" :src="output.backgroundImage" alt="Generated image" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px;" />
          <div class="content" v-html="output.content"></div>
          <div v-if="output.audio" style="margin-top: 20px">
            <h3>Listen</h3>
            <audio controls style="width: 100%">
              <source :src="output.audio" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
          </div>
        </template>
      </div>
    </div>
  </div>
  
  <script type="module">
    // App configuration - replace with the actual exported configuration
    const appConfig = ${JSON.stringify(appData, null, 2)};
    
    // Vue application
    const app = Vue.createApp({
      data() {
        return {
          appConfig: appConfig,
          formState: {},
          output: null,
          outputType: '',
          loading: false,
          results: {}
        };
      },
      computed: {
        hasOutput() {
          return this.output !== null;
        }
      },
      methods: {
        // Initialize form state with empty values for each input
        initializeForm() {
          this.appConfig.inputs.forEach(input => {
            this.formState[input.filename] = '';
          });
        },
        
        // Handle image upload
        beforeUpload(file) {
          return false;
        },
        
        handleChange({ file, fileList }) {
          if (file.status !== 'uploading') {
            // Handle the file upload here
          }
        },
        
        // Process references in prompts
        processReferences(text) {
          return text.replace(/@([a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+)/g, (match, filename) => {
            return this.formState[filename] || this.results[filename] || match;
          });
        },
        
        // Generate content based on inputs
        async generateContent() {
          this.loading = true;
          this.output = null;
          this.results = {};
          
          try {
            // Execute each action in sequence
            for (const action of this.appConfig.actions) {
              const result = await this.executeAction(action);
              this.results[action.output_filename] = result;
            }
            
            // Process the output
            if (this.appConfig.output && this.appConfig.output.length > 0) {
              const outputTemplate = this.appConfig.output[0];
              this.outputType = outputTemplate.type;
              
              // Different handling based on output type
              if (outputTemplate.type === 'Story') {
                this.output = {
                  title: outputTemplate.title.EN || outputTemplate.title,
                  content: this.results[outputTemplate.content.replace('@', '')],
                  backgroundImage: outputTemplate.backgroundImage ? this.results[outputTemplate.backgroundImage.replace('@', '')] : null,
                  audio: outputTemplate.audio ? this.results[outputTemplate.audio.replace('@', '')] : null
                };
              } else {
                // Generic output handling
                this.output = {};
                for (const [key, value] of Object.entries(outputTemplate)) {
                  if (key !== 'type' && typeof value === 'string' && value.startsWith('@')) {
                    this.output[key] = this.results[value.replace('@', '')];
                  } else if (key !== 'type') {
                    this.output[key] = value;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error generating content:', error);
            this.$message.error('Failed to generate content. Please try again.');
          } finally {
            this.loading = false;
          }
        },
        
        // Execute a single action
        async executeAction(action) {
          const prompt = action.prompt.EN || action.prompt;
          const processedPrompt = this.processReferences(prompt);
          const config = action.config || {};
          
          switch (action.type) {
            case 'generateText':
              const textResult = await window.SDK.ai.generateText({
                prompt: processedPrompt,
                model: config.model || "Best",
                temperature: config.temperature || 0.7,
                maxTokens: config.maxTokens || 1000
              });
              return textResult.text;
              
            case 'generateImage':
              const imageResult = await window.SDK.ai.generateImage({
                prompt: processedPrompt,
                model: config.model || "SDXL",
                size: config.size || "1024x1024",
                n: config.n || 1
              });
              return imageResult.images[0];
              
            case 'generateAudio':
              const audioResult = await window.SDK.ai.generateAudio({
                prompt: processedPrompt,
                model: config.model || "elevenlabs"
              });
              return audioResult.audios[0];
              
            case 'generateJSON':
              const jsonResult = await window.SDK.ai.generateObject({
                prompt: processedPrompt,
                model: config.model || "Best",
                schema: typeof config.schema === 'string' ? JSON.parse(config.schema) : config.schema,
                temperature: config.temperature || 0.7
              });
              return jsonResult.object;
              
            case 'generateVideo':
              const videoResult = await window.SDK.ai.generateVideo({
                prompt: processedPrompt,
                model: config.model || "runway"
              });
              return videoResult.video;
              
            default:
              throw new Error(\`Unsupported action type: \${action.type}\`);
          }
        }
      },
      mounted() {
        this.initializeForm();
      }
    });
    
    app.use(antd);
    app.mount('#app');
  </script>
</body>
</html>
\`\`\``;
  }

  // Format the app details
  const appDetails = `
## App Details
- Name: ${appData.name ? (typeof appData.name === 'object' ? JSON.stringify(appData.name) : appData.name) : '"My App"'}
- ID: ${appData.id || 'my-app-id'}
- Template: ${appData.template || 'form'}
- Style: ${appData.style || 'minimalistic'}`;

  // Format inputs with more detail
  const inputsSection = `
## Inputs
${appData.inputs && appData.inputs.length > 0 
  ? appData.inputs.map((input: any, index: number) => {
    const title = input.title ? (typeof input.title === 'object' ? `"${input.title.EN || Object.values(input.title)[0]}"` : `"${input.title}"`) : '"Untitled"';
    return `${index + 1}. **${title}**
   - Type: \`${input.type || 'text'}\`
   - Required: \`${input.required || false}\`
   - Filename: \`${input.filename || 'untitled.md'}\`
   - Placeholder: ${input.placeholder ? (typeof input.placeholder === 'object' ? JSON.stringify(input.placeholder) : `"${input.placeholder}"`) : 'None'}`;
  }).join('\n\n')
  : '- No inputs defined'}`;

  // Format actions with more detail
  const actionsSection = `
## Actions
${appData.actions && appData.actions.length > 0
  ? appData.actions.map((action: any, index: number) => {
    const prompt = action.prompt ? (typeof action.prompt === 'object' ? `"${action.prompt.EN || Object.values(action.prompt)[0]}"` : `"${action.prompt}"`) : '"No prompt"';
    return `${index + 1}. **${action.type}** (${action.output_filename || 'unnamed'})
   - Prompt: ${prompt}
   - Configuration:
     \`\`\`json
     ${JSON.stringify(action.config || {}, null, 2)}
     \`\`\``;
  }).join('\n\n')
  : '- No actions defined'}`;

  // Format outputs with more detail
  const outputsSection = `
## Outputs
${appData.output && appData.output.length > 0
  ? appData.output.map((output: any, index: number) => {
    const title = output.title ? (typeof output.title === 'object' ? `"${output.title.EN || Object.values(output.title)[0]}"` : `"${output.title}"`) : '"Untitled"';
    
    let outputFields = '';
    for (const [key, value] of Object.entries(output)) {
      if (key !== 'type' && key !== 'title') {
        outputFields += `\n   - ${key}: \`${value}\``;
      }
    }
    
    return `${index + 1}. **${output.type}** - ${title}${outputFields}`;
  }).join('\n\n')
  : '- No outputs defined'}`;

  return `
# Hector App Export - ${appData.name ? (typeof appData.name === 'object' ? appData.name.EN || Object.values(appData.name)[0] : appData.name) : 'Untitled App'}

This document provides detailed instructions for implementing this Hector app using the Webdraw SDK directly. It includes full configuration details and code examples to recreate the app functionality in various environments.

${appDetails}

## Setup WebdrawSDK
First, import the SDK with:
\`\`\`typescript
import { SDK } from "https://webdraw.com/webdraw-sdk@v1"
\`\`\`

For inline HTML usage:
\`\`\`html
<script type="module">
  import { SDK } from "https://webdraw.com/webdraw-sdk@v1"
  const sdk = SDK;
  // Your code here
</script>
\`\`\`

${inputsSection}

${actionsSection}

${outputsSection}

## SDK Implementation Guide

Here are detailed implementations for each action type used in this app:

${sdkImplementationExamples}

### Generic Action Executor
This function can handle any action type in your app:
${executeActionFn}

${vueExample}

## Full Configuration (JSON Reference)
\`\`\`json
${JSON.stringify(appData, null, 2)}
\`\`\`

This export was generated by Hector AI App Builder. Use this information to recreate the app in your own environment.
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