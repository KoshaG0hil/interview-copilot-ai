import React from 'react';
import { PlatformProfileType, AppSettings } from '../../types';
import { Shield, Video, CheckCircle2, ExternalLink, X, Monitor, Volume2, Eye } from 'lucide-react';

interface PlatformProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSelectPlatform: (platform: PlatformProfileType) => void;
}

export const PlatformProfilesModal: React.FC<PlatformProfilesModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSelectPlatform,
}) => {
  if (!isOpen) return null;

  const platforms: {
    id: PlatformProfileType;
    name: string;
    badge: string;
    color: string;
    description: string;
    screenShareTips: string;
    audioTips: string;
    positioningAdvice: string;
  }[] = [
    {
      id: 'zoom',
      name: 'Zoom Workplace Profile',
      badge: 'Certified Stealth',
      color: 'from-blue-500/20 to-sky-500/20 border-blue-500/30',
      description: 'Optimized for Zoom meetings with OS-level window exclusion.',
      screenShareTips: 'Whether you share "Entire Desktop" or an "Application Window", Zoom will skip this overlay window completely.',
      audioTips: 'Interviewer audio from your speakers/headphones and your microphone are transcribed in real-time.',
      positioningAdvice: 'Dock the HUD directly below your webcam and center Zoom\'s speaker video bar above it for 100% natural eye contact.',
    },
    {
      id: 'teams',
      name: 'Microsoft Teams Profile',
      badge: 'Teams Certified',
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
      description: 'Configured for Microsoft Teams desktop client and web app.',
      screenShareTips: 'Protects against Teams screen-share capture. The window renders as transparent desktop space on the interviewer\'s monitor.',
      audioTips: 'Works natively with Teams audio output and system default input device.',
      positioningAdvice: 'Align directly over the Teams meeting header or right underneath the camera lens.',
    },
    {
      id: 'google-meet',
      name: 'Google Meet Profile',
      badge: 'Chrome & Meet Ready',
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
      description: 'Engineered for Google Meet browser calls in Chrome / Edge.',
      screenShareTips: 'When choosing "Entire Screen" in Google Meet, Chrome\'s screen capture API bypasses this window due to OS Display Affinity.',
      audioTips: 'Use your standard headset or laptop mic for continuous speech recognition.',
      positioningAdvice: 'Pin the interviewer\'s video tile directly behind this floating teleprompter.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Interview Platform Profiles (Zoom, Teams, Google Meet)
              </h2>
              <p className="text-xs text-slate-400">
                Select your meeting platform to activate tailored screen-protection and audio configs.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((p) => {
              const isSelected = settings.platformProfile === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPlatform(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-gradient-to-b from-sky-500/15 to-slate-900 border-sky-500 shadow-lg shadow-sky-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                        {p.badge}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{p.screenShareTips}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{p.positioningAdvice}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlatform(p.id);
                    }}
                    className={`w-full py-2 text-xs font-semibold rounded-xl transition ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Profile' : 'Select Profile'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Verification Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-emerald-400">
              <Shield className="w-3.5 h-3.5" /> Screen Share Invisibility Guarantee
            </span>
            <p className="leading-relaxed">
              When Stealth HUD mode is launched, the app tells Windows and macOS: <code className="text-sky-300">SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)</code>. Even if the interviewer asks you to share your full desktop screen, Zoom, Microsoft Teams, and Google Meet are restricted by the operating system from capturing the HUD pixels.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
