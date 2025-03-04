import { ActionData, WebdrawSDK, TextPayload, ImagePayload, ObjectPayload, AudioPayload, VideoPayload } from '../../types/types';
import { ExecutionContext } from './ExecutionContext';

/**
 * Execute an action using the WebdrawSDK
 * @param action The action to execute
 * @param context The execution context
 * @param sdk The WebdrawSDK instance
 * @param language The language to use for the prompt
 */
export async function executeAction(
  action: ActionData,
  context: ExecutionContext,
  sdk: WebdrawSDK,
  language: string = 'EN'
): Promise<{ success: boolean; data: any; error?: Error | string }> {
  try {
    // Get the prompt in the current language or fallback
    const prompt = typeof action.prompt === 'object' 
      ? action.prompt[language] || Object.values(action.prompt)[0] 
      : action.prompt;
    
    // Resolve references in the prompt
    const resolvedPrompt = context.resolveReferences(prompt);
    
    // Execute based on action type
    let result;
    switch (action.type) {
      case 'generateText':
        const textPayload: TextPayload = {
          prompt: resolvedPrompt,
          model: action.config?.model || 'Best',
          temperature: action.config?.temperature || 0.7,
          maxTokens: action.config?.maxTokens || 1000
        };
        const textResult = await sdk.ai.generateText(textPayload);
        console.log('SDK generateText response:', textResult);
        // Text results should return the text content
        result = textResult.text;
        break;
        
      case 'generateJSON':
        const schema = typeof action.config?.schema === 'string' 
          ? JSON.parse(action.config.schema) 
          : action.config?.schema;
        
        const objectPayload: ObjectPayload = {
          prompt: resolvedPrompt,
          schema: schema,
          temperature: action.config?.temperature || 0.7
        };
        const jsonResult = await sdk.ai.generateObject(objectPayload);
        console.log('SDK generateObject response:', jsonResult);
        // JSON results should return the parsed object
        result = jsonResult.object;
        break;
        
      case 'generateImage':
        const imagePayload: ImagePayload = {
          prompt: resolvedPrompt,
          model: action.config?.model || 'SDXL',
          size: action.config?.size || '1024x1024',
          n: action.config?.n || 1
        };
        const imageResult = await sdk.ai.generateImage(imagePayload);
        console.log('SDK generateImage response:', imageResult);
        // Image results should return the first image URL/path
        result = imageResult.images[0];
        break;
        
      case 'generateAudio':
        const audioPayload: AudioPayload = {
          prompt: resolvedPrompt,
          model: action.config?.model || 'elevenlabs'
        };
        const audioResult = await sdk.ai.generateAudio(audioPayload);
        console.log('SDK generateAudio response:', audioResult);
        // Audio results should return the first audio URL/path
        result = {
          audio: audioResult.audios[0],
          filepath: typeof audioResult.filepath === 'string' ? 
            audioResult.filepath : audioResult.filepath[0]
        };
        break;
        
      case 'generateVideo':
        const videoPayload: VideoPayload = {
          prompt: resolvedPrompt,
          model: action.config?.model || 'default'
        };
        const videoResult = await sdk.ai.generateVideo(videoPayload);
        console.log('SDK generateVideo response:', videoResult);
        // Video results should return the video URL/path
        result = {
          video: videoResult.video,
          filepath: videoResult.filepath
        };
        break;
        
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Action execution error:', error);
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error : String(error) 
    };
  }
} 