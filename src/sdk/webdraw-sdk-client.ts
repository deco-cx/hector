/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { SDK } from "https://webdraw.com/webdraw-sdk@v1";
import { WebdrawSDK } from '../types/webdraw';

// Log SDK initialization to debug loading issues
console.log("Initializing Webdraw SDK client");

// Test SDK access and log results
async function testSDKAccess() {
  try {
    console.log("Testing SDK access...");
    const files = await SDK.fs.list('~/');
    console.log("SDK test successful - Files in root:", files);
    
    // Ensure the Hector/apps directory exists
    try {
      await SDK.fs.mkdir('~/Hector/apps', { recursive: true });
      console.log("Ensured ~/Hector/apps directory exists");
    } catch (dirError) {
      console.warn("Could not create ~/Hector/apps directory:", dirError);
    }
    
    return true;
  } catch (error) {
    console.error("SDK test failed:", error);
    return false;
  }
}

// Run test on module load
testSDKAccess();

// Export the SDK for use in the application
export default SDK as WebdrawSDK; 