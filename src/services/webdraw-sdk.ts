import { AppConfiguration, RuntimeState } from '../types/app';

// Constants
const APPS_DIRECTORY = '~/Hector/apps/';
const EXECUTIONS_DIRECTORY = '~/Hector/executions/';

// Helper function to ensure directories exist
export const ensureDirectoriesExist = async (): Promise<void> => {
  const sdk = window.SDK;
  
  // Check if apps directory exists, if not create it
  const appsExists = await sdk.fs.exists(APPS_DIRECTORY);
  if (!appsExists) {
    await sdk.fs.mkdir(APPS_DIRECTORY, { recursive: true });
  }
  
  // Check if executions directory exists, if not create it
  const executionsExists = await sdk.fs.exists(EXECUTIONS_DIRECTORY);
  if (!executionsExists) {
    await sdk.fs.mkdir(EXECUTIONS_DIRECTORY, { recursive: true });
  }
};

// App Configuration CRUD operations
export const listApps = async (): Promise<string[]> => {
  const sdk = window.SDK;
  await ensureDirectoriesExist();
  
  const files = await sdk.fs.list(APPS_DIRECTORY);
  return files.filter(file => file.endsWith('.json'));
};

export const getApp = async (appId: string): Promise<AppConfiguration | null> => {
  const sdk = window.SDK;
  const appPath = `${APPS_DIRECTORY}${appId}.json`;
  
  try {
    const exists = await sdk.fs.exists(appPath);
    if (!exists) {
      return null;
    }
    
    const appData = await sdk.fs.read(appPath);
    return JSON.parse(appData as string) as AppConfiguration;
  } catch (error) {
    console.error('Error getting app:', error);
    return null;
  }
};

export const saveApp = async (app: AppConfiguration): Promise<boolean> => {
  const sdk = window.SDK;
  await ensureDirectoriesExist();
  
  const appPath = `${APPS_DIRECTORY}${app.id}.json`;
  
  try {
    await sdk.fs.write(appPath, JSON.stringify(app, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving app:', error);
    return false;
  }
};

export const deleteApp = async (appId: string): Promise<boolean> => {
  const sdk = window.SDK;
  const appPath = `${APPS_DIRECTORY}${appId}.json`;
  
  try {
    const exists = await sdk.fs.exists(appPath);
    if (!exists) {
      return false;
    }
    
    await sdk.fs.remove(appPath);
    return true;
  } catch (error) {
    console.error('Error deleting app:', error);
    return false;
  }
};

// Runtime State operations
export const saveRuntimeState = async (appId: string, state: RuntimeState): Promise<boolean> => {
  const sdk = window.SDK;
  await ensureDirectoriesExist();
  
  const statePath = `${EXECUTIONS_DIRECTORY}${appId}_state.json`;
  
  try {
    await sdk.fs.write(statePath, JSON.stringify(state, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving runtime state:', error);
    return false;
  }
};

export const getRuntimeState = async (appId: string): Promise<RuntimeState | null> => {
  const sdk = window.SDK;
  const statePath = `${EXECUTIONS_DIRECTORY}${appId}_state.json`;
  
  try {
    const exists = await sdk.fs.exists(statePath);
    if (!exists) {
      return null;
    }
    
    const stateData = await sdk.fs.read(statePath);
    return JSON.parse(stateData as string) as RuntimeState;
  } catch (error) {
    console.error('Error getting runtime state:', error);
    return null;
  }
};

// AI Generation operations
export const generateText = async (prompt: string, model?: string): Promise<string> => {
  const sdk = window.SDK;
  
  try {
    const result = await sdk.ai.generateText({
      prompt,
      model: model || 'text-model',
      temperature: 0.7,
      maxTokens: 1000
    });
    
    return result.text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
};

export const generateImage = async (prompt: string, model?: string): Promise<string> => {
  const sdk = window.SDK;
  
  try {
    const result = await sdk.ai.generateImage({
      prompt,
      model: model || 'openai:dall-e-3',
      size: '1024x1024'
    });
    
    // Handle the result to get a usable URL
    let imageUrl = result.images[0];
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://fs.webdraw.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

export const generateAudio = async (prompt: string, model?: string): Promise<string> => {
  const sdk = window.SDK;
  
  try {
    const result = await sdk.ai.generateAudio({
      prompt,
      model: model || 'audio-model'
    });
    
    // Handle the result to get a usable URL
    let audioUrl = result.audios[0];
    if (audioUrl && !audioUrl.startsWith('http')) {
      audioUrl = `https://fs.webdraw.com${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
    }
    
    return audioUrl;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
};

export const generateObject = async <T>(prompt: string, schema: any): Promise<T> => {
  const sdk = window.SDK;
  
  try {
    const result = await sdk.ai.generateObject<T>({
      prompt,
      schema,
      temperature: 0.7
    });
    
    return result.object;
  } catch (error) {
    console.error('Error generating object:', error);
    throw error;
  }
};

// User authentication
export const getUser = async (): Promise<{ username: string } | null> => {
  const sdk = window.SDK;
  
  try {
    return await sdk.getUser();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const redirectToLogin = (appReturnUrl?: string): void => {
  const sdk = window.SDK;
  sdk.redirectToLogin({ appReturnUrl });
}; 