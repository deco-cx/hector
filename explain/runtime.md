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

2) We're also adding a new prop `state` for each action in our types.ts to indicate the state of execution of that action: 'idle' | 'loading'.

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

The actionsConfig.ts I think already have some logic behind but, basically, executing action is running the underlying Webdraw SDK method (described in types.ts).

The AI methods return both the result (in text or base64) and the filepath. But the filepath needs to be permissionsed calling fs.chmod with all public read. After that, prefix the filepath with fs.webdraw.com and leave it there. We'll connect the pieces later.

Leave room for logging and comment all the partes.

## Files

- Create new actions in the HectorReducer for the PLayButton and the inputs to communicate. Possibly: SET_INPUT_VALUE, SET_ACTION_STATE, SET_EXECUTION, SET_EXECUTION_BAG_FOR_FILE

- All code should be implemented in the PlayButton component for now.



