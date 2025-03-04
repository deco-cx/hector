import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useWebdraw } from '../../context/WebdrawContext';
import { AppConfig } from '../../types/types';
import { DEFAULT_LANGUAGE } from '../../types/i18n';

interface CreateAppModalProps {
  visible: boolean;
  onCancel: () => void;
  onCreate?: (app: Partial<AppConfig>) => void;
}

export function CreateAppModal({ visible, onCancel, onCreate }: CreateAppModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { service } = useWebdraw();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const { name } = values;
      
      // Create filename - lowercase with hyphens instead of spaces
      const filename = name.toLowerCase().replace(/\s+/g, '-');
      
      // Create basic app structure with localized name
      const newApp: Partial<AppConfig> = {
        id: filename,
        name: { [DEFAULT_LANGUAGE]: name },
        template: 'default',
        style: 'default',
        inputs: [],
        actions: [],
        output: [], // Using empty array for new OutputTemplate[] format
        supportedLanguages: [DEFAULT_LANGUAGE]
      };
      
      if (onCreate) {
        // Use the onCreate callback if provided
        onCreate(newApp);
      } else {
        // Otherwise save directly and navigate
        await service.saveApp(newApp as AppConfig);
        message.success('App created successfully!');
        navigate(`/app/${filename}`);
      }
      
      // Reset form
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Failed to create app:', error);
      message.error('Failed to create app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New App"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Create"
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="App Name"
          rules={[
            { required: true, message: 'Please enter an app name' },
            { min: 3, message: 'App name must be at least 3 characters' },
            { max: 50, message: 'App name cannot exceed 50 characters' }
          ]}
        >
          <Input placeholder="Enter a name for your app" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 