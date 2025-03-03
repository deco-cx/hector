import { JSONSchema7 } from 'json-schema';

export type ActionType = 'generateText' | 'generateJSON' | 'generateImage' | 'generateAudio';

export interface ActionConfig {
  type: ActionType;
  label: string;
  description: string;
  icon: string;
  fileExtension: string;
  schema: JSONSchema7;
  defaultProps: Record<string, any>;
}

export interface ActionData {
  id: string;
  type: ActionType;
  title: string;
  filename: string;
  config: Record<string, any>;
}

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
          default: 'text-model',
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
      model: 'text-model',
      temperature: 0.7,
      maxTokens: 500,
      prompt: '',
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
      temperature: 0.7,
      prompt: '',
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
          default: 'image-model',
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
      model: 'image-model',
      size: '512x512',
      n: 1,
      prompt: '',
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
          default: 'audio-model',
        },
      },
    },
    defaultProps: {
      model: 'audio-model',
      prompt: '',
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
  previousResults: Record<string, any> = {}
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

  // Process the action configuration
  const config = { ...action.config };
  if (config.prompt) {
    config.prompt = processReferences(config.prompt);
  }

  // Execute the appropriate SDK method based on action type
  switch (action.type) {
    case 'generateText':
      return await sdk.ai.generateText({
        model: config.model,
        prompt: config.prompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

    case 'generateJSON':
      return await sdk.ai.generateObject({
        prompt: config.prompt,
        schema: JSON.parse(config.schema),
        temperature: config.temperature,
      });

    case 'generateImage':
      return await sdk.ai.generateImage({
        model: config.model,
        prompt: config.prompt,
        size: config.size,
        n: config.n,
      });

    case 'generateAudio':
      return await sdk.ai.generateAudio({
        model: config.model,
        prompt: config.prompt,
      });

    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}; 