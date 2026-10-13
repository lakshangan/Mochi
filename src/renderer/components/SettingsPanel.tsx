import React, { useState } from 'react';
import mochiLogo from '../assets/mochi-logo.png';
import { AppSettings } from '../../shared/types';
import {
  Settings,
  Sliders,
  Shield,
  Volume2,
  Sparkles,
  RefreshCw,
  Key,
  EyeOff,
  Droplet,
  Sun,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Draw into 11x11 off-screen canvas
        const canvas = document.createElement('canvas');
        canvas.width = 11;
        canvas.height = 11;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and draw image scaled to 11x11
        ctx.clearRect(0, 0, 11, 11);
        ctx.drawImage(img, 0, 0, 11, 11);
        const imgData = ctx.getImageData(0, 0, 11, 11);
        const data = imgData.data;

        // Convert to 11x11 grid: 0 (off), 1 (cyan glow), 2 (accent magenta glow)
        const matrix: number[][] = [];
        for (let r = 0; r < 11; r++) {
          const row: number[] = [];
          for (let c = 0; c < 11; c++) {
            const idx = (r * 11 + c) * 4;
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];
            const alpha = data[idx + 3] / 255;

            // Perceived luminance
            const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) * alpha;

            if (luminance < 35 || alpha < 0.2) {
              row.push(0);
            } else if (luminance > 185) {
              row.push(2); // bright highlight dot
            } else {
              row.push(1); // regular glowing dot
            }
          }
          matrix.push(row);
        }

        onUpdateSettings({
          customOrbMatrix: matrix,
          useCustomOrbMatrix: true,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="panel-container settings-scroll">
      {/* Personalization Section */}
      <div className="settings-group">
        <div className="group-title">
          <Sparkles size={16} /> Personalization
        </div>
        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Your Name</span>
            <span className="setting-desc">How Mochi addresses you in greetings and focus nudges</span>
          </div>
          <input
            type="text"
            placeholder="e.g. Lakshan"
            value={settings.userName || ''}
            onChange={(e) => onUpdateSettings({ userName: e.target.value })}
            className="panel-input"
            style={{
              width: '130px',
              textAlign: 'right',
              padding: '6px 10px',
              fontSize: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
            }}
            maxLength={25}
          />
        </div>
      </div>

      {/* Visual & Pet Section */}
      <div className="settings-group">
        <div className="group-title">
          <Sliders size={16} /> Pet Appearance & Display
        </div>

        <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="setting-label-col">
              <span className="setting-name">Mascot Size</span>
              <span className="setting-desc">{settings.petSize}px (Compact & Screen-friendly)</span>
            </div>
            <input
              type="range"
              min="70"
              max="220"
              step="5"
              value={settings.petSize}
              onChange={(e) => onUpdateSettings({ petSize: parseInt(e.target.value, 10) })}
              className="range-slider"
              style={{ width: '130px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'Mini', size: 75 },
              { label: 'Small', size: 95 },
              { label: 'Compact', size: 115 },
              { label: 'Medium', size: 140 },
              { label: 'Standard', size: 170 },
            ].map((preset) => (
              <button
                key={preset.size}
                type="button"
                onClick={() => onUpdateSettings({ petSize: preset.size })}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: settings.petSize === preset.size ? '1px solid #00f7ff' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: settings.petSize === preset.size ? 'rgba(0, 247, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: settings.petSize === preset.size ? '#00f7ff' : 'rgba(255, 255, 255, 0.65)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label} ({preset.size}px)
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Opacity</span>
            <span className="setting-desc">{Math.round(settings.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={settings.opacity}
            onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
            className="range-slider"
          />
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Always On Top</span>
            <span className="setting-desc">Keep Mochi floating above other windows</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.alwaysOnTop}
              onChange={(e) => onUpdateSettings({ alwaysOnTop: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Deep Work (Hide Pet)</span>
            <span className="setting-desc">Tuck Mochi away for full-screen focus (accessible from status bar at top)</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={async () => {
              if (window.mochiApi) {
                await window.mochiApi.setPetVisible(false);
                await window.mochiApi.showNotification(
                  'Deep Work Mode Active 🧘',
                  'Mochi is hidden. Click the Mochi icon in the status bar at top near Wi-Fi/Battery to restore anytime!'
                );
              }
            }}
            style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <EyeOff size={12} />
            <span>Hide Pet</span>
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Auto Wandering</span>
            <span className="setting-desc">Mochi occasionally explores your screen</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoWander}
              onChange={(e) => onUpdateSettings({ autoWander: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Reduced Motion</span>
            <span className="setting-desc">Minimize bouncing and rapid animation</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      {/* Custom Orb Face (Dotted Dot-Matrix) Section */}
      <div className="settings-group">
        <div className="group-title">
          <ImageIcon size={16} /> Custom Orb Face (Dot-Matrix)
        </div>

        <div className="setting-item vertical">
          <div className="setting-label-col">
            <span className="setting-name">Upload Custom Image for Orb</span>
            <span className="setting-desc">
              Downsampled client-side into an ultra-lightweight 11×11 LED dot grid. Zero cloud upload, 100% private, and consumes &lt; 250 bytes of memory with zero extra RAM impact.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
            <label
              className="btn btn-sm btn-outline"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '11px',
              }}
            >
              <Upload size={13} />
              <span>Choose Image...</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>

            {settings.customOrbMatrix && settings.customOrbMatrix.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline text-danger"
                onClick={() => {
                  onUpdateSettings({
                    customOrbMatrix: undefined,
                    useCustomOrbMatrix: false,
                  });
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', fontSize: '11px' }}
              >
                <Trash2 size={12} />
                <span>Reset to Default Face</span>
              </button>
            )}
          </div>
        </div>

        {/* 11x11 Live Dot-Matrix Preview Grid */}
        {settings.customOrbMatrix && settings.customOrbMatrix.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.45)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginTop: '6px',
            }}
          >
            {/* The 11x11 LED canvas representation */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(11, 7px)',
                gridTemplateRows: 'repeat(11, 7px)',
                gap: '2px',
                padding: '6px',
                background: 'rgba(10, 12, 18, 0.9)',
                borderRadius: '8px',
                border: '1px solid rgba(0, 247, 255, 0.25)',
                boxShadow: '0 0 16px rgba(0, 247, 255, 0.2)',
              }}
            >
              {settings.customOrbMatrix.flatMap((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '2px',
                      background:
                        val === 2
                          ? '#ff3b88'
                          : val === 1
                          ? '#00f7ff'
                          : 'rgba(255, 255, 255, 0.05)',
                      boxShadow:
                        val === 2
                          ? '0 0 4px #ff3b88'
                          : val === 1
                          ? '0 0 4px #00f7ff'
                          : 'none',
                    }}
                  />
                ))
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                  Enable Custom Face
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.useCustomOrbMatrix)}
                    onChange={(e) => onUpdateSettings({ useCustomOrbMatrix: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '4px' }}>
                Active on Mochi&apos;s face when idle & in flow. Living emotions (angry, celebrating, hydrated) still overlay dynamically!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drink Water & Self-Care Section */}
      <div className="settings-group">
        <div className="group-title">
          <Droplet size={16} /> Drink Water & Self-Care
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Hydration Reminders</span>
            <span className="setting-desc">Regular reminders to drink fresh water & stay energized</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.waterReminders.enabled}
              onChange={(e) =>
                onUpdateSettings({
                  waterReminders: {
                    ...settings.waterReminders,
                    enabled: e.target.checked,
                    nextDue: Date.now() + (settings.waterReminders.intervalMinutes || 45) * 60000,
                  },
                })
              }
            />
            <span className="slider" />
          </label>
        </div>

        {settings.waterReminders.enabled && (
          <>
            <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="setting-label-col">
                  <span className="setting-name">Water Interval</span>
                  <span className="setting-desc">Every {settings.waterReminders.intervalMinutes} minutes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => {
                      const next = Math.max(5, (settings.waterReminders.intervalMinutes || 45) - 5);
                      onUpdateSettings({
                        waterReminders: {
                          ...settings.waterReminders,
                          intervalMinutes: next,
                          nextDue: Date.now() + next * 60000,
                        },
                      });
                    }}
                  >
                    -5m
                  </button>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={settings.waterReminders.intervalMinutes}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value || '1', 10));
                      onUpdateSettings({
                        waterReminders: {
                          ...settings.waterReminders,
                          intervalMinutes: val,
                          nextDue: Date.now() + val * 60000,
                        },
                      });
                    }}
                    style={{
                      width: '55px',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      textAlign: 'center',
                      fontSize: '12px',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>min</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ padding: '2px 8px', fontSize: '11px' }}
                    onClick={() => {
                      const next = Math.min(240, (settings.waterReminders.intervalMinutes || 45) + 5);
                      onUpdateSettings({
                        waterReminders: {
                          ...settings.waterReminders,
                          intervalMinutes: next,
                          nextDue: Date.now() + next * 60000,
                        },
                      });
                    }}
                  >
                    +5m
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[15, 20, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        waterReminders: {
                          ...settings.waterReminders,
                          intervalMinutes: mins,
                          nextDue: Date.now() + mins * 60000,
                        },
                      })
                    }
                    style={{
                      padding: '2.5px 8px',
                      fontSize: '11px',
                      borderRadius: '12px',
                      border:
                        settings.waterReminders.intervalMinutes === mins
                          ? '1px solid #00f7ff'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                      background:
                        settings.waterReminders.intervalMinutes === mins
                          ? 'rgba(0, 247, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                      color: settings.waterReminders.intervalMinutes === mins ? '#00f7ff' : 'rgba(255, 255, 255, 0.75)',
                      cursor: 'pointer',
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Full-Screen Alert Toggle */}
            <div className="setting-item">
              <div className="setting-label-col">
                <span className="setting-name">Full-Screen Alert</span>
                <span className="setting-desc">Show prominent unmissable full-screen reminder when it's time to drink water</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    window.mochiApi?.triggerFullScreenAlertPreview?.();
                  }}
                  title="Test the unmissable full-screen alert"
                  style={{
                    fontSize: '11px',
                    padding: '3px 9px',
                    border: '1px solid rgba(0, 247, 255, 0.4)',
                    color: '#00f7ff',
                    background: 'rgba(0, 247, 255, 0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Preview Alert
                </button>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.waterReminders.fullScreenAlert)}
                    onChange={(e) =>
                      onUpdateSettings({
                        waterReminders: {
                          ...settings.waterReminders,
                          fullScreenAlert: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* Water Logging Tracker & Accountability Nudge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(0, 247, 255, 0.06)',
                border: '1px solid rgba(0, 247, 255, 0.18)',
                marginTop: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#00f7ff' }}>
                    Hydration Log Tracker 💧
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '2px' }}>
                    Today: <strong>{settings.waterReminders.todayCount || 0} glasses</strong> • Total logged: <strong>{settings.waterReminders.loggedCount || 0} times</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={async () => {
                    const todayDateStr = new Date().toISOString().slice(0, 10);
                    const isNewDay = settings.waterReminders.lastLoggedDate !== todayDateStr;
                    const newToday = isNewDay ? 1 : (settings.waterReminders.todayCount || 0) + 1;
                    const newTotal = (settings.waterReminders.loggedCount || 0) + 1;
                    onUpdateSettings({
                      waterReminders: {
                        ...settings.waterReminders,
                        loggedCount: newTotal,
                        todayCount: newToday,
                        lastLoggedDate: todayDateStr,
                        lastCompleted: Date.now(),
                        nextDue: Date.now() + (settings.waterReminders.intervalMinutes || 45) * 60000,
                      },
                    });
                    if (window.mochiApi) {
                      await window.mochiApi.setPetState('hydrated');
                      setTimeout(() => window.mochiApi?.setPetState('idle'), 8500);
                    }
                  }}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  + Log Drink Now 🥤
                </button>
              </div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.55)', lineHeight: '1.35', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
                💡 <em>Accountability Nudge:</em> If you snooze or dismiss a reminder without logging your drink, Mochi will make an angry face 😠 for a few seconds to keep you focused on your health!
              </div>
            </div>
          </>
        )}

        {/* Mindful Break & Care */}
        <div className="setting-item" style={{ marginTop: '8px' }}>
          <div className="setting-label-col">
            <span className="setting-name">Mindful Care Breaks</span>
            <span className="setting-desc">Reminders to rest your eyes & stretch</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.breakReminders.enabled}
              onChange={(e) =>
                onUpdateSettings({
                  breakReminders: {
                    ...settings.breakReminders,
                    enabled: e.target.checked,
                    nextDue: Date.now() + (settings.breakReminders.intervalMinutes || 60) * 60000,
                  },
                })
              }
            />
            <span className="slider" />
          </label>
        </div>

        {settings.breakReminders.enabled && (
          <div className="setting-item">
            <div className="setting-label-col">
              <span className="setting-name">Full-Screen Break Alert</span>
              <span className="setting-desc">Unmissable full-screen reminder to step away and rest</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={Boolean(settings.breakReminders.fullScreenAlert)}
                onChange={(e) =>
                  onUpdateSettings({
                    breakReminders: {
                      ...settings.breakReminders,
                      fullScreenAlert: e.target.checked,
                    },
                  })
                }
              />
              <span className="slider" />
            </label>
          </div>
        )}
      </div>

      {/* Audio & Sound Section */}
      <div className="settings-group">
        <div className="group-title">
          <Volume2 size={16} /> Sound & Audio Chimes
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Enable Sound Effects</span>
            <span className="setting-desc">Gentle procedural chimes for timers & pet chirps</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>

        {settings.soundEnabled && (
          <div className="setting-item">
            <div className="setting-label-col">
              <span className="setting-name">Volume</span>
              <span className="setting-desc">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
              className="range-slider"
            />
          </div>
        )}
      </div>

      {/* Optional AI Configuration Section */}
      <div className="settings-group">
        <div className="group-title">
          <Key size={16} /> Optional AI Provider
        </div>

        <div className="setting-item vertical">
          <div className="setting-label-col">
            <span className="setting-name">Provider</span>
            <span className="setting-desc">
              Core Mochi features operate 100% offline without an external API key.
            </span>
          </div>
          <select
            value={settings.ai.provider}
            onChange={(e) =>
              onUpdateSettings({
                ai: { ...settings.ai, provider: e.target.value as any },
              })
            }
            className="select-dropdown w-full"
          >
            <option value="offline-local">Offline Local Heuristic (No Key Needed)</option>
            <option value="openai">OpenAI Compatible (GPT-4o / custom endpoint)</option>
          </select>
        </div>

        {settings.ai.provider === 'openai' && (
          <>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                fontSize: '11px',
                color: '#fef08a',
                lineHeight: '1.4',
                marginTop: '4px',
              }}
            >
              <strong>Privacy Notice:</strong> When OpenAI is selected, user chat queries are sent off-device to OpenAI&apos;s servers. Your API key is encrypted on disk using OS safeStorage (macOS Keychain / Windows DPAPI / Linux Secret Service) and executed exclusively via the background main process.
            </div>

            <div className="setting-item vertical">
              <div className="setting-label-col">
                <span className="setting-name">API Key</span>
                <span className="setting-desc">Encrypted with OS safeStorage at rest</span>
              </div>
              <div className="input-with-button">
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={settings.ai.apiKey || ''}
                  onChange={(e) =>
                    onUpdateSettings({
                      ai: { ...settings.ai, apiKey: e.target.value },
                    })
                  }
                  className="text-input"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                >
                  {apiKeyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="setting-item vertical">
              <div className="setting-label-col">
                <span className="setting-name">Model</span>
              </div>
              <input
                type="text"
                placeholder="gpt-4o-mini"
                value={settings.ai.model || ''}
                onChange={(e) =>
                  onUpdateSettings({
                    ai: { ...settings.ai, model: e.target.value },
                  })
                }
                className="text-input"
              />
            </div>
          </>
        )}
      </div>

      {/* System & Data Management */}
      <div className="settings-group">
        <div className="group-title">
          <Shield size={16} /> System & Data
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Launch at Login</span>
            <span className="setting-desc">Start Mochi Companion when you log into your desktop</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.launchAtLogin}
              onChange={(e) => onUpdateSettings({ launchAtLogin: e.target.checked })}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label-col">
            <span className="setting-name">Reset Application Data</span>
            <span className="setting-desc">Clear local tasks, notes, and preferences</span>
          </div>
          <button
            className="btn btn-sm btn-outline text-danger"
            onClick={() => {
              if (confirm('Reset all Mochi companion data and restart with defaults?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            <RefreshCw size={13} /> Reset All
          </button>
        </div>
      </div>

      {/* About Mochi Companion */}
      <div className="settings-group" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <img
          src={mochiLogo}
          alt="Mochi Logo"
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 16px rgba(0, 247, 255, 0.35)' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Mochi Desktop Companion</span>
            <span style={{ fontSize: '10px', background: 'rgba(0, 247, 255, 0.15)', color: '#00f7ff', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>v1.0.0</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
            Universal AI Desktop Companion for macOS • Reacting to your flow
          </div>
        </div>
      </div>
    </div>
  );
};
