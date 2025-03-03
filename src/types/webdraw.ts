export interface WebdrawUser {
  username: string;
}

export interface AIGenerateOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface FileSystemOptions {
  path: string;
  content?: string;
  encoding?: string;
}

export interface FileSystemInterface {
  list(path: string): Promise<string[]>;
  readFile(options: FileSystemOptions): Promise<string>;
  writeFile(options: FileSystemOptions): Promise<void>;
  delete(options: FileSystemOptions): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

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

export interface WebdrawSDK {
  fs: FileSystemInterface;
  ai: AIInterface;
  getUser(): Promise<{ username: string } | null>;
  redirectToLogin(options?: { appReturnUrl?: string }): void;
}

export interface AppConfig {
  id: string;
  name: string;
  template: string;
  style: string;
  inputs: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
  }>;
  actions: Array<{
    name: string;
    description: string;
    type: string;
    prompt: string;
  }>;
  output: {
    format: string;
    template?: string;
    enableMarkdown?: boolean;
    enableSyntaxHighlighting?: boolean;
    maxLength?: number;
    type: 'html' | 'json' | 'files';
    files: string[];
  };
}

export interface InputField {
  filename: string;
  type: 'text' | 'image' | 'select' | 'file' | 'audio';
  title: {
    EN: string;
    PT: string;
  };
  required: boolean;
  multiValue?: boolean;
  cleanOnStartup?: boolean;
  options?: string[];
  defaultValue?: unknown;
}

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

export interface OutputConfiguration {
  type: 'html' | 'json' | 'files';
  template?: string;
  files: string[];
} 