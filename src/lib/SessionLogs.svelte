<script>
  import { onMount } from 'svelte';
  import { 
    sessions, 
    sessionStats, 
    todayStats, 
    totalStats, 
    isLoading,
    loadSessions,
    loadSessionStats,
    getSessionsByDate,
    formatDuration,
    formatTime,
    getSessionTypeName,
    getSessionTypeColor
  } from './stores/sessionStore.js';
  import { isTauri } from './tauriApi.js';
  
  // For Tauri window management
  let appWindow;
  
  // Component state
  let groupedSessions = [];
  let selectedFilter = 'all'; // 'all', 'focus', 'break', 'today', 'week'
  
  // Reactive statements for filtered sessions
  $: filteredSessions = $sessions.filter(session => {
    // Apply type filter
    if (selectedFilter === 'focus') {
      return session.session_type === 'focus';
    } else if (selectedFilter === 'break') {
      return session.session_type.includes('break');
    } else if (selectedFilter === 'today') {
      const today = new Date().toDateString();
      const sessionDate = new Date(session.completed_at).toDateString();
      return sessionDate === today;
    } else if (selectedFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const sessionDate = new Date(session.completed_at);
      return sessionDate >= weekAgo;
    }
    
    return true;
  });

  $: {
    // Group sessions by date
    const grouped = {};
    filteredSessions.forEach(session => {
      const date = new Date(session.completed_at).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    
    // Convert to array and sort by date (newest first)
    groupedSessions = Object.entries(grouped)
      .map(([date, sessions]) => ({ date, sessions }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Initialize component
  onMount(async () => {
    try {
      // Initialize Tauri window
      if (isTauri()) {
        const { Window } = await import('@tauri-apps/api/window');
        appWindow = Window.getCurrent();
        console.log("Session Logs Window initialized");
      }
    } catch (error) {
      console.error("Failed to initialize Session Logs Window:", error);
    }
    
    // Load session data
    await loadSessions();
    await loadSessionStats();
  });
</script>

<!-- Session Logs Fullscreen App -->
<main class="session-logs-app">
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <h1>Session Logs</h1>
    </div>
  </header>

  <!-- Content -->
  <div class="content">
    <!-- Stats Overview -->
    <section class="stats-overview">
      <div class="stat-card">
        <div class="stat-value">{$totalStats.completed}</div>
        <div class="stat-label">Total Sessions</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{formatDuration($totalStats.focusTime)}</div>
        <div class="stat-label">Focus Time</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{$totalStats.completionRate}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">{$todayStats.sessions}</div>
        <div class="stat-label">Today</div>
      </div>
    </section>

    <!-- Filter Tabs -->
    <section class="filter-section">
      <div class="filter-tabs">
        <button 
          class="filter-tab {selectedFilter === 'all' ? 'active' : ''}"
          on:click={() => selectedFilter = 'all'}>
          All
        </button>
        <button 
          class="filter-tab {selectedFilter === 'today' ? 'active' : ''}"
          on:click={() => selectedFilter = 'today'}>
          Today
        </button>
        <button 
          class="filter-tab {selectedFilter === 'week' ? 'active' : ''}"
          on:click={() => selectedFilter = 'week'}>
          Week
        </button>
        <button 
          class="filter-tab {selectedFilter === 'focus' ? 'active' : ''}"
          on:click={() => selectedFilter = 'focus'}>
          Focus
        </button>
        <button 
          class="filter-tab {selectedFilter === 'break' ? 'active' : ''}"
          on:click={() => selectedFilter = 'break'}>
          Break
        </button>
      </div>
    </section>

    <!-- Sessions List -->
    <section class="sessions-list">
      {#if $isLoading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading sessions...</p>
        </div>
      {:else if groupedSessions.length === 0}
        <div class="empty-state">
          <h3>No sessions yet</h3>
          <p>Start your first Pomodoro session to see it here!</p>
        </div>
      {:else}
        {#each groupedSessions as dayGroup (dayGroup.date)}
          <div class="day-group">
            <h3 class="day-title">
              {dayGroup.date === new Date().toDateString() ? 'Today' : 
               dayGroup.date === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' :
               new Date(dayGroup.date).toLocaleDateString('en-US', { 
                 weekday: 'long', 
                 month: 'short', 
                 day: 'numeric' 
               })}
            </h3>
            
            <div class="session-grid">
              {#each dayGroup.sessions as session (session.id)}
                <div class="session-item {session.session_type} {session.completed ? 'completed' : 'incomplete'}">
                  <div class="session-type">
                    {session.session_type === 'focus' ? '🎯' : '☕'} 
                    {getSessionTypeName(session.session_type)}
                  </div>
                  <div class="session-time">{formatTime(session.completed_at)}</div>
                  <div class="session-duration">{session.planned_duration_minutes}m</div>
                  <div class="session-status">
                    {session.completed ? '✓' : '○'}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </section>
  </div>
</main>

<style>
  /* Clean, purposeful session logs */
  .session-logs-app {
    --primary-color: #ff6347;
    --bg-color: #f8f8f8;
    --text-color: #333;
    --secondary-text: #777;
    --border-color: #e0e0e0;
    --card-bg: #ffffff;
    
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-color);
    color: var(--text-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .session-logs-app {
      --bg-color: #0a0a0a;
      --text-color: #ffffff;
      --secondary-text: #cccccc;
      --border-color: #333333;
      --card-bg: #1a1a1a;
    }
  }

  /* Header */
  .header {
    flex-shrink: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .header-content {
    display: flex;
    align-items: center;
    max-width: none;
  }

  .header h1 {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    color: var(--text-color);
  }

  /* Content */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 40px;
  }

  /* Stats Overview */
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    border: 1px solid var(--border-color);
    transition: transform 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }

  .stat-value {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--primary-color);
  }

  .stat-label {
    font-size: 14px;
    color: var(--secondary-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  /* Filter Section */
  .filter-section {
    margin-bottom: 40px;
  }

  .filter-tabs {
    display: flex;
    gap: 8px;
  }

  .filter-tab {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    background: var(--card-bg);
    color: var(--secondary-text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color);
  }

  .filter-tab:hover {
    color: var(--text-color);
    border-color: var(--primary-color);
  }

  .filter-tab.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  /* Sessions List */
  .sessions-list {
    flex: 1;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state h3 {
    font-size: 20px;
    margin: 0 0 8px 0;
    color: var(--text-color);
  }

  .empty-state p {
    color: var(--secondary-text);
    margin: 0;
  }

  /* Day Groups */
  .day-group {
    margin-bottom: 40px;
  }

  .day-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px 0;
    color: var(--text-color);
    padding-bottom: 8px;
    border-bottom: 2px solid var(--border-color);
  }

  /* Session Grid */
  .session-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .session-item {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 20px;
    border: 1px solid var(--border-color);
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 16px;
    align-items: center;
    transition: all 0.2s ease;
  }

  .session-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .session-item.completed {
    border-left: 4px solid #10B981;
  }

  .session-item.incomplete {
    border-left: 4px solid #F59E0B;
  }

  .session-type {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-color);
  }

  .session-time {
    font-size: 13px;
    color: var(--secondary-text);
    font-family: 'SF Mono', Monaco, monospace;
  }

  .session-duration {
    font-size: 13px;
    color: var(--secondary-text);
    font-weight: 500;
  }

  .session-status {
    font-size: 16px;
    font-weight: 600;
  }

  .session-item.completed .session-status {
    color: #10B981;
  }

  .session-item.incomplete .session-status {
    color: #F59E0B;
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .stats-overview {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }

  @media (max-width: 768px) {
    .content {
      padding: 20px;
    }
    
    .header {
      padding: 15px 20px;
    }

    .stats-overview {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .stat-card {
      padding: 20px;
    }

    .filter-tabs {
      flex-wrap: wrap;
    }

    .session-grid {
      grid-template-columns: 1fr;
    }
  }
</style>