import { JSONSchema7 } from 'json-schema';
import { Localizable, DEFAULT_LANGUAGE, getLocalizedValue, ActionType, ActionConfig, ActionData, createDefaultLocalizable } from '../types/types';

// Define available actions with their schemas and default properties
export const availableActions: Record<ActionType, ActionConfig> = {
  generateText: {
    type: 'generateText',
    label: 'Generate Text',
    description: 'Generate text content using AI models',
    icon: 'FileTextOutlined',
    fileExtension: '.md',
    schema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          description: 'The prompt for text generation. Use @filename.md to reference input fields.',
        },
        model: {
          type: 'string',
          title: 'Model',
          description: 'The AI model to use for text generation',
          enum: [
            'Best',
            'Fast',
            'anthropic:claude-3-7-sonnet-latest',
            'anthropic:claude-3-5-haiku-20241022',
            'openai:gpt-4-turbo',
            'openai:gpt-4',
            'openai:gpt-4o',
            'openai:gpt-4o-mini',
            'openai:o1-preview',
            'openai:o1-mini',
            'openai:o1',
            'openai:o3-mini',
            'openai:gpt-4o-audio-preview',
            'deepseek:deepseek-chat',
            'deepseek:deepseek-reasoner',
            'mistral:pixtral-large-latest',
            'mistral:mistral-large-latest',
            'mistral:mistral-small-latest',
            'mistral:pixtral-12b-2409',
            'perplexity:sonar',
            'perplexity:sonar-pro',
            'xai:grok-2-latest',
            'xai:grok-2-vision-latest'
          ],
          default: 'Best',
        },
        temperature: {
          type: 'number',
          title: 'Temperature',
          description: 'Controls randomness (0-1)',
          minimum: 0,
          maximum: 1,
          default: 0.7,
        },
        maxTokens: {
          type: 'number',
          title: 'Max Tokens',
          description: 'Maximum length of generated text',
          minimum: 1,
          default: 500,
        },
      },
    },
    defaultProps: {
      model: 'Best',
      temperature: 0.7,
      maxTokens: 500,
    },
  },
  generateJSON: {
    type: 'generateJSON',
    label: 'Generate JSON',
    description: 'Generate structured JSON data',
    icon: 'CodeOutlined',
    fileExtension: '.json',
    schema: {
      type: 'object',
      required: ['prompt', 'schema'],
      properties: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          description: 'The prompt for JSON generation. Use @filename.md to reference input fields.',
        },
        model: {
          type: 'string',
          title: 'Model',
          description: 'The AI model to use for JSON generation',
          enum: [
            'Best',
            'Fast',
            'anthropic:claude-3-7-sonnet-latest',
            'anthropic:claude-3-5-haiku-20241022',
            'openai:gpt-4-turbo',
            'openai:gpt-4',
            'openai:gpt-4o',
            'openai:gpt-4o-mini',
            'openai:o1-preview',
            'openai:o1-mini',
            'openai:o1',
            'openai:o3-mini',
            'openai:gpt-4o-audio-preview',
            'deepseek:deepseek-chat',
            'deepseek:deepseek-reasoner',
            'mistral:pixtral-large-latest',
            'mistral:mistral-large-latest',
            'mistral:mistral-small-latest',
            'mistral:pixtral-12b-2409',
            'perplexity:sonar',
            'perplexity:sonar-pro',
            'xai:grok-2-latest',
            'xai:grok-2-vision-latest'
          ],
          default: 'Best',
        },
        schema: {
          type: 'string',
          title: 'Schema',
          description: 'The JSON schema defining the structure of the generated object',
          format: 'json',
        },
        temperature: {
          type: 'number',
          title: 'Temperature',
          description: 'Controls randomness (0-1)',
          minimum: 0,
          maximum: 1,
          default: 0.7,
        },
      },
    },
    defaultProps: {
      model: 'Best',
      temperature: 0.7,
      schema: '{\n  "type": "object",\n  "properties": {\n    "example": {\n      "type": "string"\n    }\n  }\n}',
    },
  },
  generateImage: {
    type: 'generateImage',
    label: 'Generate Image',
    description: 'Generate image content using AI models',
    icon: 'FileImageOutlined',
    fileExtension: '.png',
    schema: {
      type: 'object',
      required: ['prompt', 'model'],
      properties: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          description: 'The prompt for image generation. Use @filename.md to reference input fields.',
        },
        model: {
          type: 'string',
          title: 'Model',
          description: 'The AI model to use for image generation',
          enum: [
            'Best',
            'Fast',
            'openai:dall-e-3',
            'stability:core',
            'stability:ultra',
            'stability:conservative',
            'stability:creative',
            'stability:fast',
            'stability:erase',
            'stability:inpaint',
            'stability:outpaint',
            'stability:search-and-replace',
            'stability:search-and-recolor',
            'stability:remove-background',
            'stability:sketch',
            'stability:structure',
            'stability:style',
            'replicate:black-forest-labs/flux-dev-lora',
            'replicate:smoosh-sh/baby-mystic',
            'replicate:zetyquickly-org/faceswap-a-gif',
            'replicate:bytedance/pulid',
            'replicate:recraft-ai/recraft-v3',
            'replicate:bytedance/sdxl-lightning-4step',
            'replicate:adirik/interior-design'
          ],
          default: 'Best',
        },
        size: {
          type: 'string',
          title: 'Size',
          description: 'Size of the generated image',
          enum: ['256x256', '512x512', '1024x1024'],
          default: '512x512',
        },
        n: {
          type: 'number',
          title: 'Number of Images',
          description: 'Number of images to generate',
          minimum: 1,
          maximum: 4,
          default: 1,
        },
      },
    },
    defaultProps: {
      model: 'Best',
      size: '512x512',
      n: 1,
    },
  },
  generateAudio: {
    type: 'generateAudio',
    label: 'Generate Audio',
    description: 'Generate audio content using AI models',
    icon: 'SoundOutlined',
    fileExtension: '.mp3',
    schema: {
      type: 'object',
      required: ['prompt', 'model'],
      properties: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          description: 'The prompt for audio generation. Use @filename.md to reference input fields.',
        },
        model: {
          type: 'string',
          title: 'Model',
          description: 'The AI model to use for audio generation',
          enum: [
            'Best',
            'Fast',
            'elevenlabs:tts',
            'replicate:meta/musicgen',
            'replicate:fictions-ai/autocaption'
          ],
          default: 'Best',
        },
      },
    },
    defaultProps: {
      model: 'Best',
    },
  },
  generateVideo: {
    type: 'generateVideo',
    label: 'Generate Video',
    description: 'Generate video content using AI models',
    icon: 'PlayCircleOutlined',
    fileExtension: '.mp4',
    schema: {
      type: 'object',
      required: ['prompt', 'model'],
      properties: {
        prompt: {
          type: 'string',
          title: 'Prompt',
          description: 'The prompt for video generation. Use @filename.md to reference input fields.',
        },
        model: {
          type: 'string',
          title: 'Model',
          description: 'The AI model to use for video generation',
          enum: [
            'Best',
            'Fast',
            'minmax:video-01',
            'vidu:text2video',
            'replicate:tencent/hunyuan-video',
            'replicate:zsxkib/mmaudio'
          ],
          default: 'Best',
        },
      },
    },
    defaultProps: {
      model: 'Best',
    },
  },
};

// Helper function to generate a unique action filename
export const generateActionFilename = (
  title: string, 
  type: ActionType, 
  existingActions: ActionData[]
): string => {
  if (!title) return '';
  
  // Convert the title to a suitable filename format
  const baseFilename = title
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
  
  if (!baseFilename) return '';
  
  const extension = availableActions[type].fileExtension;
  const filenameWithExt = `${baseFilename}${extension}`;
  
  // Check for duplicates
  const isDuplicate = existingActions.some(action => action.filename === filenameWithExt);
  
  // If duplicate, add a suffix
  if (isDuplicate) {
    // Find all actions with similar filenames and get the highest suffix
    const regex = new RegExp(`^${baseFilename}-(\\d+)${extension}$`);
    const suffixes = existingActions
      .map(action => {
        const match = action.filename.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(suffix => suffix > 0);
    
    const highestSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0;
    return `${baseFilename}-${highestSuffix + 1}${extension}`;
  }
  
  return filenameWithExt;
};

// Function to execute actions via the Webdraw SDK
export const executeAction = async (
  action: ActionData,
  inputData: Record<string, any>,
  sdk: any, // We'll need to type this properly with the Webdraw SDK interface
  previousResults: Record<string, any> = {},
  language: string = DEFAULT_LANGUAGE
): Promise<any> => {
  // Replace references to input fields and previous actions in the prompt
  const processReferences = (text: string): string => {
    return text.replace(/@([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g, (match, filename) => {
      // Check if the reference is to an input field
      if (inputData[filename]) {
        return inputData[filename];
      }
      // Check if the reference is to a previous action result
      if (previousResults[filename]) {
        return previousResults[filename];
      }
      // Leave unresolved references as is
      return match;
    });
  };

  // Get the prompt text for the current language
  const promptText = getLocalizedValue(action.prompt, language) || '';
  
  // Process the prompt to replace references
  const processedPrompt = processReferences(promptText);
  
  // Process the action configuration
  const config = { ...action.config };
  
  // Execute the appropriate SDK method based on action type
  switch (action.type) {
    case 'generateText':
      return await sdk.ai.generateText({
        model: config.model,
        prompt: processedPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

    case 'generateJSON':
      return await sdk.ai.generateObject({
        model: config.model,
        prompt: processedPrompt,
        schema: JSON.parse(config.schema),
        temperature: config.temperature,
      });

    case 'generateImage':
      return await sdk.ai.generateImage({
        model: config.model,
        prompt: processedPrompt,
        size: config.size,
        n: config.n,
      });

    case 'generateAudio':
      return await sdk.ai.generateAudio({
        model: config.model,
        prompt: processedPrompt,
      });

    case 'generateVideo':
      return await sdk.ai.generateVideo({
        model: config.model,
        prompt: processedPrompt,
      });

    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
};