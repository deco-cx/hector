# Internationalization (i18n) for Hector Apps

This document outlines the internationalization requirements and implementation strategy for the Hector app builder platform.

## 1. Overview

The Hector platform requires comprehensive internationalization support at multiple levels:

- **UI Elements**: All interface components (buttons, labels, notifications)
- **App Content**: User-created content like input labels, action prompts, descriptions
- **Generated Content**: AI-generated outputs based on language-specific prompts

The system will initially support:
- English (EN)
- Portuguese (PT)

However, the architecture is designed to be fully extensible, allowing new languages to be added to the configuration at any time without code changes, similar to how the actionsConfig pattern works in the system.

## 2. Core Requirements

### 2.1 Data Structure

All user-facing text in the app configuration must use a `Localizable<T>` pattern to support an arbitrary number of languages:

```typescript
type Localizable<T> = {
  [key: string]: T;  // Where key is the language code (e.g., "EN", "PT", "ES", "FR", etc.)
};

// Example usage
interface InputField {
  filename: string;
  type: 'text' | 'image' | 'select' | 'file' | 'audio';
  title: Localizable<string>;  // { "EN": "Child's Name", "PT": "Nome da Criança" }
  required: boolean;
  placeholder?: Localizable<string>;
  // other properties...
}
```

### 2.2 Language Selection

- Users can select their preferred language when starting to use an app
- Language selection can be pre-configured via query string parameters (e.g., `?lang=PT`)
- The app should remember the user's language preference for future sessions
- A language selector should be visible on the app running screen
- The system must support dynamically adding new languages to the configuration

### 2.3 Translation Support

- The platform will provide AI-assisted translation for app content
- Creators can copy content from one language to others with automatic translation
- Translation can be applied to:
  - Individual fields (e.g., translate just a specific title)
  - Entire sections (e.g., translate all input fields)
  - The complete app (translate everything at once)
- New languages can be added to existing apps and populated through translation

### 2.4 Language-Specific AI Prompts

- AI action prompts must be language-specific
- Each action should store separate prompts for each supported language
- The prompt used for generation will match the user's selected language
- Generated content will naturally be in the language of the prompt used
- The system should gracefully handle prompts for newly added languages

## 3. Implementation Strategy

### 3.1 Localizable Type System

1. Create a `Localizable<T>` type to standardize internationalization across all text fields
2. Update existing interfaces to use this type for all user-facing text
3. Implement utility functions for working with Localizable objects:
   - `getLocalizedValue<T>(obj: Localizable<T>, lang: string, fallbackLang: string = 'EN'): T`
   - `setLocalizedValue<T>(obj: Localizable<T>, lang: string, value: T): void`
   - `addLanguageToApp(app: AppConfig, languageCode: string): AppConfig` - adds a new language to all localizable fields

### 3.2 Editor UI for Language Toggling

1. Implement language toggle buttons at two levels:
   - **App-level toggle**: Small language buttons (EN/PT/etc.) in the app header to switch the entire editor interface
   - **Field-level toggle**: Small buttons next to each localizable field to edit content in specific languages
   - **Language management**: UI for adding new languages to the app configuration

2. UI Controls Design:
   - Use pill-style buttons with mini flags for each language
   - Active language should be visually distinct (highlighted, bordered, etc.)
   - Buttons should be compact but easily clickable on mobile
   - Provide visual indication when a language is missing content
   - Include an "Add language" option to extend language support

3. Field Editing Experience:
   - When editing a localizable field, show the active language content in the input
   - Display small toggle buttons to switch to other languages
   - Indicate which languages have content and which are empty
   - Allow editing each language variant individually one at a time (not simultaneously)
   - When empty, provide an option to auto-fill from another language using AI translation

4. Bulk Language Operations:
   - Add a toolbar option to "Translate All Empty Fields" from the current language
   - Provide section-level translation buttons (e.g., translate all inputs, all actions)
   - Show progress indicator during translation operations
   - Support adding a new language to the entire app at once

### 3.3 AI Translation Integration

1. Develop an AI translation service using the WebdrawSDK
2. Create translation helpers:
   - Add "Translate from EN" button next to empty language fields 
   - Implement translation preview with edit capability as a modal dialog
   - Support batch translation requests
   - Enable translation to newly added languages
3. Implement caching for translations to improve performance
4. Add error handling for failed translations

## 4. User Experience Considerations

1. Language toggle buttons should be visually subtle but easily accessible
2. Auto-detection of browser language for first-time users
3. Clear visual indication of the current active language
4. Graceful fallback to default language if content is missing
5. Preview of translations before applying
6. Support for right-to-left languages in future expansions
7. Intuitive UI for adding and managing new languages

## 5. Implementation Phases

### Phase 1: Core Foundation
- Implement the Localizable type system
- Update existing interfaces to support multiple languages
- Add basic language toggle buttons to the editor
- Create the infrastructure for extending language support

### Phase 2: Field-Level Editing
- Develop the field-level language toggle UI
- Implement single-field editing for multiple languages
- Add field-level translation assistance
- Add UI for managing supported languages

### Phase 3: Bulk Operations
- Add app-wide and section-level language operations
- Implement bulk translation capabilities
- Create translation preview and edit workflows
- Support adding new languages to existing apps

### Phase 4: Advanced Features
- Add language-specific style adaptations
- Support for additional languages
- Performance optimizations for translations
- Enhanced language management tools

## 6. Testing Requirements

- Test with actual multilingual content
- Verify correct display of special characters
- Ensure proper handling of text expansion (some languages require more space)
- Test right-to-left language support (for future extensions)
- Validate AI translation quality across languages
- Test adding new languages to existing app configurations

## 7. Implementation Details

Based on development discussions, the following specific implementation decisions have been made:

### 7.1 Language Configuration

- The system will use a predefined list of available languages:
  ```typescript
  export const AVAILABLE_LANGUAGES = ["en-US", "pt-BR"];
  ```
- A centralized "Languages Settings" page will be implemented for managing app languages
- New languages can only be added from the predefined list

### 7.2 UI Components

- Language toggles will use pill-style buttons with mini flags
- Field editing will show one language at a time with toggle controls 
- Ant Design form components will be leveraged for a clean, intuitive interface
- Translation preview will be implemented as a modal dialog

### 7.3 Translation Implementation

- Translation services will use the WebdrawSDK's generateObject method with appropriate schemas:
  ```typescript
  // For single field translation
  const schema = {
    type: "object",
    properties: {
      value: { type: "string" }
    }
  };
  
  // For bulk translations
  // Send the schema of the object and the current app value
  ```
- Single field translations will return `{ value: string }` to be replaced
- For entire app translations, the complete app schema and current values will be used

### 7.4 Development Approach

- Implementation will begin with data model changes (Localizable type system)
- Then progress through business logic to UI components
- The system will initially focus on the core language toggle and field-level editing
- User language preference will be initially determined from browser settings or query parameters 