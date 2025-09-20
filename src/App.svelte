<script>
  import { onMount } from 'svelte';
  import PomodoroTimer from './lib/PomodoroTimer.svelte';
  import soundManager from './lib/utils/sounds.js';
  import SpaceRewards from './lib/rewards/SpaceRewards.svelte';
  
  // For Tauri window management
  let appWindow;
  
  // Initialize Tauri window on mount
  onMount(async () => {
    try {
      // Import Window API
      const { Window } = await import('@tauri-apps/api/window');
      appWindow = Window.getCurrent();
      console.log("Tauri Window initialized in App.svelte");
    } catch (error) {
      console.error("Failed to initialize Tauri Window:", error);
    }
  });
  
  // Window control functions
  async function minimizeApp() {
    console.log("Minimize button clicked in App.svelte");
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
  
  async function closeApp() {
    console.log("Close button clicked in App.svelte");
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
  
  // Timer modes
  const POMODORO = 'pomodoro';
  const SHORT_BREAK = 'shortBreak';
  
  // Timer durations in seconds
  const DURATIONS = {
    [POMODORO]: 45 * 60,      // 45 minutes
    [SHORT_BREAK]: 15 * 60    // 15 minutes
  };
  
  // Current mode and timer state
  let currentMode = POMODORO;
  let pomodorosCompleted = 0;
  let timerRef;
  
  // Get current mode label
  $: modeLabel = currentMode === POMODORO 
    ? 'Focus Time' 
    : 'Break Time';
  
  // Space reward system
  let showSpaceRewards = false;
  
  // Skip to next timer
  function skipTimer() {
    if (currentMode === POMODORO) {
      switchMode(SHORT_BREAK);
    } else {
      switchMode(POMODORO);
    }
  }
  
  // Toggle space rewards view
  function toggleSpaceRewards() {
    showSpaceRewards = !showSpaceRewards;
    soundManager.play('click');
  }
  
  // Switch between timer modes
  function switchMode(mode) {
    soundManager.play('click');
    currentMode = mode;
    
    // Reset timer when mode changes
    if (timerRef) {
      timerRef.resetTimer();
    }
  }
  
  // Handle timer completion
  function handleTimerComplete() {
    // Increment pomodoro count if a focus session was completed
    if (currentMode === POMODORO) {
      pomodorosCompleted++;
      
      // Check if we should show space rewards
      // Every 3rd completed session will discover a new planet
      if (pomodorosCompleted % 3 === 0) {
        // Auto-show rewards on discovery
        showSpaceRewards = true;
      }
    }
    
    // Show notification
    if (Notification.permission === 'granted') {
      const title = currentMode === POMODORO 
        ? '45 minutes completed! Time for a break.' 
        : '15-minute break is over. Back to focus!';
      
      // Add reward info to notification
      const rewardMsg = pomodorosCompleted % 3 === 0 
        ? ' A new planet has been discovered!' 
        : ` ${3 - (pomodorosCompleted % 3)} more sessions until new discovery.`;
      
      new Notification(title, {
        body: currentMode === POMODORO 
          ? `Time for your 15-minute break.${pomodorosCompleted > 0 ? rewardMsg : ''}` 
          : 'Ready to start another 45-minute focus session?',
        icon: '/pomodoro-icon.svg',
        silent: true
      });
    }
    
    // Move to next timer
    skipTimer();
  }
  
  // Handle button clicks
  function handleButtonClick() {
    soundManager.play('click');
  }
  
  // Tauri window controls
  // We'll use the window controls from our component
  // which handles the Tauri API calls internally
  
  // Request notification permission on mount
  onMount(() => {
    if ("Notification" in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  });
</script>

<main>
  <div class="container">
    <div class="window-controls">
      <div class="title">Pomodoro Timer</div>
      <div class="control-buttons">
        <button class="window-btn minimize-btn" on:click={minimizeApp} title="Minimize" aria-label="Minimize window">
          <svg width="12" height="1" viewBox="0 0 12 1" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="12" height="1" rx="0.5" fill="currentColor"/>
          </svg>
        </button>
        <button class="window-btn close-btn" on:click={closeApp} title="Close" aria-label="Close window">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="mode-selector">
      <button 
        class="mode-btn {currentMode === POMODORO ? 'active' : ''}" 
        on:click={() => { switchMode(POMODORO); handleButtonClick(); }}>
        Focus (45m)
      </button>
      <button 
        class="mode-btn {currentMode === SHORT_BREAK ? 'active' : ''}" 
        on:click={() => { switchMode(SHORT_BREAK); handleButtonClick(); }}>
        Break (15m)
      </button>
    </div>
    
    <PomodoroTimer
      bind:this={timerRef}
      duration={DURATIONS[currentMode]}
      label={modeLabel}
      on:complete={handleTimerComplete}>
      
      <div class="controls">
        {#if timerRef?.isRunning}
          <button class="primary-btn" on:click={() => { 
            timerRef.pauseTimer(); 
            handleButtonClick(); 
          }}>
            Pause
          </button>
        {:else}
          <button class="primary-btn" on:click={() => { 
            timerRef?.startTimer(); 
            handleButtonClick(); 
          }}>
            Start
          </button>
        {/if}
        
        <button class="secondary-btn" on:click={() => { 
          timerRef?.resetTimer(); 
          handleButtonClick(); 
        }}>
          Reset
        </button>
        
        <button class="secondary-btn" on:click={() => { 
          skipTimer(); 
          handleButtonClick(); 
        }}>
          Skip
        </button>
      </div>
    </PomodoroTimer>
    
    <div class="settings">
      <span>Focus sessions: {pomodorosCompleted}</span>
      <span class="time-worked">{Math.floor(pomodorosCompleted * 45 / 60)} hrs {pomodorosCompleted * 45 % 60} mins of focused work</span>
      <button class="rewards-toggle" on:click={toggleSpaceRewards}>
        {showSpaceRewards ? 'Hide' : 'Show'} Space Explorer
      </button>
    </div>
    
    <!-- Space Explorer Reward System -->
    <SpaceRewards 
      focusSessionsCompleted={pomodorosCompleted} 
      showReward={showSpaceRewards}
      on:discoveryComplete={() => soundManager.play('timerEnd')} 
    />
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  /* Window controls styles */
  .window-controls {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    user-select: none;
    -webkit-app-region: drag;
    box-sizing: border-box;
  }
  
  .title {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--secondary-text);
  }
  
  .control-buttons {
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
  
  .mode-selector {
    margin: 15px 0;
  }
  
  .settings {
    margin-top: 15px;
    font-size: 0.9rem;
    color: var(--secondary-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  
  .rewards-toggle {
    margin-top: 12px;
    padding: 6px 12px;
    border-radius: 16px;
    background-color: rgba(10, 10, 25, 0.7);
    color: white;
    border: none;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .rewards-toggle:hover {
    background-color: rgba(20, 20, 50, 0.9);
    transform: translateY(-1px);
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 20px 0;
  }
</style>
