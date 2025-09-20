import { writable } from 'svelte/store';

// Initialize the space rewards store
export const spaceRewards = writable({
  sessionsCompleted: 0,      // Total number of focus sessions completed
  planetsDiscovered: 0,      // Number of planets discovered
  nextDiscoveryProgress: 0,  // Progress towards next discovery (0-100%)
  hasNewDiscovery: false     // Flag for new discoveries to trigger animations
});

// Reset the space rewards (for testing or resetting user progress)
export function resetSpaceRewards() {
  spaceRewards.set({
    sessionsCompleted: 0,
    planetsDiscovered: 0,
    nextDiscoveryProgress: 0,
    hasNewDiscovery: false
  });
}

// Simulate completing sessions (for testing)
export function simulateSessionsCompleted(count) {
  spaceRewards.update(rewards => {
    const newPlanetsToDiscover = Math.floor(count / 3) - Math.floor(rewards.sessionsCompleted / 3);
    const nextDiscoveryProgress = ((count % 3) / 3) * 100;
    
    return {
      sessionsCompleted: count,
      planetsDiscovered: rewards.planetsDiscovered + (newPlanetsToDiscover > 0 ? newPlanetsToDiscover : 0),
      nextDiscoveryProgress,
      hasNewDiscovery: newPlanetsToDiscover > 0
    };
  });
}
