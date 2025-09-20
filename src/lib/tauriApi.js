/**
 * Helper functions for Tauri API access
 */
import { Window } from '@tauri-apps/api/window';

// Check if we're running in Tauri
export const isTauri = () => {
  // @ts-ignore - Tauri API
  return typeof window !== 'undefined' && typeof window.__TAURI__ !== 'undefined';
};

// Window management functions
export const minimizeWindow = async () => {
  if (!isTauri()) return false;
  
  try {
    // Get current window and minimize it
    const appWindow = Window.getCurrent();
    console.log("Minimizing window...");
    await appWindow.minimize();
    return true;
  } catch (error) {
    console.error('Failed to minimize window:', error);
    return false;
  }
};

export const closeWindow = async () => {
  if (!isTauri()) return false;
  
  try {
    // Get current window and close it
    const appWindow = Window.getCurrent();
    console.log("Closing window...");
    await appWindow.close();
    return true;
  } catch (error) {
    console.error('Failed to close window:', error);
    return false;
  }
};
