<script>
  import { onMount } from 'svelte';
  import { isTauri, minimizeWindow, closeWindow } from '../tauriApi.js';
  import soundManager from '../utils/sounds.js';

  // For Tauri window management
  let appWindow;

  // Planet discovery state
  let currentPlanetsDiscovered = 0;
  let currentSessionProgress = 100;
  let currentMode = 'pomodoro';

  // Initialize Tauri window on mount
  onMount(async () => {
    try {
      // Check if we're running in Tauri environment
      if (isTauri()) {
        // Import Window API
        const { Window } = await import('@tauri-apps/api/window');
        appWindow = Window.getCurrent();
        console.log("Space Explorer Window initialized");
        
        // Listen for progress updates from main window
        appWindow.listen('progress-update', (event) => {
          const { progress, mode } = event.payload;
          console.log('Space Explorer received progress update:', progress, 'mode:', mode);
          currentSessionProgress = progress;
          currentMode = mode;
          updateDiscoveredPlanets(progress);
        });
      } else {
        console.log("Running in web environment");
      }
    } catch (error) {
      console.error("Failed to initialize Space Explorer Window:", error);
    }

    // Read URL parameters for initial progress and mode
    const urlParams = new URLSearchParams(window.location.search);
    currentSessionProgress = parseFloat(urlParams.get('progress')) || 100;
    currentMode = urlParams.get('mode') || 'pomodoro';
    
    console.log('Space Explorer URL params - progress:', urlParams.get('progress'), 'mode:', urlParams.get('mode'));
    console.log('Space Explorer initialized with progress:', currentSessionProgress, 'mode:', currentMode);
    
    // Calculate discovered planets based on initial progress
    updateDiscoveredPlanets(currentSessionProgress);
  });

  // Calculate how many planets should be discovered based on progress
  function updateDiscoveredPlanets(progressPercent) {
    console.log('updateDiscoveredPlanets called with:', progressPercent, 'currentMode:', currentMode);
    
    if (currentMode !== 'pomodoro') {
      currentPlanetsDiscovered = 0;
      console.log('Not in pomodoro mode, setting planets to 0');
      return;
    }
    
    // For a 45-minute session, divide into 9 planets (every 11.11% progress = every 5 minutes)
    const planetsForSession = 9;
    const progressPerPlanet = 100 / planetsForSession;
    
    // Calculate how many planets should be discovered based on progress
    const timeElapsedPercent = 100 - progressPercent; // Invert because progress goes from 100 to 0
    const planetsDiscovered = Math.floor(timeElapsedPercent / progressPerPlanet);
    
    console.log('Calculation details:');
    console.log('- progressPercent:', progressPercent);
    console.log('- timeElapsedPercent:', timeElapsedPercent);
    console.log('- progressPerPlanet:', progressPerPlanet);
    console.log('- planetsDiscovered:', planetsDiscovered);
    
    currentPlanetsDiscovered = planetsDiscovered;
    console.log('Set currentPlanetsDiscovered to:', planetsDiscovered);
  }

  // Reactive statement to update planets when mode changes
  $: if (currentMode !== 'pomodoro') {
    currentPlanetsDiscovered = 0;
  }

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

  // Planet data with actual relative orbital speeds and richer details
  // Speeds are proportional to orbital periods (scaled in CSS for visibility)
  const planetData = [
    { 
      name: 'Mercury', color: '#8C7853', size: 20, orbitRadius: 7, speed: 88,
      diameterKm: 4879, distanceAu: 0.39, dayHours: 1407.6, moons: 0,
      description: 'The smallest planet, closest to the Sun.',
      facts: [
        'A year on Mercury is just 88 Earth days.',
        'Mercury has no atmosphere to retain heat.'
      ]
    },
    { 
      name: 'Venus', color: '#FFC649', size: 24, orbitRadius: 11, speed: 225,
      diameterKm: 12104, distanceAu: 0.72, dayHours: 5832, moons: 0,
      description: 'Shrouded in thick clouds and scorching temperatures.',
      facts: [
        'Venus spins backward (retrograde rotation).',
        'It is the hottest planet in the solar system.'
      ]
    },
    { 
      name: 'Earth', color: '#6B93D6', size: 26, orbitRadius: 15, speed: 365,
      diameterKm: 12742, distanceAu: 1.0, dayHours: 24, moons: 1,
      description: 'Our home world—so far the only known planet with life.',
      facts: [
        '70% of Earth’s surface is covered by water.',
        'Earth’s atmosphere protects life from meteors and radiation.'
      ]
    },
    { 
      name: 'Mars', color: '#CD5C5C', size: 22, orbitRadius: 18, speed: 687,
      diameterKm: 6779, distanceAu: 1.52, dayHours: 24.6, moons: 2,
      description: 'The Red Planet, home to the largest volcano, Olympus Mons.',
      facts: [
        'Mars has seasons like Earth due to its tilt.',
        'Dust storms can engulf the entire planet.'
      ]
    },
    { 
      name: 'Jupiter', color: '#D8CA9D', size: 38, orbitRadius: 25, speed: 4333,
      diameterKm: 139820, distanceAu: 5.2, dayHours: 9.9, moons: 95,
      description: 'A gas giant with a centuries-old storm—the Great Red Spot.',
      facts: [
        'Jupiter is more than twice as massive as all other planets combined.',
        'It has faint rings and a very strong magnetic field.'
      ]
    },
    { 
      name: 'Saturn', color: '#FAD5A5', size: 34, orbitRadius: 30, speed: 10759,
      diameterKm: 116460, distanceAu: 9.58, dayHours: 10.7, moons: 83,
      description: 'Famous for its elegant ring system of ice and rock.',
      facts: [
        'Saturn could float in water due to its low density.',
        'Its rings are mostly water ice with rocky debris.'
      ]
    },
    { 
      name: 'Uranus', color: '#4FD0E7', size: 30, orbitRadius: 36, speed: 30687,
      diameterKm: 50724, distanceAu: 19.2, dayHours: 17.2, moons: 27,
      description: 'An ice giant tipped on its side, leading to extreme seasons.',
      facts: [
        'Uranus rotates on its side at ~98° tilt.',
        'Its atmosphere contains methane, giving a cyan color.'
      ]
    },
    { 
      name: 'Neptune', color: '#4B70DD', size: 30, orbitRadius: 42, speed: 60190,
      diameterKm: 49244, distanceAu: 30.05, dayHours: 16.1, moons: 14,
      description: 'Deep blue ice giant with the fastest winds in the solar system.',
      facts: [
        'Neptune’s winds can exceed 2,000 km/h.',
        'It was discovered via mathematical prediction.'
      ]
    },
    { 
      name: 'Pluto', color: '#E5E5E5', size: 18, orbitRadius: 48, speed: 90560,
      diameterKm: 2376, distanceAu: 39.48, dayHours: 153.3, moons: 5,
      description: 'A dwarf planet in the Kuiper Belt with a heart-shaped plain.',
      facts: [
        'Pluto’s largest moon Charon is half its size.',
        'A day on Pluto lasts about 6.4 Earth days.'
      ]
    }
  ];

</script>


<main class="space-explorer">
  <!-- Enhanced cosmic background with shooting stars -->
  <div class="cosmic-background">
    <!-- layered starfields for parallax -->
    <div class="star-layer star-layer-1" aria-hidden="true">
      {#each Array(60) as _, s}
        <span class="star s1 s-{s}" style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; --size: {Math.random() * 2 + 0.6}px; --delay: {Math.random() * 6}s; --blink: {Math.random()};"></span>
      {/each}
    </div>
    <div class="star-layer star-layer-2" aria-hidden="true">
      {#each Array(40) as _, s}
        <span class="star s2 s-{s}" style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; --size: {Math.random() * 3 + 1}px; --delay: {Math.random() * 8}s; --blink: {Math.random()};"></span>
      {/each}
    </div>
    <div class="star-layer star-layer-3" aria-hidden="true">
      {#each Array(20) as _, s}
        <span class="star s3 s-{s}" style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; --size: {Math.random() * 5 + 2}px; --delay: {Math.random() * 10}s; --blink: {Math.random()};"></span>
      {/each}
    </div>

    {#each Array(6) as _, i}
      <div class="shooting-star" style="animation-delay: {i * 0.7}s; left: {Math.random() * 100}%; top: {Math.random() * 100}%;"></div>
    {/each}

    <!-- aurora ribbon and subtle lens flare -->
    <div class="aurora" aria-hidden="true"></div>
    <div class="lens-flare" aria-hidden="true"></div>

    <div class="noise" aria-hidden="true"></div>
    <!-- animated gradient overlay for subtle shifting colors -->
    <div class="animated-gradient" aria-hidden="true"></div>
  </div>

  <!-- The Sun at the center -->
  <div class="sun">
    <div class="sun-core"></div>
    <div class="sun-corona"></div>
  </div>

  <!-- Orbital Paths - only show for discovered planets -->
  {#each Array(currentPlanetsDiscovered) as _, i}
    {@const planet = planetData[i]}
    <div class="orbit-path" style="width: {planet.orbitRadius * 2}vh; height: {planet.orbitRadius * 2}vh;"></div>
  {/each}

  <!-- Planets - only show discovered planets -->
  {#each Array(currentPlanetsDiscovered) as _, i}
    {@const planet = planetData[i]}
    <div
      class={`planet planet-${i} planet-${planet.name.toLowerCase()}`}
      style="
        --size: {planet.size}px;
        --planet-color: {planet.color};
        width: {planet.size}px; 
        height: {planet.size}px;
      "
    >
      <div class="planet-tooltip">
        <div class="planet-name">{planet.name}</div>
        <div class="planet-desc">{planet.description}</div>
        <div class="planet-stats">
          <div><strong>Diameter:</strong> {planet.diameterKm.toLocaleString()} km</div>
          <div><strong>Distance:</strong> {planet.distanceAu} AU</div>
          <div><strong>Day length:</strong> {planet.dayHours} hrs</div>
          <div><strong>Moons:</strong> {planet.moons}</div>
        </div>
        <div class="planet-fact">Fun fact: {planet.facts[0]}</div>
      </div>
    </div>
  {/each}
  
  <!-- Info tooltip -->
  <div class="info-tooltip">
    <div class="info-icon">i</div>
    <div class="tooltip-content">
      <h3>Space Explorer</h3>
      <p>Watch planets orbit the sun in their actual relative speeds!</p>
      <p>Complete 3 focus sessions to discover new planets in your solar system.</p>
      <p>Hover over planets to learn more about them.</p>
    </div>
  </div>
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
  
  /* Info tooltip styles */
  .info-tooltip {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
  }
  
  .info-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: italic;
    font-family: serif;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .info-icon:hover {
    background: rgba(255, 255, 255, 0.4);
  }
  
  .info-icon:hover + .tooltip-content {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .tooltip-content {
    position: absolute;
    top: 40px;
    right: 0;
    width: 300px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 15px;
    color: white;
    font-size: 14px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }
  
  .tooltip-content h3 {
    margin-top: 0;
    color: #6B93D6;
    font-size: 16px;
    margin-bottom: 10px;
  }
  
  .tooltip-content p {
    margin: 8px 0;
    line-height: 1.4;
  }

  /* Enhanced cosmic background with dramatic nebulas, layered starfields and cinematic effects */
  .cosmic-background {
    position: absolute;
    inset: 0;
    overflow: hidden;
    /* Base deep space grade */
    background:
      linear-gradient(180deg, #05060a 0%, #081028 30%, #0b1630 60%, #071224 100%);
    z-index: 0;
  }

  /* Distant static star layer + subtle parallax drift */
  .cosmic-background::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 10px 20px, rgba(255,255,255,0.85), transparent),
      radial-gradient(1px 1px at 40px 60px, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 80px 140px, rgba(255,255,255,0.5), transparent);
    background-repeat: repeat;
    background-size: 600px 600px, 400px 400px, 1200px 1200px;
    opacity: 0.85;
    filter: contrast(115%) saturate(110%);
    animation: starDrift 80s linear infinite;
    mix-blend-mode: screen;
    z-index: 1;
    pointer-events: none;
  }

  /* Secondary star layers for depth */
  .star-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-repeat: repeat;
    mix-blend-mode: screen;
  }

  .star-layer-1 {
    background-image: radial-gradient(circle, rgba(255,255,255,0.9) 0.8px, transparent 1px);
    background-size: 500px 500px;
    opacity: 0.95;
    filter: blur(0.6px) contrast(120%);
    z-index: 2;
    transform: translateZ(0);
    animation: starDriftSlow 140s linear infinite;
  }

  .star-layer-2 {
    background-image: radial-gradient(circle, rgba(255,240,220,0.75) 0.9px, transparent 1px);
    background-size: 300px 300px;
    opacity: 0.65;
    filter: blur(1.2px) contrast(105%);
    z-index: 3;
    animation: starDrift 100s linear infinite reverse;
  }

  .star-layer-3 {
    background-image: radial-gradient(circle, rgba(200,220,255,0.6) 1px, transparent 1.4px);
    background-size: 1200px 1200px;
    opacity: 0.45;
    filter: blur(2px) contrast(100%);
    z-index: 4;
    animation: starDriftSlower 220s linear infinite;
  }

  /* Individual star elements (various sizes and blinking) */
  .star {
    position: absolute;
    display: block;
    width: var(--size, 1px);
    height: var(--size, 1px);
    background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.2) 70%, transparent 100%);
    border-radius: 50%;
    opacity: calc(0.6 + var(--blink) * 0.6);
    filter: drop-shadow(0 0 calc(var(--size) * 1.6) rgba(255,255,255,0.6));
    transform: translateZ(0);
    animation: starBlink 3s linear infinite;
    will-change: opacity, transform;
  }

  /* Layer-specific subtle motion and timing tweaks */
  .star-layer-1 .star { z-index: 6; animation-duration: calc(2.8s + var(--delay)); }
  .star-layer-2 .star { z-index: 7; animation-duration: calc(3.6s + var(--delay)); }
  .star-layer-3 .star { z-index: 8; animation-duration: calc(4.2s + var(--delay)); }

  @keyframes starBlink {
    0% { opacity: 0.2; transform: scale(0.9); }
    40% { opacity: 1; transform: scale(1.05); }
    60% { opacity: 0.6; transform: scale(1); }
    100% { opacity: 0.2; transform: scale(0.95); }
  }

  /* Colorful nebula layers with blending and slow motion */
  .cosmic-background::after {
    content: '';
    position: absolute;
    inset: -16% -28% -16% -28%;
    background:
      radial-gradient(44% 36% at 12% 22%, rgba(110,60,180,0.42) 0%, transparent 38%),
      radial-gradient(54% 44% at 82% 8%, rgba(240,70,170,0.36) 0%, transparent 44%),
      radial-gradient(66% 56% at 46% 64%, rgba(40,160,220,0.24) 0%, transparent 52%);
    filter: blur(38px) saturate(165%) contrast(110%);
    opacity: 0.98;
    animation: nebulaMove 44s ease-in-out infinite alternate;
    mix-blend-mode: screen;
    z-index: 5;
    pointer-events: none;
  }

  /* Foreground subtle grain & vignette to add drama */
  .space-explorer::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.7) 100%);
    mix-blend-mode: multiply;
    z-index: 80;
  }

  /* Cinematic color grade overlay to warm the scene slightly near the center */
  .space-explorer::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(8,18,48,0.08) 0%, rgba(8,18,48,0.15) 100%);
    pointer-events: none;
    z-index: 55;
  }

  /* Shooting stars: longer, blurred trails with glow */
  .shooting-star {
    position: absolute;
    width: 3px;
    height: 3px;
    background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.45) 60%, transparent 100%);
    border-radius: 50%;
    filter: drop-shadow(0 0 6px rgba(255,255,255,0.7));
    animation: shoot 4.6s cubic-bezier(.25,.8,.2,1) infinite;
    z-index: 45;
    transform-origin: center;
  }

  .shooting-star::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 160px;
    height: 8px;
    transform: translate(-12%, -50%) rotate(32deg);
    background: linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.95) 18%, rgba(255,255,255,0.28) 55%, transparent 100%);
    filter: blur(8px) brightness(125%);
    border-radius: 6px;
    opacity: 0.9;
    pointer-events: none;
  }

  /* Animated gradient overlay for slow color shifts */
  .animated-gradient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 40;
    mix-blend-mode: overlay;
    opacity: 0.18;
    background: linear-gradient(120deg, rgba(30,40,80,0.0) 0%, rgba(180,50,140,0.08) 35%, rgba(40,120,200,0.06) 65%, rgba(10,10,30,0.0) 100%);
    filter: blur(20px) saturate(120%);
    animation: gradientShift 24s ease-in-out infinite;
  }

  @keyframes gradientShift {
    0% { transform: translateY(0) scale(1); opacity: 0.16; }
    50% { transform: translateY(-3%) scale(1.02); opacity: 0.22; }
    100% { transform: translateY(0) scale(1); opacity: 0.16; }
  }

  /* Aurora ribbon (slow, subtle) */
  .aurora {
    position: absolute;
    left: -20%;
    right: -20%;
    top: 60%;
    height: 28vh;
    background: linear-gradient(90deg, rgba(50,120,255,0.06), rgba(170,60,220,0.12), rgba(255,100,160,0.06));
    filter: blur(30px) saturate(140%);
    transform: skewY(-6deg) translateY(6vh);
    opacity: 0.75;
    z-index: 22;
    mix-blend-mode: screen;
    animation: auroraMove 26s ease-in-out infinite alternate;
    pointer-events: none;
  }

  /* Lens flare near center/sun */
  .lens-flare {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 360px;
    height: 360px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle at 30% 30%, rgba(255,220,140,0.08) 0%, transparent 20%),
                radial-gradient(circle at 70% 70%, rgba(255,120,80,0.04) 0%, transparent 40%);
    filter: blur(36px) saturate(120%);
    opacity: 0.7;
    z-index: 12;
    mix-blend-mode: screen;
    pointer-events: none;
  }

  /* Extra subtle animated noise layer (small, very faint) to avoid flat areas */
  .cosmic-background .noise {
    position: absolute;
    inset: 0;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.035" fill="white"/></svg>');
    mix-blend-mode: overlay;
    z-index: 30;
    pointer-events: none;
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
    margin-top: calc(var(--size, 20px) / -2);
    margin-left: calc(var(--size, 20px) / -2);
    z-index: 10;
    background: var(--planet-color, #999);
    overflow: visible;
  }

  /* Per-planet visual accents */
  .planet-earth {
    background: radial-gradient(circle at 30% 30%, #7ec8e3, #1c4e80 70%);
  }
  .planet-mars {
    background: radial-gradient(circle at 40% 40%, #e07a5f, #8d3b2a 70%);
  }
  .planet-jupiter {
    background: linear-gradient(180deg, #c9b79c 0%, #a89478 20%, #d4c6ad 40%, #b6a285 60%, #d4c6ad 80%, #a89478 100%);
  }
  .planet-saturn {
    background: linear-gradient(180deg, #f3d5a5, #d9b98b);
  }
  .planet-saturn::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) rotate(20deg);
    width: calc(var(--size, 34px) * 2.2);
    height: calc(var(--size, 34px) * 0.6);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-shadow: inset 0 0 4px rgba(0,0,0,0.3);
    pointer-events: none;
  }

  /* Tooltip for planet details */
  .planet-tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 10px 12px;
    width: 220px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    font-size: 12px;
    line-height: 1.4;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    transform-origin: bottom center;
    pointer-events: none;
    z-index: 100;
  }

  .planet:hover .planet-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
  }

  .planet-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: rgba(0,0,0,0.85) transparent transparent transparent;
  }

  .planet-name {
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
  }
  .planet-desc {
    color: #d0d6f9;
    margin-bottom: 6px;
  }
  .planet-stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2px;
    margin-bottom: 6px;
  }
  .planet-fact {
    font-style: italic;
    color: #ffd166;
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
    width: 50px;
    height: 50px;
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
    top: -25px;
    left: -25px;
    width: 100px;
    height: 100px;
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
  /* 
   * Setting animation durations using scaled down versions of actual orbital periods.
   * All values are in seconds, with a scaling factor to make them visible while
   * maintaining their correct relative speeds.
   */
  .planet-0 {
    animation: orbit 8.8s linear infinite;
    animation-name: orbit0;
  }
  
  .planet-1 {
    animation: orbit 22.5s linear infinite;
    animation-name: orbit1;
  }
  
  .planet-2 {
    animation: orbit 36.5s linear infinite;
    animation-name: orbit2;
  }
  
  .planet-3 {
    animation: orbit 68.7s linear infinite;
    animation-name: orbit3;
  }
  
  .planet-4 {
    animation: orbit 433.3s linear infinite;
    animation-name: orbit4;
  }
  
  .planet-5 {
    animation: orbit 1075.9s linear infinite;
    animation-name: orbit5;
  }
  
  .planet-6 {
    animation: orbit 3068.7s linear infinite;
    animation-name: orbit6;
  }
  
  .planet-7 {
    animation: orbit 6019.0s linear infinite;
    animation-name: orbit7;
  }
  
  .planet-8 {
    animation: orbit 9056.0s linear infinite;
    animation-name: orbit8;
  }
  
  @keyframes orbit0 {
    from { transform: rotate(0deg) translateX(7vh) rotate(0deg); }
    to { transform: rotate(360deg) translateX(7vh) rotate(-360deg); }
  }
  
  @keyframes orbit1 {
    from { transform: rotate(40deg) translateX(11vh) rotate(-40deg); }
    to { transform: rotate(400deg) translateX(11vh) rotate(-400deg); }
  }
  
  @keyframes orbit2 {
    from { transform: rotate(80deg) translateX(15vh) rotate(-80deg); }
    to { transform: rotate(440deg) translateX(15vh) rotate(-440deg); }
  }
  
  @keyframes orbit3 {
    from { transform: rotate(120deg) translateX(18vh) rotate(-120deg); }
    to { transform: rotate(480deg) translateX(18vh) rotate(-480deg); }
  }
  
  @keyframes orbit4 {
    from { transform: rotate(160deg) translateX(25vh) rotate(-160deg); }
    to { transform: rotate(520deg) translateX(25vh) rotate(-520deg); }
  }
  
  @keyframes orbit5 {
    from { transform: rotate(200deg) translateX(30vh) rotate(-200deg); }
    to { transform: rotate(560deg) translateX(30vh) rotate(-560deg); }
  }
  
  @keyframes orbit6 {
    from { transform: rotate(240deg) translateX(36vh) rotate(-240deg); }
    to { transform: rotate(600deg) translateX(36vh) rotate(-600deg); }
  }
  
  @keyframes orbit7 {
    from { transform: rotate(280deg) translateX(42vh) rotate(-280deg); }
    to { transform: rotate(640deg) translateX(42vh) rotate(-640deg); }
  }
  
  @keyframes orbit8 {
    from { transform: rotate(320deg) translateX(48vh) rotate(-320deg); }
    to { transform: rotate(680deg) translateX(48vh) rotate(-680deg); }
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
    0% { background-position: 40% 20%, 20% 80%, 60% 40%; }
    100% { background-position: 80% 40%, 10% 90%, 20% 60%; }
  }

  @keyframes auroraMove {
    0% { transform: skewY(-4deg) translateY(5vh) translateX(0); opacity: 0.6; }
    100% { transform: skewY(-8deg) translateY(7vh) translateX(-4%); opacity: 0.85; }
  }

  @keyframes starDriftSlow { from { transform: translateY(0); } to { transform: translateY(-25px); } }
  @keyframes starDriftSlower { from { transform: translateY(0); } to { transform: translateY(-12px); } }

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