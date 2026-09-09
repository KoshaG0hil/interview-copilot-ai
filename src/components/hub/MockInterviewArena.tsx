import React, { useState } from 'react';
import {
  CandidateProfile,
  CompanyJobContext,
  MockInterviewSession,
  AppSettings,
  StarStory,
  KnowledgeDocument,
  CueCard,
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
  HelpCircle,
} from 'lucide-react';

interface MockInterviewArenaProps {
  profile: CandidateProfile;
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  documents?: KnowledgeDocument[];
}

export const MockInterviewArena: React.FC<MockInterviewArenaProps> = ({
  profile,
  stories,
  jobContext,
  settings,
  documents = [],
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
      // Auto-generate initial cue card for the first question
      generateCueCardForQuestion(newSession.turns[0].question);
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
    } catch (err: any) {
      alert('Error evaluating answer: ' + err.message);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-sky-400" />
            AI Mock Interview Room & Scoring Arena
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Practice realistic, interactive multi-turn interviews. Speaks follow-up questions, evaluates your answers, and scores your performance.
          </p>
        </div>

        {session && (
          <button
            onClick={() => {
              if (confirm('Start a fresh mock interview session?')) {
                setSession(null);
                setCurrentAnswer('');
                setLiveCueCard(null);
              }
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Session
          </button>
        )}
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
                Interviewer Persona
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.label)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-1 ${
                      selectedPersona === p.label
                        ? 'bg-sky-500/10 border-sky-500 text-sky-100 shadow-sm'
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
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {isAnswering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up interview room...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Start Live AI Mock Interview
                </>
              )}
            </button>
          </div>

          {/* Context Overview Sidebar */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-2">
              Candidate & Company Profile
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
              <span className="text-slate-500 block">Company:</span>
              <strong className="text-emerald-300 font-mono">{jobContext.companyName || 'Target Company'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Knowledge Base:</span>
              <span className="text-slate-300">{stories.length} STAR stories, {documents.length} extra docs</span>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 2: Active Mock Interview Room */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Interview Dialogue & Candidate Input */}
          <div className="lg:col-span-2 space-y-4">
            {/* Session Progress Header */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">
                  {session.company} — {session.stage}
                </span>
              </div>
              <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Turn {session.turns.length} of 4
              </span>
            </div>

            {/* Conversation Turns List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {session.turns.map((turn, i) => (
                <div key={turn.id} className="space-y-2.5 animate-fade-in">
                  {/* Interviewer Question Bubble */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs">
                    <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        Interviewer ({session.interviewerPersona})
                      </span>
                      <p className="text-slate-200 leading-relaxed text-sm font-medium">
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
                          Your Response
                        </span>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {turn.candidateAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Turn AI Feedback Scorecard */}
                  {turn.feedback && (
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl ml-4 space-y-2.5 text-xs animate-fade-in">
                      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> AI Turn Evaluation
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                          Score: {turn.feedback.score} / 10
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="space-y-1 text-slate-300">
                          <strong className="text-emerald-400 block">✓ What you did well:</strong>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                            {turn.feedback.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <strong className="text-amber-400 block">⚠ Areas to improve:</strong>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                            {turn.feedback.improvements.map((imp, idx) => (
                              <li key={idx}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-indigo-500/10">
                        <strong className="text-sky-300 block text-[11px] mb-0.5">Model Answer Blueprint:</strong>
                        <p className="text-slate-300 text-[11px] leading-relaxed italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                          "{turn.feedback.modelAnswer}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Answer Input Area (If In-Progress) */}
            {session.status === 'in-progress' ? (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Your Answer:</span>
                  <button
                    onClick={toggleMic}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isRecording ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Listening (Speak Now)...' : 'Record with Mic'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Speak or type your answer here... (Glance at the cue card on the right for bullet points!)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400 leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isAnswering || !currentAnswer.trim()}
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-40 shadow-lg shadow-sky-500/20"
                  >
                    {isAnswering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Evaluating & generating next turn...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Answer
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Final Scorecard Debrief */
              session.overallScore !== undefined && (
                <div className="p-6 bg-gradient-to-tr from-slate-900 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Official Hiring Debrief
                      </span>
                      <h3 className="text-lg font-bold text-slate-100">
                        Recommendation: {session.hiringRecommendation}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {session.overallScore} / 100
                      </span>
                      <span className="block text-[10px] text-slate-400">Composite Score</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    {session.overallSummary}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Right Column: Live Teleprompter Cue Card Assistant */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Live Teleprompter Cue Card
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Practice Mode</span>
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
                <p className="text-xs">Cue cards will appear here as questions are asked.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
