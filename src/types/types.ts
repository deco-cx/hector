/**
 * Central types definition file for the Hector application
 * This file contains all core types used across the application
 */

import { JSONSchema7 } from 'json-schema';

// ============================================================================
// INTERNATIONALIZATION TYPES
// ============================================================================

/**
 * Supported languages in the system
 * Using BCP 47 language tags (language-REGION)
 */
export const AVAILABLE_LANGUAGES = ["en-US", "pt-BR"];

/**
 * Default fallback language
 */
export const DEFAULT_LANGUAGE = "en-US";

/**
 * Type for localizable content
 * Maps language codes to values of type T
 */
export type Localizable<T> = {
  [languageCode: string]: T;
};

// ============================================================================
// APP CONFIGURATION TYPES
// ============================================================================

/**
 * Output configuration
 */
export interface LegacyOutputConfig {
  format: string;
  template?: string;
  enableMarkdown?: boolean;
  enableSyntaxHighlighting?: boolean;
  maxLength?: number;
  type: 'html' | 'json' | 'files';
  title?: Localizable<string>;
  description?: Localizable<string>;
  files: string[];
}

/**
 * Output template types supported by the system
 */
export type OutputTemplateType = 'Story';

/**
 * Base interface for all output templates
 */
export interface BaseOutputTemplate {
  type: OutputTemplateType;
  title: Localizable<string>;
}

/**
 * Story output template
 */
export interface StoryOutputTemplate extends BaseOutputTemplate {
  type: 'Story';
  backgroundImage?: string;
  content?: string;
  audio?: string;
}

/**
 * Union type for all output templates
 */
export type OutputTemplate = StoryOutputTemplate;

/**
 * Main application configuration interface
 */
export interface AppConfig {
  id: string;
  name: Localizable<string>;
  template: string;
  style: string;
  inputs: InputField[];
  actions: ActionData[];
  output: OutputTemplate[];
  supportedLanguages?: string[];
}

/**
 * Input field configuration
 */
export interface InputField {
  filename: string;
  type: 'text' | 'image' | 'select' | 'file' | 'audio';
  title: Localizable<string>;
  required: boolean;
  placeholder?: Localizable<string>;
  description?: Localizable<string>;
  multiValue?: boolean;
  cleanOnStartup?: boolean;
  options?: Array<{
    value: string;
    label: Localizable<string>;
  }>;
  defaultValue?: unknown;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Available action types in the system
 */
export type ActionType = 'generateText' | 'generateJSON' | 'generateImage' | 'generateAudio' | 'generateVideo';

/**
 * Configuration for each action type
 */
export interface ActionConfig {
  type: ActionType;
  label: string;
  description: string;
  icon: string;
  fileExtension: string;
  schema: JSONSchema7;
  defaultProps: Record<string, any>;
}

/**
 * Action data structure for an individual action
 */
export interface ActionData {
  id: string;
  type: ActionType;
  title: Localizable<string>;
  description?: Localizable<string>;
  filename: string;
  prompt: Localizable<string>;
  config: Record<string, any>;
}

// ============================================================================
// SDK TYPES
// ============================================================================

/**
 * WebdrawSDK main interface
 */
export interface WebdrawSDK {
  fs: FileSystemInterface;
  ai: AIInterface;
  getUser(): Promise<{ username: string } | null>;
  redirectToLogin(options?: { appReturnUrl?: string }): void;
  hello: () => string;
  generateText: (params: GenerateTextParams) => Promise<string>;
  generateImage: (params: GenerateImageParams) => Promise<string>;
  generateAudio: (params: GenerateAudioParams) => Promise<string>;
  generateVideo: (params: GenerateVideoParams) => Promise<string>;
  generateObject: (params: GenerateObjectParams) => Promise<any>;
}

/**
 * File system interface
 */
export interface FileSystemInterface {
  list(path: string): Promise<string[]>;
  readFile(options: FileSystemOptions): Promise<string>;
  read(filepath: string, options?: any): Promise<string>;
  writeFile(options: FileSystemOptions): Promise<void>;
  write(filepath: string, text: string, options?: any): Promise<void>;
  delete(options: FileSystemOptions): Promise<void>;
  remove(filepath: string): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

/**
 * AI interface
 */
export interface AIInterface {
  generateText(options: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; filepath: string }>;

  generateImage(options: {
    prompt: string;
    model?: string;
    n?: number;
    size?: string;
  }): Promise<{ images: string[]; filepath: string }>;

  generateObject<T>(options: {
    prompt: string;
    schema: {
      type: "object";
      properties: Record<string, any>;
    };
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ object: T; filepath: string }>;
}

// ============================================================================
// PARAMETER TYPES
// ============================================================================

/**
 * File system options
 */
export interface FileSystemOptions {
  path: string;
  content?: string;
  encoding?: string;
}

/**
 * Parameters for text generation
 */
export interface GenerateTextParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Parameters for image generation
 */
export interface GenerateImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

/**
 * Parameters for audio generation
 */
export interface GenerateAudioParams {
  prompt: string;
  model?: string;
  voice?: string;
  speed?: number;
}

/**
 * Parameters for video generation
 */
export interface GenerateVideoParams {
  prompt: string;
  model?: string;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
}

/**
 * Parameters for object generation
 */
export interface GenerateObjectParams {
  prompt: string;
  schema: any;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Webdraw user information
 */
export interface WebdrawUser {
  username: string;
}

/**
 * AI generate options
 */
export interface AIGenerateOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets a localized value from a Localizable object
 * Falls back to fallbackLang if the requested language is not available
 */
export function getLocalizedValue<T>(
  obj: Localizable<T> | undefined, 
  lang: string, 
  fallbackLang: string = DEFAULT_LANGUAGE
): T | undefined {
  if (!obj) return undefined;
  
  // Try to get the value in the requested language
  if (obj[lang] !== undefined) {
    return obj[lang];
  }
  
  // Fall back to the default language
  if (obj[fallbackLang] !== undefined) {
    return obj[fallbackLang];
  }
  
  // If neither requested nor fallback language exists, return the first available value
  const firstAvailableKey = Object.keys(obj)[0];
  if (firstAvailableKey) {
    return obj[firstAvailableKey];
  }
  
  // No values available
  return undefined;
}

/**
 * Sets a localized value in a Localizable object
 * Creates a new object if the original is undefined
 */
export function setLocalizedValue<T>(
  obj: Localizable<T> | undefined,
  lang: string,
  value: T
): Localizable<T> {
  const result = { ...(obj || {}) };
  result[lang] = value;
  return result;
}

/**
 * Creates a new Localizable object with a value for a single language
 */
export function createLocalizable<T>(lang: string, value: T): Localizable<T> {
  return { [lang]: value };
}

/**
 * Creates a Localizable string with a default value
 */
export function createDefaultLocalizable(value: string): Localizable<string> {
  return { [DEFAULT_LANGUAGE]: value };
} 