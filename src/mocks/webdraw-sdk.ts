import { WebdrawSDK, FileSystemOptions } from '../types/webdraw';

export class MockWebdrawSDK implements WebdrawSDK {
  private mockUser: { username: string } | null = { username: 'test-user' };
  private fileSystem: Map<string, string> = new Map();

  async getUser(): Promise<{ username: string } | null> {
    return this.mockUser;
  }

  redirectToLogin(options?: { appReturnUrl?: string }): void {
    console.log('Redirecting to login...', options);
  }

  ai = {
    generateText: async (options: { prompt: string }) => {
      return {
        text: `Mock text generated with prompt: ${options.prompt}`,
        filepath: `~/Hector/generated/text_${Date.now()}.txt`,
      };
    },

    generateImage: async (options: { prompt: string }) => {
      return {
        images: [`https://mock-image-url.com/${encodeURIComponent(options.prompt)}`],
        filepath: `~/Hector/generated/image_${Date.now()}.png`,
      };
    },

    generateObject: async <T>(options: {
      prompt: string;
      schema: { type: 'object'; properties: Record<string, any> };
    }) => {
      return {
        object: { mockData: `Generated from prompt: ${options.prompt}` } as T,
        filepath: `~/Hector/generated/object_${Date.now()}.json`,
      };
    },
  };

  fs = {
    list: async (path: string) => {
      const files: string[] = [];
      this.fileSystem.forEach((_, key) => {
        if (key.startsWith(path)) {
          files.push(key);
        }
      });
      return files;
    },

    readFile: async (options: FileSystemOptions) => {
      const content = this.fileSystem.get(options.path);
      if (!content) {
        throw new Error(`File not found: ${options.path}`);
      }
      return content;
    },

    writeFile: async (options: FileSystemOptions) => {
      if (!options.content) {
        throw new Error('No content provided');
      }
      this.fileSystem.set(options.path, options.content);
    },

    delete: async (options: FileSystemOptions) => {
      this.fileSystem.delete(options.path);
    },

    mkdir: async (path: string, options?: { recursive?: boolean }) => {
      // Mock implementation - we don't need to actually create directories
      return;
    },
  };

  // Helper methods for testing
  _setMockUser(user: { username: string } | null) {
    this.mockUser = user;
  }

  _clearFileSystem() {
    this.fileSystem.clear();
  }

  _getMockFileSystem() {
    return new Map(this.fileSystem);
  }
} 