/**
 * Translation Service
 * Uses the WebdrawSDK's generateObject method for AI-assisted translation
 */
import { WebdrawSDK, Localizable, AppConfig } from '../types/types';
import { cloneDeep } from 'lodash';
import { HectorService } from './HectorService';

/**
 * Translates a single text string from one language to another using AI
 */
export const translateText = async (
  sdk: WebdrawSDK,
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> => {
  if (!text?.trim()) {
    return '';
  }
  
  try {
    // Define our schema with proper typing
    const schema = {
      type: "object" as const,
      properties: {
        translation: {
          type: 'string',
          description: `The translated text in ${toLang}`,
        }
      }
    };
    
    const result = await sdk.ai.generateObject({
      prompt: `Translate the following text from ${fromLang} to ${toLang}:\n\n"${text}"`,
      schema
    });
    
    if (result?.object?.translation) {
      return result.object.translation;
    } else {
      console.error('Translation failed: No valid result', result);
      return text; // Return original if translation fails
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original if translation fails
  }
};

/**
 * Translates all empty fields in a Localizable object
 */
export const translateLocalizable = async (
  sdk: WebdrawSDK,
  obj: Localizable<string>,
  sourceLang: string,
  targetLang: string
): Promise<Localizable<string>> => {
  if (!obj || !obj[sourceLang]) {
    return obj || {};
  }
  
  const sourceText = obj[sourceLang];
  
  // If target language already has content, don't override
  if (obj[targetLang] && obj[targetLang].trim() !== '') {
    return obj;
  }
  
  const translatedText = await translateText(sdk, sourceText, sourceLang, targetLang);
  
  return {
    ...obj,
    [targetLang]: translatedText
  };
};

/**
 * Translates all empty fields in a complex object with Localizable properties
 * Works recursively on nested objects and arrays
 */
export const translateComplexObject = async (
  sdk: WebdrawSDK,
  obj: any,
  sourceLang: string,
  targetLang: string,
  depth = 0, // Prevents infinite recursion
  maxDepth = 10
): Promise<any> => {
  if (!obj || typeof obj !== 'object' || depth > maxDepth) {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const result = [];
    for (const item of obj) {
      result.push(await translateComplexObject(
        sdk, item, sourceLang, targetLang, depth + 1, maxDepth
      ));
    }
    return result;
  }
  
  // Check if it's a Localizable object
  const hasSourceLang = obj[sourceLang] !== undefined;
  const isStringInSourceLang = typeof obj[sourceLang] === 'string';
  
  // If it looks like a Localizable<string>, translate it
  if (hasSourceLang && isStringInSourceLang) {
    return translateLocalizable(sdk, obj, sourceLang, targetLang);
  }
  
  // Otherwise, recurse into the object properties
  const result = { ...obj };
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = await translateComplexObject(
        sdk, obj[key], sourceLang, targetLang, depth + 1, maxDepth
      );
    }
  }
  
  return result;
};

/**
 * Translates an entire app configuration
 * @param service The HectorService instance
 * @param appConfig The app configuration to translate
 * @param sourceLang The source language
 * @param targetLang The target language to translate to
 * @returns The translated app configuration
 */
export const translateAppConfig = async (
  service: HectorService,
  appConfig: any,
  sourceLang: string,
  targetLang: string
): Promise<any> => {
  // Create a deep copy of the app config to avoid modifying the original
  const translatedConfig = JSON.parse(JSON.stringify(appConfig));
  
  // Get the SDK from HectorService
  const sdk = service.getSDK();
  
  // Preserve the original actions array completely as is - do not translate or modify
  // This prevents any issues with actions being lost during translation
  const originalActions = appConfig.actions ? [...appConfig.actions] : [];
  
  // Recursively translate all localizable fields in the app config
  const translateObject = async (obj: any): Promise<any> => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      // Special case: if this is the root actions array, return the original
      if (obj === translatedConfig.actions) {
        return originalActions;
      }
      
      const translatedArray = [];
      for (const item of obj) {
        translatedArray.push(await translateObject(item));
      }
      return translatedArray;
    }
    
    // Handle objects
    const translatedObj: any = {};
    for (const key in obj) {
      // Check if this is a localizable field (has the source language)
      if (obj[key] && typeof obj[key] === 'object' && obj[key][sourceLang] !== undefined) {
        // This is a localizable field, translate it if the target language is empty
        if (!obj[key][targetLang]) {
          try {
            const sourceText = obj[key][sourceLang];
            if (sourceText) {
              // Use AI to translate the text
              const translationPrompt = `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${sourceText}`;
              
              const result = await sdk.ai.generateObject<{ translation: string }>({
                prompt: translationPrompt,
                schema: {
                  type: "object",
                  properties: {
                    translation: {
                      type: "string",
                      description: `The text translated from ${sourceLang} to ${targetLang}`
                    }
                  }
                }
              });
              
              if (result.object && result.object.translation) {
                obj[key][targetLang] = result.object.translation;
              }
            } else {
              translatedObj[key] = obj[key];
            }
          } catch (error) {
            console.error(`Error translating field ${key}:`, error);
            translatedObj[key] = obj[key];
          }
        } else {
          // Target language already has a value, keep it
          translatedObj[key] = obj[key];
        }
      } else {
        // Not a localizable field or doesn't have the source language, recurse if it's an object
        translatedObj[key] = await translateObject(obj[key]);
      }
    }
    
    return translatedObj;
  };
  
  // Start the translation process
  const result = await translateObject(translatedConfig);
  
  // Ensure the actions array is preserved in the final result
  if (originalActions.length > 0) {
    result.actions = originalActions;
  }
  
  return result;
}; 