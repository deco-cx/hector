import { AppConfig, Execution } from '../types/types';

/**
 * Extracts variable dependencies from a prompt string
 * @param prompt The prompt string to parse for variables
 * @returns Array of filenames that are required by this prompt
 */
export function extractDependencies(prompt: string): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const dependencies: string[] = [];
  let match;

  while ((match = variablePattern.exec(prompt)) !== null) {
    const variable = match[1].trim();
    dependencies.push(variable);
  }

  return dependencies;
}

/**
 * Checks if all dependencies for an action are satisfied
 * @param actionIndex Index of the action to check
 * @param appConfig Current app configuration
 * @returns Object with isPlayable flag and list of missing dependencies
 */
export function checkActionPlayable(
  actionIndex: number,
  appConfig: AppConfig
): { isPlayable: boolean; missingDependencies: string[] } {
  if (!appConfig || !appConfig.actions || !appConfig.actions[actionIndex]) {
    return { isPlayable: false, missingDependencies: [] };
  }

  const action = appConfig.actions[actionIndex];
  const prompt = typeof action.prompt === 'object' 
    ? action.prompt[appConfig.selectedLanguage || 'en-US'] || ''
    : action.prompt || '';
  
  const dependencies = extractDependencies(prompt);
  const missingDependencies: string[] = [];
  
  for (const dep of dependencies) {
    if (!appConfig.lastExecution?.bag?.[dep]?.textValue) {
      missingDependencies.push(dep);
    }
  }

  return {
    isPlayable: missingDependencies.length === 0,
    missingDependencies
  };
}

/**
 * Replaces variables in a prompt with their values from the execution bag
 * @param prompt The prompt string with variables
 * @param execution Current execution data
 * @returns Prompt with all variables replaced with their values
 */
export function replacePromptVariables(prompt: string, execution: Execution): string {
  if (!execution || !execution.bag) return prompt;

  return prompt.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const value = execution.bag[variable.trim()]?.textValue;
    return value !== undefined ? value : match;
  });
} 