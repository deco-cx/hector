import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '../types/i18n';

interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  editorLanguage: string;
  setEditorLanguage: (lang: string) => void;
  availableLanguages: string[];
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: DEFAULT_LANGUAGE,
  setCurrentLanguage: () => {},
  editorLanguage: DEFAULT_LANGUAGE,
  setEditorLanguage: () => {},
  availableLanguages: AVAILABLE_LANGUAGES
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // currentLanguage is for the user's preferred language for viewing apps
  const [currentLanguage, setCurrentLanguage] = useState<string>(DEFAULT_LANGUAGE);
  
  // editorLanguage is for the language being edited in the app editor
  const [editorLanguage, setEditorLanguage] = useState<string>(DEFAULT_LANGUAGE);

  // Initialize language from browser or localStorage on first load
  useEffect(() => {
    // Try to get from local storage first
    const storedLanguage = localStorage.getItem('preferredLanguage');
    
    if (storedLanguage && AVAILABLE_LANGUAGES.includes(storedLanguage)) {
      setCurrentLanguage(storedLanguage);
      setEditorLanguage(storedLanguage);
      return;
    }
    
    // Check URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && AVAILABLE_LANGUAGES.includes(langParam)) {
      setCurrentLanguage(langParam);
      setEditorLanguage(langParam);
      return;
    }
    
    // Fall back to browser language if available and supported
    const browserLang = navigator.language;
    
    // Check if the browser language exactly matches one of our available languages
    if (AVAILABLE_LANGUAGES.includes(browserLang)) {
      setCurrentLanguage(browserLang);
      setEditorLanguage(browserLang);
      return;
    }
    
    // Check if just the language part (without region) matches
    const browserLangPrefix = browserLang.split('-')[0].toLowerCase();
    const matchingLang = AVAILABLE_LANGUAGES.find(
      lang => lang.split('-')[0].toLowerCase() === browserLangPrefix
    );
    
    if (matchingLang) {
      setCurrentLanguage(matchingLang);
      setEditorLanguage(matchingLang);
      return;
    }
    
    // Default fallback
    setCurrentLanguage(DEFAULT_LANGUAGE);
    setEditorLanguage(DEFAULT_LANGUAGE);
  }, []);
  
  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', currentLanguage);
    
    // Update URL parameter without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('lang', currentLanguage);
    window.history.replaceState({}, '', url.toString());
  }, [currentLanguage]);
  
  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage, 
        setCurrentLanguage,
        editorLanguage,
        setEditorLanguage,
        availableLanguages: AVAILABLE_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}; 