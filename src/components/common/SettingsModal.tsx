import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { geminiService } from '../../services/gemini';
import { X, Key, Shield, Eye, Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'failed'; error?: string }>({ status: 'idle' });

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const key = formData.geminiApiKey.trim();
    if (!key) return;
    setTestResult({ status: 'testing' });
    const res = await geminiService.testConnection(key, formData.selectedModel);
    if (res.success) {
      setTestResult({ status: 'success' });
      // Auto-save verified key to settings state and store immediately
      const updated = { ...formData, geminiApiKey: key };
      setFormData(updated);
      onSave(updated);
    } else {
      setTestResult({ status: 'failed', error: res.error });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    // If in Electron, update content protection & opacity immediately
    if (window.electronAPI) {
      window.electronAPI.setContentProtection(formData.contentProtection);
      window.electronAPI.setOpacity(formData.hudOpacity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Application Settings</h2>
              <p className="text-xs text-slate-400">Configure AI Intelligence & Stealth Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-400" />
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline normal-case text-[11px]"
              >
                Get Free Key ↗
              </a>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={formData.geminiApiKey}
                onChange={(e) => {
                  setFormData({ ...formData, geminiApiKey: e.target.value });
                  setTestResult({ status: 'idle' });
                }}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 font-mono"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={!formData.geminiApiKey || testResult.status === 'testing'}
                className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition disabled:opacity-50"
              >
                {testResult.status === 'testing' ? 'Testing...' : 'Test Key'}
              </button>
            </div>
            {testResult.status === 'success' && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> API Key validated & auto-saved to disk!
              </p>
            )}
            {testResult.status === 'failed' && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Connection Failed
                </div>
                <p className="text-[11px] text-rose-300/90 font-mono break-all leading-relaxed">
                  {testResult.error || 'Invalid API key or network failure. Verify key at aistudio.google.com/app/apikey'}
                </p>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Gemini Model
            </label>
            <select
              value={formData.selectedModel}
              onChange={(e) => setFormData({ ...formData, selectedModel: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended — Free, Real-Time Low Latency)</option>
              <option value="gemini-3.7-flash">Gemini 3.7 Flash (Latest Advanced Reasoning & Speed)</option>
            </select>
          </div>

          {/* Google Search Grounding Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="space-y-0.5 pr-4">
              <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                Google Search Grounding
                <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded font-mono">Live Web</span>
              </div>
              <p className="text-xs text-slate-400">
                Allows AI to fetch real-time web info for unknown APIs, company facts, and interview questions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSearchGrounding}
                onChange={(e) => setFormData({ ...formData, enableSearchGrounding: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Screen Share Protection */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="space-y-0.5 pr-4">
              <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Anti-Detection Screen Protection
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono">Stealth</span>
              </div>
              <p className="text-xs text-slate-400">
                Prevents Zoom, Google Meet, and MS Teams from capturing this window when you share your full screen.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contentProtection}
                onChange={(e) => setFormData({ ...formData, contentProtection: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* HUD Opacity Slider */}
          <div className="space-y-2 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-sm font-medium text-slate-200">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" />
                HUD Stealth Opacity
              </span>
              <span className="font-mono text-sky-400 text-xs">{Math.round(formData.hudOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="1.0"
              step="0.05"
              value={formData.hudOpacity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, hudOpacity: val });
                document.documentElement.style.setProperty('--hud-opacity', val.toString());
              }}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Ghost (25%)</span>
              <span>Balanced (80%)</span>
              <span>Solid (100%)</span>
            </div>
          </div>

          {/* Global Hotkeys Cheat Sheet */}
          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Parakeet Stealth Global Hotkeys
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span>Toggle HUD / Hub:</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-semibold">Ctrl + \</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span>Emergency Hide / Reveal:</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-semibold">Ctrl + Shift + H</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span>Generate Answer:</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-semibold">Ctrl + Shift + Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span>Snip & Solve Screen OCR:</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-semibold">Ctrl + Shift + S</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span>Mute / Unmute Mic:</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-semibold">Ctrl + Shift + M</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span>Toggle Auto-Answer:</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-semibold">Ctrl + Shift + A</kbd>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-lg shadow-sky-500/20 transition"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
