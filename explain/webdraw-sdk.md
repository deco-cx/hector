WebdrawSDK Documentation
The WebdrawSDK is a comprehensive interface for interacting with the Webdraw platform, providing capabilities for file system operations, AI-powered content generation, canvas drawing, user authentication, and more. This document outlines the SDK's structure, methods, and usage patterns.

Core SDK Interface
export interface WebdrawSDK {
  fs: FileSystemInterface;
  drawElements: DrawElementsFunction;
  ai: AISDK & LegacyAISDK;
  inspect: (inspectedElement: InspectedElement | null) => void;
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<SerializableResponse>;
  onError: (error: State["runtimeError"]) => void;
  init: () => void;
  onLoad: () => void;
  getUser: () => Promise<{ username: string } | null>;
  redirectToLogin: (options?: { appReturnUrl?: string }) => void;
  openEmbedInCanvas: (
    link: string,
    position?: {
      clientX: number;
      clientY: number;
      width?: number;
      height?: number;
    } | {
      x: number;
      y: number;
      width?: number;
      height?: number;
    },
    type?: "embed" | "frame",
  ) => Element | undefined;
  posthogEvent: (
    eventId: PosthogEvent["name"],
    properties: Record<string, unknown>,
  ) => void;
}
File System Interface
The SDK provides a comprehensive file system interface for reading, writing, and manipulating files:

interface FileSystemInterface {
  stat(filepath: string): Promise<StatsLike<number> | null>;
  cwd(): string;
  chmod(filepath: string, mode: number): Promise<void>;
  read(filepath: string, options?: ReadFileOptions): Promise<string | Uint8Array>;
  readFile(filepath: string, options?: ReadFileOptions): Promise<string | Uint8Array>;
  write(
    filepath: string,
    text: string,
    options?: BufferEncoding | ObjectEncodingOptions | null,
  ): Promise<void>;
  list(filter?: string): Promise<string[]>;
  relative(filepath: string): string;
  remove(filepath: string): Promise<void>;
  symlink(target: string, path: string): Promise<void>;
  mkdir(
    filepath: string,
    options?: { recursive?: boolean; mode?: number },
  ): Promise<void>;
  readlink(filepath: string): Promise<string>;
  drawElements: WebdrawSDK["drawElements"];
  exists(filepath: string): Promise<boolean>;
}
Key File System Methods
stat: Get file/directory information
cwd: Get current working directory
read/readFile: Read file contents (string or binary)
write: Write content to a file
list: List files in a directory (optionally with a filter)
remove: Delete a file
mkdir: Create a directory
exists: Check if a file exists
AI Interface
The SDK provides a powerful AI interface for generating various types of content:

interface AISDK {
  generateText: (
    input: TextPayload,
  ) => Promise<{ text: string; filepath: string }>;
  
  streamText: (
    input: TextPayload,
  ) => Promise<AsyncIterableIterator<{ text: string }>>;
  
  generateObject: <T = any>(
    input: ObjectPayload,
  ) => Promise<{ object: T; filepath: string }>;
  
  streamObject: <T = any>(
    input: ObjectPayload,
  ) => Promise<AsyncIterableIterator<Partial<T>>>;
  
  generateImage: (
    input: ImagePayload,
  ) => Promise<{ images: Array<string>; filepath: string }>;
  
  generateVideo: (
    input: VideoPayload,
  ) => Promise<{ video?: string; filepath: string }>;
  
  generateAudio: (
    input: AudioPayload,
  ) => Promise<{ audios: Array<string>; filepath: Array<string> }>;
  
  generate3DObject: (
    input: Object3DPayload
  ) => Promise<Object3DResponse>;
  
  getCredits: () => Promise<WalletCredits>;
  
  showAddCreditsToWallet: (
    input: AddCreditsPayload,
  ) => Promise<AddCreditsResponse>;
}

// Legacy AI interface (maintained for backward compatibility)
interface LegacyAISDK {
  message(chat: ChatWithTools): Promise<ChatMessage>;
  genImage(prompt: { prompt: string }): Promise<{ url: string }>;
}
AI Payload Types
TextPayload
type TextPayload = {
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
ObjectPayload
type ObjectPayload = {
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
ImagePayload
type ImagePayload = {
  model: ImageModel;
  prompt?: string;
  image?: string;
  n?: number;
  size?: `${number}x${number}`;
  aspectRatio?: `${number}:${number}`;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
  seed?: number;
};
VideoPayload
type VideoPayload = {
  model: VideoModel;
  prompt?: string;
  image?: string;
  video?: string;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
};
AudioPayload
type AudioPayload = {
  model: AudioModel;
  prompt?: string;
  audio?: string;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
};
Object3DPayload
type Object3DPayload = {
  model: ObjectModel3D;
  prompt?: string;
  image?: string;
  providerOptions?: ProviderOptions;
  headers?: Record<string, string>;
  seed?: number;
};
Drawing Interface
The SDK provides capabilities for drawing elements on the canvas:

type DrawElementsFunction = (
  elements: Element[],
  position: "top" | "bottom" | "left" | "right" | {
    x: number;
    y: number;
  },
) => Promise<void>;

interface Element {
  x: number;
  y: number;
  type: string;
  link: string | null;
  height: number;
  width: number;
}
Position Calculation
The SDK includes a utility for calculating positions relative to existing elements:

interface PositionCalculationParams {
  position: "top" | "bottom" | "left" | "right";
  elements: Array<Element>;
  appEmbeddable: Element;
  padding?: number;
}

function calculatePosition({
  position,
  elements,
  appEmbeddable,
  padding = 50,
}: PositionCalculationParams): { x: number; y: number };
User Authentication
The SDK provides methods for user authentication and session management:

// Get the current user
getUser(): Promise<{ username: string } | null>;

// Redirect to login page
redirectToLogin(options?: { appReturnUrl?: string }): void;
Fetch API
The SDK provides a fetch API for making HTTP requests:

interface SerializableResponse extends Pick<Response, "ok"> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

fetch(input: RequestInfo, init?: RequestInit): Promise<SerializableResponse>;
Event Tracking
The SDK provides a method for tracking events:

posthogEvent(
  eventId: PosthogEvent["name"],
  properties: Record<string, unknown>,
): void;