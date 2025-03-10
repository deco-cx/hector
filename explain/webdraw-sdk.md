WebdrawSDK Documentation
The WebdrawSDK is a comprehensive interface for interacting with the Webdraw platform, providing capabilities for file system operations, AI-powered content generation, user authentication, and more. This document outlines the SDK's structure, methods, and usage patterns.

The generated code will use AI APIs using Webdraw SDK

To use the SDK, import it like this.

import { SDK } from "https://webdraw.com/webdraw-sdk@v1"

if used in inline code, 
import  inside of a <script type="module"

instantiates like this: const sdk = SDK

Core SDK Interface
export interface WebdrawSDK {
  fs: FileSystemInterface;
  ai: AISDK & LegacyAISDK;
  inspect: (inspectedElement: InspectedElement | null) => void;
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<SerializableResponse>;
  onError: (error: State["runtimeError"]) => void;
  init: () => void;
  onLoad: () => void;
  getUser: () => Promise<{ username: string } | null>;
  redirectToLogin: (options?: { appReturnUrl?: string }) => void;
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


Supported Models
The SDK supports various models for different types of content generation:

Text Models (TextModel)
```typescript
export const TEXT_MODELS = [
  "openai:gpt-4-turbo",
  "openai:gpt-4",
  "openai:gpt-4o",
  "openai:gpt-4o-mini",
  "openai:o1-preview",
  "openai:o1-mini",
  "openai:o1",
  "openai:o3-mini",
  "openai:gpt-4o-audio-preview",
  "anthropic:claude-3-5-sonnet-latest",
  "anthropic:claude-3-7-sonnet-latest",
  "anthropic:claude-3-5-haiku-20241022",
  "google:gemini-2.0-flash",
  "google:gemini-2.0-flash-lite-preview-02-05",
  "google:gemini-1.5-pro-latest",
  "google:gemini-1.5-flash",
  "mistral:pixtral-large-latest",
  "mistral:mistral-large-latest",
  "mistral:mistral-small-latest",
  "mistral:pixtral-12b-2409",
  "deepseek:deepseek-chat",
  "deepseek:deepseek-reasoner",
  "perplexity:sonar-pro",
  "perplexity:sonar",
  "perplexity:llama-3.1-sonar-small-128k-online",
  "perplexity:llama-3.1-sonar-large-128k-online",
  "perplexity:llama-3.1-sonar-huge-128k-online",
  "xai:grok-2-latest",
  "xai:grok-2-vision-latest",
  "pinecone:*"
];
```

Image Models (ImageModel)
```typescript
export const IMAGE_MODELS = [
  "openai:dall-e-3",
  "stability:core",
  "stability:ultra",
  "stability:conservative",
  "stability:creative",
  "stability:fast",
  "stability:erase",
  "stability:inpaint",
  "stability:outpaint",
  "stability:search-and-replace",
  "stability:search-and-recolor",
  "stability:remove-background",
  "stability:replace-background-and-relight",
  "stability:sketch",
  "stability:structure",
  "stability:style",
  "replicate:black-forest-labs/flux-dev-lora",
  "replicate:smoosh-sh/baby-mystic",
  "replicate:zetyquickly-org/faceswap-a-gif",
  "replicate:bytedance/pulid",
  "replicate:recraft-ai/recraft-v3",
  "replicate:bytedance/sdxl-lightning-4step",
  "replicate:adirik/interior-design",
  "luma:photon-1",
  "luma:photon-flash-1"
];
```

Video Models (VideoModel)
```typescript
export const VIDEO_MODELS = [
  "stability:video",
  "minimax:video-01",
  "minimax:video-01-live2d",
  "minimax:I2V-01",
  "minimax:I2V-01-live",
  "minimax:T2V-01",
  "minimax:T2V-01-Director",
  "minimax:S2V-01",
  "pika:generate",
  "pika:extend",
  "pika:adjust",
  "vidu:img2video",
  "vidu:reference2video",
  "vidu:start-end2video",
  "vidu:text2video",
  "vidu:template2video",
  "vidu:upscale",
  "replicate:fictions-ai/autocaption",
  "replicate:tencent/hunyuan-video",
  "replicate:zsxkib/mmaudio",
  "luma:ray-2",
  "luma:ray-1-6"
];
```

Audio Models (AudioModel)
```typescript
export const AUDIO_MODELS = [
  "elevenlabs:tts",
  "elevenlabs:tts-timestamps",
  "elevenlabs:voice-changer",
  "elevenlabs:sound-effects",
  "elevenlabs:audio-isolation",
  "elevenlabs:text-to-voice",
  "replicate:meta/musicgen"
];
```

3D Object Models (ObjectModel3D)
```typescript
export const OBJECT_3D_MODELS = [
  "meshy:text-to-3d",
  "meshy:image-to-3d",
  "stability:fast-3d",
  "stability:point-aware-3d"
];
```

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

Example Usage

// Import the SDK
import { SDK } from "https://webdraw.com/webdraw-sdk@v1";

// Initialize the SDK
const sdk = SDK;

// Example: Generate text using AI
async function generateStory() {
  try {
    const result = await sdk.ai.generateText({
      prompt: "Write a short story about a magical forest"
    });
    console.log(result.text);
    console.log('Saved to:', result.filepath);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example: Read a file
async function readFile() {
  try {
    const content = await sdk.fs.readFile('/path/to/file.txt');
    console.log('File content:', content);
  } catch (error) {
    console.error('Error:', error);
  }
}