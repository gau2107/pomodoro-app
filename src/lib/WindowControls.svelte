<script>
  import { onMount } from 'svelte';
  import soundManager from './utils/sounds.js';
  
  let appWindow;
  
  // Initialize Tauri window on mount
  onMount(async () => {
    try {
      // Import Window API directly
      const { Window } = await import('@tauri-apps/api/window');
      appWindow = Window.getCurrent();
      console.log("Tauri Window initialized");
    } catch (error) {
      console.error("Failed to initialize Tauri Window:", error);
    }
  });
  
  // Minimize button handler
  async function handleMinimize() {
    console.log("Minimize button clicked");
    // Play click sound
    soundManager.play('click');
    
    try {
      if (appWindow) {
        console.log("Calling window.minimize()");
        await appWindow.minimize();
      } else {
        console.error("Window object not available");
      }
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  }
  
  // Close button handler
  async function handleClose() {
    console.log("Close button clicked");
    // Play click sound
    soundManager.play('click');
    
    try {
      if (appWindow) {
        console.log("Calling window.close()");
        await appWindow.close();
      } else {
        console.error("Window object not available");
      }
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  }
</script>

<div class="window-controls draggable">
  <div class="title">
    <slot>Pomodoro</slot>
  </div>
  <div class="controls no-drag">
    <button 
      class="window-btn minimize-btn" 
      on:click={handleMinimize} 
      title="Minimize" 
      aria-label="Minimize window"
      data-tauri-drag-region="false"
    >
      <svg width="12" height="1" viewBox="0 0 12 1" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="12" height="1" rx="0.5" fill="currentColor"/>
      </svg>
    </button>
    <button 
      class="window-btn close-btn" 
      on:click={handleClose} 
      title="Close" 
      aria-label="Close window"
      data-tauri-drag-region="false"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .window-controls {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 10px;
    user-select: none;
    -webkit-app-region: drag;
    box-sizing: border-box;
  }
  
  .title {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--secondary-text);
  }
  
  .controls {
    display: flex;
    gap: 8px;
  }
  
  .window-btn {
    -webkit-app-region: no-drag;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    color: var(--secondary-text);
    transition: all 0.15s ease;
    background-color: rgba(0, 0, 0, 0.03);
    padding: 0;
    position: relative;
    z-index: 1000;
  }
  
  .minimize-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
    transform: translateY(1px);
  }
  
  .close-btn:hover {
    background-color: #ff3b30;
    color: white;
  }
  
  .window-btn:active {
    transform: scale(0.95);
  }
  
  .no-drag {
    -webkit-app-region: no-drag;
  }
</style>
