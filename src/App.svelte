<script>
  import { onMount } from 'svelte';
  import PomodoroTimer from './lib/PomodoroTimer.svelte';
  import soundManager from './lib/utils/sounds.js';
  import SpaceRewards from './lib/rewards/SpaceRewards.svelte';
  import { isTauri } from './lib/tauriApi.js';
  import { 
    startSession, 
    completeSession, 
    loadSessionStats,
    sessionStats
  } from './lib/stores/sessionStore.js';
  
  // For Tauri window management
  let appWindow;
  
  // Initialize Tauri window on mount
  onMount(async () => {
    try {
      // Check if we're running in Tauri environment
      if (isTauri()) {
        // Import Window API
        const { Window } = await import('@tauri-apps/api/window');
        appWindow = Window.getCurrent();
        console.log("Tauri Window initialized in App.svelte");
      } else {
        console.log("Running in web environment, Tauri Window API not available");
      }
    } catch (error) {
      console.error("Failed to initialize Tauri Window:", error);
      console.log("Continuing without window controls - this is normal in web environment");
    }
    
    // Request notification permission
    if ("Notification" in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
    // Load existing session stats
    await loadSessionStats();
  });
  
  // Window control functions (removed - using native controls)
  
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
  let currentSessionProgress = 100; // 100% at start, 0% at end
  let currentSession = null; // Track current session for logging
  
  // Get current mode label
  $: modeLabel = currentMode === POMODORO 
    ? 'Focus Time' 
    : 'Break Time';
  
  // Space reward system
  let showSpaceRewards = false;
  
  // Open session logs in a new window
  async function openSessionLogs() {
    soundManager.play('click');
    
    try {
      if (isTauri()) {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        
        // Try to get existing window first
        try {
          const existingWindow = await WebviewWindow.getByLabel('session-logs');
          if (existingWindow) {
            await existingWindow.show();
            await existingWindow.setFocus();
            console.log('Session Logs window shown');
            return;
          }
        } catch (e) {
          console.log('No existing window found, creating new one');
        }
        
        // Create new window
        const webview = new WebviewWindow('session-logs', {
          url: 'session-logs.html',
          title: 'Session Logs',
          fullscreen: true,
          resizable: true,
          center: true,
          decorations: true,
          visible: true
        });
        
        console.log('Session Logs window created');
      } else {
        console.log('Tauri not available, session logs requires desktop app');
        alert('Session logs feature requires the desktop app');
      }
    } catch (error) {
      console.error('Failed to open Session Logs window:', error);
      alert('Failed to open session logs');
    }
  }
  
  // Skip to next timer
  function skipTimer() {
    // Complete current session as incomplete if one is active
    if (currentSession) {
      const timeElapsed = DURATIONS[currentMode] - (timerRef?.timeRemaining || 0);
      completeSession(false, timeElapsed);
      currentSession = null;
    }
    
    if (currentMode === POMODORO) {
      switchMode(SHORT_BREAK);
    } else {
      switchMode(POMODORO);
    }
  }
  
  // Open space explorer in a new window
  async function openSpaceExplorer() {
    soundManager.play('click');
    
    try {
      if (isTauri()) {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        
        // Try to get existing window first
        try {
          const existingWindow = await WebviewWindow.getByLabel('space-explorer');
          if (existingWindow) {
            // If window exists, show, attempt to set fullscreen and focus it
            await existingWindow.show();
            try {
              // some WebviewWindow implementations expose setFullscreen
              await existingWindow.setFullscreen(true);
            } catch (fsErr) {
              // ignore if method isn't available
            }
            await existingWindow.setFocus();
            console.log('Space Explorer window shown');
            return;
          }
        } catch (e) {
          console.log('No existing window found, creating new one');
        }
        
        // Create new window
        const webview = new WebviewWindow('space-explorer', {
          url: `space-explorer.html?progress=${currentSessionProgress}&mode=${currentMode}`,
          title: 'Space Explorer',
          width: 1000,
          height: 700,
          center: true,
          resizable: true,
          decorations: true,
          visible: true,
          fullscreen: true
        });
        
        console.log('Space Explorer window created with URL:', `space-explorer.html?progress=${currentSessionProgress}&mode=${currentMode}`);
        
        // Send initial progress update after window is created
        setTimeout(() => sendProgressUpdateToSpaceExplorer(), 1000);
      } else {
        console.log('Tauri not available, space explorer requires desktop app');
        // Fallback: show inline space rewards
        showSpaceRewards = !showSpaceRewards;
      }
    } catch (error) {
      console.error('Failed to open Space Explorer window:', error);
      // Fallback: show inline space rewards
      showSpaceRewards = !showSpaceRewards;
    }
  }
  
  // Switch between timer modes
  function switchMode(mode) {
    soundManager.play('click');
    
    // Complete current session if one is active
    if (currentSession) {
      const timeElapsed = DURATIONS[currentMode] - timerRef?.timeRemaining || 0;
      completeSession(false, timeElapsed);
      currentSession = null;
    }
    
    currentMode = mode;
    
    // Reset session progress when switching modes
    currentSessionProgress = 100;
    
    // Reset timer when mode changes
    if (timerRef) {
      timerRef.resetTimer();
    }
  }
  
  // Handle timer completion
  async function handleTimerComplete() {
    // Complete current session
    if (currentSession) {
      await completeSession(true);
      currentSession = null;
    }
    
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
    
    // Refresh session stats
    await loadSessionStats();
    
    // Move to next timer
    skipTimer();
  }
  
  // Handle button clicks
  function handleButtonClick() {
    soundManager.play('click');
  }
  
  // Handle timer start
  function handleTimerStart() {
    // Start tracking session
    const sessionType = currentMode === POMODORO ? 'focus' : 
                       currentMode === SHORT_BREAK ? 'short_break' : 'long_break';
    const durationMinutes = DURATIONS[currentMode] / 60;
    
    currentSession = startSession(sessionType, durationMinutes);
    console.log('Started session tracking:', currentSession);
  }
  
  // Handle timer pause
  function handleTimerPause() {
    // Session tracking continues - we'll save actual time on completion
    console.log('Timer paused, session tracking continues');
  }
  
  // Handle timer reset
  function handleTimerReset() {
    // Complete current session as incomplete if one was active
    if (currentSession) {
      const timeElapsed = DURATIONS[currentMode] - (timerRef?.timeRemaining || DURATIONS[currentMode]);
      completeSession(false, timeElapsed);
      currentSession = null;
      console.log('Session reset and saved as incomplete');
    }
  }
  
  // Handle timer progress updates
  function handleTimerProgress(event) {
    const newProgress = event.detail.progress;
    console.log('Main app progress update:', newProgress, 'current mode:', currentMode);
    currentSessionProgress = newProgress;
    
    // Send progress update to Space Explorer window if it's open
    sendProgressUpdateToSpaceExplorer();
  }

  // Send progress update to Space Explorer window
  async function sendProgressUpdateToSpaceExplorer() {
    if (!isTauri()) return;
    
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const spaceExplorerWindow = await WebviewWindow.getByLabel('space-explorer');
      if (spaceExplorerWindow) {
        console.log('Sending progress update to Space Explorer:', currentSessionProgress, currentMode);
        await spaceExplorerWindow.emit('progress-update', { 
          progress: currentSessionProgress, 
          mode: currentMode 
        });
      } else {
        console.log('Space Explorer window not found');
      }
    } catch (error) {
      console.log('Error sending progress update:', error);
    }
  }
  
  // Tauri window controls
  // We'll use the window controls from our component
  // which handles the Tauri API calls internally
</script>

<main>
  <div class="container">
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
      on:complete={handleTimerComplete}
      on:progress={handleTimerProgress}
      on:start={handleTimerStart}
      on:pause={handleTimerPause}
      on:reset={handleTimerReset}>
      
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
      <span>Focus sessions: {$sessionStats.completed_sessions || pomodorosCompleted}</span>
      <span class="time-worked">{Math.floor(($sessionStats.total_focus_time_minutes || pomodorosCompleted * 45) / 60)} hrs {($sessionStats.total_focus_time_minutes || pomodorosCompleted * 45) % 60} mins of focused work</span>
      <div class="action-buttons">
        <button class="rewards-toggle" on:click={openSpaceExplorer}>
          🚀 Space Explorer
        </button>
        <button class="logs-toggle" on:click={openSessionLogs}>
          📊 Session Logs
        </button>
      </div>
    </div>
    
    <!-- Space Explorer Reward System -->
    <SpaceRewards 
      currentSessionProgress={currentSessionProgress} 
      currentMode={currentMode}
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
    -webkit-app-region: drag;
  }
  
  /* Window controls styles (removed - using native controls) */
  
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
  
  .action-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .rewards-toggle,
  .logs-toggle {
    padding: 6px 12px;
    border-radius: 16px;
    background-color: rgba(10, 10, 25, 0.7);
    color: white;
    border: none;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .rewards-toggle:hover,
  .logs-toggle:hover {
    background-color: rgba(20, 20, 50, 0.9);
    transform: translateY(-1px);
  }
  
  .logs-toggle {
    background-color: rgba(25, 25, 45, 0.7);
  }
  
  .logs-toggle:hover {
    background-color: rgba(35, 35, 65, 0.9);
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin: 20px 0;
  }
</style>
