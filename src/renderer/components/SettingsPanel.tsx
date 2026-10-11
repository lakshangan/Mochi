import React, { useState } from 'react';
import { AppSettings } from '../../shared/types';
import { Settings, Sliders, Shield, Volume2, Sparkles, RefreshCw, Key } from 'lucide-react';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  return (
    <div className="panel-container settings-scroll">
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
            <div className="setting-item vertical">
              <div className="setting-label-col">
                <span className="setting-name">API Key</span>
                <span className="setting-desc">Stored strictly locally in encrypted user data</span>
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
    </div>
  );
};
