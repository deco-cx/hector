/**
 * Central types definition file for the Hector application
 * This file contains all core types used across the application
 */

import { JSONSchema7 } from 'json-schema';

// ============================================================================
// INTERNATIONALIZATION TYPES
// ============================================================================

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE = 'en-US';

/**
 * List of available languages in the application
 * Using BCP 47 language tags (language-REGION)
 */
export const AVAILABLE_LANGUAGES = ['en-US', 'pt-BR', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'];

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
  selectedLanguage?: string;
  /**
   * Last execution data for runtime
   */
  lastExecution?: Execution;
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
export type ActionType = 'generateText' | 'generateJSON' | 'generateImage' | 'generateAudio' | 'generateVideo' | 'generateWithLora' | 'readFile' | 'writeFile';

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
  category: 'AI' | 'FileSystem' | string;
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
  /**
   * State of execution for this action
   */
  state?: 'idle' | 'loading' | 'error';
}

// ============================================================================
// SDK TYPES
// ============================================================================

/**
 * Message format for AI conversations
 */
export interface Message {
  role: 'user' | 'system' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
}

/**
 * AI models for text generation
 */
export type TextModel = 
  | 'Best'
  | 'Fast'
  | string; // Allows for provider-specific models

/**
 * AI models for image generation
 */
export type ImageModel = 
  | 'Best'
  | 'Fast'
  | string; // Allows for provider-specific models

/**
 * AI models for video generation
 */
export type VideoModel = 
  | 'Best'
  | 'Fast'
  | string; // Allows for provider-specific models

/**
 * AI models for audio generation
 */
export type AudioModel = 
  | 'Best'
  | 'Fast'
  | string; // Allows for provider-specific models

/**
 * AI models for 3D object generation
 */
export type ObjectModel3D = 
  | 'Best'
  | 'Fast'
  | string; // Allows for provider-specific models

/**
 * Provider-specific options for AI requests
 */
export type ProviderOptions = Record<string, any>;

/**
 * Core tool definition for AI assistants
 */
export interface CoreTool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Response for 3D object generation
 */
export interface Object3DResponse {
  object?: string;
  filepath?: string;
}

/**
 * Credits available in the wallet
 */
export interface WalletCredits {
  availableCredits: number;
  usedCredits: number;
}

/**
 * Payload for adding credits
 */
export interface AddCreditsPayload {
  amount?: number;
}

/**
 * Response from adding credits
 */
export interface AddCreditsResponse {
  success: boolean;
  transaction?: {
    id: string;
    amount: number;
    timestamp: string;
  };
}

/**
 * Text generation payload
 */
export type TextPayload = {
  model?: TextModel;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Record<string, CoreTool>;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
} & ({
  messages: Message[];
} | {
  prompt: string;
});

/**
 * Object generation payload
 */
export type ObjectPayload = {
  schema: {
    type: "object";
    properties: Record<string, any>;
  };
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  streamType?: "partial_object" | "text_stream";
  providerOptions?: ProviderOptions;
} & ({
  messages: Message[];
} | {
  prompt: string;
});

/**
 * Image generation payload
 */
export type ImagePayload = {
  model?: ImageModel;
  prompt?: string;
  image?: string;
  n?: number;
  size?: `${number}x${number}`;
  aspectRatio?: `${number}:${number}`;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
  seed?: number;
};

/**
 * Video generation payload
 */
export type VideoPayload = {
  model?: VideoModel;
  prompt?: string;
  image?: string;
  video?: string;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
};

/**
 * Audio generation payload
 */
export type AudioPayload = {
  model?: AudioModel;
  prompt?: string;
  audio?: string;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
};

/**
 * 3D object generation payload
 */
export type Object3DPayload = {
  model?: ObjectModel3D;
  prompt?: string;
  image?: string;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
  seed?: number;
};

/**
 * AI interface
 */
export interface AIInterface {
  /**
   * Generate text using AI
   */
  generateText(input: TextPayload): Promise<{ text: string; filepath: string }>;
  
  /**
   * Stream text generation results
   */
  streamText(input: TextPayload): Promise<AsyncIterableIterator<{ text: string }>>;
  
  /**
   * Generate a structured object using AI
   */
  generateObject<T = any>(input: ObjectPayload): Promise<{ object: T; filepath: string }>;
  
  /**
   * Stream object generation results
   */
  streamObject<T = any>(input: ObjectPayload): Promise<AsyncIterableIterator<Partial<T>>>;
  
  /**
   * Generate images using AI
   */
  generateImage(input: ImagePayload): Promise<{ images: string[]; filepath: string }>;
  
  /**
   * Generate video using AI
   */
  generateVideo(input: VideoPayload): Promise<{ video?: string; filepath: string }>;
  
  /**
   * Generate audio using AI
   */
  generateAudio(input: AudioPayload): Promise<{ audios: string[]; filepath: string[] }>;
  
  /**
   * Generate 3D objects using AI
   */
  generate3DObject(input: Object3DPayload): Promise<Object3DResponse>;
  
  /**
   * Get available credits in the wallet
   */
  getCredits(): Promise<WalletCredits>;
  
  /**
   * Show UI to add credits to wallet
   */
  showAddCreditsToWallet(input: AddCreditsPayload): Promise<AddCreditsResponse>;
}

/**
 * WebdrawSDK main interface
 */
export interface WebdrawSDK {
  /**
   * Filesystem interface for working with files
   */
  fs: FileSystemInterface;
  
  /**
   * AI interface for generating content
   */
  ai: AIInterface;
  
  /**
   * Get current user information
   */
  getUser(): Promise<{ username: string } | null>;
  
  /**
   * Redirect to login page
   */
  redirectToLogin(options?: { appReturnUrl?: string }): void;
  
  /**
   * Simple hello function for testing connection
   */
  hello: () => string;
  
  /**
   * Create variations of an image
   * @deprecated Use ai.* methods instead
   */
  imageVariation?: (config: any) => Promise<any>;
  
  /**
   * Upscale an image
   * @deprecated Use ai.* methods instead
   */
  upscaleImage?: (config: any) => Promise<any>;
  
  /**
   * Remove background from an image
   * @deprecated Use ai.* methods instead
   */
  removeBackground?: (config: any) => Promise<any>;
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
  
  // Additional methods used in implementation
  chmod(filepath: string, mode: number): Promise<void>;
  exists(filepath: string): Promise<boolean>;
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
 * @deprecated Use TextPayload instead
 */
export interface GenerateTextParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * @deprecated Use ImagePayload instead
 */
export interface GenerateImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

/**
 * @deprecated Use AudioPayload instead
 */
export interface GenerateAudioParams {
  prompt: string;
  model?: string;
  voice?: string;
  speed?: number;
}

/**
 * @deprecated Use VideoPayload instead
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
 * @deprecated Use ObjectPayload instead
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

/**
 * Check if a language exists in a localizable object
 */
export function hasLanguage<T>(obj: Localizable<T> | undefined, lang: string): boolean {
  if (!obj) return false;
  return obj[lang] !== undefined;
}

/**
 * Get available languages in the app config
 */
export function getAvailableLanguages(appConfig?: any): string[] {
  if (!appConfig?.supportedLanguages || !Array.isArray(appConfig.supportedLanguages)) {
    return AVAILABLE_LANGUAGES;
  }
  return appConfig.supportedLanguages;
}

/**
 * Determines if a Localizable object is complete (has values for all required languages)
 */
export function isComplete<T>(
  obj: Localizable<T> | undefined,
  requiredLanguages: string[] = AVAILABLE_LANGUAGES
): boolean {
  if (!obj) return false;
  
  return requiredLanguages.every(lang => obj[lang] !== undefined);
}

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  SETTINGS: '/settings',
  LANGUAGE_SETTINGS: '/settings/languages',
  APP_EDITOR: '/app/:appName',
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  PREFERRED_LANGUAGE: 'preferredLanguage',
};

/**
 * Validates an AppConfig object to ensure it has all required fields
 * Returns true if valid, false otherwise
 */
export function isValidAppConfig(appConfig: any): appConfig is AppConfig {
  if (!appConfig) return false;
  
  // Check required fields
  if (typeof appConfig.id !== 'string' || !appConfig.id) return false;
  
  // Check name is a valid Localizable object with at least one language
  if (!appConfig.name || typeof appConfig.name !== 'object' || Object.keys(appConfig.name).length === 0) return false;
  
  // Check template and style
  if (typeof appConfig.template !== 'string') return false;
  if (typeof appConfig.style !== 'string') return false;
  
  // Check inputs and actions are arrays
  if (!Array.isArray(appConfig.inputs)) return false;
  if (!Array.isArray(appConfig.actions)) return false;
  
  // Check output is an array
  if (!Array.isArray(appConfig.output)) return false;
  
  // Check supportedLanguages is an array if present
  if (appConfig.supportedLanguages !== undefined && !Array.isArray(appConfig.supportedLanguages)) return false;
  
  // Check selectedLanguage is a string if present
  if (appConfig.selectedLanguage !== undefined && typeof appConfig.selectedLanguage !== 'string') return false;
  
  return true;
}

// ============================================================================
// RUNTIME TYPES
// ============================================================================

/**
 * Represents the content of a file in the execution context
 */
export interface FileContent {
  path?: string;
  textValue?: string;
}

/**
 * Represents a single execution of the app with input values and action results
 */
export interface Execution {
  /**
   * Holds values for inputs and results from actions.
   * Keys are filenames, values are file contents
   */
  bag: Record<string, FileContent>;
  
  /**
   * Timestamp when this execution was created/updated
   */
  timestamp: number;
} 