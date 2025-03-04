import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Tabs, Empty, Spin, Alert } from 'antd';
import { FileTextOutlined, FileImageOutlined, SoundOutlined, VideoCameraOutlined, CodeOutlined, DownloadOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * Types of results that can be visualized
 */
type ResultType = 'text' | 'json' | 'image' | 'audio' | 'video' | 'unknown';

/**
 * Props for the ResultVisualization component
 */
interface ResultVisualizationProps {
  result: any;
  actionName: string;
  title?: string;
}

/**
 * Component to visualize action results in an appropriate format
 */
export const ResultVisualization: React.FC<ResultVisualizationProps> = ({ 
  result, 
  actionName,
  title = 'Result' 
}) => {
  const [activeTab, setActiveTab] = useState<string>('visual');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Check if the result is still processing
  useEffect(() => {
    if (result && typeof result === 'object' && result.isProcessing === true) {
      setIsLoading(true);
      setLoadError(null);
      
      // Set up a timer to check periodically if the result is ready
      const checkInterval = setInterval(() => {
        // In a real implementation, we would check if the file is available
        // For now, we'll just simulate it becoming available after some time
        if (result.publicUrl) {
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 1000);
      
      return () => {
        clearInterval(checkInterval);
      };
    } else {
      setIsLoading(false);
    }
  }, [result]);
  
  // Handle image/media loading errors
  const handleMediaError = (error: React.SyntheticEvent<HTMLImageElement | HTMLAudioElement | HTMLVideoElement>) => {
    console.error('Error loading media:', error);
    setLoadError('The media file could not be loaded. It may still be processing.');
  };
  
  // Try reloading the media
  const handleReload = () => {
    setLoadError(null);
    
    // Force a refresh of the media element
    // This is a simple approach - in a real implementation we might want to check the file availability again
    const mediaElement = document.querySelector('.result-media') as HTMLImageElement | HTMLAudioElement | HTMLVideoElement;
    if (mediaElement) {
      const currentSrc = mediaElement.src;
      mediaElement.src = '';
      setTimeout(() => {
        mediaElement.src = currentSrc;
      }, 100);
    }
  };
  
  if (!result) {
    return (
      <Card title={title} size="small" className="result-visualization-card">
        <Empty description="No result available" />
      </Card>
    );
  }
  
  // Determine the type of result
  const getResultType = (): ResultType => {
    // Handle the case where result is a processed file with publicUrl
    if (typeof result === 'object' && result.publicUrl) {
      const url = result.publicUrl as string;
      if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image';
      if (url.endsWith('.mp3') || url.endsWith('.wav')) return 'audio';
      if (url.endsWith('.mp4') || url.endsWith('.webm')) return 'video';
      if (url.endsWith('.json')) return 'json';
      if (url.endsWith('.md') || url.endsWith('.txt')) return 'text';
    }
    
    if (typeof result === 'string') {
      if (result.startsWith('data:image')) return 'image';
      if (result.startsWith('data:audio')) return 'audio';
      if (result.startsWith('data:video')) return 'video';
      try {
        JSON.parse(result);
        return 'json';
      } catch (e) {
        return 'text';
      }
    } else if (typeof result === 'object') {
      if (result.base64 && result.base64.startsWith('data:image')) return 'image';
      if (result.base64 && result.base64.startsWith('data:audio')) return 'audio';
      if (result.base64 && result.base64.startsWith('data:video')) return 'video';
      return 'json';
    }
    
    return 'unknown';
  };
  
  const resultType = getResultType();
  
  // Get icon based on result type
  const getResultIcon = () => {
    switch (resultType) {
      case 'image':
        return <FileImageOutlined />;
      case 'audio':
        return <SoundOutlined />;
      case 'video':
        return <VideoCameraOutlined />;
      case 'json':
        return <CodeOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };
  
  // Get the URL to display
  const getDisplayUrl = () => {
    if (typeof result === 'object' && result.publicUrl) {
      return result.publicUrl;
    }
    
    if (typeof result === 'string') {
      return result;
    }
    
    if (typeof result === 'object') {
      if (result.base64) return result.base64;
      if (result.filepath) return result.filepath;
    }
    
    return null;
  };
  
  // Create a download link for the result
  const getDownloadLink = () => {
    let url, filename;
    
    // First check if we have a processed result with publicUrl
    if (typeof result === 'object' && result.publicUrl) {
      url = result.publicUrl;
      filename = result.filepath ? result.filepath.split('/').pop() : `${actionName}_result.${resultType}`;
    }
    // Otherwise, handle the result as before
    else if (typeof result === 'string') {
      if (resultType === 'text' || resultType === 'json') {
        const blob = new Blob([result], { type: 'text/plain' });
        url = URL.createObjectURL(blob);
        filename = `${actionName}_result.txt`;
      } else {
        url = result;
        filename = `${actionName}_result.${resultType}`;
      }
    } else if (typeof result === 'object') {
      if (result.base64) {
        url = result.base64;
        filename = result.filename || `${actionName}_result.${resultType}`;
      } else {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        url = URL.createObjectURL(blob);
        filename = `${actionName}_result.json`;
      }
    }
    
    return { url, filename };
  };
  
  // Render the result based on its type
  const renderResult = () => {
    // If still loading, show a loading spinner
    if (isLoading) {
      return (
        <div className="result-loading" style={{ textAlign: 'center', padding: '30px' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            tip="Waiting for file to be available..."
          />
          <p style={{ marginTop: '15px' }}>
            <Text type="secondary">
              This may take a few seconds. The file is being processed and made publicly accessible.
            </Text>
          </p>
        </div>
      );
    }
    
    // If there was an error loading the media, show an error message
    if (loadError) {
      return (
        <div className="result-error" style={{ textAlign: 'center', padding: '20px' }}>
          <Alert
            message="Loading Error"
            description={loadError}
            type="error"
            showIcon
          />
          <Button 
            onClick={handleReload} 
            icon={<ReloadOutlined />} 
            style={{ marginTop: '15px' }}
          >
            Try Again
          </Button>
        </div>
      );
    }
    
    const displayUrl = getDisplayUrl();
    
    switch (resultType) {
      case 'text':
        let textContent;
        if (typeof result === 'object' && result.publicUrl) {
          // For text files, we should show a note that this is a file link
          // In a production app, we might fetch the content of the file
          textContent = `File: ${result.publicUrl}`;
        } else {
          textContent = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        }
        
        return (
          <div className="result-text">
            <Paragraph 
              style={{ 
                maxHeight: '300px', 
                overflow: 'auto', 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace' 
              }}
            >
              {textContent}
            </Paragraph>
          </div>
        );
        
      case 'json':
        let jsonData;
        let formattedJson;
        try {
          if (typeof result === 'string') {
            jsonData = JSON.parse(result);
          } else {
            jsonData = result;
          }
          formattedJson = JSON.stringify(jsonData, null, 2);
        } catch (e) {
          // If we can't parse it as JSON, just render as text
          return (
            <div className="result-text">
              <Paragraph 
                style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto', 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace' 
                }}
              >
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </Paragraph>
            </div>
          );
        }
        
        return (
          <div className="result-json">
            <pre 
              style={{ 
                maxHeight: '300px', 
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                margin: 0,
                fontSize: '13px'
              }}
            >
              {formattedJson}
            </pre>
          </div>
        );
        
      case 'image':
        return (
          <div className="result-image" style={{ textAlign: 'center' }}>
            <img 
              className="result-media"
              src={displayUrl} 
              alt={actionName}
              style={{ maxWidth: '100%', maxHeight: '300px' }}
              onError={handleMediaError}
            />
          </div>
        );
        
      case 'audio':
        return (
          <div className="result-audio" style={{ textAlign: 'center' }}>
            <audio 
              className="result-media"
              src={displayUrl} 
              controls
              style={{ width: '100%' }}
              onError={handleMediaError}
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="result-video" style={{ textAlign: 'center' }}>
            <video 
              className="result-media"
              src={displayUrl} 
              controls
              style={{ width: '100%', maxHeight: '300px' }}
              onError={handleMediaError}
            />
          </div>
        );
        
      default:
        return (
          <div className="result-unknown">
            <Paragraph>
              <Text type="secondary">
                Result is not in a visual format. You can download it using the button below.
              </Text>
            </Paragraph>
          </div>
        );
    }
  };
  
  // Render raw data view for all result types
  const renderRawData = () => {
    return (
      <div className="result-raw-data">
        <Paragraph 
          style={{ 
            maxHeight: '300px', 
            overflow: 'auto', 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'monospace' 
          }}
        >
          {typeof result === 'string' 
            ? result 
            : JSON.stringify(result, null, 2)
          }
        </Paragraph>
      </div>
    );
  };
  
  const downloadLink = getDownloadLink();
  
  return (
    <Card
      title={
        <Space>
          {getResultIcon()}
          <Text strong>{title}</Text>
          {isLoading && <LoadingOutlined style={{ color: '#1890ff' }} />}
        </Space>
      }
      size="small"
      className="result-visualization-card"
      extra={
        downloadLink && downloadLink.url && (
          <Button 
            type="text" 
            icon={<DownloadOutlined />} 
            href={downloadLink.url}
            download={downloadLink.filename}
            disabled={isLoading}
          >
            Download
          </Button>
        )
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Visual" key="visual">
          {renderResult()}
        </TabPane>
        <TabPane tab="Raw Data" key="raw">
          {renderRawData()}
        </TabPane>
      </Tabs>
    </Card>
  );
}; 