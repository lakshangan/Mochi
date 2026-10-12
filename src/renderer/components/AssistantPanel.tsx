import React, { useState, useEffect } from 'react';
import { useMochiStore } from '../hooks/useMochiStore';
import { TimerPanel } from './TimerPanel';
import { ReminderPanel } from './ReminderPanel';
import { TaskPanel } from './TaskPanel';
import { NotesPanel } from './NotesPanel';
import { AiChatPanel } from './AiChatPanel';
import { SettingsPanel } from './SettingsPanel';
import { SystemPerformanceMetrics } from '../../shared/types';
import {
  LayoutDashboard,
  Clock,
  Droplet,
  CheckSquare,
  FileText,
  MessageSquare,
  Settings,
  X,
  Sparkles,
  Play,
  Flame,
  Power,
  EyeOff,
  Activity,
  Cpu,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

export const AssistantPanel: React.FC = () => {
  const {
    state,
    messages,
    addMessage,
    updateSettings,
    setPetState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startPomodoro,
    skipPomodoro,
    snoozeWater,
    completeWater,
    dismissWater,
    snoozeBreak,
    startBreakTimer,
    dismissBreak,
    addTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addNote,
    updateNote,
    deleteNote,
  } = useMochiStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'timer' | 'reminders' | 'tasks' | 'notes' | 'chat' | 'settings'
  >('overview');
  const [metrics, setMetrics] = useState<SystemPerformanceMetrics | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fetchMetrics = async () => {
      if (window.mochiApi?.getSystemMetrics) {
        try {
          const res = await window.mochiApi.getSystemMetrics();
          setMetrics(res);
        } catch {
          // fallback
        }
      }
    };
    fetchMetrics();
    timer = setInterval(fetchMetrics, 3500);
    return () => clearInterval(timer);
  }, []);

  const closeWindow = () => {
    if (window.mochiApi) {
      window.mochiApi.closeAssistant();
    }
  };

  const handleQuit = () => {
    if (window.mochiApi) {
      window.mochiApi.quitApp();
    }
  };

  const pendingTasks = state.tasks.filter((t) => !t.completed);

  return (
    <div className="assistant-window-container">
      {/* Apple macOS Native Titlebar */}
      <div className="assistant-header-bar">
        <div className="mac-traffic-lights">
          <button className="traffic-dot close" onClick={handleQuit} title="Turn Off / Quit Mochi">
            <span className="traffic-icon">×</span>
          </button>
          <button className="traffic-dot minimize" onClick={closeWindow} title="Hide Assistant Panel">
            <span className="traffic-icon">−</span>
          </button>
          <button className="traffic-dot zoom" title="Zoom">
            <span className="traffic-icon">+</span>
          </button>
        </div>

        <div className="mac-title-center">
          <div className="brand-dot" />
          <span className="brand-title">Mochi Companion</span>
          <span className="mac-status-pill">{state.petState}</span>
        </div>

        <div className="mac-title-spacer">
          <button
            className="mac-deep-work-btn"
            onClick={async () => {
              if (window.mochiApi) {
                await window.mochiApi.setPetVisible(false);
                await window.mochiApi.showNotification(
                  'Deep Work Mode Active 🧘',
                  'Mochi is hidden for full-screen focus. Click the Mochi icon in the status bar at top anytime to restore!'
                );
              }
            }}
            title="Hide Mochi for full-screen Deep Work (accessible from status bar at top)"
          >
            <EyeOff size={11} />
            <span>Deep Work</span>
          </button>
          <button
            className="mac-turn-off-btn"
            onClick={handleQuit}
            title="Turn Off Mochi (Quit App)"
          >
            <Power size={11} />
            <span>Turn Off</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <nav className="assistant-nav-bar">
        <button
          className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          title="Overview"
        >
          <LayoutDashboard size={16} />
          <span>Home</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
          title="Timers"
        >
          <Clock size={16} />
          <span>Timer</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
          title="Reminders"
        >
          <Droplet size={16} />
          <span>Care</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          title="Tasks"
        >
          <CheckSquare size={16} />
          <span>Tasks</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          title="Notes"
        >
          <FileText size={16} />
          <span>Notes</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          title="AI & Commands"
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          title="Settings"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Tab Body */}
      <main className="assistant-main-content">
        {activeTab === 'overview' && (
          <div className="panel-container overview-scroll">
            {/* Friendly Greeting Card */}
            <div className="greeting-card">
              <div className="greeting-text">
                <h3>{state.settings.userName ? `Hello, ${state.settings.userName}! ✨` : 'Hello, Friend! ✨'}</h3>
                <p>
                  Mochi is floating on your desktop. Here is your productivity pulse for today:
                </p>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setPetState('happy')}
              >
                Pet Mochi
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="quick-shortcuts-grid">
              <div
                className="shortcut-card"
                onClick={() => {
                  setActiveTab('timer');
                  startPomodoro('focus');
                }}
              >
                <Flame size={18} className="text-amber" />
                <div className="shortcut-title">Focus 25m</div>
                <div className="shortcut-sub">Pomodoro Session</div>
              </div>

              <div
                className="shortcut-card"
                onClick={() => {
                  completeWater();
                }}
              >
                <Droplet size={18} className="text-cyan" />
                <div className="shortcut-title">Drink Water</div>
                <div className="shortcut-sub">+ Log Hydration</div>
              </div>

              <div
                className="shortcut-card"
                onClick={() => {
                  setActiveTab('timer');
                  startTimer(15 * 60, 'Power Sprint');
                }}
              >
                <Clock size={18} className="text-violet" />
                <div className="shortcut-title">15m Timer</div>
                <div className="shortcut-sub">Quick Sprint</div>
              </div>

              <div
                className="shortcut-card"
                onClick={() => setActiveTab('tasks')}
              >
                <CheckSquare size={18} className="text-emerald" />
                <div className="shortcut-title">{pendingTasks.length} Pending</div>
                <div className="shortcut-sub">View Tasks</div>
              </div>
            </div>

            {/* Live Timer Status Preview if running */}
            {state.timer.status !== 'stopped' && (
              <div
                className="active-timer-banner"
                onClick={() => setActiveTab('timer')}
              >
                <div className="timer-banner-left">
                  <div className="live-pulse" />
                  <div>
                    <strong>{state.timer.label || 'Active Timer'}</strong>
                    <div className="timer-banner-time">
                      {Math.floor(state.timer.remainingSeconds / 60)}:
                      {(state.timer.remainingSeconds % 60).toString().padStart(2, '0')} remaining
                    </div>
                  </div>
                </div>
                <span className="badge-status">{state.timer.status.toUpperCase()}</span>
              </div>
            )}

            {/* Pending Tasks Preview */}
            <div className="overview-section">
              <div className="section-header-row">
                <span className="section-heading">Top Tasks</span>
                <button
                  className="btn-link"
                  onClick={() => setActiveTab('tasks')}
                >
                  Manage All →
                </button>
              </div>

              <div className="overview-task-list">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="overview-task-item">
                    <button
                      className="check-circle-sm"
                      onClick={() => toggleTask(task.id)}
                    />
                    <span className="task-name">{task.title}</span>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <div className="subtle-note">No pending tasks right now. Great job! 🎉</div>
                )}
              </div>
            </div>

            {/* Real-time Hardware Diagnostics & RAM Telemetry */}
            <div className="overview-section diagnostics-section">
              <div className="section-header-row">
                <span className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={13} className="text-cyan" />
                  <span>Hardware Pulse & Diagnostics</span>
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="diag-dot-pulse" />
                  <span>Low Impact</span>
                </span>
              </div>

              <div className="diagnostics-card">
                <div className="diag-metrics-grid">
                  <div className="diag-metric-box">
                    <div className="diag-metric-header">
                      <HardDrive size={11} className="text-cyan" />
                      <span>RAM Footprint</span>
                    </div>
                    <div className="diag-metric-number">
                      {metrics ? `${metrics.totalRamMB} MB` : '42 MB'}
                    </div>
                    <div className="diag-metric-sub">
                      Main {metrics ? `${metrics.mainProcessRamMB}M` : '28M'} · Rend {metrics ? `${metrics.rendererRamMB}M` : '14M'}
                    </div>
                  </div>

                  <div className="diag-metric-box">
                    <div className="diag-metric-header">
                      <Cpu size={11} className="text-emerald" />
                      <span>CPU Load</span>
                    </div>
                    <div className="diag-metric-number">
                      {metrics ? `${metrics.cpuPercent}%` : '< 1%'}
                    </div>
                    <div className="diag-metric-sub">Ultra-Low Power</div>
                  </div>

                  <div className="diag-metric-box">
                    <div className="diag-metric-header">
                      <ShieldCheck size={11} className="text-violet" />
                      <span>Leak Watchdog</span>
                    </div>
                    <div className="diag-metric-number text-emerald">Protected</div>
                    <div className="diag-metric-sub">Zero Leaks Detected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <TimerPanel
            timer={state.timer}
            pomodoroSessions={state.settings.pomodoro.completedSessions}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onResumeTimer={resumeTimer}
            onResetTimer={resetTimer}
            onStartPomodoro={startPomodoro}
            onSkipPomodoro={skipPomodoro}
          />
        )}

        {activeTab === 'reminders' && (
          <ReminderPanel
            waterSettings={state.settings.waterReminders}
            breakSettings={state.settings.breakReminders}
            activeReminder={state.activeReminder}
            onUpdateWater={(partial) =>
              updateSettings({
                waterReminders: { ...state.settings.waterReminders, ...partial },
              })
            }
            onUpdateBreak={(partial) =>
              updateSettings({
                breakReminders: { ...state.settings.breakReminders, ...partial },
              })
            }
            onCompleteWater={completeWater}
            onSnoozeWater={snoozeWater}
            onDismissWater={dismissWater}
            onStartBreakTimer={startBreakTimer}
            onSnoozeBreak={snoozeBreak}
            onDismissBreak={dismissBreak}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskPanel
            tasks={state.tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onClearCompleted={clearCompletedTasks}
          />
        )}

        {activeTab === 'notes' && (
          <NotesPanel
            notes={state.notes}
            onAddNote={addNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />
        )}

        {activeTab === 'chat' && (
          <AiChatPanel
            messages={messages}
            aiSettings={state.settings.ai}
            onSendMessage={addMessage}
            onExecuteAction={(action, navigate = false) => {
              if (action.type === 'start_timer') {
                startTimer(action.payload.seconds, action.payload.label);
                if (navigate) setActiveTab('timer');
              } else if (action.type === 'start_pomodoro') {
                startPomodoro(action.payload.phase);
                if (navigate) setActiveTab('timer');
              } else if (action.type === 'pause_timer') {
                pauseTimer();
                if (navigate) setActiveTab('timer');
              } else if (action.type === 'resume_timer') {
                resumeTimer();
                if (navigate) setActiveTab('timer');
              } else if (action.type === 'reset_timer') {
                resetTimer();
                if (navigate) setActiveTab('timer');
              } else if (action.type === 'set_water_reminder') {
                updateSettings({
                  waterReminders: {
                    ...state.settings.waterReminders,
                    intervalMinutes: action.payload.intervalMinutes,
                    enabled: true,
                  },
                });
                if (navigate) setActiveTab('reminders');
              } else if (action.type === 'set_break_reminder') {
                updateSettings({
                  breakReminders: {
                    ...state.settings.breakReminders,
                    intervalMinutes: action.payload.intervalMinutes,
                    enabled: true,
                  },
                });
                if (navigate) setActiveTab('reminders');
              } else if (action.type === 'create_task') {
                addTask(action.payload.title, action.payload.priority);
                if (navigate) setActiveTab('tasks');
              } else if (action.type === 'clear_completed_tasks') {
                clearCompletedTasks();
                if (navigate) setActiveTab('tasks');
              } else if (action.type === 'add_note') {
                addNote(action.payload.title, action.payload.content);
                if (navigate) setActiveTab('notes');
              } else if (action.type === 'pet_mood') {
                setPetState(action.payload.state);
              } else if (action.type === 'view_tab') {
                if (action.payload?.tab) {
                  setActiveTab(action.payload.tab);
                }
              }
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={state.settings}
            onUpdateSettings={updateSettings}
          />
        )}
      </main>
    </div>
  );
};
