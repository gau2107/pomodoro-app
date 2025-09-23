/**
 * Session logging store for Pomodoro app
 * Uses Tauri commands when available, falls back to localStorage
 */
import { writable, derived } from 'svelte/store';

// Check if we're in Tauri environment
const isTauri = () => {
  // @ts-ignore - Tauri API check
  return typeof window !== 'undefined' && typeof window.__TAURI__ !== 'undefined';
};

// Base stores
export const sessions = writable([]);
export const sessionStats = writable({
  total_sessions: 0,
  completed_sessions: 0,
  total_focus_time_minutes: 0,
  today_sessions: 0,
  today_focus_time_minutes: 0,
  this_week_sessions: 0,
  this_week_focus_time_minutes: 0,
  completion_rate: 0
});

// Loading state
export const isLoading = writable(false);

// Current session tracking
export const currentSession = writable(null);

// Derived stores for computed values
export const todayStats = derived(sessionStats, ($stats) => ({
  sessions: $stats.today_sessions,
  focusTime: $stats.today_focus_time_minutes,
  hours: Math.floor($stats.today_focus_time_minutes / 60),
  minutes: $stats.today_focus_time_minutes % 60
}));

export const totalStats = derived(sessionStats, ($stats) => ({
  sessions: $stats.total_sessions,
  completed: $stats.completed_sessions,
  focusTime: $stats.total_focus_time_minutes,
  hours: Math.floor($stats.total_focus_time_minutes / 60),
  minutes: $stats.total_focus_time_minutes % 60,
  completionRate: $stats.completion_rate
}));

// localStorage fallback functions
function saveToLocalStorage(sessions) {
  try {
    localStorage.setItem('pomodoro_sessions', JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem('pomodoro_sessions');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return [];
  }
}

function calculateStats(sessionList) {
  const today = new Date().toDateString();
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  
  let totalSessions = sessionList.length;
  let completedSessions = sessionList.filter(s => s.was_completed).length;
  let totalFocusTime = 0;
  let todaySessions = 0;
  let todayFocusTime = 0;
  let thisWeekSessions = 0;
  let thisWeekFocusTime = 0;
  
  sessionList.forEach(session => {
    const sessionDate = new Date(session.completed_at);
    const sessionDateStr = sessionDate.toDateString();
    
    // Count focus time
    if (session.session_type === 'focus') {
      const focusTime = session.was_completed ? session.duration_minutes : Math.floor(session.focus_time_seconds / 60);
      totalFocusTime += focusTime;
      
      if (sessionDateStr === today) {
        todaySessions++;
        todayFocusTime += focusTime;
      }
      
      if (sessionDate >= thisWeekStart) {
        thisWeekSessions++;
        thisWeekFocusTime += focusTime;
      }
    }
  });
  
  return {
    total_sessions: totalSessions,
    completed_sessions: completedSessions,
    total_focus_time_minutes: totalFocusTime,
    today_sessions: todaySessions,
    today_focus_time_minutes: todayFocusTime,
    this_week_sessions: thisWeekSessions,
    this_week_focus_time_minutes: thisWeekFocusTime,
    completion_rate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
  };
}

/**
 * Load all sessions from storage
 */
export async function loadSessions() {
  try {
    isLoading.set(true);
    
    let sessionList = [];
    
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const sessionLogs = await invoke('load_sessions');
        sessionList = sessionLogs.sessions || [];
        console.log('Loaded sessions from Tauri:', sessionList.length);
      } catch (error) {
        console.error('Tauri command failed, falling back to localStorage:', error);
        sessionList = loadFromLocalStorage();
      }
    } else {
      sessionList = loadFromLocalStorage();
      console.log('Loaded sessions from localStorage:', sessionList.length);
    }
    
    sessions.set(sessionList);
    return { sessions: sessionList };
  } catch (error) {
    console.error('Failed to load sessions:', error);
    sessions.set([]);
    return { sessions: [] };
  } finally {
    isLoading.set(false);
  }
}

/**
 * Load session statistics
 */
export async function loadSessionStats() {
  try {
    let stats;
    
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        stats = await invoke('get_session_stats');
        console.log('Loaded session stats from Tauri:', stats);
      } catch (error) {
        console.error('Tauri command failed, calculating stats locally:', error);
        const sessionList = loadFromLocalStorage();
        stats = calculateStats(sessionList);
      }
    } else {
      const sessionList = loadFromLocalStorage();
      stats = calculateStats(sessionList);
      console.log('Calculated session stats locally:', stats);
    }
    
    sessionStats.set(stats);
    return stats;
  } catch (error) {
    console.error('Failed to load session stats:', error);
    return null;
  }
}

/**
 * Save a new session
 */
export async function saveSession(sessionData) {
  try {
    let success = false;
    
    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_session', { session: sessionData });
        success = true;
        console.log('Session saved via Tauri:', sessionData);
      } catch (error) {
        console.error('Tauri command failed, falling back to localStorage:', error);
        // Fallback to localStorage
        const currentSessions = loadFromLocalStorage();
        currentSessions.push(sessionData);
        success = saveToLocalStorage(currentSessions);
      }
    } else {
      // Use localStorage directly
      const currentSessions = loadFromLocalStorage();
      currentSessions.push(sessionData);
      success = saveToLocalStorage(currentSessions);
      console.log('Session saved to localStorage:', sessionData);
    }
    
    if (success) {
      // Reload data to update stores
      await loadSessions();
      await loadSessionStats();
    }
    
    return success;
  } catch (error) {
    console.error('Failed to save session:', error);
    return false;
  }
}

/**
 * Start tracking a new session
 */
export function startSession(sessionType, durationMinutes) {
  const session = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    session_type: sessionType,
    duration_minutes: durationMinutes,
    completed_at: new Date().toISOString(),
    was_completed: false,
    focus_time_seconds: 0
  };
  
  currentSession.set(session);
  console.log('Started tracking session:', session);
  return session;
}

/**
 * Complete the current session
 */
export async function completeSession(wasCompleted = true, actualFocusTimeSeconds = null) {
  const session = await new Promise(resolve => {
    currentSession.subscribe(value => {
      resolve(value);
    })();
  });
  
  if (!session) {
    console.warn('No active session to complete');
    return false;
  }
  
  // Update session with completion data
  const completedSession = {
    ...session,
    completed_at: new Date().toISOString(),
    was_completed: wasCompleted,
    focus_time_seconds: actualFocusTimeSeconds || (wasCompleted ? session.duration_minutes * 60 : 0)
  };
  
  // Save to storage
  const success = await saveSession(completedSession);
  
  if (success) {
    currentSession.set(null);
    console.log('Session completed and saved:', completedSession);
  }
  
  return success;
}

/**
 * Get formatted session history grouped by date
 */
export function getSessionsByDate(sessionList) {
  const grouped = {};
  
  sessionList.forEach(session => {
    const date = new Date(session.completed_at).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(session);
  });
  
  // Sort dates (newest first)
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  return sortedDates.map(date => ({
    date,
    sessions: grouped[date].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
  }));
}

/**
 * Format duration for display
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format time for display
 */
export function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Get session type display name
 */
export function getSessionTypeName(sessionType) {
  switch (sessionType) {
    case 'focus':
      return 'Focus';
    case 'short_break':
      return 'Short Break';
    case 'long_break':
      return 'Long Break';
    default:
      return sessionType;
  }
}

/**
 * Get session type color
 */
export function getSessionTypeColor(sessionType) {
  switch (sessionType) {
    case 'focus':
      return '#ff6347';
    case 'short_break':
      return '#4CAF50';
    case 'long_break':
      return '#2196F3';
    default:
      return '#999';
  }
}

// Initialize stores on import
if (typeof window !== 'undefined') {
  loadSessions();
  loadSessionStats();
}