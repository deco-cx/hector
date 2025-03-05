# Hector - AI App Builder Technical Stack

This document provides an overview of the technical stack used in the Hector AI App Builder project, along with guidance for developing similar applications.

## Core Technologies

### Frontend Framework
- **React 18.2.0**: The application is built using React for its component-based architecture and robust ecosystem.
- **TypeScript**: The entire codebase uses TypeScript for type safety, improved developer experience, and better code maintainability.

### Build System
- **Vite 5.1.4**: Modern, fast build tool and development server with near-instant hot module replacement (HMR).
- **ESLint 9.21.0**: For code linting and enforcing consistent coding practices.

### UI Framework
- **Ant Design 5.14.2**: Provides a comprehensive set of high-quality React components following the Ant Design specification.
- **@ant-design/icons 5.6.1**: Icon library for Ant Design components.
- **Custom CSS**: Global styles defined in index.css with responsive design considerations.

### Routing
- **React Router 6.22.1**: Handles client-side routing with support for nested routes, route parameters, and navigation.

### Form Handling
- **@rjsf/antd 5.24.3**: React JSON Schema Form with Ant Design theme, used for generating dynamic forms based on JSON schemas.
- **@rjsf/core 5.24.3**: Core library for JSON Schema Form implementation.
- **@rjsf/validator-ajv8 5.24.3**: JSON Schema validation using AJV 8.

### State Management
- **React Context API**: Used for global state management (see `HectorContext.tsx` and `LanguageContext.tsx`).
- **React Hooks**: Extensively used for component-level state management and side effects.

### Internationalization (i18n)
- **Custom i18n Implementation**: Using React Context for managing language state and localized content.
- **Localizable Type System**: A custom type system for handling multi-language text values.

## Project Structure

```
hector/
├── src/
│   ├── components/       # React components organized by feature
│   │   ├── AppCreation/  # Components for creating and editing apps
│   │   ├── Home/         # Homepage components
│   │   ├── Layout/       # Layout components
│   │   ├── Runtime/      # App runtime components
│   │   └── ...
│   ├── context/          # React context providers
│   ├── services/         # Service modules for API integration
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── explain/              # Documentation files
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## Key Design Patterns

1. **Context-based State Management**: The application uses React Context API for managing global state instead of state management libraries like Redux.

2. **Component Composition**: Components are organized in a hierarchical structure with clear separation of concerns.

3. **Dynamic Form Generation**: Forms are generated from JSON Schema definitions, allowing for flexible and maintainable form implementations.

4. **Localization Strategy**: The application uses a `Localizable<T>` type pattern that allows storing multi-language values for text fields.

5. **Mobile-First Design**: The UI is designed to work well on mobile devices first, with responsive adjustments for larger screens.

## Setting Up a Similar Project

### 1. Initialize a New Project

```bash
# Create a new Vite project with React and TypeScript
npm create vite@latest my-app -- --template react-ts

# Navigate to the project directory
cd my-app

# Install dependencies
npm install
```

### 2. Add Core Dependencies

```bash
# Install Ant Design and related packages
npm install antd @ant-design/icons

# Install React Router
npm install react-router-dom

# Install React JSON Schema Form (if needed)
npm install @rjsf/core @rjsf/antd @rjsf/validator-ajv8 @rjsf/utils

# Install additional utilities
npm install uuid @types/uuid
```

### 3. Configure TypeScript

Create or update `tsconfig.json` with appropriate settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Set Up Project Structure

Create the following directory structure:

```bash
mkdir -p src/components src/context src/services src/types
```

### 5. Implement Context Providers

Create context providers for global state management:

```tsx
// src/context/YourContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface YourContextType {
  // Define your context state and methods
}

const YourContext = createContext<YourContextType | null>(null);

export const YourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Implement your state and methods
  
  return (
    <YourContext.Provider value={/* your context value */}>
      {children}
    </YourContext.Provider>
  );
};

export const useYourContext = () => {
  const context = useContext(YourContext);
  if (!context) {
    throw new Error('useYourContext must be used within a YourProvider');
  }
  return context;
};
```

### 6. Set Up Routing

Implement routing in your main App component:

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Import your pages/components
import HomePage from './components/Home/HomePage';
import DetailPage from './components/Detail/DetailPage';

// Import your context providers
import { YourProvider } from './context/YourContext';

function App() {
  return (
    <ConfigProvider>
      <YourProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </BrowserRouter>
      </YourProvider>
    </ConfigProvider>
  );
}

export default App;
```

### 7. Create Reusable Components

Build reusable components following the Hector project's pattern:

1. Define component props with TypeScript interfaces
2. Use functional components with hooks
3. Organize components by feature
4. Use Ant Design components as building blocks

### 8. Implement Internationalization

For a custom i18n solution similar to Hector:

```tsx
// src/types/types.ts
export type Localizable<T> = {
  [lang: string]: T;
};

export const DEFAULT_LANGUAGE = 'en-US';
export const AVAILABLE_LANGUAGES = ['en-US', 'pt-BR'];
```

## Best Practices

1. **Component Design**: Keep components focused on a single responsibility.
   
2. **Type Safety**: Use TypeScript interfaces and types consistently throughout the codebase.
   
3. **Form Handling**: Use React JSON Schema Form for complex, dynamic forms.
   
4. **Responsive Design**: Follow a mobile-first approach with responsive breakpoints.
   
5. **State Management**: Use React Context for global state and component state for local state.
   
6. **Code Organization**: Group related components and utilities together.
   
7. **Error Handling**: Implement consistent error handling patterns.

## Development Workflow

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Build for Production**:
   ```bash
   npm run build
   ```

3. **Lint Code**:
   ```bash
   npm run lint
   ```

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

## Conclusion

The Hector project demonstrates a well-structured React application with TypeScript, using modern patterns and libraries. By following the architecture and patterns outlined in this document, you can create similar applications with a focus on maintainability, type safety, and user experience.

For more detailed information on specific aspects of the implementation, refer to the other documentation files in the `explain/` directory. 