import React, { useState } from 'react';
import { CompanyJobContext, AppSettings } from '../../types';
import { geminiService } from '../../services/gemini';
import { Building2, Globe, Sparkles, Loader2, Newspaper, Heart, Layers, CheckCircle } from 'lucide-react';

interface JobCompanySetupProps {
  context: CompanyJobContext;
  onUpdateContext: (context: CompanyJobContext) => void;
  settings: AppSettings;
}

export const JobCompanySetup: React.FC<JobCompanySetupProps> = ({
  context,
  onUpdateContext,
  settings,
}) => {
  const [isResearching, setIsResearching] = useState(false);
  const [researchMessage, setResearchMessage] = useState<string | null>(null);

  const handleResearch = async () => {
    if (!context.companyName.trim()) {
      alert('Please enter a company name first.');
      return;
    }
    if (!settings.geminiApiKey) {
      alert('Please enter your Gemini API Key in Settings to enable Live Google Search grounding.');
      return;
    }

    try {
      setIsResearching(true);
      setResearchMessage(`Researching ${context.companyName} with Google Search grounding...`);
      const research = await geminiService.researchCompany(
        context.companyName,
        settings.geminiApiKey
      );

      onUpdateContext({
        ...context,
        companyIndustry: research.summary,
        companyValues: research.values || [],
        recentCompanyNews: research.recentNews || [],
        notes: research.interviewVibe || context.notes,
      });

      setResearchMessage(`Fetched fresh intelligence on ${context.companyName}!`);
    } catch (err: any) {
      setResearchMessage('Failed to research company: ' + err.message);
    } finally {
      setIsResearching(false);
      setTimeout(() => setResearchMessage(null), 6000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-400" />
          Target Company & Job Intelligence
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure the role you're interviewing for. The AI tailors answers to the job description and uses live web search to align with company values and recent news.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form Setup */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={context.companyName}
                  onChange={(e) => onUpdateContext({ ...context, companyName: e.target.value })}
                  placeholder="e.g. Stripe, OpenAI, Uber"
                  className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleResearch}
              disabled={isResearching || !context.companyName}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 border border-sky-500/30 rounded-xl text-xs font-semibold text-sky-300 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isResearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Searching Live Web...
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Live Web Research Company
                </>
              )}
            </button>

            {researchMessage && (
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-300 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                {researchMessage}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Job Title
              </label>
              <input
                type="text"
                value={context.jobTitle}
                onChange={(e) => onUpdateContext({ ...context, jobTitle: e.target.value })}
                placeholder="e.g. Staff Distributed Systems Engineer"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Interview Stage
              </label>
              <select
                value={context.interviewStage}
                onChange={(e) => onUpdateContext({ ...context, interviewStage: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="technical">Technical Coding / DSA</option>
                <option value="system-design">System Design & Architecture</option>
                <option value="behavioral">Behavioral / Leadership (STAR)</option>
                <option value="hiring-manager">Hiring Manager / Culture Fit</option>
                <option value="screening">Recruiter Screening</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Job Description & Live Grounding Output */}
        <div className="md:col-span-2 space-y-4">
          {/* Job Description Box */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Paste Job Description (JD)
            </label>
            <textarea
              rows={6}
              value={context.jobDescription}
              onChange={(e) => onUpdateContext({ ...context, jobDescription: e.target.value })}
              placeholder="Paste the target job description requirements, tech stack, and responsibilities here..."
              className="w-full px-4 py-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-sky-400 leading-relaxed"
            />
          </div>

          {/* Company Intelligence Summary */}
          {(context.companyIndustry || context.companyValues?.length || context.recentCompanyNews?.length) && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Live Grounded Company Intelligence ({context.companyName})
              </div>

              {context.companyIndustry && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {context.companyIndustry}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Core Values */}
                {context.companyValues && context.companyValues.length > 0 && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" /> Core Values & Principles
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {context.companyValues.map((v, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-sky-400">•</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recent News */}
                {context.recentCompanyNews && context.recentCompanyNews.length > 0 && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Newspaper className="w-3.5 h-3.5" /> Recent Announcements & Context
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {context.recentCompanyNews.map((n, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {context.notes && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                    Interview Tone & Recommended Strategy:
                  </span>
                  {context.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
