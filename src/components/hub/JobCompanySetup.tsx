import React, { useState } from 'react';
import { CompanyJobContext, AppSettings } from '../../types';
import { geminiService } from '../../services/gemini';
import {
  Building2,
  Globe,
  Sparkles,
  Loader2,
  Newspaper,
  Heart,
  CheckCircle,
  Link2,
  Clipboard,
  AlertCircle,
} from 'lucide-react';

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
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [jobUrlInput, setJobUrlInput] = useState(context.jobUrl || '');

  const showStatus = (type: 'success' | 'error', text: string, duration = 7000) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), duration);
  };

  const handleFetchJobUrl = async () => {
    const url = jobUrlInput.trim();
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      showStatus('error', 'Please enter a valid job listing URL starting with https://');
      return;
    }
    if (!settings.geminiApiKey) {
      showStatus('error', 'Please enter your Gemini API Key in Settings to auto-parse the JD.');
      return;
    }
    if (!window.electronAPI?.fetchUrl) {
      showStatus('error', 'URL fetching only works in the desktop app (Electron).');
      return;
    }

    try {
      setIsFetchingUrl(true);
      setStatusMessage({ type: 'success', text: 'Fetching job listing from URL...' });

      const fetchResult = await window.electronAPI.fetchUrl(url);
      if (!fetchResult.success || !fetchResult.content) {
        showStatus('error', fetchResult.error || 'Failed to fetch page content.');
        return;
      }

      setStatusMessage({ type: 'success', text: 'Parsing job description with AI...' });
      const parsed = await geminiService.parseJobDescriptionFromHtml(fetchResult.content, settings.geminiApiKey);

      onUpdateContext({
        ...context,
        jobUrl: url,
        companyName: parsed.companyName || context.companyName,
        jobTitle: parsed.jobTitle || context.jobTitle,
        jobDescription: parsed.jobDescription || context.jobDescription,
        requiredSkills: parsed.requiredSkills?.length ? parsed.requiredSkills : context.requiredSkills,
      });

      showStatus('success', `✓ JD imported! Detected role: ${parsed.jobTitle || 'see below'}`);
    } catch (err: any) {
      showStatus('error', 'Failed to parse job URL: ' + err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleResearch = async () => {
    if (!context.companyName.trim()) {
      showStatus('error', 'Please enter a company name first.');
      return;
    }
    if (!settings.geminiApiKey) {
      showStatus('error', 'Please enter your Gemini API Key in Settings to enable Live Web Research.');
      return;
    }

    try {
      setIsResearching(true);
      setStatusMessage({ type: 'success', text: `Researching ${context.companyName} with Google Search grounding...` });
      const research = await geminiService.researchCompany(context.companyName, settings.geminiApiKey);

      onUpdateContext({
        ...context,
        companyIndustry: research.summary,
        companyValues: research.values || [],
        recentCompanyNews: research.recentNews || [],
        notes: research.interviewVibe || context.notes,
      });

      showStatus('success', `✓ Fetched fresh intelligence on ${context.companyName}!`);
    } catch (err: any) {
      showStatus('error', 'Failed to research company: ' + err.message);
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-400" />
          Target Company & Job Description
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Paste a job link OR manually type the JD. The AI tailors every answer to this role — so the more detail, the better your cue cards.
        </p>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-sky-500/10 border-sky-500/20 text-sky-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3.5">
            {/* Fetch from URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Paste Job Listing URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={jobUrlInput}
                  onChange={(e) => setJobUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchJobUrl()}
                  placeholder="https://jobs.company.com/..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400 placeholder-slate-600"
                />
              </div>
              <button
                type="button"
                onClick={handleFetchJobUrl}
                disabled={isFetchingUrl || !jobUrlInput.trim()}
                className="mt-2 w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500/20 to-sky-500/20 hover:from-indigo-500/30 hover:to-sky-500/30 border border-indigo-500/30 rounded-xl text-xs font-semibold text-indigo-300 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching & Parsing...
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    Auto-Import JD from URL
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                Works with Greenhouse, Lever, LinkedIn, Workday & more
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <div className="flex-1 h-px bg-slate-800" />
              <span>or fill manually</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={context.companyName}
                onChange={(e) => onUpdateContext({ ...context, companyName: e.target.value })}
                placeholder="e.g. Stripe, OpenAI, Uber"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Target Job Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Job Title
              </label>
              <input
                type="text"
                value={context.jobTitle}
                onChange={(e) => onUpdateContext({ ...context, jobTitle: e.target.value })}
                placeholder="e.g. Staff Security Engineer"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Interview Stage */}
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

            {/* Live Research Company */}
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
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-4">
          {/* Job Description Box */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Job Description
              </label>
              {context.jobDescription && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {context.jobDescription.length.toLocaleString()} chars loaded
                </span>
              )}
            </div>
            <textarea
              rows={9}
              value={context.jobDescription}
              onChange={(e) => onUpdateContext({ ...context, jobDescription: e.target.value })}
              placeholder={`Paste the full job description here, OR use "Auto-Import JD from URL" above to auto-fill this from any job listing link.

Include responsibilities, requirements, tech stack, and nice-to-haves for best results.`}
              className="w-full px-4 py-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-sky-400 leading-relaxed"
            />
            <p className="text-[10px] text-slate-500">
              Tip: The more complete the JD, the more tailored your cue cards will be.
            </p>
          </div>

          {/* Required Skills (auto-filled from URL parse) */}
          {context.requiredSkills && context.requiredSkills.length > 0 && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-sky-400" />
                Auto-Detected Required Skills ({context.requiredSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {context.requiredSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-sky-300 text-xs rounded-lg border border-slate-700"
                  >
                    {skill}
                    <button
                      onClick={() =>
                        onUpdateContext({
                          ...context,
                          requiredSkills: context.requiredSkills.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
