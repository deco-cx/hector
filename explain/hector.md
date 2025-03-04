# AI App Builder Design Document

## 1. Overview

The AI App Builder, named "Hector," is a no-code platform designed to empower users to create, manage, and run custom AI-powered applications.

By leveraging a step-by-step configuration process, users can define an app's visual style, input fields, AI-driven actions, and output formats.

The platform integrates with the Webdraw AI SDK, which offers
- Easy access to multiple AI models
- A filesystem for each user to server as database.
- Rhe generation of various content types, including text, images, audio, and more.

This design document outlines the app's functionality, user interface, data model, and technical integrations, providing a comprehensive blueprint for development.

It should work similarly to create Zaps on Zapier, but simples, mobile-friendly and AI-oriented.

## 2. Technologies

### 2.1 Frontend Framework

- **React**: The application uses React 18 (v18.2.0) for:
  - Better stability with common libraries
  - Full compatibility with Ant Design
  - Widely supported ecosystem
  - Proven production reliability

- **TypeScript**: The project uses TypeScript for type safety and improved developer experience.

### 2.2 UI Framework

- **Ant Design v5.x**: The application uses Ant Design for:
  - Pre-built, high-quality React components
  - Built-in support for React 18
  - Modern design system with consistent UX patterns
  - Built-in styling system with CSS-in-JS
  - Mobile-first responsive components
  - No need for additional CSS frameworks

- **React JSON Schema Form**: The application uses React JSON Schema Form for:
  - Dynamic form generation based on JSON Schema definitions
  - Automatic validation from schema constraints
  - Custom form layouts and widgets
  - Integration with Ant Design components
  - Simplified form state management

### 2.3 Data Management

- **Webdraw SDK**: The application integrates with the Webdraw AI SDK for:
  - File system operations (reading/writing app configuration and state.)
  - AI-driven content generation (text, images, audio)
  - User authentication
  - More details in the []./explain/webdraw-sdk.md](./explain/webdraw-sdk.md) document.
- **Iframe Integration**: The Webdraw SDK runs in an iframe within the application.

### 2.4 Build and Development Tools

- **Vite**: Modern build tool chosen for:
  - Lightning-fast development server with HMR
  - Optimized production builds
  - Native TypeScript support
  - Simple configuration
  - Strong plugin ecosystem
- **ESLint**: Code quality maintenance through ESLint with React-specific rules
- **Jest and Testing Library**: Testing support through Jest and React Testing Library

### 2.5 Development Philosophy

- **Simplicity First**: We favor simple, maintainable solutions over complex architectures
- **Mobile-First**: All features are designed with mobile users in mind
- **Developer Experience**: Tools and frameworks are chosen to enhance development speed and code quality
- **Performance**: Leveraging modern build tools and optimized dependencies for fast load times

## 3. User Flows

### 3.1 Creating a New App

1. **Initiate Creation**:
   - User clicks the "New App" button on the dashboard.

2. **Select Template**:
   - User chooses a template (e.g., "Form," "Quiz (WIP)"). Don't worry about quiz, just making it here to allow other types of app in the future.

3. **Configure Styleguide**:
   - User selects a visual theme (e.g., "Minimalistic," "Cyberpunk," "Classic") to define colors, fonts, and overall style.

4. **Define Inputs**:
   - User specifies input fields (e.g., "Filename," "Title," "Type") with options like "Text," "Image," etc., determining what data the app collects. There can be Select fields where user will configure options. This is similar to creating a Form on Google Forms, but simples.

5. **Set Up Actions**:
   - User adds AI-driven actions (e.g., "Gerar Texto" [Generate Text], "Gerar Imagem" [Generate Image]) and configures them with prompts or parameters.
   - New actions can be added. They're mostly a mapping to Webdraw SDK AI methods. Check more info in [./explain/webdraw-sdk.md](./explain/webdraw-sdk.md).

6. **Configure Output**:
   - User defines how generated content is displayed or exported (e.g., referencing files like "@cover.png," "@story.md"). The output is a static form with text, audio, image, video that the user can fill. Later it'll be possible to pass anything.

7. **Save App**:
   - The app configuration is saved as a JSON file in the ~/Hector/apps/ directory using the Webdraw SDK filesystem.

### 3.2 Editing an Existing App

1. **Select App**:
   - User selects an app from the "My Apps" list and clicks "Edit."

2. **Modify Configuration**:
   - User updates the template, style, inputs, actions, or output as needed.

3. **Save Changes**:
   - The updated configuration overwrites the existing JSON file in the Webdraw filesystem.

### 3.3 Running an App

1. **Select App**:
   - User selects an app from "My Apps" and clicks "Run."

2. **Enter Inputs**:
   - User provides data for the input fields defined in the configuration.

3. **Generate Output**:
   - User clicks "Generate" to execute the actions and produce the output.

4. **View or Export Output**:
   - The generated content is displayed, with options to download or share.

### 3.4 Exporting an App

1. **Select App**:
   - User selects an app and clicks "Export."

2. **Generate Export**:
   - The app configuration is packaged for sharing or standalone deployment. This feature will be implemented in a future version.

## 4. UI Components

### 4.1 Dashboard

1. **Header**:
   - Displays "Hector - AI App Builder" with a brief description:
     - "No-code interface"
     - "Explore"
     - "Export an APP"

2. **My Apps Section**:
   - Lists user-created apps with options to "Edit" or "Run" each app.

3. **New App Button**:
   - Initiates the app creation process.

### 4.2 App Configuration Screen

1. **Steps Navigation**:
   - Organized into collapsible sections or tabs:
     - "Styleguide"
     - "Inputs"
     - "Actions"
     - "Output"

2. **Styleguide Configuration**:
   - Offers a selection of visual themes (e.g., "Minimalistic," "Cyberpunk," "Classic") with previews.

3. **Inputs Configuration**:
   - Input Field Cards: Each input field is displayed as a card with two views:
     - View Mode: Shows a preview of the field with its label, filename, type, and a visual representation.
     - Edit Mode: Provides a form for configuring the field's properties.

   - Add Input Field: Users can add multiple input fields, each with:
     - Display Label: Text shown to users filling out the form.
     - Filename: Automatically generated from the label (e.g., "childs_name.md"). Used to reference this field in other parts of the app.
     - Type: The input type (e.g., "Text," "Number," "Email," "Textarea," "Select").
     - Required Status: Whether the field is mandatory or optional.
     - Placeholder Text: Custom text that appears in the input field when it's empty, providing guidance to users.
   
   - Automatic Filename Generation: The system automatically converts the Display Label into a filename with the appropriate extension (.md for text fields). It handles uniqueness by adding suffixes if needed.

   - Card Flipping Interface: Users can toggle between view and edit modes by clicking an icon, creating a visual "flip" effect for better user experience.

   - Field Management: Users can easily add, edit, and delete fields, with intuitive controls and visual feedback.

4. **Actions Configuration**:
   - List to add actions (e.g., "Gerar JSON," "Gerar Texto," "Gerar Imagem," "Gerar Aúdio") with configuration forms:
     - Prompt or schema for each action (e.g., "Generate a story for @child_name.md").

5. **Output Configuration**:
   - Template-based system for structuring output display
   - Currently supports the "Story" template with fields for backgroundImage, title, content, and audio
   - The title field is localized by language and serves as the default display field
   - Each field references files generated by actions via dropdown selectors
   - Users can only add one instance of each template type
   - Visual preview of the configured output

### 4.3 Running Screen

1. **Input Form**:
   - Dynamically generated based on the app's input configuration.

2. **Generate Button**:
   - Triggers the execution of configured actions.

3. **Output Display**:
   - Shows generated content (e.g., text, images, audio) with download/share options.

### 4.4 Actions Configuration

**Purpose:**  
Configures the AI-driven actions that the app will perform, such as generating text, images, or audio based on user inputs.

**Functionality:**

-   **Add Action:** Users can add actions from a list of available types:
    -   **Generate Text:** Creates text content using AI models (.md files)
    -   **Generate JSON:** Creates structured JSON data (.json files)
    -   **Generate Image:** Creates image content (.png files)
    -   **Generate Audio:** Creates audio content (.mp3 files)
  
-   **Action Configuration:** Each action has a card-based interface with:
    -   **View Mode:** Shows a summary of the action with its type, output filename, and prompt
    -   **Edit Mode:** Provides a form for configuring the action's properties
  
-   **Configure Action:** Each action has common properties and type-specific properties:
    -   **Action Type:** The type of content to generate (Text, JSON, Image, Audio)
    -   **Action Title:** A descriptive name for the action
    -   **Output Filename:** Auto-generated from the title with appropriate extension (.md, .json, .png, .mp3)
    -   **Schema-based Form:** Dynamic configuration form generated from JSON Schema for each action type
    -   **Prompt:** Users define the AI prompt, referencing input fields or previous actions with @filename.ext notation
    -   **Additional Properties:** Specific to each action type (e.g., model, temperature, max tokens for text)
    -   **Schema Field (JSON Actions):** For JSON generation actions, users can define a JSON schema directly in a text field or use the "Use AI" button to generate a schema automatically. When the "Use AI" button is clicked, a specialized implementation uses the generateObject API with a meta-schema to produce valid JSON Schema documents based on the user's description.
    -   **Model Selection (Text and JSON):** For text and JSON generation, users can choose from a variety of AI models including general options (Best, Fast) and specific provider models (Anthropic, OpenAI, Deepseek, Mistral, etc.)
      
-   **Available Variables Component:** 
    -   Displays all available variables that can be referenced in the prompt
    -   Shows input fields and outputs from previous actions with appropriate icons and labels
    -   Allows users to click on a variable to insert its reference (@filename.ext) into the prompt field
    -   Visually distinguishes between input fields and different types of action outputs using color-coded tags
    -   Automatically updates based on the current action being edited to only show relevant variables

-   **Schema-driven Forms:** Action-specific configuration forms are automatically generated using React JSON Schema Form:
    -   Forms adapt to each action type's schema
    -   Fields include appropriate validation
    -   Specialized widgets for different data types (text areas for prompts, sliders for numeric values, etc.)
    -   Consistent user experience across all form fields
      
-   **AI Schema Generation:** For JSON actions, the platform provides specialized AI-powered Schema generation:
    -   **Use AI Button:** Located alongside the Schema field to invoke AI-powered schema generation
    -   **Object Generation API:** Uses a specialized API to create properly structured JSON Schema documents
    -   **Descriptive Interface:** Users describe the data structure they want to create in natural language
    -   **Fallback Mechanism:** Automatically falls back to text-based generation if object generation fails
    -   **Validation:** Ensures the generated schema conforms to JSON Schema standards
      
-   **Multiple Actions:** Users can chain multiple actions, with each action potentially using outputs from previous ones.
  
-   **Reference System:** Actions can reference both input fields and outputs from previous actions using the @filename.ext notation in prompts.

**Visual Elements:**

-   Cards for each action with summary in view mode and configuration form in edit mode
-   "Add Action" section with cards for each available action type
-   Dynamically generated form fields for action properties (common and type-specific)
-   Interactive prompt field with available variables component showing clickable variable references
-   Toggle buttons to switch between view and edit modes
-   Auto-generated output filename display (non-editable)
-   Informative tooltips for each property

### 4.4 Output Configuration

**Purpose:**  
Defines how the app's generated content is presented or exported to the user.

**Functionality:**

-   **Template Selection:** Users can add output templates (currently only "Story" template is available) through a card-based interface similar to Actions.
  
-   **Template Configuration:** Each template has fields that reference files generated by actions:
    -   **Story Template:** Has optional fields for backgroundImage, title, content, and audio.
    -   **Title Field:** The title field is localized by language and serves as the default field displayed in the card view.
  
-   **File References:** Users select files using dropdowns that only show compatible files (e.g., image fields only show image files).
  
-   **Template Limits:** Users can only add one instance of each template type.
  

**Visual Elements:**

-   Large buttons with icons for adding different template types.
  
-   Form interface for configuring template fields (without the card flip effect used in Actions).
  
-   Dropdown selectors for each field showing only compatible files from inputs and actions.
  
-   Disabled add buttons for template types that have already been added.

## 5. Data Model

### 5.1 App Configuration JSON

Each app is stored as a JSON file in ~/Hector/apps/ using the Webdraw filesystem. Below is an example structure:

```json
{
  "id": "unique_app_id",
  "name": "Example App",
  "template": "form",
  "style": "minimalistic",
  "inputs": [
    {
      "filename": "child_name.md",
      "type": "text",
      "title": {
        "EN": "Child's Name",
        "PT": "Nome da Criança"
      },
      "required": true,
      "placeholder": "Enter the child's name"
    }
  ],
  "actions": [
    {
      "type": "Gerar Texto",
      "prompt": {
        "EN": "Generate a story for @child_name.md",
        "PT": "Gere uma história para @child_name.md"
      },
      "output_filename": "story.md"
    },
    {
      "type": "Gerar Imagem",
      "prompt": "Create a cover for @child_name.md's story",
      "output_filename": "cover.png"
    },
    {
      "type": "Gerar JSON",
      "prompt": "Generate a product catalog for @store_name.md",
      "schema": {
        "type": "object",
        "properties": {
          "products": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "price": { "type": "number" },
                "category": { "type": "string" }
              }
            }
          }
        }
      },
      "model": "Best",
      "temperature": 0.7,
      "output_filename": "catalog.json"
    }
  ],
  "output": {
    "type": "html",
    "template": "story_template.html",
    "files": ["@cover.png", "@story.md", "@story.mp3"]
  }
}
```

- **id**: Unique identifier for the app.
- **name**: User-defined app name.
- **template**: Selected template (e.g., "form").
- **style**: Chosen visual theme.
- **inputs**: Array of input fields with properties.
- **actions**: Array of AI actions with configurations.
- **output**: Defines how results are presented or exported.

```json
// Updated output structure
"output": [
  {
    "type": "Story",
    "title": {
      "EN": "My Story Title",
      "PT": "Título da Minha História"
    },
    "backgroundImage": "@cover.png",
    "content": "@story_content.md",
    "audio": "@narration.mp3"
  }
]
```

## 6. Integration with Webdraw AI SDK

The app uses the Webdraw AI SDK to perform AI-driven actions and manage file storage. Key methods include:

- **Gerar JSON**: Maps to generateObject() for structured data generation.
- **Gerar Texto**: Maps to generateText() for text generation.
- **Gerar Imagem**: Maps to generateImage() for image creation.
- **Gerar Aúdio**: Maps to generateAudio() for audio production.

### 6.1 AI Object Generation for Schema Creation

The application leverages the Webdraw SDK's Object Generation API to create JSON Schema definitions for JSON actions. This specialized implementation ensures that generated schemas are valid and properly structured.

**Implementation Details:**
- **generateObject()**: The system uses this specialized API endpoint with a meta-schema to generate valid JSON Schema documents
- **Schema Generation Flow**:
  1. User clicks "Use AI" button next to the Schema field
  2. A modal appears for Schema generation
  3. User enters a description of the data structure they need
  4. The system detects that this is a Schema field for a JSON action
  5. It calls generateObject() with a meta-schema that includes a jsonSchema property
  6. If successful, the generated schema is extracted from the response and formatted as JSON
  7. The formatted schema is inserted into the Schema field
  8. If unsuccessful, the system falls back to text generation with specific instructions

- **Benefits**:
  - More accurate and valid JSON Schemas compared to text-based generation
  - Proper schema structure with correct types, validations, and nested objects
  - More intuitive interface for users who may not be familiar with JSON Schema syntax
  - Enhanced reliability with fallback mechanisms

- **Technical Implementation**:
  - The system detects Schema fields in JSON actions via field ID and title
  - Uses a specialized meta-schema with a jsonSchema object property
  - Comprehensive error handling with fallback to text generation
  - Proper JSON formatting with indentation for better readability
  - Clear success/error messages to guide users

### 6.2 Example Payload Configuration

For "Gerar Texto":

```typescript
{
  prompt: "Generate a story for @child_name.md",
  model: "text-model",
  maxTokens: 500
}
```

For "Gerar JSON":

```typescript
// Current implementation for JSON schema creation
// Note: Currently using regular text generation instead of specialized Object Generation
{
  // Regular text generation to create a schema string
  prompt: "Create a JSON schema for a product catalog with name, price, and category fields",
  model: "Best", 
  temperature: 0.7
  // Result is a text string that needs to be valid JSON Schema
}

// JSON generation with the created schema:
{
  model: "Best",
  prompt: "Generate a product catalog for a sports store",
  schema: JSON.parse(schemaString), // Schema is parsed from the string stored in the action config
  temperature: 0.7
}

// FUTURE IMPLEMENTATION (proposed for specialized schema generation):
{
  // Meta-schema for generating a valid JSON Schema
  schema: {
    type: "object",
    properties: {
      jsonSchema: {
        type: "object",
        description: "A valid JSON Schema defining the structure of objects"
      }
    }
  },
  prompt: "Create a JSON schema for a product catalog with name, price, and category fields",
  model: "anthropic:claude-3-7-sonnet-latest",
  temperature: 0.7
}
```

For "Gerar JSON":

```typescript
// Schema generation using Object Generation API:
{
  // Meta-schema for generating JSON Schema
  schema: {
    type: "object",
    properties: {
      jsonSchema: {
        type: "object",
        description: "A valid JSON Schema defining the structure of objects"
      }
    }
  },
  prompt: "Create a JSON schema for a product catalog with name, price, and category fields",
  model: "Best",
  temperature: 0.7
}

// JSON generation with the created schema:
{
  model: "Best",
  prompt: "Generate a product catalog for a sports store",
  schema: JSON.parse(schemaString), // Schema is parsed from the string stored in the action config
  temperature: 0.7
}
```

The UI allows users to configure these payloads through React JSON Schema Form, an advanced form generation library that automatically builds forms based on JSON Schema definitions. This approach:

1. Creates consistent, well-structured forms for each action type
2. Handles validation automatically based on schema properties
3. Simplifies form state management
4. Provides a better user experience with appropriate input widgets for different data types

Each action type has a corresponding JSON Schema that defines its configuration options, allowing for clear separation between the UI and data model.

### 6.2 Authentication

Authentication is handled by the Webdraw SDK. The application can check for a logged-in user with:

```typescript
const user = await SDK.getUser(); // Returns { username: string } if user is logged in
```

## 7. Validation and Error Handling

### 7.1 Configuration Validation

- Ensures all required input fields are defined.
- Verifies action configurations (e.g., valid prompts).
- Disables the "Run App" button until the configuration is valid.

### 7.2 Runtime Error Handling

- Catches failures in AI generation (e.g., service downtime).
- Displays user-friendly error messages (e.g., "Failed to generate text. Please try again.").

## 8. Storage

- **App Configurations**:
  - Saved as JSON files in ~/Hector/apps/ using the Webdraw SDK filesystem.
  - Retrieved using SDK.fs.list('~/Hector/apps').filter(endsWithJson).

- **Generated Files**:
  - Stored in the Webdraw filesystem and referenced in the output configuration (e.g., "@story.md").

## 9. Internationalization

- **Language Support**:
  - UI and app content support multiple languages (e.g., English "EN," Portuguese "PT").
  - Language selection toggles titles, prompts, and descriptions (e.g., "Child's Name" vs. "Nome da Criança").

## 10. Technical Implementation

### 10.1 Frontend Architecture

- The application is a frontend-only Single Page Application (SPA) with browser routing.
- The Webdraw SDK is imported and runs in an iframe.
- Ant Design provides the UI components and styling system, ensuring a modern and responsive interface.

### 10.2 Additional Features

- **Collapsible Sections**:
  - Configuration UI uses collapsible panels to manage screen space.

- **Templates**:
  - Predefined templates (e.g., "Form," "Quiz") streamline app creation, with "Quiz" marked as Work in Progress (WIP).

- **Export Format**:
  - The export functionality will be implemented in a future version, with a placeholder function that will call AI for this purpose.

---

This design document provides a complete specification for "Hector," the AI App Builder, covering user flows, UI components, data structures, and integrations. It ensures the platform is intuitive, scalable, and ready for implementation.

# Screens

The AI App Builder, "Hector," is composed of several key screens that guide users through the process of creating, configuring, and running custom AI-powered applications. Each screen serves a distinct purpose and is designed to be intuitive, ensuring users can navigate the app-building process with ease. Below is a detailed breakdown of each screen and its functionality.

----------

## 1. Dashboard

**Purpose:**  
The Dashboard is the entry point for users, providing an overview of their existing apps and options to create, edit, or run apps.

**Functionality:**

-   **Header:** Displays the app name ("Hector - AI App Builder") and a brief description of its features:  
    -   "No-code interface"
      
    -   "Explore"
      
    -   "Export an APP"
      
    
-   **My Apps Section:** Lists all user-created apps with the following options for each:  
    -   **Edit:** Opens the App Configuration Screen to modify the app.
      
    -   **Run:** Opens the Running Screen to interact with the app.
      
    
-   **New App Button:** Initiates the app creation process by navigating to the App Configuration Screen.
  

**Visual Elements:**

-   App list with cards or table rows, each showing the app's name and action buttons ("Edit," "Run").
  
-   Prominent "New App" button.
  

----------

## 2. App Configuration Screen

**Purpose:**  
This is the central screen for creating or editing an app. It is divided into four main steps: Styleguide, Inputs, Actions, and Output. Users can configure each aspect of their app in a structured, step-by-step manner.

**Functionality:**

-   **Steps Navigation:** The screen is organized into collapsible sections or tabs for each step:  
    1.  **Styleguide**
      
    3.  **Inputs**
      
    5.  **Actions**
      
    7.  **Output**
      
    
-   Users can navigate between steps sequentially or jump to a specific section.
  
-   Each section is clearly marked, with a progress indicator or step numbers (e.g., "1> Styleguide," "2> Inputs").
  

**Visual Elements:**

-   Step indicators or tabs at the top or side of the screen.
  
-   Collapsible panels for each section to manage space.
  
-   "Save" button to store the configuration as a JSON file in ~/Hector/apps/.
  

----------

### 2.1 Styleguide Configuration

**Purpose:**  
Allows users to select a visual theme for their app, defining its aesthetic elements such as colors, fonts, and spacing.

**Functionality:**

-   **Theme Selection:** Users choose from predefined styles (e.g., "Minimalistic," "Cyberpunk," "Classic").
  
-   **Preview:** Each style option includes a visual preview of how the app will look.
  
-   **Customization (Optional):** Depending on the design, users may further tweak colors or fonts within the selected style.
  

**Visual Elements:**

-   Grid or list of style cards with previews.
  
-   Selection mechanism (e.g., radio buttons or clickable cards).
  
-   Optional customization fields for advanced users.
  

----------

### 2.2 Inputs Configuration

**Purpose:**  
Defines the data inputs that the app will collect from its users (e.g., text fields, dropdowns, file uploads).

**Functionality:**

-   **Input Field Cards:** Each input field is displayed as a card with two views:  
    -   **View Mode:** Shows a preview of the field with its label, filename, type, and a visual representation.
    -   **Edit Mode:** Provides a form for configuring the field's properties.

-   **Add Input Field:** Users can add multiple input fields, each with:  
    -   **Display Label:** Text shown to users filling out the form.
    -   **Filename:** Automatically generated from the label (e.g., "childs_name.md"). Used to reference this field in other parts of the app.
    -   **Type:** The input type (e.g., "Text," "Number," "Email," "Textarea," "Select").
    -   **Required Status:** Whether the field is mandatory or optional.
    -   **Placeholder Text:** Custom text that appears in the input field when it's empty, providing guidance to users.
    
-   **Automatic Filename Generation:** The system automatically converts the Display Label into a filename with the appropriate extension (.md for text fields). It handles uniqueness by adding suffixes if needed.
    
-   **Card Flipping Interface:** Users can toggle between view and edit modes by clicking an icon, creating a visual "flip" effect for better user experience.

-   **Field Management:** Users can easily add, edit, and delete fields, with intuitive controls and visual feedback.

**Visual Elements:**

-   Cards for each field with preview in view mode.
-   Toggle buttons to flip between view and edit modes.
-   Field preview showing how the input will appear to end users.
-   Auto-generated filename display (non-editable).
-   "Add Field" button to create new inputs.
-   Delete button for removing unwanted fields.

----------

### 2.3 Actions Configuration

**Purpose:**  
Configures the AI-driven actions that the app will perform, such as generating text, images, or audio based on user inputs.

**Functionality:**

-   **Add Action:** Users can add actions from a list of available types:
    -   **Generate Text:** Creates text content using AI models (.md files)
    -   **Generate JSON:** Creates structured JSON data (.json files)
    -   **Generate Image:** Creates image content (.png files)
    -   **Generate Audio:** Creates audio content (.mp3 files)
  
-   **Action Configuration:** Each action has a card-based interface with:
    -   **View Mode:** Shows a summary of the action with its type, output filename, and prompt
    -   **Edit Mode:** Provides a form for configuring the action's properties
  
-   **Configure Action:** Each action has common properties and type-specific properties:
    -   **Action Type:** The type of content to generate (Text, JSON, Image, Audio)
    -   **Action Title:** A descriptive name for the action
    -   **Output Filename:** Auto-generated from the title with appropriate extension (.md, .json, .png, .mp3)
    -   **Schema-based Form:** Dynamic configuration form generated from JSON Schema for each action type
    -   **Prompt:** Users define the AI prompt, referencing input fields or previous actions with @filename.ext notation
    -   **Additional Properties:** Specific to each action type (e.g., model, temperature, max tokens for text)
    -   **Schema Field (JSON Actions):** For JSON generation actions, users can define a JSON schema directly in a text field or use the "Use AI" button to generate a schema automatically. When the "Use AI" button is clicked, a specialized implementation uses the generateObject API with a meta-schema to produce valid JSON Schema documents based on the user's description.
    -   **Model Selection (Text and JSON):** For text and JSON generation, users can choose from a variety of AI models including general options (Best, Fast) and specific provider models (Anthropic, OpenAI, Deepseek, Mistral, etc.)
      
-   **Available Variables Component:** 
    -   Displays all available variables that can be referenced in the prompt
    -   Shows input fields and outputs from previous actions with appropriate icons and labels
    -   Allows users to click on a variable to insert its reference (@filename.ext) into the prompt field
    -   Visually distinguishes between input fields and different types of action outputs using color-coded tags
    -   Automatically updates based on the current action being edited to only show relevant variables

-   **Schema-driven Forms:** Action-specific configuration forms are automatically generated using React JSON Schema Form:
    -   Forms adapt to each action type's schema
    -   Fields include appropriate validation
    -   Specialized widgets for different data types (text areas for prompts, sliders for numeric values, etc.)
    -   Consistent user experience across all form fields
      
-   **AI Schema Generation:** For JSON actions, the platform provides specialized AI-powered Schema generation:
    -   **Use AI Button:** Located alongside the Schema field to invoke AI-powered schema generation
    -   **Object Generation API:** Uses a specialized API to create properly structured JSON Schema documents
    -   **Descriptive Interface:** Users describe the data structure they want to create in natural language
    -   **Fallback Mechanism:** Automatically falls back to text-based generation if object generation fails
    -   **Validation:** Ensures the generated schema conforms to JSON Schema standards
      
-   **Multiple Actions:** Users can chain multiple actions, with each action potentially using outputs from previous ones.
  
-   **Reference System:** Actions can reference both input fields and outputs from previous actions using the @filename.ext notation in prompts.

**Visual Elements:**

-   Cards for each action with summary in view mode and configuration form in edit mode
-   "Add Action" section with cards for each available action type
-   Dynamically generated form fields for action properties (common and type-specific)
-   Interactive prompt field with available variables component showing clickable variable references
-   Toggle buttons to switch between view and edit modes
-   Auto-generated output filename display (non-editable)
-   Informative tooltips for each property

----------

### 2.4 Output Configuration

**Purpose:**  
Defines how the app's generated content is presented or exported to the user.

**Functionality:**

-   **Template Selection:** Users can add output templates (currently only "Story" template is available) through a card-based interface similar to Actions.
  
-   **Template Configuration:** Each template has fields that reference files generated by actions:
    -   **Story Template:** Has optional fields for backgroundImage, title, content, and audio.
    -   **Title Field:** The title field is localized by language and serves as the default field displayed in the card view.
  
-   **File References:** Users select files using dropdowns that only show compatible files (e.g., image fields only show image files).
  
-   **Template Limits:** Users can only add one instance of each template type.
  

**Visual Elements:**

-   Large buttons with icons for adding different template types.
  
-   Form interface for configuring template fields (without the card flip effect used in Actions).
  
-   Dropdown selectors for each field showing only compatible files from inputs and actions.
  
-   Disabled add buttons for template types that have already been added.

----------

## 3. Running Screen

**Purpose:**  
Allows users to interact with their configured app by providing inputs and generating outputs.

**Functionality:**

-   **Dynamic Input Form:** Generates input fields based on the app's configured inputs (e.g., text boxes, file uploaders).
  
-   **Generate Button:** Triggers the execution of all configured actions using the provided inputs.
  
-   **Output Display:** Shows the generated content (e.g., text, images, audio) in a user-friendly format.
  
-   **Download/Share Options:** Provides buttons to download the output or share it via a link or file export.
  

**Visual Elements:**

-   Form with dynamically generated input fields.
  
-   "Generate" button to run the app.
  
-   Output section with previews or links to generated files.
  
-   "Download" and "Share" buttons for the output.
  

----------

## 4. Export Screen

**Purpose:**  
Enables users to export their app's configuration for sharing or standalone deployment.

**Functionality:**

-   **Export Format:** Users can choose to export the app as an HTML file or JSON configuration.
  
-   **Generate Export:** Clicking "Export" packages the app's configuration and generated files into a downloadable format.
  
-   **Validation:** Ensures the app is fully configured and valid before allowing export.
  

**Visual Elements:**

-   Dropdown to select export format (e.g., "HTML," "JSON").
  
-   "Export" button to initiate the process.
  
-   Status messages or progress indicators during export.
  

----------

## 5. Additional UI Elements

-   **Language Toggle:** Buttons or dropdowns (e.g., "EN," "PT") to switch between supported languages for the UI and app content.
  
-   **Collapsible Sections:** Used throughout the configuration screens to manage space and improve usability.
  
-   **Validation Indicators:** Visual cues (e.g., checkmarks, error messages) to show whether the app is ready to run or export.

# TODOs and Future Improvements

The following features and improvements need to be implemented:

## 1. Enhanced Styleguide Selection
- Develop a more robust and comprehensive styleguide selection interface
- Add preview capabilities for each style option
- Include customization options for colors, fonts, and spacing within each style
- Support custom CSS injection for advanced users

## 2. Output Configuration Enhancement
- Improve the interface for defining output formats and templates
- Add support for multiple output formats (HTML, PDF, etc.)
- Develop a template editor for customizing the presentation of generated content
- Create reusable output templates that can be shared across apps

## 3. Runtime/Execution System
- Implement a robust execution engine for running apps
- Integrate in the app's data structure for storing execution data and results
- Create a system for tracking execution history and allowing resumption of previous runs
- Add real-time progress indicators during execution
- Implement caching mechanisms for previously generated content
- Support for cancelling running executions
- Add execution analytics and performance monitoring

## 4. Internationalization (i18n) for Apps
- Complete UI internationalization for all components and screens
- Support for content internationalization (input labels, prompts, etc.)
- Enable language-specific AI prompts and outputs
- Add language selection controls for users running apps
- Implement AI-assisted translation for app content
- Support for language detection and automatic switching based on user preferences
- Create a Localizable<T> type for all user-facing text fields
- Add mechanisms to copy content between languages with AI translation assistance
- Support query string parameters for pre-selecting language

## 5. COMPLETED: AI Schema Generation for JSON Actions
- Implement specialized JSON Schema generation using the Object Generation API
- Create a dedicated modal for schema generation with better UX
- Define meta-schema for generating valid JSON Schema documents
- Add error handling and validation for generated schemas
- Provide helper UI to explain JSON Schema concepts
- Include examples of common schema patterns
- Support for schema templates based on common data structures