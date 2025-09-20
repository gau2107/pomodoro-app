<script>
  import { onMount } from 'svelte';
  import { isTauri, minimizeWindow, closeWindow } from '../tauriApi.js';
  import soundManager from '../utils/sounds.js';

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
        console.log("Space Explorer Window initialized");
      } else {
        console.log("Running in web environment");
      }
    } catch (error) {
      console.error("Failed to initialize Space Explorer Window:", error);
    }
  });

  // Window control functions
  async function minimizeApp() {
    soundManager.play('click');
    await minimizeWindow();
  }

  async function closeApp() {
    soundManager.play('click');
    await closeWindow();
  }

  // Planet interaction state
  let selectedPlanet = null;
  let hoveredPlanet = null;

  // Planet data with slower, more visible orbital speeds
  // Mercury: 30s, others scaled proportionally but capped at 300s max
  const planetData = [
    { name: 'Mercury', color: '#8C7853', size: 16, orbitRadius: 60, speed: 30, description: 'The smallest planet, closest to the Sun.' },
    { name: 'Venus', color: '#FFC649', size: 20, orbitRadius: 90, speed: 76.7, description: 'The hottest planet in our solar system.' },
    { name: 'Earth', color: '#6B93D6', size: 22, orbitRadius: 120, speed: 124.4, description: 'Our home planet, the only one known to harbor life.' },
    { name: 'Mars', color: '#CD5C5C', size: 18, orbitRadius: 150, speed: 234.1, description: 'The Red Planet, with the largest volcano in the solar system.' },
    { name: 'Jupiter', color: '#D8CA9D', size: 32, orbitRadius: 200, speed: 300, description: 'The largest planet, a gas giant with a Great Red Spot.' },
    { name: 'Saturn', color: '#FAD5A5', size: 28, orbitRadius: 250, speed: 300, description: 'Famous for its spectacular ring system.' },
    { name: 'Uranus', color: '#4FD0E7', size: 24, orbitRadius: 300, speed: 300, description: 'An ice giant that rotates on its side.' },
    { name: 'Neptune', color: '#4B70DD', size: 24, orbitRadius: 350, speed: 300, description: 'The windiest planet, with supersonic winds.' },
    { name: 'Pluto', color: '#E5E5E5', size: 14, orbitRadius: 400, speed: 300, description: 'A dwarf planet at the edge of our solar system.' }
  ];

</script>


<main class="space-explorer">
  <!-- Enhanced cosmic background with shooting stars -->
  <div class="cosmic-background">
    {#each Array(8) as _, i}
      <div class="shooting-star" style="animation-delay: {i * 0.7}s; left: {Math.random() * 100}%; top: {Math.random() * 100}%;"></div>
    {/each}
  </div>

  <!-- The Sun at the center -->
  <div class="sun">
    <div class="sun-core"></div>
    <div class="sun-corona"></div>
  </div>

  <!-- Orbital Paths -->
  {#each planetData as planet, i}
    <div class="orbit-path" style="width: {planet.orbitRadius * 2}px; height: {planet.orbitRadius * 2}px;"></div>
  {/each}
  
  <!-- Planets -->
  {#each planetData as planet, i}
    <div
      class="planet planet-{i}"
      style="
        background-color: {planet.color}; 
        width: {planet.size}px; 
        height: {planet.size}px;
      "
    ></div>
  {/each}
</main>

<style>
  .space-explorer {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #000;
  }

  /* Enhanced cosmic background with shooting stars */
  .cosmic-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse at top, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(ellipse at bottom, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
    overflow: hidden;
  }

  .cosmic-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(2px 2px at 20px 30px, #eee, transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 40px, #fff, transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
      radial-gradient(2px 2px at 160px 30px, #fff, transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: twinkle 4s ease-in-out infinite alternate;
  }

  .cosmic-background::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    animation: nebulaMove 20s ease-in-out infinite alternate;
  }

  /* Shooting stars animation */
  .shooting-star {
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    animation: shoot 3s linear infinite;
  }

  .shooting-star::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 20px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.8), transparent);
    transform: rotate(45deg);
    transform-origin: 0 0;
  }

  /* Planet styles */
  .orbit-path {
    position: absolute;
    left: 50%;
    top: 50%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
  }

  .planet {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 10px rgba(255,255,255,0.2);
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: center;
    margin-top: -0.5em;
    margin-left: -0.5em;
    z-index: 10;
  }

  /* Sun styles */
  .sun {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
  }

  .sun-core {
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, #ffeb3b 0%, #ff9800 50%, #ff5722 100%);
    border-radius: 50%;
    box-shadow:
      0 0 20px #ffeb3b,
      0 0 40px #ff9800,
      0 0 60px #ff5722,
      0 0 80px rgba(255, 235, 59, 0.3);
    animation: sunGlow 2s ease-in-out infinite alternate;
  }

  .sun-corona {
    position: absolute;
    top: -20px;
    left: -20px;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(255, 235, 59, 0.2) 0%, rgba(255, 152, 0, 0.1) 50%, transparent 100%);
    border-radius: 50%;
    animation: coronaPulse 3s ease-in-out infinite;
  }

  @keyframes orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Individual planet orbit animations using circular paths */
  /* Define animations for each planet using straightforward circular motion */
  .planet-0 {
    animation: orbit 30s linear infinite;
    animation-name: orbit0;
  }
  
  .planet-1 {
    animation: orbit 76.7s linear infinite;
    animation-name: orbit1;
  }
  
  .planet-2 {
    animation: orbit 124.4s linear infinite;
    animation-name: orbit2;
  }
  
  .planet-3 {
    animation: orbit 234.1s linear infinite;
    animation-name: orbit3;
  }
  
  .planet-4 {
    animation: orbit 300s linear infinite;
    animation-name: orbit4;
  }
  
  .planet-5 {
    animation: orbit 300s linear infinite;
    animation-name: orbit5;
  }
  
  .planet-6 {
    animation: orbit 300s linear infinite;
    animation-name: orbit6;
  }
  
  .planet-7 {
    animation: orbit 300s linear infinite;
    animation-name: orbit7;
  }
  
  .planet-8 {
    animation: orbit 300s linear infinite;
    animation-name: orbit8;
  }
  
  @keyframes orbit0 {
    from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
  }
  
  @keyframes orbit1 {
    from { transform: rotate(40deg) translateX(90px) rotate(-40deg); }
    to { transform: rotate(400deg) translateX(90px) rotate(-400deg); }
  }
  
  @keyframes orbit2 {
    from { transform: rotate(80deg) translateX(120px) rotate(-80deg); }
    to { transform: rotate(440deg) translateX(120px) rotate(-440deg); }
  }
  
  @keyframes orbit3 {
    from { transform: rotate(120deg) translateX(150px) rotate(-120deg); }
    to { transform: rotate(480deg) translateX(150px) rotate(-480deg); }
  }
  
  @keyframes orbit4 {
    from { transform: rotate(160deg) translateX(200px) rotate(-160deg); }
    to { transform: rotate(520deg) translateX(200px) rotate(-520deg); }
  }
  
  @keyframes orbit5 {
    from { transform: rotate(200deg) translateX(250px) rotate(-200deg); }
    to { transform: rotate(560deg) translateX(250px) rotate(-560deg); }
  }
  
  @keyframes orbit6 {
    from { transform: rotate(240deg) translateX(300px) rotate(-240deg); }
    to { transform: rotate(600deg) translateX(300px) rotate(-600deg); }
  }
  
  @keyframes orbit7 {
    from { transform: rotate(280deg) translateX(350px) rotate(-280deg); }
    to { transform: rotate(640deg) translateX(350px) rotate(-640deg); }
  }
  
  @keyframes orbit8 {
    from { transform: rotate(320deg) translateX(400px) rotate(-320deg); }
    to { transform: rotate(680deg) translateX(400px) rotate(-680deg); }
  }

  @keyframes sunGlow {
    0% {
      box-shadow:
        0 0 20px #ffeb3b,
        0 0 40px #ff9800,
        0 0 60px #ff5722,
        0 0 80px rgba(255, 235, 59, 0.3);
    }
    100% {
      box-shadow:
        0 0 30px #ffeb3b,
        0 0 60px #ff9800,
        0 0 90px #ff5722,
        0 0 120px rgba(255, 235, 59, 0.5);
    }
  }

  @keyframes coronaPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.6;
    }
  }

  @keyframes twinkle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes nebulaMove {
    0% { background-position: 60% 30%, 20% 80%; }
    100% { background-position: 80% 40%, 10% 90%; }
  }

  @keyframes shoot {
    0% {
      transform: translateX(-100px) translateY(-100px);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateX(calc(100vw + 100px)) translateY(calc(100vh + 100px));
      opacity: 0;
    }
  }
</style>