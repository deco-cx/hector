import React, { useState } from 'react';
import { Typography, Card, Button, Space, Empty, Tabs, Tooltip, Modal } from 'antd';
import { InfoCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { OutputTemplate, OutputTemplateType } from '../../../types/types';
import { availableOutputTemplates, createOutputTemplate, templateFieldFileTypes } from '../../../config/outputsConfig';
import RJSFForm from '@rjsf/antd';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import FileReferenceField from '../components/FileReferenceField';

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
    setFormData((prev: any) => ({
      ...prev,
      output: newOutputs,
    }));
  };

  // Handle template selection in modal
  const handleAddTemplate = (type: OutputTemplateType) => {
    // Create a new template
    const newTemplate = createOutputTemplate(type);
    
    // Add to outputs array
    const newOutputs = [...outputs, newTemplate];
    updateOutputs(newOutputs);
    
    // Close modal and set active tab to the new template
    setIsAddTemplateModalVisible(false);
    setActiveTab(type);
  };

  // Handle template deletion
  const handleDeleteTemplate = (type: OutputTemplateType) => {
    const newOutputs = outputs.filter(output => output.type !== type);
    updateOutputs(newOutputs);
    
    // Reset active tab if deleted
    if (activeTab === type) {
      setActiveTab(newOutputs.length > 0 ? newOutputs[0].type : null);
    }
  };

  // Update template configuration
  const handleConfigChange = (type: OutputTemplateType, formData: any) => {
    const newOutputs = outputs.map(output => {
      if (output.type === type) {
        return { ...output, ...formData };
      }
      return output;
    });
    updateOutputs(newOutputs);
  };

  // Show preview of the template
  const handleShowPreview = (template: OutputTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewModalVisible(true);
  };

  // Get available template types that haven't been added yet
  const getAvailableTemplateTypes = () => {
    const existingTypes = new Set(outputs.map(output => output.type));
    return Object.keys(availableOutputTemplates).filter(
      type => !existingTypes.has(type as OutputTemplateType)
    ) as OutputTemplateType[];
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
    const uiSchema = createUiSchema(type);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
        </div>

        <RJSFForm
          schema={templateConfig.schema as RJSFSchema}
          formData={template}
          validator={validator}
          onChange={(e) => handleConfigChange(type, e.formData)}
          widgets={widgets}
          uiSchema={uiSchema}
        />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {getAvailableTemplateTypes().map(type => (
            <Card 
              key={type}
              hoverable
              style={{ marginBottom: '8px' }}
              onClick={() => handleAddTemplate(type)}
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