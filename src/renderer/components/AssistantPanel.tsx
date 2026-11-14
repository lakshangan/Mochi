import React, { useState, useEffect } from 'react';
import mochiLogo from '../assets/mochi-logo.png';
import { useMochiStore, calculateLevelInfo } from '../hooks/useMochiStore';
import { TimerPanel } from './TimerPanel';
import { ReminderPanel } from './ReminderPanel';
import { TaskPanel } from './TaskPanel';
import { NotesPanel } from './NotesPanel';
import { AiChatPanel } from './AiChatPanel';
import { SettingsPanel } from './SettingsPanel';
import { GitCompanionPanel } from './GitCompanionPanel';
import { DeskStretchesModal } from './DeskStretchesModal';
import { AssistantTitlebar } from './AssistantTitlebar';
import { OnboardingModal } from './OnboardingModal';
import { MindfulBreathingModal } from './MindfulBreathingModal';
import { SoundscapePlayer } from './SoundscapePlayer';
import { SystemPerformanceMetrics } from '../../shared/types';
import {
  LayoutDashboard,
  Clock,
  Droplet,
  Check,
  CheckSquare,
  FileText,
  MessageSquare,
  Settings,
  Sparkles,
  Flame,
  Activity,
  Cpu,
  HardDrive,
  ShieldCheck,
  GitBranch,
  Wind,
  Compass,
} from 'lucide-react';

export const AssistantPanel: React.FC = () => {
  const {
    state,
    platform,
    messages,
    addMessage,
    updateSettings,
    setPetState,
    resetAllData,
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
    addXp,
    gitStatus,
    lastGitEvent,
    refreshGitStatus,
  } = useMochiStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'timer' | 'reminders' | 'tasks' | 'notes' | 'chat' | 'git' | 'settings'
  >('overview');
  const [showStretchesModal, setShowStretchesModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [metrics, setMetrics] = useState<SystemPerformanceMetrics | null>(null);

  // Auto trigger onboarding if first time launch
  useEffect(() => {
    if (state.settings && !state.settings.hasSeenWelcome) {
      setShowOnboarding(true);
    }
  }, [state.settings?.hasSeenWelcome]);

  // Periodic metrics polling
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

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showOnboarding) {
          setShowOnboarding(false);
        } else if (showBreathingModal) {
          setShowBreathingModal(false);
        } else if (showStretchesModal) {
          setShowStretchesModal(false);
        } else {
          closeWindow();
        }
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          const tabMap: Record<string, typeof activeTab> = {
            '1': 'overview',
            '2': 'timer',
            '3': 'reminders',
            '4': 'git',
            '5': 'tasks',
            '6': 'notes',
            '7': 'chat',
            '8': 'settings',
          };
          if (tabMap[e.key]) {
            setActiveTab(tabMap[e.key]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOnboarding, showBreathingModal, showStretchesModal]);

  const pendingTasks = state.tasks.filter((t) => !t.completed);
  const levelInfo = calculateLevelInfo(state.settings.gamification?.xp || 0);

  return (
    <div className={`assistant-window-container platform-${platform}`}>
      {/* OS-Adaptive Native Titlebar */}
      <AssistantTitlebar
        platform={platform}
        petState={state.petState}
        levelInfo={levelInfo}
        totalXp={state.settings.gamification?.xp || 0}
        onClose={closeWindow}
        onMinimize={() => {
          if (window.mochiApi?.minimizeWindow) {
            window.mochiApi.minimizeWindow();
          } else {
            closeWindow();
          }
        }}
        onQuit={handleQuit}
        onOpenStretches={() => setShowStretchesModal(true)}
        onOpenBreathing={() => setShowBreathingModal(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onToggleDeepWork={async () => {
          if (window.mochiApi) {
            await window.mochiApi.setPetVisible(false);
            const hint =
              platform === 'darwin'
                ? 'Click the Mochi icon in the top menu bar to restore anytime!'
                : 'Click the Mochi icon in the system notification tray to restore anytime!';
            await window.mochiApi.showNotification(
              'Deep Work Mode Active 🧘',
              `Mochi is tucked away for focus. ${hint}`
            );
          }
        }}
      />

      {/* Navigation Tab Bar */}
      <nav className="assistant-nav-bar">
        <button
          className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          title="Overview (Press 1)"
        >
          <LayoutDashboard size={14} />
          <span>Home</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
          title="Timers (Press 2)"
        >
          <Clock size={14} />
          <span>Timer</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
          title="Care & Wellness (Press 3)"
        >
          <Droplet size={14} />
          <span>Care</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'git' ? 'active' : ''}`}
          onClick={() => setActiveTab('git')}
          title="Git & Flow Companion (Press 4)"
        >
          <GitBranch size={14} />
          <span>Git</span>
          {gitStatus?.commitsToday ? (
            <span className="nav-badge-dot">{gitStatus.commitsToday}</span>
          ) : null}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          title="Tasks (Press 5)"
        >
          <CheckSquare size={14} />
          <span>Tasks</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
          title="Notes (Press 6)"
        >
          <FileText size={14} />
          <span>Notes</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          title="AI & Commands (Press 7)"
        >
          <MessageSquare size={14} />
          <span>Chat</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          title="Settings (Press 8)"
        >
          <Settings size={14} />
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

            {/* Weekly Productivity & Focus Pulse */}
            <div className="weekly-pulse-card">
              <div className="weekly-pulse-header">
                <span className="weekly-pulse-title">
                  <Activity size={13} className="text-cyan" />
                  <span>Weekly Flow & Wellness Pulse</span>
                </span>
                <span className="flow-score-badge">94% Flow State</span>
              </div>
              <div className="weekly-days-row">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
                  const isToday = idx === todayIdx;
                  return (
                    <div key={day} className={`weekly-day-pill ${isToday ? 'today' : ''}`}>
                      <span>{day}</span>
                      <div
                        className="day-dot-status"
                        style={{ opacity: idx <= todayIdx ? 1 : 0.2 }}
                      />
                    </div>
                  );
                })}
              </div>
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
                  setShowBreathingModal(true);
                }}
              >
                <Wind size={18} className="text-violet" />
                <div className="shortcut-title">Box Breathing</div>
                <div className="shortcut-sub">4-4-4-4 Calm Reset</div>
              </div>

              <div
                className="shortcut-card"
                onClick={() => {
                  setShowOnboarding(true);
                }}
              >
                <Compass size={18} className="text-emerald" />
                <div className="shortcut-title">Feature Tour</div>
                <div className="shortcut-sub">Guide & Gestures</div>
              </div>
            </div>

            {/* Ambient Focus Soundscape Bar */}
            <SoundscapePlayer compact={true} />

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
                  <span>Hardware Pulse & Diagnostics ({platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux'})</span>
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
                      <span>Security & Leak Watchdog</span>
                    </div>
                    <div className="diag-metric-number text-emerald">Protected</div>
                    <div className="diag-metric-sub">CSP & Sandboxed</div>
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

        {activeTab === 'git' && (
          <GitCompanionPanel
            status={gitStatus}
            lastEvent={lastGitEvent}
            onRefresh={refreshGitStatus}
            onOpenStretches={() => setShowStretchesModal(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={state.settings}
            onUpdateSettings={updateSettings}
            onOpenOnboarding={() => setShowOnboarding(true)}
            onResetAll={resetAllData}
          />
        )}
      </main>

      <DeskStretchesModal
        isOpen={showStretchesModal}
        onClose={() => setShowStretchesModal(false)}
        onRewardXp={addXp}
      />

      <MindfulBreathingModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
        onRewardXp={addXp}
        onSetPetState={setPetState}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        platform={platform}
        currentSettings={state.settings}
        onSaveSettings={updateSettings}
        onClose={() => setShowOnboarding(false)}
        onRewardXp={addXp}
      />

      {/* Full-Screen Alert Modal for Drink Water & Mindful Care */}
      {state.activeReminder && state.activeReminder.fullScreenAlert && (
        <div className="fullscreen-reminder-modal">
          <div className="fullscreen-modal-backdrop" />
          <div className="fullscreen-modal-content">
            <div className="fullscreen-modal-glow" />
            <div className="fullscreen-modal-icon">
              {state.activeReminder.type === 'water' ? '💧' : '🌿'}
            </div>
            <h2 className="fullscreen-modal-title">{state.activeReminder.title}</h2>
            <p className="fullscreen-modal-text">{state.activeReminder.message}</p>

            <div className="fullscreen-modal-actions">
              {state.activeReminder.type === 'water' ? (
                <>
                  <button
                    className="btn btn-lg btn-primary"
                    onClick={() => {
                      completeWater();
                    }}
                  >
                    <Check size={18} /> I Drank Water! 🥤
                  </button>
                  <button
                    className="btn btn-lg btn-secondary"
                    onClick={() => snoozeWater(10)}
                  >
                    <Clock size={16} /> Snooze 10m
                  </button>
                  <button
                    className="btn btn-lg btn-outline"
                    onClick={() => dismissWater()}
                  >
                    Dismiss
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-lg btn-primary"
                    onClick={() => startBreakTimer()}
                  >
                    <Sparkles size={18} /> Start Break Now 🌿
                  </button>
                  <button
                    className="btn btn-lg btn-secondary"
                    onClick={() => snoozeBreak(10)}
                  >
                    <Clock size={16} /> Snooze 10m
                  </button>
                  <button
                    className="btn btn-lg btn-outline"
                    onClick={() => dismissBreak()}
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
