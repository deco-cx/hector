import { 
  Localizable,
  WebdrawSDK as MainWebdrawSDK,
  FileSystemInterface as MainFileSystemInterface,
  AIInterface as MainAIInterface,
  GenerateTextParams as MainGenerateTextParams,
  GenerateImageParams as MainGenerateImageParams,
  GenerateAudioParams as MainGenerateAudioParams,
  GenerateVideoParams as MainGenerateVideoParams,
  GenerateObjectParams as MainGenerateObjectParams,
  FileSystemOptions as MainFileSystemOptions,
  InputField as MainInputField,
  ActionData as MainActionData
} from './types';

/**
 * @deprecated Use WebdrawUser from types.ts instead
 */
export interface WebdrawUser {
  username: string;
}

/**
 * @deprecated Use AIGenerateOptions from types.ts instead
 */
export interface AIGenerateOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
}

/**
 * @deprecated Use FileSystemOptions from types.ts instead
 */
export interface FileSystemOptions {
  path: string;
  content?: string;
  encoding?: string;
}

/**
 * @deprecated Use FileSystemInterface from types.ts instead
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
 * @deprecated Use AIInterface from types.ts instead
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

/**
 * @deprecated Use WebdrawSDK from types.ts instead
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
 * @deprecated Use FileSystemInterface from types.ts instead
 */
export interface FileSystem {
  list: (path: string) => Promise<string[]>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  delete: (path: string) => Promise<void>;
}

/**
 * @deprecated Use TextPayload from types.ts instead
 */
export interface GenerateTextParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * @deprecated Use ImagePayload from types.ts instead
 */
export interface GenerateImageParams {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  negativePrompt?: string;
}

/**
 * @deprecated Use AudioPayload from types.ts instead
 */
export interface GenerateAudioParams {
  prompt: string;
  model?: string;
  voice?: string;
  speed?: number;
}

/**
 * @deprecated Use VideoPayload from types.ts instead
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
 * @deprecated Use ObjectPayload from types.ts instead
 */
export interface GenerateObjectParams {
  prompt: string;
  schema: any;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * @deprecated Use AppConfig from types.ts instead
 */
export interface AppConfig {
  id: string;
  name: Localizable<string>;
  template: string;
  style: string;
  inputs: InputField[];
  actions: ActionData[];
  output: OutputConfig;
  supportedLanguages?: string[];
}

/**
 * @deprecated Use InputField from types.ts instead
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

/**
 * @deprecated Use ActionData from types.ts instead
 */
export interface ActionData {
  id: string;
  type: string;
  title: Localizable<string>;
  description?: Localizable<string>;
  filename: string;
  prompt: Localizable<string>;
  config: Record<string, any>;
}

/**
 * @deprecated Use OutputTemplate from types.ts instead
 */
export interface OutputConfig {
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
 * @deprecated Use ActionData from types.ts instead, this is a legacy format
 */
export interface Action {
  type: 'Gerar JSON' | 'Gerar Texto' | 'Gerar Imagem' | 'Gerar Aúdio';
  prompt: {
    EN: string;
    PT: string;
  };
  output_filename: string;
  model?: string;
  parameters?: Record<string, unknown>;
} 