import React, { useRef, useEffect } from 'react';
import { TranscriptItem } from '../../types';
import { Mic, User, Volume2, Sparkles, Trash2 } from 'lucide-react';

interface TranscriptStreamProps {
  transcripts: TranscriptItem[];
  isListening: boolean;
  onSelectQuestion: (question: string) => void;
  onClear: () => void;
}

export const TranscriptStream: React.FC<TranscriptStreamProps> = ({
  transcripts,
  isListening,
  onSelectQuestion,
  onClear,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="flex flex-col h-full bg-slate-950/70 rounded-xl border border-slate-800/80 overflow-hidden text-xs">
      {/* Header bar */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {isListening ? 'Live Audio Stream' : 'Audio Paused'}
            </span>
          </div>
        </div>

        {transcripts.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Transcript Items Body */}
      <div
        ref={containerRef}
        className="flex-1 p-2.5 overflow-y-auto space-y-2 max-h-[160px]"
      >
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-4">
            <Mic className="w-5 h-5 mb-1 opacity-50" />
            <p className="text-[11px]">Listening to interview audio...</p>
            <p className="text-[10px] text-slate-600">Interviewer questions will appear here.</p>
          </div>
        ) : (
          transcripts.map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-lg border transition ${
                item.speaker === 'interviewer'
                  ? 'bg-sky-950/20 border-sky-500/20 text-sky-100'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.speaker === 'interviewer' ? (
                    <>
                      <Volume2 className="w-3 h-3 text-sky-400" />
                      Interviewer
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-slate-400" />
                      Candidate
                    </>
                  )}
                </span>
                {item.speaker === 'interviewer' && item.isFinal && (
                  <button
                    onClick={() => onSelectQuestion(item.text)}
                    className="px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 text-[10px] font-semibold flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Answer
                  </button>
                )}
              </div>
              <p className="leading-snug text-xs">
                {item.text}
                {!item.isFinal && <span className="inline-block w-1.5 h-3 ml-1 bg-sky-400 animate-pulse" />}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
