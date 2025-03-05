import React, { useState, useRef, useEffect } from 'react';
import { Button, Tooltip, Popover, message } from 'antd';
import { PlayCircleOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { useHector } from '../../../context/HectorContext';
import { useHectorDispatch } from '../../../context/HectorDispatchContext';
import { ActionType as HectorActionType } from '../../../context/HectorReducer';
import { ActionData, FileContent } from '../../../types/types';
import { checkActionPlayable, replacePromptVariables } from '../../../utils/runtimeUtils';

interface PlayActionProps {
  actionIndex: number;
}

/**
 * Component for executing actions in the runtime
 */
export function PlayAction({ actionIndex }: PlayActionProps) {
  const { appConfig, sdk, isSDKAvailable } = useHector();
  const dispatch = useHectorDispatch();
  const [isHovered, setIsHovered] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Reset abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  if (!appConfig || !appConfig.actions || !appConfig.actions[actionIndex]) {
    return null;
  }

  const action = appConfig.actions[actionIndex];
  const actionState = action.state || 'idle';
  const isLoading = actionState === 'loading';

  // Check if the action is playable
  const { isPlayable, missingDependencies } = checkActionPlayable(actionIndex, appConfig);

  // Handle action execution
  const handlePlay = async () => {
    if (!isSDKAvailable || !sdk || !action || !isPlayable || isRunning) {
      return;
    }

    // Start execution
    setIsRunning(true);
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      // Update action state to loading
      dispatch({
        type: HectorActionType.SET_ACTION_STATE,
        payload: {
          index: actionIndex,
          state: 'loading'
        }
      });
      
      // Execute the action
      const result = await executeAction(action, controller.signal);
      
      // Store the result in the execution bag
      dispatch({
        type: HectorActionType.SET_EXECUTION_BAG_FOR_FILE,
        payload: {
          filename: action.filename,
          content: {
            textValue: result.text,
            path: result.filepath
          }
        }
      });
      
      // Set action state back to idle
      dispatch({
        type: HectorActionType.SET_ACTION_STATE,
        payload: {
          index: actionIndex,
          state: 'idle'
        }
      });
      
      console.log(`Executed action: ${action.type}`, result);
    } catch (error) {
      // Only handle error if not cancelled
      if (!controller.signal.aborted) {
        console.error('Error executing action:', error);
        
        // Update action state to error
        dispatch({
          type: HectorActionType.SET_ACTION_STATE,
          payload: {
            index: actionIndex,
            state: 'error'
          }
        });
      }
    } finally {
      // Clean up if not aborted
      if (!controller.signal.aborted) {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    }
  };

  /**
   * Execute the action based on its type
   */
  const executeAction = async (action: ActionData, signal: AbortSignal): Promise<{ text: string; filepath: string }> => {
    if (!sdk || !appConfig || !appConfig.lastExecution) {
      throw new Error('SDK or execution context not available');
    }

    // Replace variables in the prompt
    const rawPrompt = typeof action.prompt === 'object'
      ? action.prompt[appConfig.selectedLanguage || 'en-US'] || ''
      : action.prompt || '';
    
    const processedPrompt = replacePromptVariables(rawPrompt, appConfig.lastExecution);

    // Execute based on action type
    switch (action.type) {
      case 'generateText': {
        const config = action.config || {};
        
        // Create payload and only include model if it's not "Best"
        const payload: any = {
          prompt: processedPrompt,
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 500,
        };
        
        // Only add model if it's not "Best" (default)
        if (config.model && config.model !== 'Best') {
          payload.model = config.model;
        }
        
        const result = await sdk.ai.generateText(payload);

        // Set permissions on the file
        await sdk.fs.chmod(result.filepath, 0o744);
        
        return result;
      }

      case 'generateJSON': {
        const config = action.config || {};
        let schema;
        
        try {
          schema = config.schema ? JSON.parse(config.schema) : {};
        } catch (error) {
          console.error('Error parsing schema:', error);
          schema = { type: 'object', properties: {} };
        }

        // Create payload and only include model if it's not "Best"
        const payload: any = {
          prompt: processedPrompt,
          schema: {
            type: 'object',
            properties: schema.properties || {}
          },
          temperature: config.temperature || 0.7,
        };
        
        // Only add model if it's not "Best" (default)
        if (config.model && config.model !== 'Best') {
          payload.model = config.model;
        }
        
        const result = await sdk.ai.generateObject(payload);

        // Set permissions on the file
        await sdk.fs.chmod(result.filepath, 0o744);

        // Convert object back to string for display
        return { 
          text: JSON.stringify(result.object, null, 2), 
          filepath: result.filepath 
        };
      }

      case 'generateImage': {
        const config = action.config || {};
        
        // Create payload and only include model if it's not "Best"
        const payload: any = {
          prompt: processedPrompt,
          // size: config.size || '1024x1024',
          aspect_ratio: "1:1", // Use 1:1 aspect ratio instead of n parameter
        };
        
        // For image generation, "Best" should be replaced with "openai:dall-e-3"
        if (config.model && config.model !== 'Best') {
          payload.model = config.model;
        } else {
          payload.model = "openai:dall-e-3";
        }
        
        const result = await sdk.ai.generateImage(payload);

        // Set permissions on the file
        await sdk.fs.chmod(result.filepath, 0o744);

        // Return the image URL
        return { 
          text: `Image generated at: ${result.filepath}`, 
          filepath: result.filepath 
        };
      }

      case 'generateAudio': {
        const config = action.config || {};
        
        // Create payload with ElevenLabs configuration
        const payload: any = {
          prompt: processedPrompt,
          providerOptions: {
            elevenLabs: {
              voiceId: config.voiceId || 'ZqvIIuD5aI9JFejebHiH',
              model_id: "eleven_turbo_v2_5",
              optimize_streaming_latency: 0,
              voice_settings: {
                speed: 0.9,
                similarity_boost: 0.85,
                stability: 0.75,
                style: 0,
              },
            },
          },
        };
        
        // Default to elevenlabs:tts if not specified or Best is selected
        if (config.model && config.model !== 'Best') {
          payload.model = config.model;
        } else {
          payload.model = "elevenlabs:tts";
        }
        
        const result = await sdk.ai.generateAudio(payload);

        // Set permissions on the file - handle both string and array return types
        if (typeof result.filepath === 'string') {
          await sdk.fs.chmod(result.filepath, 0o744);
        } else if (Array.isArray(result.filepath) && result.filepath.length > 0) {
          await sdk.fs.chmod(result.filepath[0], 0o744);
        }

        // Return the audio file info
        return { 
          text: `Audio generated at: ${result.filepath}`, 
          filepath: typeof result.filepath === 'string' ? result.filepath : result.filepath[0]
        };
      }

      // Additional action types can be implemented here

      default:
        throw new Error(`Action type ${action.type} not supported`);
    }
  };

  // Button hover event handlers
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Render appropriate icon based on state
  const renderIcon = () => {
    if (isLoading) {
      return <LoadingOutlined />;
    }
    return isHovered && isLoading ? <StopOutlined /> : <PlayCircleOutlined />;
  };

  // Render appropriate tooltip based on state
  const renderTooltip = () => {
    if (!isPlayable) {
      return `Dependencies missing: ${missingDependencies.join(', ')}`;
    }
    
    if (isLoading) {
      return 'Cancel execution';
    }
    
    return 'Execute action';
  };

  // Render the PlayAction button
  return (
    <Tooltip title={renderTooltip()}>
      <Button
        type={isHovered ? 'primary' : 'default'}
        shape="circle"
        icon={renderIcon()}
        onClick={handlePlay}
        disabled={!isPlayable && !isLoading}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </Tooltip>
  );
} 