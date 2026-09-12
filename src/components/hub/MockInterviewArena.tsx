import React, { useState, useEffect, useRef } from 'react';
import {
  CandidateProfile,
  CompanyJobContext,
  MockInterviewSession,
  MockInterviewTurn,
  AppSettings,
  StarStory,
  KnowledgeDocument,
  CueCard,
  CustomQAItem,
} from '../../types';
import { mockInterviewService } from '../../services/mockInterviewService';
import { geminiService } from '../../services/gemini';
import { speechService } from '../../services/speechRecognition';
import { CueCardView } from '../hud/CueCardView';
import {
  PlayCircle,
  Award,
  Sparkles,
  Mic,
  MicOff,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  User,
  Bot,
  AlertCircle,
  Volume2,
  VolumeX,
  Clock,
  RotateCcw,
  BookOpen,
  Copy,
  Gauge,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MockInterviewArenaProps {
  profile: CandidateProfile;
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  documents?: KnowledgeDocument[];
  customQAs?: CustomQAItem[];
}

export const MockInterviewArena: React.FC<MockInterviewArenaProps> = ({
  profile,
  stories,
  jobContext,
  settings,
  documents = [],
  customQAs = [],
}) => {
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [selectedPersona, setSelectedPersona] = useState('Senior Bar Raiser (Amazon/Meta)');
  const [selectedStage, setSelectedStage] = useState('Technical Coding & Problem Solving');
  const [selectedDifficulty, setSelectedDifficulty] = useState<MockInterviewSession['difficulty']>('senior');

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveCueCard, setLiveCueCard] = useState<CueCard | null>(null);
  const [isGeneratingCueCard, setIsGeneratingCueCard] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.15); // 1.15x is natural conversational speed
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Load natural voices from browser SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
          // Pick high-quality English voice
          const bestVoice =
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Natural') ||
                  v.name.includes('Google') ||
                  v.name.includes('Jenny') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Guy') ||
                  v.name.includes('Zira') ||
                  v.name.includes('David'))
            ) || voices.find((v) => v.lang.startsWith('en'));

          if (bestVoice && !selectedVoiceName) {
            setSelectedVoiceName(bestVoice.name);
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Speaking Timer when recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string, customRate?: number) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = customRate || speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    if (selectedVoiceName && availableVoices.length > 0) {
      const voiceObj = availableVoices.find((v) => v.name === selectedVoiceName);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const personas = [
    { id: 'bar-raiser', label: 'Senior Bar Raiser (Amazon/Meta)', desc: 'High rigor on leadership principles, STAR metrics, and deep ownership.' },
    { id: 'tech-lead', label: 'Staff Architect / Tech Lead', desc: 'Focuses on deep system design, bottlenecks, concurrency, and trade-offs.' },
    { id: 'hiring-manager', label: 'Hiring Director / Manager', desc: 'Evaluates culture alignment, cross-functional conflict, and business ROI.' },
  ];

  const stages = [
    'Technical Coding & Problem Solving',
    'System Design & Architecture',
    'Behavioral & Leadership (STAR)',
    'Hiring Manager & Culture Fit',
  ];

  const handleStartMock = async () => {
    if (!settings.geminiApiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      return;
    }

    try {
      setIsAnswering(true);
      const newSession = await mockInterviewService.startMockSession(
        profile,
        jobContext,
        selectedStage,
        selectedDifficulty,
        selectedPersona,
        settings
      );
      setSession(newSession);
      const firstQ = newSession.turns[0].question;
      speakText(firstQ);
      generateCueCardForQuestion(firstQ);
    } catch (err: any) {
      alert('Failed to start mock session: ' + err.message);
    } finally {
      setIsAnswering(false);
    }
  };

  const generateCueCardForQuestion = async (question: string) => {
    try {
      setIsGeneratingCueCard(true);
      const card = await geminiService.generateCueCard({
        question,
        mode: selectedStage.includes('Coding') ? 'technical' : selectedStage.includes('System') ? 'system-design' : 'behavioral',
        profile,
        stories,
        jobContext,
        settings,
        documents,
        customQAs,
      });
      setLiveCueCard(card);
    } catch (err) {
      console.warn('Could not generate live cue card:', err);
    } finally {
      setIsGeneratingCueCard(false);
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      speechService.stop();
      setIsRecording(false);
    } else {
      setTimerSeconds(0);
      speechService.start((data) => {
        if (data.isFinal) {
          setCurrentAnswer((prev) => (prev ? prev + ' ' + data.text : data.text));
        }
      });
      setIsRecording(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || !currentAnswer.trim()) return;

    try {
      setIsAnswering(true);
      if (isRecording) {
        speechService.stop();
        setIsRecording(false);
      }

      const turnCount = session.turns.length;
      const isLastTurn = turnCount >= 4; // 4 questions per mock interview

      const evaluation = await mockInterviewService.evaluateAnswerAndGetNextQuestion(
        session,
        currentAnswer,
        settings,
        isLastTurn
      );

      const updatedTurns = [...session.turns];
      updatedTurns[updatedTurns.length - 1].candidateAnswer = currentAnswer;
      updatedTurns[updatedTurns.length - 1].feedback = evaluation.feedback;

      if (!isLastTurn && evaluation.nextQuestion) {
        updatedTurns.push({
          id: 'turn-' + (turnCount + 1),
          question: evaluation.nextQuestion,
          timestamp: Date.now(),
        });
        speakText(evaluation.nextQuestion);
        generateCueCardForQuestion(evaluation.nextQuestion);
      }

      const updatedSession: MockInterviewSession = {
        ...session,
        turns: updatedTurns,
        status: isLastTurn ? 'completed' : 'in-progress',
      };

      if (isLastTurn) {
        const finalDebrief = await mockInterviewService.generateFinalScorecard(
          updatedSession,
          settings
        );
        updatedSession.overallScore = finalDebrief.overallScore;
        updatedSession.overallSummary = finalDebrief.overallSummary;
        updatedSession.hiringRecommendation = finalDebrief.hiringRecommendation;
      }

      setSession(updatedSession);
      setCurrentAnswer('');
      setTimerSeconds(0);
      setShowPracticeAnswer(false);
    } catch (err: any) {
      alert('Error evaluating answer: ' + err.message);
    } finally {
      setIsAnswering(false);
    }
  };

  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const currentWpm = timerSeconds > 0 ? Math.round((wordCount / timerSeconds) * 60) : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentTurn = session?.turns[session.turns.length - 1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-sky-400" />
            Parakeet AI Mock Interview Room & Practice Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice-enabled interactive AI interviewer with adjustable speech pacing, instant model practice answers, and real-time candidate coaching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Interviewer Speed Pacing Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Speed:</span>
            {[
              { rate: 0.85, label: '0.85x' },
              { rate: 1.0, label: '1.0x' },
              { rate: 1.15, label: '1.15x ★' },
              { rate: 1.3, label: '1.3x' },
            ].map((p) => (
              <button
                key={p.rate}
                type="button"
                onClick={() => setSpeechRate(p.rate)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                  speechRate === p.rate
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Interviewer Speech Speed: ${p.label}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Voice Output Toggle */}
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              isVoiceEnabled
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle AI Interviewer Voice Readout"
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Voice {isVoiceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {session && (
            <button
              onClick={() => {
                if (confirm('Start a fresh mock interview session?')) {
                  setSession(null);
                  setCurrentAnswer('');
                  setLiveCueCard(null);
                  setTimerSeconds(0);
                  setShowPracticeAnswer(false);
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Session
            </button>
          )}
        </div>
      </div>

      {/* Screen 1: Session Setup (If No Active Session) */}
      {!session ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Customize Mock Interview Parameters
            </h3>

            {/* Persona Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Interviewer Persona & Tone
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.label)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-1 ${
                      selectedPersona === p.label
                        ? 'bg-sky-500/10 border-sky-500 text-sky-100 shadow-sm ring-1 ring-sky-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block text-slate-200">{p.label}</span>
                    <span className="text-[10px] text-slate-400 leading-snug">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Interview Round
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Difficulty Level
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                >
                  <option value="entry">Entry / Junior Level</option>
                  <option value="mid">Mid-Level Engineer</option>
                  <option value="senior">Senior Engineer (Standard FAANG)</option>
                  <option value="staff-principal">Staff / Principal Architect</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartMock}
              disabled={isAnswering}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {isAnswering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up interactive interview room...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Start Interactive AI Mock Interview
                </>
              )}
            </button>
          </div>

          {/* Context Overview Sidebar */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Active Knowledge Base Injected
            </span>
            <div>
              <span className="text-slate-500 block">Candidate:</span>
              <strong className="text-slate-200">{profile.fullName || 'Candidate'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Target Role:</span>
              <strong className="text-sky-300">{jobContext.jobTitle || profile.targetRole || 'Software Engineer'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Target Company:</span>
              <strong className="text-emerald-300 font-mono">{jobContext.companyName || 'Target Company'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Personal Knowledge Vault:</span>
              <span className="text-slate-300">{stories.length} STAR stories, {customQAs.length} custom Q&As, {documents.length} extra docs</span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-sky-400" />
                Interviewer voice speed set to <strong>{speechRate}x</strong>.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 2: Active Parakeet Mock Interview Room */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Dialogue, AI Voice Player, Model Answers, and Candidate Input */}
          <div className="lg:col-span-2 space-y-4">
            {/* Session Progress Header */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-sky-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <div>
                  <span className="font-bold text-slate-100 block">
                    {session.company} — {session.stage}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {session.interviewerPersona} • {session.difficulty.toUpperCase()} • Speed: {speechRate}x
                  </span>
                </div>
              </div>
              <span className="font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 font-bold">
                Turn {session.turns.length} / 4
              </span>
            </div>

            {/* Conversation Turns List */}
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {session.turns.map((turn, i) => (
                <div key={turn.id} className="space-y-3 animate-fade-in">
                  {/* Interviewer Question Bubble */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs shadow-sm">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isAiSpeaking && i === session.turns.length - 1 ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-500/20' : 'bg-sky-500/10 text-sky-400'}`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                          Interviewer • Question {i + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => speakText(turn.question)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 transition"
                            title="Replay Audio"
                          >
                            <Volume2 className="w-3 h-3 text-sky-400" />
                            <span>Listen ({speechRate}x)</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-100 leading-relaxed text-sm font-medium">
                        {turn.question}
                      </p>
                    </div>
                  </div>

                  {/* Candidate Answer Bubble (If submitted) */}
                  {turn.candidateAnswer && (
                    <div className="p-4 bg-slate-950 border border-slate-800/90 rounded-2xl flex items-start gap-3 text-xs ml-4">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                          Your Answer
                        </span>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-xs">
                          {turn.candidateAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Turn AI Feedback Scorecard */}
                  {turn.feedback && (
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl ml-4 space-y-3 text-xs animate-fade-in shadow-md">
                      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" /> Parakeet AI Real-Time Feedback
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${turn.feedback.score >= 8 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : turn.feedback.score >= 6 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                          Score: {turn.feedback.score} / 10
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                          <strong className="text-emerald-400 block font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Strengths:
                          </strong>
                          <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                            {turn.feedback.strengths.map((s, idx) => (
                              <li key={idx} className="leading-snug">{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                          <strong className="text-amber-400 block font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Improvement Areas:
                          </strong>
                          <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                            {turn.feedback.improvements.map((imp, idx) => (
                              <li key={idx} className="leading-snug">{imp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-indigo-500/10">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-sky-300 block text-[11px] font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-400" /> Senior Model Answer Benchmark:
                          </strong>
                          <button
                            onClick={() => speakText(turn.feedback!.modelAnswer)}
                            className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" /> Listen
                          </button>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed italic bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                          "{turn.feedback.modelAnswer}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Answer Input & Practice Assistant Area (If In-Progress) */}
            {session.status === 'in-progress' ? (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                {/* Practice Model Answer Accordion */}
                {liveCueCard && (
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowPracticeAnswer(!showPracticeAnswer)}
                        className="flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>💡 Peek Practice Answer & Senior Talking Points</span>
                        {showPracticeAnswer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showPracticeAnswer && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const points = liveCueCard.bulletPoints.join(' ');
                              const fullScript = `${liveCueCard.headline} Specifically: ${points}`;
                              setCurrentAnswer(fullScript);
                            }}
                            className="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-medium rounded-lg flex items-center gap-1 transition"
                            title="Load model answer into your text box to practice speaking"
                          >
                            <Copy className="w-3 h-3" /> Load into Practice Box
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const points = liveCueCard.bulletPoints.join('. ');
                              speakText(`${liveCueCard.headline}. ${points}`);
                            }}
                            className="px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-medium rounded-lg flex items-center gap-1 transition"
                          >
                            <Volume2 className="w-3 h-3" /> Listen
                          </button>
                        </div>
                      )}
                    </div>

                    {showPracticeAnswer && (
                      <div className="pt-2 border-t border-indigo-500/20 space-y-2 text-xs animate-fade-in">
                        <p className="font-semibold text-sky-300">
                          {liveCueCard.headline}
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1 text-[11px]">
                          {liveCueCard.bulletPoints.map((b, idx) => (
                            <li key={idx} className="leading-relaxed">{b}</li>
                          ))}
                        </ul>
                        {liveCueCard.starMapping?.resultHighlight && (
                          <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-emerald-300">
                            <strong>Key Metric / Result:</strong> {liveCueCard.starMapping.resultHighlight}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">Your Answer:</span>
                    {isRecording && (
                      <span className="flex items-center gap-1.5 text-[11px] font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        <Clock className="w-3 h-3 animate-spin" /> {formatTime(timerSeconds)}
                        <span className="text-slate-400">·</span>
                        <span className={currentWpm >= 120 && currentWpm <= 160 ? 'text-emerald-400' : 'text-amber-400'}>
                          {currentWpm} WPM {currentWpm >= 120 && currentWpm <= 160 ? '(Good Pace)' : ''}
                        </span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={toggleMic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {isRecording ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Listening (Speak Now)...' : 'Record Voice Answer'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Speak your answer with the mic or type here... (Glance at the cue card on the right or click 'Peek Practice Answer' above for model points!)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400 leading-relaxed font-sans"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {wordCount > 0 ? `${wordCount} words typed/spoken` : 'Glance at cue cards while answering'}
                  </span>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isAnswering || !currentAnswer.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-40 shadow-lg shadow-sky-500/20"
                  >
                    {isAnswering ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Evaluating & Generating Next Turn...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Answer & Next Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Final Parakeet-Style Debrief Scorecard */
              session.overallScore !== undefined && (
                <div className="p-6 bg-gradient-to-tr from-slate-900 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-2xl space-y-5 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Official AI Hiring Debrief
                      </span>
                      <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        {session.hiringRecommendation}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {session.company} • {session.stage}
                      </span>
                    </div>
                    <div className="text-right bg-slate-950/80 px-4 py-2 rounded-2xl border border-indigo-500/30">
                      <span className="text-3xl font-black text-emerald-400 font-mono">
                        {session.overallScore}
                      </span>
                      <span className="text-slate-400 text-sm font-mono">/100</span>
                      <span className="block text-[10px] text-slate-400 font-medium">Composite Score</span>
                    </div>
                  </div>

                  {/* Competency Breakdown Meters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Technical Depth</span>
                      <span className="text-base font-bold text-sky-400 font-mono">{Math.min(98, session.overallScore + 4)}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">STAR Structure</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{Math.min(95, session.overallScore + 2)}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Communication</span>
                      <span className="text-base font-bold text-indigo-400 font-mono">{Math.min(94, session.overallScore - 2)}%</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Business ROI</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{Math.min(92, session.overallScore - 4)}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300 block">Executive Summary & Feedback:</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                      {session.overallSummary}
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setSession(null);
                        setCurrentAnswer('');
                        setLiveCueCard(null);
                        setTimerSeconds(0);
                        setShowPracticeAnswer(false);
                      }}
                      className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-sky-500/20"
                    >
                      <RotateCcw className="w-4 h-4" /> Start Another Mock Interview
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Right Column: Live Glance-and-Speak Cue Card Assistant */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Teleprompter Cue Card
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Glance & Speak</span>
            </div>

            {isGeneratingCueCard ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                <p className="text-xs">Generating cue card points for question...</p>
              </div>
            ) : liveCueCard ? (
              <CueCardView card={liveCueCard} compact />
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <p className="text-xs">Cue cards will appear here in real-time as questions are asked.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
