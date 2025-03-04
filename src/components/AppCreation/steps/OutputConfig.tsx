import React, { useState } from 'react';
import { Typography, Card, Button, Space, Empty, Tabs, Tooltip, Modal, Form, Row, Col, Input } from 'antd';
import { InfoCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { OutputTemplate, OutputTemplateType, getLocalizedValue, DEFAULT_LANGUAGE } from '../../../types/types';
import { availableOutputTemplates, createOutputTemplate, templateFieldFileTypes } from '../../../config/outputsConfig';
import RJSFForm from '@rjsf/antd';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import FileReferenceField from '../components/FileReferenceField';
import LocalizableInput from '../../../components/LocalizableInput/LocalizableInput';
import FileSelector from '../components/FileSelector';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

// Custom widgets for RJSF
const widgets = {
  FileReferenceWidget: FileReferenceField
};

interface OutputConfigProps {
  formData: {
    output: OutputTemplate[];
    [key: string]: any;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export function OutputConfig({ formData, setFormData }: OutputConfigProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isAddTemplateModalVisible, setIsAddTemplateModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<OutputTemplate | null>(null);

  // Ensure output array exists
  const outputs = Array.isArray(formData.output) ? formData.output : [];

  // Update outputs in the parent state
  const updateOutputs = (newOutputs: OutputTemplate[]) => {
    console.log('updateOutputs called with:', newOutputs);
    setFormData((prev: any) => {
      console.log('Previous formData:', prev);
      const updated = {
        ...prev,
        output: newOutputs,
      };
      console.log('Updated formData:', updated);
      return updated;
    });
  };

  // Handle template selection in modal
  const handleAddTemplate = (type: OutputTemplateType) => {
    console.log('Adding template of type:', type);
    
    try {
      // Create a new template
      const newTemplate = createOutputTemplate(type);
      console.log('Created new template:', newTemplate);
      
      // Add to outputs array
      const newOutputs = [...outputs, newTemplate];
      console.log('New outputs array:', newOutputs);
      
      // First close the modal
      setIsAddTemplateModalVisible(false);
      
      // Update parent state with a direct object rather than a function
      const updatedFormData = {
        output: newOutputs
      };
      console.log('Passing to setFormData:', updatedFormData);
      setFormData(updatedFormData);
      
      // Finally set the active tab
      setTimeout(() => {
        setActiveTab(type);
        console.log('Set active tab to:', type);
      }, 0);
    } catch (error) {
      console.error('Error adding template:', error);
      // You can add an alert or message here to inform the user
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = (type: OutputTemplateType) => {
    const newOutputs = outputs.filter(output => output.type !== type);
    
    // Update parent state with a direct object rather than a function
    const updatedFormData = {
      output: newOutputs
    };
    console.log('Deleting template, new outputs:', newOutputs);
    setFormData(updatedFormData);
    
    // Reset active tab if deleted
    if (activeTab === type) {
      setActiveTab(newOutputs.length > 0 ? newOutputs[0].type : null);
    }
  };

  // Update template configuration
  const handleConfigChange = (type: OutputTemplateType, formData: any) => {
    console.log('handleConfigChange called with:', formData);
    
    // Handle the case where Ant Form returns values with different structure than our template
    const updatedTemplate = { 
      ...formData,
      // Ensure we preserve the template type
      type
    };
    
    // FileSelector already handles the @ prefix, so we don't need the prefix logic anymore
    
    // Update the outputs array
    const newOutputs = outputs.map(output => {
      if (output.type === type) {
        return updatedTemplate;
      }
      return output;
    });
    
    // Update parent state with a direct object
    const updatedFormData = {
      output: newOutputs
    };
    console.log('Updating template, new outputs:', newOutputs);
    setFormData(updatedFormData);
  };

  // Show preview of the template
  const handleShowPreview = (template: OutputTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewModalVisible(true);
  };

  // Get available template types that haven't been added yet
  const getAvailableTemplateTypes = () => {
    const existingTypes = new Set(outputs.map(output => output.type));
    const availableTypes = Object.keys(availableOutputTemplates).filter(
      type => !existingTypes.has(type as OutputTemplateType)
    ) as OutputTemplateType[];
    
    console.log('Available template types:', availableTypes);
    console.log('Available templates object:', availableOutputTemplates);
    
    return availableTypes;
  };

  // Get template by type
  const getTemplateByType = (type: OutputTemplateType): OutputTemplate | undefined => {
    return outputs.find(output => output.type === type);
  };

  // Render the preview modal
  const renderPreviewModal = () => {
    if (!previewTemplate) return null;

    return (
      <Modal
        title="Output Preview"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <Paragraph>
            This is a placeholder for the output preview.
            The actual preview will be implemented in the future.
          </Paragraph>
          <pre style={{ backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify(previewTemplate, null, 2)}
          </pre>
        </div>
      </Modal>
    );
  };

  // Create UI schema for the form with file widgets
  const createUiSchema = (type: OutputTemplateType) => {
    const uiSchema: Record<string, any> = {
      "ui:submitButtonOptions": {
        norender: true, // Hide submit button
      }
    };
    
    // For each field that should use the file widget
    const templateConfig = availableOutputTemplates[type];
    const properties = templateConfig.schema.properties || {};
    
    Object.entries(properties).forEach(([key, prop]) => {
      // If property is described in templateFieldFileTypes
      if (templateFieldFileTypes[key]) {
        uiSchema[key] = {
          "ui:widget": "FileReferenceWidget"
        };
      }
    });
    
    return uiSchema;
  };

  // Render tab contents for a template
  const renderTemplateForm = (type: OutputTemplateType) => {
    const template = getTemplateByType(type);
    if (!template) return null;

    const templateConfig = availableOutputTemplates[type];
    
    return (
      <div>
        <Card 
          className="output-template-card"
          title={template.title && getLocalizedValue(template.title, DEFAULT_LANGUAGE) || 'Output Template'}
          extra={
            <Space>
              <Tooltip title="Preview Output">
                <Button 
                  icon={<EyeOutlined />} 
                  onClick={() => handleShowPreview(template)}
                >
                  Preview
                </Button>
              </Tooltip>
              <Tooltip title="Delete Template">
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDeleteTemplate(type)}
                >
                  Delete
                </Button>
              </Tooltip>
            </Space>
          }
        >
          <Form
            layout="vertical"
            initialValues={{
              ...template,
              // No need to remove @ from file references - the FileSelector handles this
            }}
            onValuesChange={(changedValues, allValues) => handleConfigChange(type, allValues)}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name={['title']}
                  label="Title"
                  rules={[{ required: true, message: 'Title is required' }]}
                >
                  <LocalizableInput placeholder="Enter template title" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16} className="mb-4">
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="backgroundImage"
                  label="Background Image"
                  extra="Select an image file for the background"
                >
                  <FileSelector 
                    placeholder="Select an image file" 
                    fileType="image"
                    appData={formData as any}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="audio"
                  label="Audio Narration"
                  extra="Select an audio file for narration"
                >
                  <FileSelector 
                    placeholder="Select an audio file" 
                    fileType="audio"
                    appData={formData as any}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="content"
              label="Content"
              extra="Select a markdown or text file for the story content"
            >
              <FileSelector 
                placeholder="Select a content file" 
                fileType="text"
                appData={formData as any}
              />
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <Title level={4}>Configure Output</Title>
      <Paragraph>
        Define how the AI's responses should be formatted and displayed in your application.
        Select a template type to configure your output.
      </Paragraph>
      
      {(() => { 
        console.log('Rendering OutputConfig with outputs:', outputs); 
        console.log('Is add template modal visible:', isAddTemplateModalVisible);
        console.log('Active tab:', activeTab);
        return null; 
      })()}
      
      <Card>
        {outputs.length === 0 ? (
          <Empty
            description="No output templates added yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsAddTemplateModalVisible(true)}
            >
              Add Output Template
            </Button>
          </Empty>
        ) : (
          <>
            <Tabs
              activeKey={activeTab || outputs[0].type}
              onChange={key => setActiveTab(key as OutputTemplateType)}
              tabBarExtraContent={
                getAvailableTemplateTypes().length > 0 && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddTemplateModalVisible(true)}
                  >
                    Add Template
                  </Button>
                )
              }
            >
              {outputs.map(output => (
                <TabPane 
                  tab={availableOutputTemplates[output.type].label} 
                  key={output.type}
                >
                  {renderTemplateForm(output.type)}
                </TabPane>
              ))}
            </Tabs>
          </>
        )}
      </Card>

      {/* Modal for adding new template */}
      <Modal
        title="Add Output Template"
        open={isAddTemplateModalVisible}
        onCancel={() => setIsAddTemplateModalVisible(false)}
        footer={null}
      >
        {(() => {
          const availableTypes = getAvailableTemplateTypes();
          console.log('Rendering modal content, available types:', availableTypes);
          
          if (availableTypes.length === 0) {
            return (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Typography.Text>All available template types have been added.</Typography.Text>
              </div>
            );
          }
          
          return null;
        })()}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {getAvailableTemplateTypes().map(type => (
            <Card 
              key={type}
              hoverable
              style={{ marginBottom: '8px', cursor: 'pointer' }}
              onClick={() => {
                console.log('Card clicked for template type:', type);
                handleAddTemplate(type);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: '12px' }}>
                  {/* You can use dynamic icons here if needed */}
                  <span style={{ fontSize: '24px' }}>📄</span>
                </div>
                <div>
                  <Typography.Text strong>{availableOutputTemplates[type].label}</Typography.Text>
                  <Paragraph style={{ marginBottom: 0 }}>
                    {availableOutputTemplates[type].description}
                  </Paragraph>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Preview modal */}
      {renderPreviewModal()}
    </div>
  );
} 