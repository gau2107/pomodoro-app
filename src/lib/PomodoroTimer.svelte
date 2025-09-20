<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import soundManager from './utils/sounds.js';
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Props with defaults
  export let duration = 25 * 60; // Default: 25 minutes in seconds
  export let label = "Focus Time";
  export let autoStart = false;
  
  // Internal state
  let timeRemaining = duration;
  let isRunning = false;
  let intervalId;
  let progressPercent = 100;
  let startTime = 0; // Track when timer started
  let pausedTime = 0; // Track total paused time
  
  // Format time as MM:SS
  export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Start the timer
  export function startTimer() {
    if (!isRunning) {
      isRunning = true;
      startTime = performance.now() - (pausedTime * 1000); // Account for previously paused time
      
      intervalId = setInterval(() => {
        if (isRunning) {
          const elapsed = (performance.now() - startTime) / 1000; // Convert to seconds
          const remaining = Math.max(0, duration - elapsed);
          
          if (remaining > 0) {
            timeRemaining = Math.ceil(remaining);
            updateProgress();
          } else {
            timeRemaining = 0;
            completeTimer();
          }
        }
      }, 100); // Check more frequently for accuracy
      
      // Dispatch event
      dispatch('start');
    }
  }
  
  // Update progress bar
  function updateProgress() {
    progressPercent = (timeRemaining / duration) * 100;
    
    // Dispatch progress event
    dispatch('progress', { progress: progressPercent });
  }
  
  // Pause the timer
  export function pauseTimer() {
    if (isRunning) {
      isRunning = false;
      // Track how much time has elapsed when pausing
      pausedTime = (performance.now() - startTime) / 1000;
      clearInterval(intervalId);
      
      // Dispatch event
      dispatch('pause');
    }
  }
  
  // Reset the timer
  export function resetTimer() {
    pauseTimer();
    timeRemaining = duration;
    updateProgress();
    
    // Reset tracking variables
    startTime = 0;
    pausedTime = 0;
    
    // Dispatch event
    dispatch('reset');
  }
  
  // Complete the timer
  function completeTimer() {
    pauseTimer();
    
    // Play sound
    soundManager.play('timerEnd');
    
    // Dispatch complete event
    dispatch('complete');
  }
  
  // React to changes in duration prop
  $: if (duration && !isRunning) {
    timeRemaining = duration;
    updateProgress();
    // Reset tracking variables when duration changes
    startTime = 0;
    pausedTime = 0;
  }
  
  // Auto-start if requested
  onMount(() => {
    if (autoStart) {
      startTimer();
    }
  });
  
  // Clean up on component destroy
  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
</script>

<div class="timer-component">
  <div class="timer-label">{label}</div>
  
  <div class="timer-display">
    {formatTime(timeRemaining)}
  </div>
  
  <div class="progress-bar">
    <div class="progress" style="width: {progressPercent}%"></div>
  </div>
  
  <slot></slot>
</div>
