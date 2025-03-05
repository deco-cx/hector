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
    if (!isSDKAvailable || !sdk) {
      message.error('SDK is not available');
      return;
    }

    // If already running, cancel the operation
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      
      // Reset action state
      dispatch({
        type: HectorActionType.SET_ACTION_STATE,
        payload: { index: actionIndex, state: 'idle' }
      });
      
      return;
    }

    // Don't run if dependencies aren't met
    if (!isPlayable) {
      message.error(`Cannot run action. Missing dependencies: ${missingDependencies.join(', ')}`);
      return;
    }

    try {
      // Set action state to loading
      dispatch({
        type: HectorActionType.SET_ACTION_STATE,
        payload: { index: actionIndex, state: 'loading' }
      });

      // Create an AbortController for cancellation
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Execute the action based on its type
      const result = await executeAction(action, signal);

      // If the operation was not aborted, update the execution bag
      if (!signal.aborted) {
        // Set the result in the execution bag
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

        // Update action state to idle
        dispatch({
          type: HectorActionType.SET_ACTION_STATE,
          payload: { index: actionIndex, state: 'idle' }
        });

        // Show success message
        message.success(`Successfully executed ${action.type}`);
      }
    } catch (error) {
      // Only update state if not aborted
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.error('Error executing action:', error);
        
        // Update action state to error
        dispatch({
          type: HectorActionType.SET_ACTION_STATE,
          payload: { index: actionIndex, state: 'error' }
        });

        // Show error message
        message.error(`Error executing action: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      // Reset abort controller if not aborted
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
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
        const result = await sdk.ai.generateText({
          prompt: processedPrompt,
          model: config.model || 'Best',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 500,
        });

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

        const result = await sdk.ai.generateObject({
          prompt: processedPrompt,
          schema: {
            type: 'object',
            properties: schema.properties || {}
          },
          temperature: config.temperature || 0.7,
        });

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
        const result = await sdk.ai.generateImage({
          prompt: processedPrompt,
          model: config.model || 'Best',
          size: config.size || '1024x1024',
        });

        // Set permissions on the file
        await sdk.fs.chmod(result.filepath, 0o744);

        // Return the image URL
        return { 
          text: `Image generated at: ${result.filepath}`, 
          filepath: result.filepath 
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