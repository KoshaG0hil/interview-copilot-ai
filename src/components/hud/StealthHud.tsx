import React, { useState, useEffect } from 'react';
import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  ResponseMode,
  CueCard,
  AppSettings,
  TranscriptItem,
  KnowledgeDocument,
  CustomQAItem,
} from '../../types';
import { geminiService } from '../../services/gemini';
import { speechService } from '../../services/speechRecognition';
import { CueCardView } from './CueCardView';
import { TranscriptStream } from './TranscriptStream';
import { QuickActionToolbar } from './QuickActionToolbar';
import {
  ShieldCheck,
  Sparkles,
  Send,
  Loader2,
  X,
  Minus,
  Mic,
} from 'lucide-react';

interface StealthHudProps {
  profile: CandidateProfile;
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  documents?: KnowledgeDocument[];
  customQAs?: CustomQAItem[];
  onUpdateSettings: (settings: AppSettings) => void;
  onSwitchToHub: () => void;
}

export const StealthHud: React.FC<StealthHudProps> = ({
  profile,
  stories,
  jobContext,
  settings,
  documents = [],
  customQAs = [],
  onUpdateSettings,
  onSwitchToHub,
}) => {
  const [activeMode, setActiveMode] = useState<ResponseMode>('behavioral');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [history, setHistory] = useState<CueCard[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'interviewer' | 'candidate'>('interviewer');
  const [activeTab, setActiveTab] = useState<'card' | 'transcript' | 'history'>('card');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Initialize Speech Recognition & Global Shortcuts
  useEffect(() => {
    // Start listening by default in live HUD if supported
    if (speechService.checkSupport()) {
      speechService.start((data) => {
        setTranscripts((prev) => {
          const id = 'tr-' + Date.now();
          const newItem: TranscriptItem = {
            id,
            speaker: data.speaker,
            text: data.text,
            timestamp: Date.now(),
            isFinal: data.isFinal,
          };

          if (!data.isFinal && prev.length > 0 && !prev[prev.length - 1].isFinal) {
            return [...prev.slice(0, -1), newItem];
          }
          return [...prev, newItem];
        });

        // If auto-answer is enabled and a full question is detected
        if (
          settings.autoAnswerOnQuestionDetected &&
          data.isFinal &&
          data.speaker === 'interviewer' &&
          data.text.endsWith('?')
        ) {
          handleGenerateAnswer(data.text);
        }
      });
      setIsListening(true);
    }

    // Register Electron Global Shortcut listeners
    const cleanupShortcuts = window.electronAPI?.onGlobalShortcut((action) => {
      if (action === 'trigger-answer') {
        const latestQuestion =
          transcripts.filter((t) => t.speaker === 'interviewer').slice(-1)[0]?.text || currentQuestion;
        if (latestQuestion) {
          handleGenerateAnswer(latestQuestion);
        }
      } else if (action === 'trigger-screen-capture') {
        handleScreenCapture();
      } else if (action === 'clear-transcript') {
        setTranscripts([]);
      } else if (action === 'toggle-mode-hub') {
        onSwitchToHub();
      }
    });

    return () => {
      speechService.stop();
      cleanupShortcuts?.();
    };
  }, [settings, transcripts, currentQuestion]);

  const handleGenerateAnswer = async (
    questionToSolve: string = currentQuestion,
    screenImageBase64?: string
  ) => {
    if (!questionToSolve.trim() && !screenImageBase64) return;
    if (!settings.geminiApiKey) {
      notify('Please configure your Gemini API Key in Settings.');
      return;
    }

    try {
      setIsLoading(true);
      setActiveTab('card');
      const card = await geminiService.generateCueCard({
        question: questionToSolve,
        mode: activeMode,
        profile,
        stories,
        jobContext,
        settings,
        documents,
        customQAs,
        screenImageBase64,
      });

      setCueCard(card);
      setHistory((prev) => [card, ...prev.slice(0, 30)]);
      setCurrentQuestion('');
    } catch (err: any) {
      notify('Error generating cue card: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenCapture = async () => {
    if (!window.electronAPI?.captureScreen) {
      notify('Screen capture is available in Electron desktop mode.');
      return;
    }

    notify('Capturing screen for coding question analysis...');
    const imageBase64 = await window.electronAPI.captureScreen();
    if (imageBase64) {
      handleGenerateAnswer(
        activeMode === 'assessment'
          ? 'Analyze this online assessment problem on screen. Provide optimal solution, Big-O complexity, and edge cases.'
          : 'Analyze this question/problem on screen and provide the optimal answer.',
        imageBase64
      );
    } else {
      notify('Screen capture failed.');
    }
  };

  const notify = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const toggleMic = () => {
    if (isListening) {
      speechService.stop();
      setIsListening(false);
    } else {
      speechService.start((data) => {
        setTranscripts((prev) => [
          ...prev,
          {
            id: 'tr-' + Date.now(),
            speaker: data.speaker,
            text: data.text,
            timestamp: Date.now(),
            isFinal: data.isFinal,
          },
        ]);
      });
      setIsListening(true);
    }
  };

  const toggleSpeaker = () => {
    const next = currentSpeaker === 'interviewer' ? 'candidate' : 'interviewer';
    setCurrentSpeaker(next);
    speechService.setSpeaker(next);
  };

  const platformBadge =
    settings.platformProfile === 'teams'
      ? 'TEAMS PROTECTED'
      : settings.platformProfile === 'google-meet'
      ? 'MEET PROTECTED'
      : 'ZOOM PROTECTED';

  return (
    <div
      className="glass-hud flex flex-col h-screen w-screen overflow-hidden text-slate-100 rounded-xl"
      style={{
        opacity: settings.hudOpacity,
      }}
    >
      {/* Draggable Top Bar with Stealth & Platform Indicator */}
      <div className="window-drag-region h-8 px-3 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>{platformBadge}</span>
          </div>
          {jobContext.companyName && (
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
              @{jobContext.companyName}
            </span>
          )}
        </div>

        {/* Navigation Tabs in Header */}
        <div className="window-no-drag flex items-center gap-1">
          <button
            onClick={() => setActiveTab('card')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              activeTab === 'card'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cue Card
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
              activeTab === 'transcript'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>Audio ({transcripts.length})</span>
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                activeTab === 'history'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Past ({history.length})
            </button>
          )}
        </div>

        {/* Window Controls */}
        <div className="window-no-drag flex items-center gap-1">
          <button
            onClick={() => window.electronAPI?.minimizeWindow()}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSwitchToHub()}
            className="p-1 text-slate-400 hover:text-sky-300 rounded"
            title="Exit HUD to Knowledge Hub"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        {/* Status Notification Toast */}
        {statusNotification && (
          <div className="p-2 bg-sky-500/20 border border-sky-500/30 rounded-lg text-xs text-sky-200 flex items-center gap-1.5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Tab 1: Active Cue Card */}
        {activeTab === 'card' && (
          <div>
            {isLoading ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                <p className="text-xs font-medium">Synthesizing cue-card from profile & web grounding...</p>
              </div>
            ) : cueCard ? (
              <CueCardView card={cueCard} />
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <Sparkles className="w-7 h-7 mb-2 text-sky-400/40" />
                <p className="text-xs font-semibold text-slate-300">Live Stealth Teleprompter Ready</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  Audio is listening. Or press <kbd className="font-mono text-sky-400">Ctrl+Shift+Space</kbd> to solve latest question, or type below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Audio Transcript Stream */}
        {activeTab === 'transcript' && (
          <div className="h-[220px]">
            <TranscriptStream
              transcripts={transcripts}
              isListening={isListening}
              onSelectQuestion={(q) => handleGenerateAnswer(q)}
              onClear={() => setTranscripts([])}
            />
          </div>
        )}

        {/* Tab 3: History of Generated Cue Cards */}
        {activeTab === 'history' && (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {history.map((card, i) => (
              <div
                key={card.id || i}
                onClick={() => {
                  setCueCard(card);
                  setActiveTab('card');
                }}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-sky-400 uppercase">{card.mode}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(card.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="font-semibold text-slate-200 line-clamp-1">{card.question}</p>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{card.headline}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Question Quick Input Bar */}
      <div className="px-2.5 py-1.5 bg-slate-950/70 border-t border-slate-800/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateAnswer(currentQuestion);
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Type interview question or paste code problem (Enter to solve)..."
            className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !currentQuestion.trim()}
            className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 transition disabled:opacity-40 shrink-0"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>

      {/* Persistent Bottom Quick Action Toolbar */}
      <QuickActionToolbar
        currentMode={activeMode}
        onSelectMode={(m) => setActiveMode(m)}
        isListening={isListening}
        onToggleMic={toggleMic}
        currentSpeaker={currentSpeaker}
        onToggleSpeaker={toggleSpeaker}
        onCaptureScreen={handleScreenCapture}
        opacity={settings.hudOpacity}
        onChangeOpacity={(newOpacity) => {
          onUpdateSettings({ ...settings, hudOpacity: newOpacity });
          if (window.electronAPI) window.electronAPI.setOpacity(newOpacity);
        }}
        onSwitchToHub={onSwitchToHub}
        platformProfile={settings.platformProfile}
      />
    </div>
  );
};
