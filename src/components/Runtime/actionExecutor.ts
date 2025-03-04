import { ActionData, InputField } from '../../types/types';
import { ExecutionContext } from './ExecutionContext';

/**
 * Interface for the WebDraw SDK
 * This is a simplified interface for the actual SDK
 */
interface WebDrawSDK {
  generateImage: (config: any) => Promise<any>;
  generateText: (config: any) => Promise<any>;
  imageVariation: (config: any) => Promise<any>;
  upscaleImage: (config: any) => Promise<any>;
  removeBackground: (config: any) => Promise<any>;
  fs: {
    chmod: (path: string, mode: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
  };
  // Add other SDK methods as needed
}

/**
 * Interface for action execution result
 */
export interface ActionExecutionResult {
  data: any;
  success: boolean;
  error?: Error | string;
}

/**
 * Makes a file publicly accessible by changing its permissions
 * @param sdk The WebDraw SDK instance
 * @param filePath The path to the file
 */
async function makeFilePublic(sdk: WebDrawSDK, filePath: string): Promise<void> {
  try {
    // Make the file publicly accessible (typically takes ~100-200ms)
    await sdk.fs.chmod(filePath, '0644');
    console.log(`Made file public: ${filePath}`);
  } catch (error) {
    console.error(`Error making file public: ${filePath}`, error);
    throw error;
  }
}

/**
 * Converts a WebDraw file path to a publicly accessible URL
 * @param filePath The path returned by the SDK
 * @returns The public URL for the file
 */
function getPublicFileUrl(filePath: string): string {
  // Ensure the path starts with a slash
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `https://fs.webdraw.com${normalizedPath}`;
}

/**
 * Waits for a file to become available by polling the exists endpoint
 * @param sdk The WebDraw SDK instance
 * @param filePath The path to check
 * @param maxRetries Maximum number of retries
 * @param interval Interval between retries in ms
 * @returns The public URL when the file is available
 */
async function waitForFileAvailability(
  sdk: WebDrawSDK, 
  filePath: string, 
  maxRetries = 10, 
  interval = 500
): Promise<string> {
  // Format the URL upfront
  const publicUrl = getPublicFileUrl(filePath);
  
  // Check file availability with retries
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Check if file exists (typically takes ~300-500ms per check)
      const exists = await sdk.fs.exists(filePath);
      
      if (exists) {
        console.log(`File is available after ${retries + 1} attempts: ${publicUrl}`);
        return publicUrl;
      }
      
      console.log(`File not available yet, retry ${retries + 1}/${maxRetries}: ${filePath}`);
      await new Promise(resolve => setTimeout(resolve, interval));
      retries++;
    } catch (error) {
      console.error(`Error checking file availability: ${filePath}`, error);
      await new Promise(resolve => setTimeout(resolve, interval));
      retries++;
    }
  }
  
  console.warn(`File may not be available after ${maxRetries} attempts: ${filePath}`);
  // Return the URL anyway, it might become available later
  return publicUrl;
}

/**
 * Processes a file result from WebDraw SDK to make it accessible
 * @param sdk The WebDraw SDK instance
 * @param result The result from an SDK call containing a file path
 * @returns Processed result with public URL
 */
async function processFileResult(sdk: WebDrawSDK, result: any): Promise<any> {
  // Check if this is a file path result
  if (typeof result === 'string' && (
    result.endsWith('.png') || 
    result.endsWith('.jpg') || 
    result.endsWith('.jpeg') ||
    result.endsWith('.md') ||
    result.endsWith('.json') ||
    result.endsWith('.mp3') ||
    result.endsWith('.mp4')
  )) {
    // This is a file path
    // 1. Make the file public (typically takes ~100-200ms)
    await makeFilePublic(sdk, result);
    
    // 2. Wait for the file to be available (may take 500ms to several seconds)
    const publicUrl = await waitForFileAvailability(sdk, result);
    
    return {
      filepath: result,
      publicUrl,
      isProcessing: false
    };
  } 
  // Check if this is an array of file paths (like images[] or audios[])
  else if (Array.isArray(result)) {
    const processedResults = await Promise.all(
      result.map(async (item) => {
        if (typeof item === 'string' && (
          item.endsWith('.png') || 
          item.endsWith('.jpg') || 
          item.endsWith('.jpeg') ||
          item.endsWith('.md') ||
          item.endsWith('.json') ||
          item.endsWith('.mp3') ||
          item.endsWith('.mp4')
        )) {
          await makeFilePublic(sdk, item);
          const publicUrl = await waitForFileAvailability(sdk, item);
          
          return {
            filepath: item,
            publicUrl,
            isProcessing: false
          };
        }
        return item;
      })
    );
    
    return processedResults;
  }
  // Check if this is an object with images, audios, etc. properties
  else if (result && typeof result === 'object') {
    const processedResult = { ...result };
    
    // Process common properties that might contain file paths
    const fileProperties = ['images', 'audios', 'videos', 'filepath', 'file'];
    
    for (const prop of fileProperties) {
      if (result[prop]) {
        if (Array.isArray(result[prop])) {
          processedResult[prop] = await Promise.all(
            result[prop].map(async (item: string) => {
              if (typeof item === 'string') {
                await makeFilePublic(sdk, item);
                const publicUrl = await waitForFileAvailability(sdk, item);
                
                return {
                  filepath: item,
                  publicUrl,
                  isProcessing: false
                };
              }
              return item;
            })
          );
        } else if (typeof result[prop] === 'string') {
          await makeFilePublic(sdk, result[prop]);
          const publicUrl = await waitForFileAvailability(sdk, result[prop]);
          
          processedResult[prop] = {
            filepath: result[prop],
            publicUrl,
            isProcessing: false
          };
        }
      }
    }
    
    return processedResult;
  }
  
  // If it's not a file result, return as is
  return result;
}

/**
 * Execute an action based on its type using the Webdraw SDK
 * @param action The action to execute
 * @param executionContext The execution context to use for resolving values
 * @param sdk The Webdraw SDK instance
 */
export async function executeAction(
  action: ActionData,
  executionContext: ExecutionContext,
  sdk: WebDrawSDK
): Promise<ActionExecutionResult> {
  try {
    // Create configuration by resolving input values from execution context
    const config: Record<string, any> = {};
    
    // Map inputs to configuration values
    if (action.inputs) {
      for (const input of action.inputs) {
        const value = executionContext.getValue(input.filename);
        
        if (value !== undefined) {
          // Handle special input types
          if (input.type === 'image' || input.type === 'audio' || input.type === 'file') {
            // For file types, we need to make sure we extract the right property based on what the SDK expects
            config[input.filename] = typeof value === 'object' ? value : { base64: value };
          } else {
            config[input.filename] = value;
          }
        } else if (input.required) {
          throw new Error(`Required input ${input.filename} is missing for action ${action.id}`);
        }
      }
    }
    
    // Execute the action based on its type
    let result;
    const actionType = action.type as string;
    
    // Start a timer to measure execution time
    console.time(`Execute ${actionType}`);
    
    switch (actionType) {
      case 'txt2img':
      case 'generateImage':
        // Typically takes 2-10 seconds depending on the model and image size
        result = await sdk.generateImage(config);
        // Process file paths in the result to make them publicly accessible
        result = await processFileResult(sdk, result);
        break;
        
      case 'text_generation':
      case 'generateText':
        // Typically takes 1-5 seconds depending on prompt length and model
        result = await sdk.generateText(config);
        // Process file paths in the result to make them publicly accessible
        result = await processFileResult(sdk, result);
        break;
        
      case 'img_variation':
      case 'imageVariation':
        // Typically takes 2-8 seconds
        result = await sdk.imageVariation(config);
        // Process file paths in the result to make them publicly accessible
        result = await processFileResult(sdk, result);
        break;
        
      case 'upscale':
      case 'upscaleImage':
        // Typically takes 1-3 seconds depending on image size
        result = await sdk.upscaleImage(config);
        // Process file paths in the result to make them publicly accessible
        result = await processFileResult(sdk, result);
        break;
        
      case 'remove_bg':
      case 'removeBackground':
        // Typically takes 1-4 seconds depending on image complexity
        result = await sdk.removeBackground(config);
        // Process file paths in the result to make them publicly accessible
        result = await processFileResult(sdk, result);
        break;
        
      // Add other action types as needed
        
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
    
    // Stop the timer and log the execution time
    console.timeEnd(`Execute ${actionType}`);
    
    // If we get here, the execution was successful
    return {
      data: result,
      success: true
    };
  } catch (error) {
    // Handle any errors during execution
    return {
      data: null,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Extracts input references from a prompt
 * @param prompt The prompt text to analyze
 * @returns Array of input filenames referenced in the prompt
 */
export function extractInputReferences(prompt: string): string[] {
  // Look for patterns like ${input.filename} or {{input.filename}}
  const references: string[] = [];
  
  // Match ${input.filename} pattern
  const dollarBraceMatches = prompt.match(/\$\{input\.([\w.-]+)\}/g);
  if (dollarBraceMatches) {
    dollarBraceMatches.forEach(match => {
      const filename = match.match(/\$\{input\.([\w.-]+)\}/)?.[1];
      if (filename && !references.includes(filename)) {
        references.push(filename);
      }
    });
  }
  
  // Match {{input.filename}} pattern
  const doubleBraceMatches = prompt.match(/\{\{input\.([\w.-]+)\}\}/g);
  if (doubleBraceMatches) {
    doubleBraceMatches.forEach(match => {
      const filename = match.match(/\{\{input\.([\w.-]+)\}\}/)?.[1];
      if (filename && !references.includes(filename)) {
        references.push(filename);
      }
    });
  }
  
  // Also match the @filename.ext pattern as mentioned in user instructions
  const atMatches = prompt.match(/@([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g);
  if (atMatches) {
    atMatches.forEach(match => {
      const filename = match.substring(1); // Remove the @ symbol
      if (!references.includes(filename)) {
        references.push(filename);
      }
    });
  }
  
  return references;
}

/**
 * Recursively build a dependency graph for an action
 * @param actionId The ID of the action to build a dependency graph for
 * @param actions All available actions
 * @param dependencyGraph The current dependency graph being built
 * @param visited Set of action IDs that have been visited
 * @param path Current path of action IDs being traversed
 */
export function buildDependencyGraph(
  actionId: string,
  actions: ActionData[],
  dependencyGraph: Record<string, string[]> = {},
  visited: Set<string> = new Set(),
  path: string[] = []
): { graph: Record<string, string[]>, circularDeps: string[][] } {
  // Track current path for circular dependency detection
  path.push(actionId);
  visited.add(actionId);
  
  // Track circular dependencies
  const circularDeps: string[][] = [];
  
  // Find the action in the list
  const action = actions.find(a => a.id === actionId);
  if (!action) {
    return { graph: dependencyGraph, circularDeps };
  }
  
  // Initialize dependencies array for this action
  if (!dependencyGraph[actionId]) {
    dependencyGraph[actionId] = [];
  }
  
  // Extract dependencies from prompt fields
  const prompt = typeof action.prompt === 'object' 
    ? Object.values(action.prompt)[0] 
    : action.prompt;
    
  if (typeof prompt === 'string') {
    const references = extractInputReferences(prompt);
    
    // For each reference, find corresponding actions that produce this output
    for (const ref of references) {
      const dependencyActions = actions.filter(a => 
        (a.outputs && a.outputs.some(output => output === ref)) ||
        (a.inputs && a.inputs.some(input => input.filename === ref))
      );
      
      // Add dependencies to the graph
      for (const depAction of dependencyActions) {
        if (depAction.id !== actionId && !dependencyGraph[actionId].includes(depAction.id)) {
          dependencyGraph[actionId].push(depAction.id);
          
          // Check for circular dependencies
          if (path.includes(depAction.id)) {
            // We found a cycle
            const cycle = path.slice(path.indexOf(depAction.id)).concat(depAction.id);
            circularDeps.push(cycle);
          } else if (!visited.has(depAction.id)) {
            // Recursively build the graph for dependencies
            const { circularDeps: nestedCircular } = buildDependencyGraph(
              depAction.id,
              actions,
              dependencyGraph,
              visited,
              [...path]
            );
            circularDeps.push(...nestedCircular);
          }
        }
      }
    }
  }
  
  // Remove the current action from the path
  path.pop();
  
  return { graph: dependencyGraph, circularDeps };
} 