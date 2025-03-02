// Basic types from the SDK
export interface WebdrawSDK {
  fs: FileSystemInterface;
  ai: AISDK & LegacyAISDK;
  getUser: () => Promise<{ username: string } | null>;
  redirectToLogin: (options?: { appReturnUrl?: string }) => void;
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<SerializableResponse>;
}

export interface SerializableResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export interface FileSystemInterface {
  stat: (filepath: string) => Promise<StatsLike<number> | null>;
  cwd: () => string;
  read: (filepath: string, options?: any) => Promise<string | Uint8Array>;
  readFile: (filepath: string, options?: any) => Promise<string | Uint8Array>;
  write: (filepath: string, text: string, options?: any) => Promise<void>;
  list: (filter?: string) => Promise<string[]>;
  remove: (filepath: string) => Promise<void>;
  mkdir: (filepath: string, options?: { recursive?: boolean; mode?: number }) => Promise<void>;
  exists: (filepath: string) => Promise<boolean>;
}

export interface StatsLike<T> {
  isFile: () => boolean;
  isDirectory: () => boolean;
  size: T;
  mtime: Date;
}

// AI SDK Types
export interface AISDK {
  generateText: (input: TextPayload) => Promise<{ text: string; filepath: string }>;
  streamText: (input: TextPayload) => Promise<AsyncIterableIterator<{ text: string }>>;
  generateObject: <T = any>(input: ObjectPayload) => Promise<{ object: T; filepath: string }>;
  streamObject: <T = any>(input: ObjectPayload) => Promise<AsyncIterableIterator<Partial<T>>>;
  generateImage: (input: ImagePayload) => Promise<{ images: Array<string>; filepath: string }>;
  generateVideo: (input: VideoPayload) => Promise<{ video?: string; filepath: string }>;
  generateAudio: (input: AudioPayload) => Promise<{ audios: Array<string>; filepath: Array<string> }>;
  generate3DObject: (input: Object3DPayload) => Promise<Object3DResponse>;
}

export interface LegacyAISDK {
  message: (chat: any) => Promise<any>;
  genImage: (prompt: { prompt: string }) => Promise<{ url: string }>;
}

// Payload Types
export interface TextPayload {
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Record<string, any>;
  providerOptions?: any;
  headers?: Record<string, string>;
  messages?: any[];
  prompt?: string;
}

export interface ObjectPayload {
  schema: {
    type: "object";
    properties: Record<string, any>;
  };
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  streamType?: "partial_object" | "text_stream";
  providerOptions?: any;
  messages?: any[];
  prompt?: string;
}

export interface ImagePayload {
  model: string;
  prompt?: string;
  image?: string;
  n?: number;
  size?: string;
  aspectRatio?: string;
  providerOptions?: any;
  headers?: Record<string, string>;
  seed?: number;
}

export interface VideoPayload {
  model: string;
  prompt?: string;
  image?: string;
  video?: string;
  providerOptions?: any;
  headers?: Record<string, string>;
}

export interface AudioPayload {
  model: string;
  prompt?: string;
  audio?: string;
  providerOptions?: any;
  headers?: Record<string, string>;
}

export interface Object3DPayload {
  model: string;
  prompt?: string;
  image?: string;
  providerOptions?: any;
  headers?: Record<string, string>;
  seed?: number;
}

export interface Object3DResponse {
  object?: string;
  filepath?: string;
}

// Declare the global SDK variable
declare global {
  interface Window {
    SDK: WebdrawSDK;
  }
} 