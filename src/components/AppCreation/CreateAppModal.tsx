import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useWebdraw } from '../../context/WebdrawContext';
import { AppConfig } from '../../types/webdraw';

interface CreateAppModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateAppModal({ visible, onClose }: CreateAppModalProps) {
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
      
      // Create basic app structure
      const newApp: AppConfig = {
        id: filename,
        name: name,
        template: "form",
        style: "minimalistic",
        inputs: [],
        actions: [],
        output: {
          type: "html",
          format: "standard",
          files: []
        }
      };
      
      // Save to filesystem using the service
      await service.saveApp(newApp);
      
      // Reset form and close modal
      form.resetFields();
      onClose();
      
      // Navigate to the edit page
      navigate(`/edit/${filename}`);
      
      message.success(`App "${name}" created successfully!`);
    } catch (error) {
      console.error('Failed to create app:', error);
      message.error('Failed to create app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New App"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="App Name"
          rules={[
            { required: true, message: 'Please enter an app name' },
            { min: 3, message: 'Name must be at least 3 characters' }
          ]}
        >
          <Input placeholder="Enter a name for your app" />
        </Form.Item>
      </Form>
    </Modal>
  );
} 