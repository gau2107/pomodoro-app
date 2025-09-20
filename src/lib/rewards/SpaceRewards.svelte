<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import soundManager from '../utils/sounds.js';
  
  // Props: These define how quickly rewards are earned
  export let currentSessionProgress = 100; // 100% at start, 0% at end
  export let currentMode = 'pomodoro'; // 'pomodoro' or 'shortBreak'
  export let showReward = false;
  
  // Event dispatcher for animations
  const dispatch = createEventDispatcher();
  
  // Planet data with visual properties
  const planetData = [
    { name: 'Mercury', color: '#8C7853', size: 16, orbitRadius: 60, speed: 4 },
    { name: 'Venus', color: '#FFC649', size: 20, orbitRadius: 90, speed: 3 },
    { name: 'Earth', color: '#6B93D6', size: 22, orbitRadius: 120, speed: 2 },
    { name: 'Mars', color: '#CD5C5C', size: 18, orbitRadius: 150, speed: 1.6 },
    { name: 'Jupiter', color: '#D8CA9D', size: 32, orbitRadius: 200, speed: 1.2 },
    { name: 'Saturn', color: '#FAD5A5', size: 28, orbitRadius: 250, speed: 1 },
    { name: 'Uranus', color: '#4FD0E7', size: 24, orbitRadius: 300, speed: 0.8 },
    { name: 'Neptune', color: '#4B70DD', size: 24, orbitRadius: 350, speed: 0.6 },
    { name: 'Pluto', color: '#E5E5E5', size: 14, orbitRadius: 400, speed: 0.4 }
  ];
  
  // References for animations
  let spaceContainer;
  let currentPlanet;
  let spaceshipElement;
  
  // Animation states
  let isAnimating = false;
  let animationStage = 'idle'; // 'idle', 'flying', 'discovering', 'celebrating'
  let currentPlanetsDiscovered = 0;
  let lastDiscoveryProgress = 0;
  
  // Watch for prop changes - calculate planets based on current session progress
  $: if (currentSessionProgress !== undefined && currentMode === 'pomodoro' && !showReward) {
    updateCurrentSessionRewards(currentSessionProgress);
  }
  
  // Show all planets when Space Explorer is opened
  $: if (showReward) {
    currentPlanetsDiscovered = 9;
  } else {
    // Reset to actual progress when hidden
    if (currentMode === 'pomodoro') {
      updateCurrentSessionRewards(currentSessionProgress);
    } else {
      currentPlanetsDiscovered = 0;
    }
  }
  
  // Update rewards based on current session progress (only for focus sessions)
  function updateCurrentSessionRewards(progressPercent) {
    if (currentMode !== 'pomodoro') {
      currentPlanetsDiscovered = 0;
      return;
    }
    
    // For a 45-minute session, divide into 9 planets (every 11.11% progress = every 5 minutes)
    const planetsForSession = 9;
    const progressPerPlanet = 100 / planetsForSession;
    
    // Calculate how many planets should be discovered based on progress
    const timeElapsedPercent = 100 - progressPercent; // Invert because progress goes from 100 to 0
    const planetsDiscovered = Math.floor(timeElapsedPercent / progressPerPlanet);
    
    // Check if we just discovered a new planet
    if (planetsDiscovered > currentPlanetsDiscovered && planetsDiscovered > 0) {
      // We discovered a new planet!
      currentPlanetsDiscovered = planetsDiscovered;
      
      // Trigger discovery animation if showing rewards
      if (showReward && !isAnimating) {
        setTimeout(() => triggerDiscoveryAnimation(), 500);
      }
    } else if (planetsDiscovered < currentPlanetsDiscovered) {
      // Session reset - reset planets
      currentPlanetsDiscovered = planetsDiscovered;
    }
  }
  
  // Trigger the planet discovery animation
  function triggerDiscoveryAnimation() {
    if (isAnimating) return;
    
    isAnimating = true;
    animationStage = 'flying';
    
    // Play discovery sound
    soundManager.play('discovery');
    
    // After animations complete, reset state
    setTimeout(() => {
      animationStage = 'discovering';
      
      setTimeout(() => {
        animationStage = 'celebrating';
        
        setTimeout(() => {
          animationStage = 'idle';
          isAnimating = false;
          
          // Notify parent component
          dispatch('discoveryComplete');
        }, 2000);
      }, 1500);
    }, 2000);
  }
  
  // Generate a unique planet for each discovery
  function getPlanetStyle(index) {
    // Create a deterministic but varied set of planets
    const hue = (index * 137.5) % 360;
    const size = 30 + (index % 5) * 10;
    const hasMoons = index % 3 === 0;
    const hasRings = index % 4 === 1;
    
    return {
      color: `hsl(${hue}, 70%, 60%)`,
      size: `${size}px`,
      hasMoons,
      hasRings,
      orbitDistance: 50 + (index * 20)
    };
  }
</script>

<div class="space-rewards {showReward ? 'expanded' : 'collapsed'}" class:animating={isAnimating}>
  {#if showReward}
    <div class="cosmos-container" bind:this={spaceContainer}>
      <!-- Sun at the center -->
      <div class="sun"></div>
      
      <!-- Orbits and Planets -->
      {#each Array(currentPlanetsDiscovered) as _, i}
        {@const planet = planetData[i]}
        
        <div 
          class="orbit" 
          style="width: {planet.orbitRadius * 2}px; height: {planet.orbitRadius * 2}px;">
          
          <div 
            class="planet" 
            style="
              background-color: {planet.color}; 
              width: {planet.size}px; 
              height: {planet.size}px;
              animation-delay: {-i * 5}s;
              --orbit-speed: {planet.speed}s;
              --orbit-radius: {planet.orbitRadius}px;"
          >
            <span class="planet-name">{planet.name}</span>
            
            {#if planet.name === 'Saturn'}
              <div class="rings"></div>
            {/if}
          </div>
        </div>
      {/each}
      
      <!-- Spaceship animates during discovery -->
      <div 
        class="spaceship" 
        class:flying={animationStage === 'flying'} 
        class:discovering={animationStage === 'discovering'}
        class:celebrating={animationStage === 'celebrating'}
        bind:this={spaceshipElement}>
        <svg viewBox="0 0 64 64" width="40" height="40">
          <path d="M32,8 L40,32 L24,32 Z" fill="#e0e0e0" />
          <path d="M24,32 L32,56 L40,32 Z" fill="#c0c0c0" />
          <path d="M40,32 L56,32 L40,40 Z" fill="#a0a0a0" />
          <path d="M24,32 L8,32 L24,40 Z" fill="#a0a0a0" />
          <circle cx="32" cy="32" r="6" fill="#3090ff" />
        </svg>
      </div>
      
      <!-- Progress indicator for current session -->
      <div class="discovery-progress">
        <div class="label">Session Progress</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {100 - currentSessionProgress}%"></div>
        </div>
        <div class="progress-text">{Math.floor(100 - currentSessionProgress)}%</div>
      </div>
      
      <!-- Stats display -->
      <div class="stats">
        <div class="stat">
          <span class="value">{currentPlanetsDiscovered}</span>
          <span class="label">Planets This Session</span>
        </div>
        <div class="stat">
          <span class="value">{Math.floor((100 - currentSessionProgress) / (100/9)) + 1}</span>
          <span class="label">Next Planet In</span>
        </div>
      </div>
    </div>
  {:else}
    <!-- Collapsed view shows just a small indicator -->
    <div class="collapsed-indicator">
      <div class="planet-icon"></div>
      <div class="planet-count">{currentPlanetsDiscovered}</div>
    </div>
  {/if}
</div>

<style>
  .space-rewards {
    position: relative;
    transition: all 0.5s ease;
  }
  
  .expanded {
    height: 500px;
    margin: 20px 0;
  }
  
  .collapsed {
    height: 40px;
    overflow: hidden;
  }
  
  .cosmos-container {
    position: relative;
    width: 100vw;
    height: 100%;
    background-color: rgba(10, 10, 25, 0.9);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .sun {
    position: absolute;
    width: 30px;
    height: 30px;
    background: radial-gradient(circle, #ffef9e 0%, #ffcc33 50%, #ff9900 100%);
    border-radius: 50%;
    box-shadow: 0 0 20px #ffcc33, 0 0 30px #ff9900;
    z-index: 2;
  }
  
  .orbit {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .planet {
    position: absolute;
    border-radius: 50%;
    transform-origin: 50% 50%;
    animation: orbit var(--orbit-speed) linear infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .planet-name {
    font-size: 10px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
  }
  
  .rings {
    position: absolute;
    width: calc(100% * 1.8);
    height: 4px;
    background: rgba(250, 213, 165, 0.6);
    border-radius: 2px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .spaceship {
    position: absolute;
    z-index: 10;
    transition: transform 2s cubic-bezier(0.2, 0.8, 0.2, 1);
    opacity: 0;
  }
  
  .spaceship.flying {
    animation: flyIn 2s forwards;
    opacity: 1;
  }
  
  .spaceship.discovering {
    animation: scan 1.5s forwards;
    opacity: 1;
  }
  
  .spaceship.celebrating {
    animation: celebrate 2s forwards;
    opacity: 1;
  }
  
  .discovery-progress {
    position: absolute;
    bottom: 20px;
    left: 20px;
    width: calc(100% - 40px);
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.5s ease;
  }
  
  .progress-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    align-self: flex-end;
  }
  
  .stats {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .stat .value {
    font-size: 18px;
    font-weight: bold;
    color: #fff;
  }
  
  .stat .label {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .collapsed-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 20px;
    background-color: rgba(10, 10, 25, 0.7);
    cursor: pointer;
  }
  
  .planet-icon {
    width: 14px;
    height: 14px;
    background-color: #4CAF50;
    border-radius: 50%;
  }
  
  .planet-count {
    font-size: 12px;
    font-weight: bold;
    color: white;
  }
  
  /* Animations */
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
    to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
  }
  
  @keyframes flyIn {
    0% { transform: translate(200px, 100px) rotate(-30deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  
  @keyframes scan {
    0% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(60px, -30px) rotate(15deg); }
    100% { transform: translate(-60px, 30px) rotate(-15deg); }
  }
  
  @keyframes celebrate {
    0% { transform: translate(-60px, 30px) rotate(-15deg); }
    25% { transform: translate(30px, -50px) rotate(30deg); }
    50% { transform: translate(-30px, -60px) rotate(-45deg); }
    75% { transform: translate(60px, 20px) rotate(15deg); }
    100% { transform: translate(200px, -100px) rotate(45deg); opacity: 0; }
  }
</style>
