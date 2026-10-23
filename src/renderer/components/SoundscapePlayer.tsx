import React, { useState, useEffect } from 'react';
import { SoundscapeService } from '../services/soundscape-service';
import { SoundscapePreset } from '../../shared/types';
import { CloudRain, Coffee, Trees, Waves, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface SoundscapePlayerProps {
  compact?: boolean;
}

export const SoundscapePlayer: React.FC<SoundscapePlayerProps> = ({ compact = false }) => {
  const [preset, setPreset] = useState<SoundscapePreset>(SoundscapeService.getCurrentPreset());
  const [volume, setVolume] = useState<number>(SoundscapeService.getVolume());
  const [energy, setEnergy] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    const updateMeter = () => {
      setEnergy(SoundscapeService.getAudioEnergy());
      animId = requestAnimationFrame(updateMeter);
    };
    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSelect = (p: SoundscapePreset) => {
    if (preset === p) {
      SoundscapeService.stop();
      setPreset('off');
    } else {
      SoundscapeService.play(p);
      setPreset(p);
    }
  };

  const handleVolume = (val: number) => {
    setVolume(val);
    SoundscapeService.setVolume(val);
  };

  const presets: { id: SoundscapePreset; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'rain', label: 'Lo-Fi Rain', icon: <CloudRain size={16} />, desc: 'Gentle soothing rainfall' },
    { id: 'cafe', label: 'Cozy Cafe', icon: <Coffee size={16} />, desc: 'Warm ambient coffeehouse murmur' },
    { id: 'forest', label: 'Pine Forest', icon: <Trees size={16} />, desc: 'Wind whispering through trees' },
    { id: 'binaural', label: 'Alpha Focus', icon: <Waves size={16} />, desc: '10Hz binaural beats for flow' },
  ];

  if (compact) {
    return (
      <div className="soundscape-compact-row">
        {presets.map((p) => {
          const isActive = preset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`soundscape-pill-btn ${isActive ? 'active' : ''}`}
              title={p.desc}
            >
              {p.icon}
              <span>{p.label}</span>
              {isActive && (
                <div
                  className="soundscape-mini-equalizer"
                  style={{ transform: `scaleY(${0.3 + energy * 0.7})` }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="soundscape-player-card">
      <div className="soundscape-header">
        <div className="soundscape-title-box">
          <Sparkles size={18} className="accent-icon" />
          <div>
            <h4 className="card-title">Ambient Focus Soundscapes</h4>
            <p className="card-subtitle">Procedural, zero-lag Web Audio for deep flow state</p>
          </div>
        </div>
        {preset !== 'off' && (
          <div className="soundscape-live-badge">
            <span className="pulse-dot" />
            <span>PLAYING</span>
          </div>
        )}
      </div>

      <div className="soundscape-grid">
        {presets.map((p) => {
          const isActive = preset === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`soundscape-option-card ${isActive ? 'selected' : ''}`}
            >
              <div className="soundscape-icon-wrap">{p.icon}</div>
              <div className="soundscape-info">
                <span className="soundscape-name">{p.label}</span>
                <span className="soundscape-desc">{p.desc}</span>
              </div>
              {isActive && (
                <div className="soundscape-visualizer-bars">
                  <span style={{ height: `${Math.min(100, Math.max(20, energy * 120))}%` }} />
                  <span style={{ height: `${Math.min(100, Math.max(30, energy * 160))}%` }} />
                  <span style={{ height: `${Math.min(100, Math.max(15, energy * 90))}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="soundscape-volume-bar">
        {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => handleVolume(parseFloat(e.target.value))}
          className="mac-slider"
        />
        <span className="volume-label">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
};
