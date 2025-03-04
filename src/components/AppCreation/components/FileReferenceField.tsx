import React, { useState } from 'react';
import { Input, Button, Tooltip, Upload, Modal, Space, Tag } from 'antd';
import { UploadOutlined, FileOutlined, FileImageOutlined, FileTextOutlined, FilePdfOutlined, SoundOutlined } from '@ant-design/icons';
import { WidgetProps } from '@rjsf/utils';
import { isFileType } from '../../../config/outputsConfig';
import { RcFile } from 'antd/lib/upload/interface';

/**
 * A custom widget for React JSON Schema Form that allows selecting or uploading files.
 * The value is stored as a string reference (e.g., "@file.md").
 */
const FileReferenceField: React.FC<WidgetProps> = (props) => {
  const { id, value, label, onChange, onBlur, onFocus, options, schema } = props;
  const [inputValue, setInputValue] = useState<string>(value || '');
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [fileList, setFileList] = useState<RcFile[]>([]);

  // Define accepted file types based on schema description
  const fileDescription = schema.description || 'Select a file';
  const acceptedFileTypes = getAcceptedFileTypes(fileDescription);

  // Determine the icon based on file extension
  const getFileIcon = (filename: string) => {
    if (!filename) return <FileOutlined />;
    if (isFileType(filename, 'image')) return <FileImageOutlined />;
    if (isFileType(filename, 'text')) return <FileTextOutlined />;
    if (isFileType(filename, 'audio')) return <SoundOutlined />;
    return <FileOutlined />;
  };

  // Extract accepted file types from the description
  function getAcceptedFileTypes(description: string): string {
    if (description.includes('image')) return '.png,.jpg,.jpeg,.gif,.webp,.svg';
    if (description.includes('audio')) return '.mp3,.wav,.ogg,.flac,.aac';
    if (description.includes('text') || description.includes('md')) return '.md,.txt,.html';
    if (description.includes('json')) return '.json';
    if (description.includes('video')) return '.mp4,.webm,.mov,.avi';
    // Default to all file types
    return '*';
  }

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Ensure value starts with @ for file references
    let finalValue = newValue;
    if (newValue && !newValue.startsWith('@')) {
      finalValue = `@${newValue}`;
    }
    
    onChange(finalValue);
  };

  // Handle blur event
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(id, inputValue);
    }
  };

  // Handle focus event
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(id, inputValue);
    }
  };

  // Handle file upload
  const handleUpload = (file: RcFile) => {
    // For now, we just store the file name with @ prefix
    const fileName = `@${file.name}`;
    setInputValue(fileName);
    onChange(fileName);
    setFileList([file]);
    return false; // Prevent default upload behavior
  };

  // Show file preview (placeholder for now)
  const showPreview = () => {
    setPreviewVisible(true);
  };

  // Clear selected file
  const clearFile = () => {
    setInputValue('');
    onChange('');
    setFileList([]);
  };

  // Render file tag if a file is selected
  const renderFileTag = () => {
    if (!inputValue) return null;
    
    return (
      <Space style={{ marginTop: '8px' }}>
        <Tag 
          icon={getFileIcon(inputValue)}
          color="blue"
          closable
          onClose={clearFile}
        >
          {inputValue.replace('@', '')}
        </Tag>
        <Button size="small" onClick={showPreview}>Preview</Button>
      </Space>
    );
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          id={id}
          value={inputValue ? inputValue.replace('@', '') : ''}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={`Enter file name (e.g., image.png)`}
          prefix={inputValue ? getFileIcon(inputValue) : <FileOutlined />}
          addonAfter={
            <Upload
              beforeUpload={handleUpload}
              fileList={fileList}
              showUploadList={false}
              accept={acceptedFileTypes}
            >
              <Tooltip title="Select file">
                <Button icon={<UploadOutlined />} />
              </Tooltip>
            </Upload>
          }
        />
        {renderFileTag()}
      </Space>

      {/* Preview Modal (placeholder) */}
      <Modal
        title="File Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {isFileType(inputValue, 'image') ? (
            <p>Image Preview Placeholder</p>
          ) : isFileType(inputValue, 'audio') ? (
            <p>Audio Player Placeholder</p>
          ) : isFileType(inputValue, 'text') ? (
            <p>Text Content Placeholder</p>
          ) : (
            <p>File Preview Not Available</p>
          )}
          <p>{inputValue}</p>
        </div>
      </Modal>
    </div>
  );
};

export default FileReferenceField; 