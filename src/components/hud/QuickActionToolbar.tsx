import React from 'react';
import { ResponseMode } from '../../types';
import { Mic, MicOff, Camera, MessageSquare, Code, Layers, Zap, Eye, LayoutDashboard, ShieldCheck } from 'lucide-react';

interface QuickActionToolbarProps {
  currentMode: ResponseMode;
  onSelectMode: (mode: ResponseMode) => void;
  isListening: boolean;
  onToggleMic: () => void;
  currentSpeaker: 'interviewer' | 'candidate';
  onToggleSpeaker: () => void;
  onCaptureScreen: () => void;
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
  onSwitchToHub: () => void;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  currentMode,
  onSelectMode,
  isListening,
  onToggleMic,
  currentSpeaker,
  onToggleSpeaker,
  onCaptureScreen,
  opacity,
  onChangeOpacity,
  onSwitchToHub,
}) => {
  const modes: { id: ResponseMode; label: string; icon: any }[] = [
    { id: 'behavioral', label: 'STAR', icon: MessageSquare },
    { id: 'technical', label: 'Code', icon: Code },
    { id: 'system-design', label: 'Design', icon: Layers },
    { id: 'quick-bullet', label: 'Rapid', icon: Zap },
  ];

  return (
    <div className="flex items-center justify-between gap-1.5 p-1.5 bg-slate-950/80 border-t border-slate-800 text-xs">
      {/* Mode Buttons */}
      <div className="flex items-center gap-1">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={`Switch to ${m.label} mode`}
            >
              <Icon className="w-3 h-3" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Audio, Screen Capture, Opacity, Hub Switch */}
      <div className="flex items-center gap-1">
        {/* Speaker Selector Toggle */}
        <button
          onClick={onToggleSpeaker}
          className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition border ${
            currentSpeaker === 'interviewer'
              ? 'bg-sky-950/60 border-sky-500/30 text-sky-300'
              : 'bg-indigo-950/60 border-indigo-500/30 text-indigo-300'
          }`}
          title="Toggle who is currently speaking"
        >
          {currentSpeaker === 'interviewer' ? 'IN: Interviewer' : 'IN: Candidate'}
        </button>

        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          className={`p-1.5 rounded-md transition ${
            isListening
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={isListening ? 'Mute Speech Capture' : 'Start Speech Capture'}
        >
          {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>

        {/* Screen Snip OCR */}
        <button
          onClick={onCaptureScreen}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition"
          title="Capture Screen for Coding Problem or Diagram (Ctrl+Shift+S)"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>

        {/* Opacity Cycle Button */}
        <button
          onClick={() => {
            const next = opacity >= 0.9 ? 0.4 : opacity >= 0.6 ? 0.95 : 0.7;
            onChangeOpacity(next);
          }}
          className="px-1.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-1 transition"
          title="Toggle Ghost Transparency"
        >
          <Eye className="w-3 h-3 text-sky-400" />
          <span>{Math.round(opacity * 100)}%</span>
        </button>

        {/* Switch back to Hub */}
        <button
          onClick={onSwitchToHub}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition"
          title="Return to Knowledge Hub"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
