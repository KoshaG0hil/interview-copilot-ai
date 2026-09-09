import React, { useState } from 'react';
import {
  BookOpen,
  Key,
  Shield,
  FileText,
  Building2,
  PlayCircle,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  HardDrive,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Getting Your Free Google Gemini API Key',
      icon: Key,
      color: 'text-amber-400',
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            The app uses official Google Gemini models (Gemini 2.5 Flash / 3.7 Flash) with <strong>Live Google Search Grounding</strong>. Google provides a generous <strong>free tier</strong> that allows hundreds of requests per minute without any credit card required!
          </p>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
            <div className="font-semibold text-slate-200">How to get your free key in 30 seconds:</div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>
                Visit{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  aistudio.google.com/app/apikey <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>Sign in with any standard Google account.</li>
              <li>Click the blue <strong>"Create API key"</strong> button.</li>
              <li>Copy the generated key (starts with <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">AIzaSy...</code>).</li>
              <li>
                Click the <strong>Settings</strong> icon in this app and paste it into the API Key field!
              </li>
            </ol>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-sky-500/20"
            >
              <Key className="w-3.5 h-3.5" /> Open Settings & Enter Key
            </button>
          </div>
        </div>
      ),
    },
    {
      title: '2. Uploading Your Resume & Knowledge Base',
      icon: FileText,
      color: 'text-sky-400',
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Every candidate is unique. Rather than giving generic advice, Interview Copilot anchors every answer to <strong>your actual background</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] block">
                Resume Ingestion
              </span>
              <p>
                Drag and drop your resume (<code className="text-slate-400">.docx</code>, <code className="text-slate-400">.doc</code>, <code className="text-slate-400">.pdf</code>, <code className="text-slate-400">.txt</code>, or <code className="text-slate-400">.md</code>). The AI parses your technical skills, work history, and summary automatically.
              </p>
            </div>
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px] block">
                Additional Knowledge Documents
              </span>
              <p>
                Attach supplementary documents: system design notes, technical cheat sheets, portfolio links, or custom architecture writeups.
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-300 flex items-start gap-2">
            <HardDrive className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <strong className="block font-semibold">100% Persistent Local Storage</strong>
              Whatever documents or resumes you upload are stored directly on your computer's local disk. They will remain safely saved across app restarts until you choose to delete them.
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '3. Target Company & Job Intelligence',
      icon: Building2,
      color: 'text-indigo-400',
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Interviews are won when you demonstrate alignment with the company's specific product, engineering stack, and core values.
          </p>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-slate-200">How to use Company Intelligence:</div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>Go to the <strong>"Company & JD"</strong> tab.</li>
              <li>Enter the company name (e.g. <em>Stripe</em>, <em>Google</em>, <em>OpenAI</em>, or any startup).</li>
              <li>Click <strong>"Live Web Research Company"</strong>. The AI performs live Google Search grounding to retrieve their stated values, recent major news/releases, and tech stack.</li>
              <li>Paste the Job Description (JD) so answers can directly map to required skills.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      title: '4. The STAR Behavioral Story Bank',
      icon: BookOpen,
      color: 'text-emerald-400',
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            In FAANG and top-tier behavioral rounds (Amazon Leadership Principles, Google Googlyness), interviewers evaluate you using the <strong>STAR framework</strong> (Situation, Task, Action, Result).
          </p>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-slate-200">Pre-loaded & Auto-Generated Stories:</div>
            <p>
              We've pre-loaded production-tested STAR stories (Monolith Migration, Outage Resolution). You can click <strong>"Auto-Extract STAR Stories"</strong> in the Resume tab to instantly convert your resume bullet points into full STAR stories with quantifiable metrics!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '5. Launching & Operating the Stealth Mode HUD',
      icon: Shield,
      color: 'text-sky-400',
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            When you're ready for your interview, click <strong>"Launch Stealth HUD"</strong> in the header or press <kbd className="font-mono text-sky-400 bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + \</kbd>.
          </p>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              Why It Is Screen-Share Protected:
            </div>
            <p className="text-slate-400 leading-relaxed">
              The window sets OS-level window display affinity (<code className="text-sky-300">setContentProtection(true)</code>). When sharing your screen in <strong>Zoom, Google Meet, Microsoft Teams, or Discord</strong>, the window is omitted from the stream so interviewers only see your desktop background!
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Essential Global Hotkeys (Works even inside Zoom/IDE):
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Toggle HUD / Hub:</span>
                <kbd className="font-mono text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + \</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Emergency Hide:</span>
                <kbd className="font-mono text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + Shift + H</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Quick Answer:</span>
                <kbd className="font-mono text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + Shift + Space</kbd>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span>Snip Screen OCR:</span>
                <kbd className="font-mono text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + Shift + S</kbd>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Interview Copilot AI — User Guide & Setup
              </h2>
              <p className="text-xs text-slate-400">
                Step {currentStep + 1} of {steps.length}: {current.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-sky-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {currentStep + 1}/{steps.length}
          </span>
        </div>

        {/* Step Content */}
        <div className="flex-1 p-6 overflow-y-auto">{current.content}</div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-sky-500/10"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Ready to Ace Interviews!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
