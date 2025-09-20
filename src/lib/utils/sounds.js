/**
 * Utility for managing sound effects in the Pomodoro app
 */

// Simple notification sound (short beep)
export const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDa0XxAL0Vl0/7ZkFRANj6Gxu7WoGBRRnGexdHAik09Okqe3ObDml5EPWen3d2ol1A5R2auf8HWvn1PKFZsn8fG0MiQc1ZSQmis094AAAA=';

// Short click sound (button feedback)
export const CLICK_SOUND = 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEAiBUAAIgVAAABAAgAZGF0YQAEAAB0d3x3cHJ1eHp6eXp8eny7tKyiiIKMnrK5rJKAeH2UsK+Wg3livMfFs7OvrKarq6utr7W5vb+1p5OO+vn7/fz8/v7+/v39/v7+/f39/v7+/f39/v7+AAAA=';

// Sound manager class
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
    
    // Initialize all sounds
    this.initSound('timerEnd', NOTIFICATION_SOUND, 0.5);
    this.initSound('click', CLICK_SOUND, 0.2);
    this.initSound('discovery', NOTIFICATION_SOUND, 0.4); // Use notification sound for discovery
  }
  
  // Initialize a sound with given volume
  initSound(name, src, volume = 1.0) {
    const audio = new Audio(src);
    audio.volume = volume;
    this.sounds[name] = audio;
  }
  
  // Play a sound by name
  play(name) {
    if (this.muted || !this.sounds[name]) return;
    
    // Create a new audio element each time to allow overlapping sounds
    const sound = this.sounds[name];
    const clone = sound.cloneNode();
    clone.volume = sound.volume;
    clone.play();
  }
  
  // Toggle mute state
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
  
  // Set volume for a specific sound
  setVolume(name, volume) {
    if (this.sounds[name]) {
      this.sounds[name].volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Create and export singleton instance
const soundManager = new SoundManager();
export default soundManager;
