# Hector Runtime Feature

Since we're creating an app builder, we might as well run the app, right?

So far, we've been creating a app builder that, mostly, allows the user to define inputs, actions and outputs leveragind the Webdraw SDK, which gives access to a lot of AI models.

To accomplish that, let's go step by step

## Data 

We're going to add a new prop to AppConfig called `lastExecution`.

Last Execution will hold data from inputs and the result of calling actions.

type FileContent = { path?: string, textValue?: string };

type Execution = {
  /**
    Holds values for inputs. Eg, if we have the input:
      "inputs": [
    {
      "title": {
        "en-US": "Child Name",
        "pt-BR": "Nome da Criança"
      },
      "filename": "child_name.md",
      "type": "text",
      "required": false,
      "placeholder": {
        "en-US": ""
      }
    },

    The user will be able to fill that value in a text field. and if they
    fill the value "Lina" the bag will have

    { "child_name.md": {  textValue: "Lina" } }

    Similar for action. If the app has an action like
     "actions": [
    {
      "id": "42cf8b9d-9fc8-4015-beda-9d277053dd23",
      "type": "generateJSON",
      "title": {
        "en-US": "Plot"
      },
      "description": {
        "en-US": ""
      },
      "filename": "plot.json",
      "prompt": {
        "en-US": "Generate a plot for a child story with child name  {{child_name.md}} and theme  {{theme.md}}"
      },

      and hits "Play" to play that, after the async AI call is success, the bag
      will be

      { "child_name.md": {  textValue: "Lina" }, "plot.json": {  textValue: "{ \"plot\": ...}"  } }
  */
  bag: Record<string, FileContent>
  timestamp: number
}

2) We're also adding a new prop `state` for each action in our types.ts to indicate the state of execution of that action: 'idle' | 'loading' | 'error'.

After this, I think we have the data model to continue execution.

## UI Changes

- The InputsConfig view mode for each input, instead of just showing the config, will actually render an Input for that field. New the user fills the value, it updates the bag.

- The ActionsConfig view mode will also have elements for running the action. Two actually:
1) A <PlayAction actionIndex={number} >  button that will be rendered on the header of the card for that action, on the left of the edit/view button.
2) Inside the card, when in view mode, there will be a "Result" section, with a different color, and there will be rendered the textValue for that action, after it's rendered. Make it a textarea

## Validation

- The PlayAction component will hook in the appConfig State and
1) Verify if that action is playable
2) Play if necessary
3) Have loading state (changing the action.state)

To validate if the action is playable, the PlayAction will implement an algorithm that will build a dependency graph of the 

## Executing

The actionsConfig.ts I think already have some logic behind but, basically, executing action is running the underlying Webdraw SDK method (described in types.ts) replacing the internal values.

This is an example of an app:

{
  "id": "inputsonly",
  "name": {
    "en-US": "InputsOnly"
  },
  "template": "default",
  "style": "classic",
  "inputs": [
    {
      "title": {
        "en-US": "Child Name",
        "pt-BR": "Nome da Criança"
      },
      "filename": "child_name.md",
      "type": "text",
      "required": false,
      "placeholder": {
        "en-US": ""
      }
    },
    {
      "title": {
        "en-US": "Theme"
      },
      "filename": "theme.md",
      "type": "text",
      "required": false,
      "placeholder": {
        "en-US": ""
      }
    }
  ],
  "actions": [
    {
      "id": "42cf8b9d-9fc8-4015-beda-9d277053dd23",
      "type": "generateJSON",
      "title": {
        "en-US": "Plot"
      },
      "description": {
        "en-US": ""
      },
      "filename": "plot.json",
      "prompt": {
        "en-US": "Generate a plot for a child story with child name  {{child_name.md}} and theme  {{theme.md}}"
      },
      "config": {
        "model": "Best",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"title\": {\n      \"type\": \"string\",\n      \"description\": \"Title for a children's story\"\n    },\n    \"plot\": {\n      \"type\": \"string\",\n      \"description\": \"Plot summary for a children's story\"\n    }\n  },\n  \"required\": [\n    \"title\",\n    \"plot\"\n  ]\n}",
        "temperature": 0.7
      }
    },
    {
      "id": "e1ed8d94-376a-47b0-add4-0c276dc44bc3",
      "type": "generateText",
      "title": {
        "en-US": "Story"
      },
      "description": {
        "en-US": ""
      },
      "filename": "story.md",
      "prompt": {
        "en-US": "Generate Story based on  {{plot.json}} asdas"
      },
      "config": {
        "model": "Best",
        "temperature": 0.7,
        "maxTokens": 500
      }
    }
  ],

The AI methods return both the result (in text or base64) and the filepath. But the filepath needs to be permissionsed calling fs.chmod with all public read. After that, prefix the filepath with fs.webdraw.com and leave it there. We'll connect the pieces later.

Leave room for logging and comment all the partes.

## Files

- Create new actions in the HectorReducer for the PLayButton and the inputs to communicate. Possibly: SET_INPUT_VALUE, SET_ACTION_STATE, SET_EXECUTION, SET_EXECUTION_BAG_FOR_FILE

- All code should be implemented in the PlayButton component for now.

## FAQ:

- Error Handling: 

Execution Flow: Can multiple actions be executed in sequence, or is it one at a time? Is there a need for a "Run All" feature?
- Not for now, make the system work with all exeuctions beins triggers by clicking the play button

Persistence: Is the execution state (bag) persisted anywhere, or is it only in-memory until the app is closed?
- It's saved in the same place of app config. If the user hit save changes, it will save with the app json. No new thing.

Input Validation: How should the system handle required inputs that haven't been filled when a user attempts to run an action?
- The validation for an action is making sure that all the values it depends (inside its prompt the {{variables}} have values in the execution bag)

Action Results Display: For actions that produce complex output (like JSON or images), are there specific rendering requirements beyond showing in a textarea?
- Always render in a textarea

File Handling: After executing an action that produces a file, how should file permissions be handled, especially for security?
- Just add a block of code after the await sdk.ai call fos us to call sdk.fs.chmod(filepath, 0o744).

Cancellation: Is there a need to cancel an action while it's running?
- Yes, add that in the play button logic please.

Dependency Resolution: While the document mentions building a dependency graph to validate if actions are playable, it doesn't fully explain the implementation details. How should the system extract the dependencies from prompt strings (those {{variable}} patterns)? Should it use regex or some other method?
- Yes. Extract that into a function and implement the simple thing with regex first. Later we figure something better

Dependency Chain: If Action B depends on Action A's output, and Action A hasn't been executed yet, should the Play button for Action B be disabled or show a warning message? Or should it automatically trigger Action A first?
- Be disabled with a popover saying it depends on ...

Dependencies Between Files: The example shows dependencies like {{plot.json}}. How should the system handle extracting values from structured files like JSON? Should it read the entire file content, or is there a way to access specific properties within?
- For now, just assume the plot.json textValue will have the current value to be replaced

## Audio Generation

For audio generation using ElevenLabs, the following default values should be used:
- model_id: "eleven_turbo_v2_5"
- optimize_streaming_latency: 0
- voiceId: "ZqvIIuD5aI9JFejebHiH"

These defaults provide a good starting point for TTS (Text-to-Speech) generation.

When an audio file is generated, the system will:
1. Store the filepath in the execution bag's `path` property
2. Display an AudioPlayer component in the result area
3. The AudioPlayer will poll the web-accessible URL (fs.webdraw.com) until the file is available
   - The component checks once per second for up to 60 seconds (1 minute)
   - It displays the current retry attempt number during the loading state
   - The component shows detailed console logs for troubleshooting
4. Once available, the component will render an HTML audio player for immediate playback

The audio files will be available at the URL pattern: `https://fs.webdraw.com/users/{userId}/Audio/{filename}.mp3`

## Image Generation

For image generation, the following model substitution should be used:
- When "Best" is selected, use "openai:dall-e-3" as the actual model parameter
- This ensures compatibility with the OpenAI DALL-E 3 provider

Additional parameters for image generation:
- `aspect_ratio: "1:1"` - Set a square aspect ratio for all generated images
- `size` - Uses the configured size or defaults to '1024x1024'

When an image file is generated, the system will:
1. Store the filepath in the execution bag's `path` property
2. Display an ImageVisualizer component in the result area
3. The ImageVisualizer will poll the web-accessible URL (fs.webdraw.com) until the file is available
   - The component checks once per second for up to 60 seconds (1 minute)
   - It displays the current retry attempt number during the loading state
   - The component shows detailed console logs for troubleshooting
4. Once available, the component will render the image with appropriate styling for immediate viewing

Image files will be accessible at the URL pattern: `https://fs.webdraw.com/users/{userId}/Pictures/{filename}.webp`

