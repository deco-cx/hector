/**
 * Core internationalization (i18n) types and utilities for Hector Apps
 */

/**
 * Supported languages in the system
 * Using BCP 47 language tags (language-REGION)
 */
export const AVAILABLE_LANGUAGES = ["en-US", "pt-BR"];

/**
 * Default fallback language
 */
export const DEFAULT_LANGUAGE = "en-US";

/**
 * Type for localizable content
 * Maps language codes to values of type T
 */
export type Localizable<T> = {
  [languageCode: string]: T;
};

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
 * Checks if a Localizable object has a value for a specific language
 */
export function hasLanguage<T>(obj: Localizable<T> | undefined, lang: string): boolean {
  return obj !== undefined && obj[lang] !== undefined;
}

/**
 * Gets all languages that have values in a Localizable object
 */
export function getAvailableLanguages<T>(obj: Localizable<T> | undefined): string[] {
  if (!obj) return [];
  return Object.keys(obj);
}

/**
 * Adds a new language to a Localizable object with an empty value
 * If the language already exists, returns the original object
 */
export function addLanguage<T>(
  obj: Localizable<T> | undefined,
  lang: string,
  emptyValue: T
): Localizable<T> {
  if (obj && obj[lang] !== undefined) {
    return obj; // Language already exists
  }
  
  return setLocalizedValue(obj, lang, emptyValue);
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