import React, { useState } from 'react';
import { AssessmentSolution, AppSettings } from '../../types';
import { assessmentService } from '../../services/assessmentService';
import {
  Code2,
  Camera,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertTriangle,
  Play,
  FileCode,
  Layers,
} from 'lucide-react';

interface AssessmentCopilotProps {
  settings: AppSettings;
}

export const AssessmentCopilot: React.FC<AssessmentCopilotProps> = ({ settings }) => {
  const [problemText, setProblemText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Python 3');
  const [selectedPlatform, setSelectedPlatform] = useState<AssessmentSolution['platform']>('hackerrank');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<AssessmentSolution | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const languages = ['Python 3', 'Java', 'C++', 'TypeScript', 'JavaScript', 'Go', 'SQL'];

  const platforms: { id: AssessmentSolution['platform']; label: string }[] = [
    { id: 'hackerrank', label: 'HackerRank' },
    { id: 'codesignal', label: 'CodeSignal' },
    { id: 'leetcode', label: 'LeetCode' },
    { id: 'karat', label: 'Karat' },
    { id: 'codility', label: 'Codility' },
    { id: 'other', label: 'General OA / Quiz' },
  ];

  const handleSolve = async (screenImageBase64?: string) => {
    if (!problemText.trim() && !screenImageBase64) {
      alert('Please enter problem text or use Screen Snip.');
      return;
    }
    if (!settings.geminiApiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      return;
    }

    try {
      setIsSolving(true);
      const sol = await assessmentService.solveAssessment(
        {
          problemText: problemText.trim(),
          platform: selectedPlatform,
          language: selectedLanguage,
          screenImageBase64,
        },
        settings
      );
      setSolution(sol);
    } catch (err: any) {
      alert('Error generating assessment solution: ' + err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const handleScreenSnip = async () => {
    if (!window.electronAPI?.captureScreen) {
      alert('Screen Snip is available in the Electron desktop app.');
      return;
    }

    setStatusNotice('Capturing screen for assessment...');
    const imageBase64 = await window.electronAPI.captureScreen();
    if (imageBase64) {
      handleSolve(imageBase64);
      setStatusNotice(null);
    } else {
      setStatusNotice('Screen capture failed.');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleCopyCode = () => {
    if (!solution?.optimalCode) return;
    navigator.clipboard.writeText(solution.optimalCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-400" />
            Online Assessment (OA) & Coding Test Copilot
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant algorithmic solutions for HackerRank, CodeSignal, LeetCode, Karat, and Codility.
          </p>
        </div>

        <button
          onClick={handleScreenSnip}
          className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-sky-500/20"
        >
          <Camera className="w-4 h-4" />
          <span>Screen Snip Problem (Ctrl+Shift+S)</span>
        </button>
      </div>

      {statusNotice && (
        <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {statusNotice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Problem Input & Language Config */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5">
            {/* Target Language */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Preset */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Assessment Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              >
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Problem Statement Box */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Problem Statement / Constraints
              </label>
              <textarea
                rows={7}
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Paste the problem description, constraints, and sample inputs here (or hit Screen Snip above)..."
                className="w-full px-3 py-2.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-sky-400 leading-relaxed"
              />
            </div>

            <button
              onClick={() => handleSolve()}
              disabled={isSolving || !problemText.trim()}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-lg shadow-sky-500/15"
            >
              {isSolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Optimal Solution...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Solve Problem
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Code Solution, Complexity & Edge Cases */}
        <div className="md:col-span-2">
          {solution ? (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 animate-fade-in">
              {/* Title & Complexity Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                    {solution.platform}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-1">
                    {solution.problemTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Time: {solution.timeComplexity}
                  </span>
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Space: {solution.spaceComplexity}
                  </span>
                </div>
              </div>

              {/* Algorithm Intuition */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Algorithm Intuition (Avoids TLE)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {solution.algorithmExplanation}
                </p>
              </div>

              {/* Executable Code Block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[11px] font-bold flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-sky-400" />
                    {solution.language} Optimal Implementation
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs text-emerald-300 font-mono leading-relaxed max-h-[320px]">
                  <code>{solution.optimalCode}</code>
                </pre>
              </div>

              {/* Test Cases & Edge Cases Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Dry Run Test Cases */}
                {solution.testCases && solution.testCases.length > 0 && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Play className="w-3 h-3 text-emerald-400" /> Dry Run Test Cases
                    </span>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {solution.testCases.map((tc, idx) => (
                        <div key={idx} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="text-slate-400">Input: <span className="text-slate-200">{tc.input}</span></div>
                          <div className="text-emerald-400">Output: {tc.expectedOutput}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edge Cases */}
                {solution.edgeCases && solution.edgeCases.length > 0 && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Crucial Edge Cases
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                      {solution.edgeCases.map((ec, idx) => (
                        <li key={idx}>{ec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center">
              <Code2 className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm text-slate-400 font-medium mb-1">
                No Assessment Problem Loaded
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Paste your coding problem on the left or click "Screen Snip Problem" to capture questions directly from HackerRank, LeetCode, or CodeSignal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
