import { JSONSchema7 } from 'json-schema';
import { OutputTemplateType, OutputTemplate, createDefaultLocalizable } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for each output template type
 */
export interface OutputTemplateConfig {
  type: OutputTemplateType;
  label: string;
  description: string;
  icon: string;
  schema: JSONSchema7;
  defaultProps: Record<string, any>;
}

/**
 * Define available output templates with their schemas and default properties
 */
export const availableOutputTemplates: Record<OutputTemplateType, OutputTemplateConfig> = {
  Story: {
    type: 'Story',
    label: 'Story',
    description: 'A narrative template with text, image, and audio support',
    icon: 'BookOutlined',
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: {
          type: 'object',
          title: 'Title',
          description: 'The title of the story',
        },
        backgroundImage: {
          type: 'string',
          title: 'Background Image',
          description: 'An image to use as background (e.g., @cover.png)',
        },
        content: {
          type: 'string',
          title: 'Content',
          description: 'The main content of the story (e.g., @story.md)',
        },
        audio: {
          type: 'string',
          title: 'Audio',
          description: 'Audio narration of the story (e.g., @narration.mp3)',
        },
      },
    },
    defaultProps: {},
  },
};

/**
 * Create a new output template with default values
 */
export const createOutputTemplate = (type: OutputTemplateType): OutputTemplate => {
  const templateConfig = availableOutputTemplates[type];
  
  return {
    type: type,
    title: createDefaultLocalizable(`New ${templateConfig.label}`),
    // Other fields will be undefined by default
  } as OutputTemplate;
};

/**
 * Get file extensions for different media types
 */
export const fileExtensions = {
  image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
  text: ['.md', '.txt', '.html'],
  json: ['.json'],
  video: ['.mp4', '.webm', '.mov', '.avi']
};

/**
 * Check if a file is of a specific type based on its extension
 */
export const isFileType = (filename: string, type: keyof typeof fileExtensions): boolean => {
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return fileExtensions[type].includes(extension);
};

/**
 * Get compatible file types for each field in the Story template
 */
export const templateFieldFileTypes: Record<string, Array<keyof typeof fileExtensions>> = {
  backgroundImage: ['image'],
  content: ['text'],
  audio: ['audio']
}; 