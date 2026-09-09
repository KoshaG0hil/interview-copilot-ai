import React, { useState } from 'react';
import { CueCard } from '../../types';
import { Copy, Check, ExternalLink, Award, Code, Lightbulb, Sparkles } from 'lucide-react';

interface CueCardViewProps {
  card: CueCard;
  compact?: boolean;
}

export const CueCardView: React.FC<CueCardViewProps> = ({ card, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    const text = [
      `Q: ${card.question}`,
      `Anchor: ${card.headline}`,
      ...card.bulletPoints.map((b) => `• ${b}`),
      card.codeSnippet ? `\nCode:\n${card.codeSnippet.code}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format asterisks (*keyword*) into glowing tags
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const clean = part.slice(1, -1);
        return (
          <span key={index} className="cue-keyword font-semibold">
            {clean}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 font-sans animate-fade-in text-slate-100">
      {/* Anchor Headline Box */}
      <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 shadow-inner flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Anchor Talking Point (Say First)
          </span>
          <p className="text-sm font-semibold text-slate-100 leading-snug">
            {card.headline}
          </p>
        </div>
        <button
          onClick={handleCopyAll}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition shrink-0"
          title="Copy Answer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bullet Points Teleprompter */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Key Talking Points (Glance & Speak)
        </span>
        <div className="space-y-1.5">
          {card.bulletPoints.map((bullet, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/70 hover:border-slate-700 transition text-xs text-slate-200 leading-relaxed"
            >
              <span className="w-4 h-4 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 font-bold">
                {idx + 1}
              </span>
              <div className="flex-1">{renderFormattedText(bullet)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Snippet Box (If Technical) */}
      {card.codeSnippet && card.codeSnippet.code && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono font-bold text-sky-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" /> {card.codeSnippet.language || 'Code'}
            </span>
            {card.codeSnippet.complexity && (
              <div className="flex gap-2 text-[11px] text-slate-400 font-mono">
                <span>Time: <strong className="text-emerald-400">{card.codeSnippet.complexity.time}</strong></span>
                <span>Space: <strong className="text-amber-400">{card.codeSnippet.complexity.space}</strong></span>
              </div>
            )}
          </div>
          <pre className="p-2.5 rounded-lg bg-slate-900 overflow-x-auto text-[11px] text-emerald-300 font-mono leading-tight max-h-48">
            <code>{card.codeSnippet.code}</code>
          </pre>
        </div>
      )}

      {/* STAR Story Highlights (If Behavioral) */}
      {card.starMapping?.storyTitle && (
        <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            <Award className="w-3 h-3" /> Grounded In Candidate Story: {card.starMapping.storyTitle}
          </div>
          {card.starMapping.resultHighlight && (
            <p className="text-indigo-200 text-[11px]">
              <strong className="text-emerald-400">Metric:</strong> {card.starMapping.resultHighlight}
            </p>
          )}
        </div>
      )}

      {/* Grounding Citations (If Live Web Search Grounded) */}
      {card.groundingSources && card.groundingSources.length > 0 && (
        <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <span className="font-semibold text-sky-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Live Grounded Sources:
          </span>
          {card.groundingSources.slice(0, 3).map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-sky-300 underline truncate max-w-[180px]"
            >
              {source.title}
            </a>
          ))}
        </div>
      )}

      {/* Potential Curveball Follow-up Tips */}
      {card.followUpTips && card.followUpTips.length > 0 && !compact && (
        <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> Anticipate Follow-Up / Questions to Ask Back
          </span>
          <ul className="space-y-0.5 text-slate-300 text-[11px]">
            {card.followUpTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400">›</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
