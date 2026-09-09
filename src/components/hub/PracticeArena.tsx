import React, { useState } from 'react';
import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  ResponseMode,
  CueCard,
  AppSettings,
  KnowledgeDocument,
  CustomQAItem,
} from '../../types';
import { geminiService } from '../../services/gemini';
import { CueCardView } from '../hud/CueCardView';
import { PlayCircle, Sparkles, Code, MessageSquare, Layers, Zap, Loader2 } from 'lucide-react';

interface PracticeArenaProps {
  profile: CandidateProfile;
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  documents?: KnowledgeDocument[];
  customQAs?: CustomQAItem[];
}

const SAMPLE_QUESTIONS: { mode: ResponseMode; question: string }[] = [
  {
    mode: 'behavioral',
    question: 'Tell me about a time you had to deal with an unexpected system failure or high-severity outage.',
  },
  {
    mode: 'behavioral',
    question: 'Describe a situation where you strongly disagreed with a senior engineer or product manager. How did you handle it?',
  },
  {
    mode: 'technical',
    question: 'How would you implement an LRU Cache with O(1) get and put operations in memory?',
  },
  {
    mode: 'system-design',
    question: 'Design a distributed rate limiter that handles 100,000 requests per second across multiple data centers.',
  },
  {
    mode: 'quick-bullet',
    question: 'Why are you interested in joining our team at this specific stage?',
  },
];

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  profile,
  stories,
  jobContext,
  settings,
  documents = [],
  customQAs = [],
}) => {
  const [activeMode, setActiveMode] = useState<ResponseMode>('behavioral');
  const [currentQuestion, setCurrentQuestion] = useState(SAMPLE_QUESTIONS[0].question);
  const [isLoading, setIsLoading] = useState(false);
  const [cueCard, setCueCard] = useState<CueCard | null>(null);

  const handleRunSimulation = async (questionToAsk: string = currentQuestion) => {
    if (!questionToAsk.trim()) return;
    if (!settings.geminiApiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      return;
    }

    try {
      setIsLoading(true);
      const card = await geminiService.generateCueCard({
        question: questionToAsk,
        mode: activeMode,
        profile,
        stories,
        jobContext,
        settings,
        documents,
        customQAs,
      });
      setCueCard(card);
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sample: { mode: ResponseMode; question: string }) => {
    setActiveMode(sample.mode);
    setCurrentQuestion(sample.question);
    handleRunSimulation(sample.question);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-sky-400" />
          Mock Interview Simulation & Practice Arena
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Simulate questions before the live call. Preview exactly how cue cards and teleprompter bullet points will appear in your Stealth HUD.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Input & Presets */}
        <div className="md:col-span-1 space-y-4">
          {/* Mode Selector */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Response Mode
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveMode('behavioral')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeMode === 'behavioral'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Behavioral (STAR)
              </button>
              <button
                onClick={() => setActiveMode('technical')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeMode === 'technical'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" /> Technical / Code
              </button>
              <button
                onClick={() => setActiveMode('system-design')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeMode === 'system-design'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> System Design
              </button>
              <button
                onClick={() => setActiveMode('quick-bullet')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeMode === 'quick-bullet'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Quick Bullet
              </button>
            </div>
          </div>

          {/* Question Input Box */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Interview Question
            </span>
            <textarea
              rows={3}
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Type an interview question..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400 leading-relaxed"
            />
            <button
              onClick={() => handleRunSimulation()}
              disabled={isLoading || !currentQuestion.trim()}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-sky-500/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Teleprompter Card...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Cue Card
                </>
              )}
            </button>
          </div>

          {/* Sample Prompts */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Popular Interview Questions
            </span>
            <div className="space-y-1.5">
              {SAMPLE_QUESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSample(s)}
                  className="w-full text-left p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-300 transition line-clamp-2"
                >
                  <span className="text-[10px] text-sky-400 font-mono block uppercase">
                    {s.mode}
                  </span>
                  {s.question}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Teleprompter Cue Card Preview */}
        <div className="md:col-span-2">
          {cueCard ? (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Stealth Cue Card Preview (How it appears in HUD)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono">
                  {cueCard.mode}
                </span>
              </div>
              <CueCardView card={cueCard} />
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center">
              <PlayCircle className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm text-slate-400 font-medium mb-1">
                No simulated answer generated yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Type a question or pick one of the popular presets on the left, then click "Generate Cue Card" to test your knowledge base.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
