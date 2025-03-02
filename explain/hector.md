# AI App Builder Design Document

## 1. Overview

The AI App Builder, named "Hector," is a no-code platform designed to empower users to create, manage, and run custom AI-powered applications. By leveraging a step-by-step configuration process, users can define an app's visual style, input fields, AI-driven actions, and output formats. The platform integrates with the Webdraw AI SDK to enable the generation of various content types, including text, images, audio, and more. This design document outlines the app's functionality, user interface, data model, and technical integrations, providing a comprehensive blueprint for development.

It should work similarly to create Zaps on Zapier, but simples, mobile-friendly and AI-oriented.

## 2. Technologies

### 2.1 Frontend Framework

- **React**: The application is built using React (v19.0.0), a JavaScript library for building user interfaces.
- **TypeScript**: The project uses TypeScript (v4.9.5) for type safety and improved developer experience.
- **Single Page Application (SPA)**: Hector is implemented as a frontend-only SPA with browser routing. It should build a static app that doesn't require a server.

### 2.2 UI Components and Styling

- **DaisyUI**: The application uses DaisyUI, a component library for Tailwind CSS that provides ready-to-use UI components with a consistent design system.
- **Themes**: DaisyUI's theming capabilities are leveraged to implement the various visual themes offered in the Styleguide configuration.
- **Responsive Design**: The UI is designed to be responsive and work across different device sizes.

### 2.3 Data Management

- **Webdraw SDK**: The application integrates with the Webdraw AI SDK for:
  - File system operations (reading/writing app configuration and state.)
  - AI-driven content generation (text, images, audio)
  - User authentication
  - More details in the []./explain/webdraw-sdk.md](./explain/webdraw-sdk.md) document.
- **Iframe Integration**: The Webdraw SDK runs in an iframe within the application.

### 2.4 Build and Development Tools

- **React Scripts**: The project uses Create React App's scripts for development, building, and testing.
- **ESLint**: Code quality is maintained through ESLint with React-specific rules.
- **Jest and Testing Library**: Testing is supported through Jest and React Testing Library.

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
   - Form to add input fields, each with:
     - Filename: e.g., "child_name.md"
     - Type: e.g., "Text," "Image"
     - Title: Multilingual label (e.g., "EN: Child's Name," "PT: Nome da Criança")
     - Additional properties (e.g., required status).

4. **Actions Configuration**:
   - List to add actions (e.g., "Gerar JSON," "Gerar Texto," "Gerar Imagem," "Gerar Aúdio") with configuration forms:
     - Prompt or schema for each action (e.g., "Generate a story for @child_name.md").

5. **Output Configuration**:
   - Fields to specify output files (e.g., "@cover.png," "@story.md," "@story.mp3") with a dropdown of files generated in previous steps.

### 4.3 Running Screen

1. **Input Form**:
   - Dynamically generated based on the app's input configuration.

2. **Generate Button**:
   - Triggers the execution of configured actions.

3. **Output Display**:
   - Shows generated content (e.g., text, images, audio) with download/share options.

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
      "required": true
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

## 6. Integration with Webdraw AI SDK

The app uses the Webdraw AI SDK to perform AI-driven actions and manage file storage. Key methods include:

- **Gerar JSON**: Maps to generateObject() for structured data generation.
- **Gerar Texto**: Maps to generateText() for text generation.
- **Gerar Imagem**: Maps to generateImage() for image creation.
- **Gerar Aúdio**: Maps to generateAudio() for audio production.

### 6.1 Example Payload Configuration

For "Gerar Texto":

```typescript
{
  prompt: "Generate a story for @child_name.md",
  model: "text-model",
  maxTokens: 500
}
```

The UI allows users to configure these payloads, which are then passed to the SDK methods.

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
- DaisyUI is used for UI components and styling, providing a modern and responsive interface.

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

  

-   App list with cards or table rows, each showing the app’s name and action buttons ("Edit," "Run").
  
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

  

-   **Add Input Field:** Users can add multiple input fields, each with:  
    -   **Filename:** A unique identifier (e.g., "child_name.md").
      
    -   **Type:** The input type (e.g., "Text," "Image," "Select").
      
    -   **Title:** Multilingual labels (e.g., "EN: Child's Name," "PT: Nome da Criança").
      
    -   **Additional Properties:** Options like "Required," "Multi-Value," or "Clean on Startup."
      
    
  
-   **Edit or Remove Fields:** Users can modify or delete existing input fields.
  
-   **Language Support:** Input titles can be defined in multiple languages (e.g., English and Portuguese).
  

**Visual Elements:**

  

-   Form with fields for each input property.
  
-   "Add Field" button to create new inputs.
  
-   List of configured inputs with edit and delete icons.
  

----------

### 2.3 Actions Configuration

  

**Purpose:**  
Configures the AI-driven actions that the app will perform, such as generating text, images, or audio based on user inputs.

  

**Functionality:**

  

-   **Add Action:** Users can add actions from a list of available types (e.g., "Gerar JSON," "Gerar Texto," "Gerar Imagem," "Gerar Aúdio").
  
-   **Configure Action:** Each action has a configuration form:  
    -   **Type:** The action type (e.g., "Gerar Texto").
      
    -   **Prompt or Schema:** Users define the AI prompt or JSON schema, using variables from inputs (e.g., "Generate a story for @child_name.md").
      
    -   **Output Filename:** Specifies where the generated content will be saved (e.g., "story.md").
      
    
  
-   **Multiple Actions:** Users can chain multiple actions, with each action potentially using outputs from previous ones.
  
-   **Action Validation:** Ensures that prompts or schemas are correctly formatted and reference valid input variables.
  

**Visual Elements:**

  

-   List of configured actions with options to edit or remove.
  
-   "Add Action" button with a dropdown of available action types.
  
-   Configuration form for each action, including text areas for prompts and input fields for filenames.
  

----------

### 2.4 Output Configuration

  

**Purpose:**  
Defines how the app’s generated content is presented or exported to the user.

  

**Functionality:**

  

-   **Output Type:** Users select the format for the output (e.g., HTML, JSON, or direct file display).
  
-   **File References:** Users specify which generated files to include in the output (e.g., "@cover.png," "@story.md," "@story.mp3").
  
-   **Display Template:** For HTML outputs, users can select or define a template that structures how the generated content is displayed.
  
-   **File Selection:** A dropdown or list allows users to choose from files generated in previous actions.
  

**Visual Elements:**

  

-   Dropdown for selecting output type.
  
-   List or grid to select files for inclusion in the output.
  
-   Optional template selection or customization for HTML outputs.
  

----------

## 3. Running Screen

  

**Purpose:**  
Allows users to interact with their configured app by providing inputs and generating outputs.

  

**Functionality:**

  

-   **Dynamic Input Form:** Generates input fields based on the app’s configured inputs (e.g., text boxes, file uploaders).
  
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
Enables users to export their app’s configuration for sharing or standalone deployment.

  

**Functionality:**

  

-   **Export Format:** Users can choose to export the app as an HTML file or JSON configuration.
  
-   **Generate Export:** Clicking "Export" packages the app’s configuration and generated files into a downloadable format.
  
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