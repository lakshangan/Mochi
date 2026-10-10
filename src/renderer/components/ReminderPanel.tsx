import React, { useState } from 'react';
import {
  WaterReminderSettings,
  BreakReminderSettings,
  ReminderNotificationEvent,
} from '../../shared/types';
import { Droplet, Sun, Check, Clock, BellOff, Sparkles } from 'lucide-react';

interface ReminderPanelProps {
  waterSettings: WaterReminderSettings;
  breakSettings: BreakReminderSettings;
  activeReminder: ReminderNotificationEvent | null;
  onUpdateWater: (settings: Partial<WaterReminderSettings>) => void;
  onUpdateBreak: (settings: Partial<BreakReminderSettings>) => void;
  onCompleteWater: () => void;
  onSnoozeWater: (minutes?: number) => void;
  onDismissWater: () => void;
  onStartBreakTimer: () => void;
  onSnoozeBreak: (minutes?: number) => void;
  onDismissBreak: () => void;
}

export const ReminderPanel: React.FC<ReminderPanelProps> = ({
  waterSettings,
  breakSettings,
  activeReminder,
  onUpdateWater,
  onUpdateBreak,
  onCompleteWater,
  onSnoozeWater,
  onDismissWater,
  onStartBreakTimer,
  onSnoozeBreak,
  onDismissBreak,
}) => {
  const [glassesToday, setGlassesToday] = useState(3);

  const formatMinutesLeft = (nextDue?: number) => {
    if (!nextDue) return 'Not scheduled';
    const diff = Math.max(0, Math.round((nextDue - Date.now()) / 60000));
    if (diff === 0) return 'Due now!';
    return `in ~${diff} min${diff === 1 ? '' : 's'}`;
  };

  return (
    <div className="panel-container">
      {/* Active Reminder Urgent Banner if triggered */}
      {activeReminder && (
        <div className={`urgent-reminder-banner ${activeReminder.type}`}>
          <div className="urgent-banner-header">
            <span className="urgent-icon">
              {activeReminder.type === 'water' ? '💧' : '🌿'}
            </span>
            <div>
              <strong>{activeReminder.title}</strong>
              <div className="urgent-text">{activeReminder.message}</div>
            </div>
          </div>

          <div className="urgent-banner-actions">
            {activeReminder.type === 'water' ? (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setGlassesToday((g) => g + 1);
                    onCompleteWater();
                  }}
                >
                  <Check size={14} /> Drank Water!
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => onSnoozeWater(10)}>
                  <Clock size={14} /> Snooze 10m
                </button>
                <button className="btn btn-sm btn-outline" onClick={onDismissWater}>
                  <BellOff size={14} /> Dismiss
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-sm btn-primary" onClick={onStartBreakTimer}>
                  <Sparkles size={14} /> Start Break Timer
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => onSnoozeBreak(10)}>
                  <Clock size={14} /> Snooze 10m
                </button>
                <button className="btn btn-sm btn-outline" onClick={onDismissBreak}>
                  <BellOff size={14} /> Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Water Section */}
      <div className="reminder-card water-card">
        <div className="card-header">
          <div className="title-row">
            <Droplet className="card-icon text-cyan" size={20} />
            <div>
              <div className="card-title">Hydration Reminder</div>
              <div className="card-subtitle">Next reminder: {formatMinutesLeft(waterSettings.nextDue)}</div>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={waterSettings.enabled}
              onChange={(e) => onUpdateWater({ enabled: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>

        {waterSettings.enabled && (
          <div className="card-body">
            <div className="setting-sub-row">
              <label>Reminder Interval:</label>
              <select
                value={waterSettings.intervalMinutes}
                onChange={(e) =>
                  onUpdateWater({
                    intervalMinutes: parseInt(e.target.value, 10),
                    nextDue: Date.now() + parseInt(e.target.value, 10) * 60000,
                  })
                }
                className="select-dropdown"
              >
                <option value={20}>Every 20 mins</option>
                <option value={30}>Every 30 mins</option>
                <option value={45}>Every 45 mins (Recommended)</option>
                <option value={60}>Every 60 mins</option>
                <option value={90}>Every 90 mins</option>
              </select>
            </div>

            <div className="tracker-row">
              <div className="tracker-count">
                <span>Glasses today:</span>
                <strong>{glassesToday} 🥤</strong>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setGlassesToday((g) => g + 1);
                  onCompleteWater();
                }}
              >
                + Log Glass
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Break Section */}
      <div className="reminder-card break-card">
        <div className="card-header">
          <div className="title-row">
            <Sun className="card-icon text-amber" size={20} />
            <div>
              <div className="card-title">Mindful Break Reminder</div>
              <div className="card-subtitle">Next break: {formatMinutesLeft(breakSettings.nextDue)}</div>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={breakSettings.enabled}
              onChange={(e) => onUpdateBreak({ enabled: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>

        {breakSettings.enabled && (
          <div className="card-body">
            <div className="setting-sub-row">
              <label>Work Interval:</label>
              <select
                value={breakSettings.intervalMinutes}
                onChange={(e) =>
                  onUpdateBreak({
                    intervalMinutes: parseInt(e.target.value, 10),
                    nextDue: Date.now() + parseInt(e.target.value, 10) * 60000,
                  })
                }
                className="select-dropdown"
              >
                <option value={30}>Every 30 mins</option>
                <option value={45}>Every 45 mins</option>
                <option value={60}>Every 60 mins (Standard)</option>
                <option value={90}>Every 90 mins</option>
              </select>
            </div>

            <div className="setting-sub-row">
              <label>Break Duration:</label>
              <select
                value={breakSettings.breakDurationMinutes}
                onChange={(e) =>
                  onUpdateBreak({ breakDurationMinutes: parseInt(e.target.value, 10) })
                }
                className="select-dropdown"
              >
                <option value={3}>3 minutes (Micro-stretch)</option>
                <option value={5}>5 minutes (Standard)</option>
                <option value={10}>10 minutes (Walk & rest)</option>
              </select>
            </div>

            <div className="quick-action-row">
              <button className="btn btn-sm btn-secondary w-full" onClick={onStartBreakTimer}>
                <Sparkles size={14} /> Start {breakSettings.breakDurationMinutes}m Break Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
