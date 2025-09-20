<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { spaceRewards } from './spaceRewardsStore.js';
  import soundManager from '../utils/sounds.js';
  
  // Props: These define how quickly rewards are earned
  export let focusSessionsCompleted = 0;
  export let showReward = false;
  
  // Event dispatcher for animations
  const dispatch = createEventDispatcher();
  
  // References for animations
  let spaceContainer;
  let currentPlanet;
  let spaceshipElement;
  
  // Animation states
  let isAnimating = false;
  let animationStage = 'idle'; // 'idle', 'flying', 'discovering', 'celebrating'
  
  // Watch for prop changes
  $: if (focusSessionsCompleted > 0) {
    updateRewards(focusSessionsCompleted);
  }
  
  // Update the rewards based on completed sessions
  function updateRewards(sessionsCount) {
    // Update the store
    spaceRewards.update(rewards => {
      // Calculate new discoveries
      const newPlanetsToDiscover = Math.floor(sessionsCount / 3) - Math.floor(rewards.sessionsCompleted / 3);
      
      // Calculate progress towards next discovery (0-100%)
      const nextDiscoveryProgress = ((sessionsCount % 3) / 3) * 100;
      
      // If there's a new discovery and we're showing rewards, trigger animation
      if (newPlanetsToDiscover > 0 && showReward && !isAnimating) {
        setTimeout(() => triggerDiscoveryAnimation(), 500);
      }
      
      // Update the store
      return {
        ...rewards,
        sessionsCompleted: sessionsCount,
        planetsDiscovered: rewards.planetsDiscovered + (newPlanetsToDiscover > 0 ? newPlanetsToDiscover : 0),
        nextDiscoveryProgress: nextDiscoveryProgress,
        hasNewDiscovery: newPlanetsToDiscover > 0
      };
    });
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
          
          // Clear the new discovery flag
          spaceRewards.update(r => ({...r, hasNewDiscovery: false}));
          
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
      {#each Array($spaceRewards.planetsDiscovered) as _, i}
        {@const planetStyle = getPlanetStyle(i)}
        
        <div 
          class="orbit" 
          style="width: {planetStyle.orbitDistance * 2}px; height: {planetStyle.orbitDistance * 2}px;">
          
          <div 
            class="planet" 
            style="
              background-color: {planetStyle.color}; 
              width: {planetStyle.size}; 
              height: {planetStyle.size};
              animation-delay: {-i * 5}s;"
            class:has-rings={planetStyle.hasRings}
            class:has-moons={planetStyle.hasMoons}>
            
            {#if planetStyle.hasRings}
              <div class="rings"></div>
            {/if}
            
            {#if planetStyle.hasMoons}
              <div class="moon moon-1"></div>
              <div class="moon moon-2"></div>
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
      
      <!-- Progress indicator for next discovery -->
      <div class="discovery-progress">
        <div class="label">Next discovery</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {$spaceRewards.nextDiscoveryProgress}%"></div>
        </div>
        <div class="progress-text">{Math.floor($spaceRewards.nextDiscoveryProgress)}%</div>
      </div>
      
      <!-- Stats display -->
      <div class="stats">
        <div class="stat">
          <span class="value">{$spaceRewards.planetsDiscovered}</span>
          <span class="label">Planets Discovered</span>
        </div>
        <div class="stat">
          <span class="value">{$spaceRewards.sessionsCompleted}</span>
          <span class="label">Focus Sessions</span>
        </div>
      </div>
    </div>
  {:else}
    <!-- Collapsed view shows just a small indicator -->
    <div class="collapsed-indicator">
      <div class="planet-icon"></div>
      <div class="planet-count">{$spaceRewards.planetsDiscovered}</div>
    </div>
  {/if}
</div>

<style>
  .space-rewards {
    position: relative;
    transition: all 0.5s ease;
  }
  
  .expanded {
    height: 300px;
    margin: 20px 0;
  }
  
  .collapsed {
    height: 40px;
    overflow: hidden;
  }
  
  .cosmos-container {
    position: relative;
    width: 100%;
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
    animation: orbit 20s linear infinite;
  }
  
  .planet.has-rings {
    position: relative;
  }
  
  .planet.has-rings .rings {
    position: absolute;
    width: 160%;
    height: 40%;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    top: 30%;
    left: -30%;
    transform: rotateX(75deg);
  }
  
  .planet.has-moons {
    position: relative;
  }
  
  .planet .moon {
    position: absolute;
    width: 30%;
    height: 30%;
    background-color: rgba(200, 200, 200, 0.8);
    border-radius: 50%;
    animation: moonOrbit 10s linear infinite;
  }
  
  .moon-1 {
    animation-delay: -2s;
  }
  
  .moon-2 {
    width: 20%;
    height: 20%;
    animation-duration: 7s;
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
    from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
  }
  
  @keyframes moonOrbit {
    0% { transform: rotate(0deg) translate(150%) rotate(0deg); }
    100% { transform: rotate(360deg) translate(150%) rotate(-360deg); }
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
