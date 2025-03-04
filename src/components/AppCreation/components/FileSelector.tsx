import React, { useState, useEffect, useContext } from 'react';
import { Select, Typography, Empty, Divider, Tag } from 'antd';
import { 
  FileImageOutlined, 
  FileTextOutlined, 
  FilePdfOutlined, 
  SoundOutlined, 
  FileOutlined,
  PictureOutlined,
  AudioOutlined,
  FileMarkdownOutlined
} from '@ant-design/icons';
import { isFileType, fileExtensions } from '../../../config/outputsConfig';
import { AppConfig, InputField, ActionData } from '../../../types/types';

const { Option, OptGroup } = Select;
const { Text } = Typography;

export interface FileSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  fileType?: keyof typeof fileExtensions | 'all';
  style?: React.CSSProperties;
  appData?: AppConfig;
}

/**
 * A component that allows selecting files from a dropdown
 * Shows icons based on file type and only shows compatible files
 */
const FileSelector: React.FC<FileSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select a file',
  fileType = 'all',
  style,
  appData
}) => {
  // Extract input and action files from app data
  const [availableFiles, setAvailableFiles] = useState<{
    inputs: string[];
    actions: string[];
  }>({
    inputs: [],
    actions: []
  });

  // Update available files when app data changes
  useEffect(() => {
    if (!appData) return;

    // Extract filenames from inputs
    const inputFiles = (appData.inputs || [])
      .map(input => `@${input.filename}`)
      .filter(Boolean);

    // Extract filenames from actions
    const actionFiles = (appData.actions || [])
      .map(action => `@${action.filename}`)
      .filter(Boolean);

    setAvailableFiles({
      inputs: inputFiles,
      actions: actionFiles
    });
  }, [appData]);

  // Get display value (without @)
  const displayValue = value?.startsWith('@') ? value.substring(1) : value;

  // Filter files based on type
  const filterFilesByType = (files: string[]) => {
    return files.filter(file => {
      if (fileType === 'all') return true;
      return isFileType(file, fileType as keyof typeof fileExtensions);
    });
  };

  const filteredInputFiles = filterFilesByType(availableFiles.inputs);
  const filteredActionFiles = filterFilesByType(availableFiles.actions);

  // Get icon based on file type
  const getFileIcon = (filename: string) => {
    if (isFileType(filename, 'image')) return <PictureOutlined />;
    if (isFileType(filename, 'text')) {
      if (filename.endsWith('.md')) return <FileMarkdownOutlined />;
      return <FileTextOutlined />;
    }
    if (isFileType(filename, 'audio')) return <AudioOutlined />;
    return <FileOutlined />;
  };

  const handleChange = (newValue: string) => {
    // Pass the value with @ to parent
    if (onChange) {
      onChange(newValue.startsWith('@') ? newValue : `@${newValue}`);
    }
  };

  // Handle custom input
  const handleCustomInput = (input: string) => {
    if (!input) return;
    
    // Add file extension if none provided
    let customValue = input;
    if (!customValue.includes('.')) {
      switch (fileType) {
        case 'image':
          customValue += '.png';
          break;
        case 'audio':
          customValue += '.mp3';
          break;
        case 'text':
          customValue += '.md';
          break;
        default:
          customValue += '.txt';
      }
    }
    
    // Add @ prefix if not present
    if (!customValue.startsWith('@')) {
      customValue = `@${customValue}`;
    }
    
    handleChange(customValue);
  };

  // Create option renderer
  const renderFileOption = (file: string) => {
    const fileName = file.startsWith('@') ? file.substring(1) : file;
    return (
      <Option key={file} value={file} label={fileName}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {getFileIcon(file)}
          <Text style={{ marginLeft: 8 }}>{fileName}</Text>
          {fileType !== 'all' && isFileType(file, fileType as keyof typeof fileExtensions) && (
            <Tag color="blue" style={{ marginLeft: 'auto' }}>Recommended</Tag>
          )}
        </div>
      </Option>
    );
  };

  return (
    <Select
      showSearch
      value={displayValue}
      placeholder={placeholder}
      style={{ width: '100%', ...(style || {}) }}
      onChange={handleChange}
      optionFilterProp="label"
      filterOption={(input, option) => 
        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
      }
      notFoundContent={
        <Empty 
          description={`No ${fileType !== 'all' ? fileType : ''} files found`} 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      }
      showAction={['focus', 'click']}
      onInputKeyDown={(e) => {
        if (e.key === 'Enter') {
          const target = e.target as HTMLInputElement;
          handleCustomInput(target.value);
          // Clear the input
          (e.target as HTMLInputElement).value = '';
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ padding: '0 8px 8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {filteredInputFiles.length === 0 && filteredActionFiles.length === 0 
                ? `No ${fileType !== 'all' ? fileType : ''} files available. Add inputs or actions that generate ${fileType} files.`
                : "Can't find your file? Type a filename and press Enter."}
            </Text>
          </div>
        </>
      )}
      allowClear
    >
      {/* Show Actions first, then Inputs */}
      {filteredActionFiles.length > 0 && (
        <OptGroup label="From Actions">
          {filteredActionFiles.map(renderFileOption)}
        </OptGroup>
      )}
      
      {filteredInputFiles.length > 0 && (
        <OptGroup label="From Inputs">
          {filteredInputFiles.map(renderFileOption)}
        </OptGroup>
      )}
      
      {filteredInputFiles.length === 0 && filteredActionFiles.length === 0 && (
        <Option disabled value="no-files">
          <Empty 
            description={`No ${fileType !== 'all' ? fileType : ''} files available`} 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </Option>
      )}
    </Select>
  );
};

export default FileSelector; 