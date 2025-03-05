import React, { useState, useEffect, useRef } from 'react';
import { Spin, Alert } from 'antd';
import { SoundOutlined, LoadingOutlined } from '@ant-design/icons';

interface AudioPlayerProps {
  filepath: string;
}

export function AudioPlayer({ filepath }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 60; // Try for up to 60 seconds (1 minute)
  const retryIntervalRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);

  // Construct the web-accessible URL
  const getWebUrl = (path: string) => {
    // Extract the path part after /users/
    const pathMatch = path.match(/\/users\/(.+)/);
    if (pathMatch && pathMatch[1]) {
      return `https://fs.webdraw.com/users/${pathMatch[1]}`;
    }
    return null;
  };

  useEffect(() => {
    // Set up unmounted ref for cleanup
    unmountedRef.current = false;

    if (!filepath) {
      setError('No audio file path provided');
      setIsLoading(false);
      return;
    }

    const webUrl = getWebUrl(filepath);
    if (!webUrl) {
      setError('Invalid file path format');
      setIsLoading(false);
      return;
    }

    retryCountRef.current = 0;
    
    // Function to check file availability
    const checkFileAvailability = () => {
      // Don't continue if unmounted
      if (unmountedRef.current) return;
      
      retryCountRef.current++;
      console.log(`Checking audio availability (attempt ${retryCountRef.current}): ${webUrl}`);
      
      // Use fetch to check if the file is available
      fetch(webUrl, { method: 'HEAD', cache: 'no-store' })
        .then(response => {
          // Don't update state if unmounted
          if (unmountedRef.current) return;
          
          if (response.ok) {
            console.log('Audio file is now available!');
            setAudioUrl(webUrl);
            setIsLoading(false);
            
            // Clear any existing interval
            if (retryIntervalRef.current) {
              window.clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;
            }
          } else if (retryCountRef.current >= maxRetries) {
            console.error('Maximum retries reached, audio file not available');
            setError('Audio file not available after multiple attempts');
            setIsLoading(false);
            
            // Clear any existing interval
            if (retryIntervalRef.current) {
              window.clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;
            }
          }
          // Otherwise, the interval will continue checking
        })
        .catch(err => {
          // Don't update state if unmounted
          if (unmountedRef.current) return;
          
          console.warn(`Attempt ${retryCountRef.current} failed: ${err.message}`);
          
          // Only show error if we've reached max retries
          if (retryCountRef.current >= maxRetries) {
            console.error('Maximum retries reached:', err);
            setError(`Failed to check file availability: ${err.message}`);
            setIsLoading(false);
            
            // Clear any existing interval
            if (retryIntervalRef.current) {
              window.clearInterval(retryIntervalRef.current);
              retryIntervalRef.current = null;
            }
          }
          // Otherwise, the interval will continue checking
        });
    };

    // Start checking for file availability with an interval
    checkFileAvailability(); // Check immediately first
    
    // Set up the interval for checking
    retryIntervalRef.current = window.setInterval(checkFileAvailability, 1000);

    // Cleanup
    return () => {
      unmountedRef.current = true;
      if (retryIntervalRef.current) {
        window.clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, [filepath]);

  if (isLoading) {
    return (
      <div className="audio-player-loading" style={{ textAlign: 'center', padding: '20px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p style={{ marginTop: '10px' }}>
          Waiting for audio file to be available... (Attempt {retryCountRef.current}/{maxRetries})
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (audioUrl) {
    return (
      <div className="audio-player" style={{ margin: '20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <SoundOutlined style={{ fontSize: '18px', marginRight: '8px' }} />
          <span>Audio generated successfully</span>
        </div>
        <audio 
          controls 
          src={audioUrl} 
          style={{ width: '100%' }}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  return null;
} 