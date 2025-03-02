// App Configuration Types
export type Language = 'EN' | 'PT';

export type InputType = 'text' | 'image' | 'select' | 'file' | 'audio';

export interface MultilingualText {
  EN: string;
  PT: string;
}

export interface InputField {
  filename: string;
  type: InputType;
  title: MultilingualText;
  required: boolean;
  multiValue: boolean;
  cleanOnStartup: boolean;
  options?: string[]; // Only for "select" type
  defaultValue?: any;
}

export type ActionType = 'Gerar JSON' | 'Gerar Texto' | 'Gerar Imagem' | 'Gerar Aúdio';

export interface Action {
  type: ActionType;
  prompt: MultilingualText;
  output_filename: string;
  model?: string;
  parameters?: Record<string, any>;
}

export type OutputType = 'html' | 'json' | 'files';

export interface OutputConfiguration {
  type: OutputType;
  template?: string;
  files?: string[];
}

export interface AppConfiguration {
  id: string;
  name: string;
  template: string;
  style: string;
  inputs: InputField[];
  actions: Action[];
  output: OutputConfiguration;
}

// Runtime Types
export type RuntimeStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface RuntimeState {
  appConfig: AppConfiguration;
  inputValues: Record<string, any>;
  generatedOutputs: Record<string, any>;
  currentLanguage: Language;
  status: RuntimeStatus;
  error?: string;
}

// Theme Types
export type ThemeType = 'light' | 'dark' | 'cupcake' | 'cyberpunk' | 'retro' | 'valentine' | 'aqua' | 'corporate' | 'synthwave' | 'night'; 