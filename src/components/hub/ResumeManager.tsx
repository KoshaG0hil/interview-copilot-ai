import React, { useState } from 'react';
import { CandidateProfile, StarStory, AppSettings, KnowledgeDocument, CustomQAItem } from '../../types';
import { resumeParser } from '../../services/resumeParser';
import { geminiService } from '../../services/gemini';
import {
  Upload,
  FileText,
  Sparkles,
  HardDrive,
  Loader2,
  Trash2,
  Plus,
  Eye,
  FileCode,
  CheckCircle2,
  MessageSquarePlus,
  MessagesSquare,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';

interface ResumeManagerProps {
  profile: CandidateProfile;
  onUpdateProfile: (profile: CandidateProfile) => void;
  documents: KnowledgeDocument[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (id: string) => void;
  onAddStories: (stories: StarStory[]) => void;
  customQAs: CustomQAItem[];
  onAddCustomQA: (qa: CustomQAItem) => void;
  onDeleteCustomQA: (id: string) => void;
  settings: AppSettings;
}

const QA_CATEGORIES: CustomQAItem['category'][] = [
  'background',
  'technical',
  'behavioral',
  'role-specific',
  'custom',
];

const categoryLabel = (c?: string) => {
  const map: Record<string, string> = {
    background: '👤 Background',
    technical: '⚡ Technical',
    behavioral: '🧠 Behavioral',
    'role-specific': '🎯 Role-Specific',
    custom: '📝 Custom',
  };
  return c ? (map[c] || c) : '📝 Custom';
};

export const ResumeManager: React.FC<ResumeManagerProps> = ({
  profile,
  onUpdateProfile,
  documents,
  onAddDocument,
  onDeleteDocument,
  onAddStories,
  customQAs,
  onAddCustomQA,
  onDeleteCustomQA,
  settings,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingStories, setIsExtractingStories] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Supplementary document modal state
  const [isAddingCustomDoc, setIsAddingCustomDoc] = useState(false);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customDocType, setCustomDocType] = useState<KnowledgeDocument['type']>('project-notes');
  const [customDocContent, setCustomDocContent] = useState('');
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);

  // Custom Q&A modal state
  const [isAddingQA, setIsAddingQA] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaCategory, setQaCategory] = useState<CustomQAItem['category']>('custom');
  const [expandedQAId, setExpandedQAId] = useState<string | null>(null);

  const showStatus = (msg: string, dur = 5000) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), dur);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSupplementary = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      showStatus(`Extracting text from ${file.name}...`);
      const text = await resumeParser.extractTextFromFile(file);

      if (!text.trim()) {
        showStatus('Could not extract text. Try pasting it manually below.');
        setIsParsing(false);
        return;
      }

      // Add as persistent document
      const newDoc: KnowledgeDocument = {
        id: 'doc-' + Date.now(),
        name: file.name,
        type: isSupplementary ? 'project-notes' : 'resume',
        content: text,
        sizeBytes: file.size,
        dateAdded: new Date().toISOString(),
      };
      onAddDocument(newDoc);

      // If it's the primary resume, auto-extract profile & skills
      if (!isSupplementary) {
        showStatus('Analyzing resume and extracting your profile, skills & background...');
        const extracted = await geminiService.parseResumeText(text, settings.geminiApiKey);
        const updatedProfile: CandidateProfile = {
          ...profile,
          resumeText: text,
          lastUpdated: new Date().toISOString(),
          fullName: extracted.fullName || profile.fullName || 'Candidate',
          targetRole: extracted.targetRole || profile.targetRole || 'Engineer',
          yearsOfExperience: extracted.yearsOfExperience || profile.yearsOfExperience || 2,
          summary: extracted.summary || profile.summary,
          coreSkills: extracted.coreSkills?.length ? extracted.coreSkills : profile.coreSkills,
        };
        onUpdateProfile(updatedProfile);
        showStatus(`✓ "${file.name}" saved. Skills & profile auto-extracted from your resume!`);
      } else {
        showStatus(`✓ "${file.name}" added to your Knowledge Base.`);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showStatus('Error parsing document: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocTitle.trim() || !customDocContent.trim()) return;

    const newDoc: KnowledgeDocument = {
      id: 'doc-' + Date.now(),
      name: customDocTitle.trim(),
      type: customDocType,
      content: customDocContent.trim(),
      dateAdded: new Date().toISOString(),
    };
    onAddDocument(newDoc);
    setCustomDocTitle('');
    setCustomDocContent('');
    setIsAddingCustomDoc(false);
  };

  const handleSaveQA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;

    const newQA: CustomQAItem = {
      id: 'qa-' + Date.now(),
      question: qaQuestion.trim(),
      answer: qaAnswer.trim(),
      category: qaCategory,
      dateAdded: new Date().toISOString(),
    };
    onAddCustomQA(newQA);
    setQaQuestion('');
    setQaAnswer('');
    setQaCategory('custom');
    setIsAddingQA(false);
    showStatus('✓ Custom Q&A saved to your Knowledge Bank!');
  };

  const handleGenerateStories = async () => {
    const resumeText = profile.resumeText || documents.find((d) => d.type === 'resume')?.content;
    if (!resumeText) {
      alert('Please upload a resume first.');
      return;
    }
    if (!settings.geminiApiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      return;
    }

    try {
      setIsExtractingStories(true);
      showStatus('Generating STAR stories from your resume...');
      const stories = await geminiService.generateStarStoriesFromResume(resumeText, settings.geminiApiKey);
      if (stories.length > 0) {
        onAddStories(stories);
        showStatus(`✓ ${stories.length} STAR stories extracted into your Story Bank!`);
      } else {
        showStatus('Could not auto-generate stories. Try adding them manually in the STAR Bank tab.');
      }
    } catch (err: any) {
      showStatus('Failed to generate stories: ' + err.message);
    } finally {
      setIsExtractingStories(false);
    }
  };

  const resumeDoc = documents.find((d) => d.type === 'resume');
  const supplementaryDocs = documents.filter((d) => d.type !== 'resume');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Persistent Storage Badge */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>
            <strong>Persistent Local Storage:</strong> {documents.length} doc(s) + {customQAs.length} custom Q&As saved permanently to disk.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingQA(true)}
            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs rounded-lg font-medium flex items-center gap-1 transition"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" /> Add Q&A
          </button>
          <button
            onClick={() => setIsAddingCustomDoc(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" /> Add Notes
          </button>
        </div>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-300 flex items-center gap-2">
          {isParsing || isExtractingStories ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {statusMessage}
        </div>
      )}

      {/* === SECTION 1: Primary Resume === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload area */}
        <div className="md:col-span-1 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold">
            <Upload className="w-5 h-5" />
            <span>Primary Resume</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload your resume — the AI automatically extracts all your skills, background, and achievements. This becomes your primary knowledge base.
          </p>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition group">
            <FileText className="w-8 h-8 text-slate-500 group-hover:text-sky-400 transition mb-2" />
            <span className="text-xs font-medium text-slate-300 group-hover:text-sky-300">
              {isParsing ? 'Analyzing Resume...' : 'Click to Upload Resume (PDF/TXT)'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">Saved permanently to disk</span>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => handleFileUpload(e, false)}
              disabled={isParsing}
              className="hidden"
            />
          </label>

          {(profile.resumeText || resumeDoc) && (
            <button
              onClick={handleGenerateStories}
              disabled={isExtractingStories}
              className="w-full py-2 px-3 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-500/30 rounded-xl text-xs font-semibold text-sky-300 flex items-center justify-center gap-2 transition"
            >
              {isExtractingStories ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Stories...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Extract STAR Stories
                </>
              )}
            </button>
          )}
        </div>

        {/* Resume status & extracted skills */}
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-3">
            <FileCode className="w-5 h-5 text-sky-400" />
            <span>Resume Knowledge Base Status</span>
          </div>

          {resumeDoc || profile.resumeText ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {resumeDoc?.name || 'Resume Loaded'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {resumeDoc
                      ? `${((resumeDoc.sizeBytes || 0) / 1024).toFixed(1)} KB · Added ${new Date(resumeDoc.dateAdded).toLocaleDateString()}`
                      : `Last synced: ${profile.lastUpdated ? new Date(profile.lastUpdated).toLocaleDateString() : 'Unknown'}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {resumeDoc && (
                    <button
                      onClick={() => setPreviewDoc(resumeDoc)}
                      className="text-sky-400 hover:text-sky-300 text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  )}
                  {resumeDoc && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${resumeDoc.name}" from your knowledge base?`)) {
                          onDeleteDocument(resumeDoc.id);
                          onUpdateProfile({ ...profile, resumeText: '', coreSkills: [], summary: '' });
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Extracted skills summary */}
              {profile.coreSkills && profile.coreSkills.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Auto-Extracted Skills ({profile.coreSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.coreSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-slate-800 text-sky-300 text-xs rounded-lg border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected name & role */}
              {(profile.fullName || profile.targetRole || profile.summary) && (
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                  {profile.fullName && (
                    <p className="text-xs text-slate-300">
                      <span className="text-slate-500 font-semibold">Name:</span> {profile.fullName}
                    </p>
                  )}
                  {profile.targetRole && (
                    <p className="text-xs text-slate-300">
                      <span className="text-slate-500 font-semibold">Detected Role:</span> {profile.targetRole}
                    </p>
                  )}
                  {profile.summary && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {profile.summary}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <p className="text-sm font-medium text-slate-500">No resume uploaded yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Upload your resume on the left to auto-extract your skills, background, and STAR stories.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* === SECTION 2: Custom Q&A Knowledge Bank === */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <MessagesSquare className="w-5 h-5 text-indigo-400" />
            <span>Custom Q&A Knowledge Bank ({customQAs.length})</span>
          </div>
          <button
            onClick={() => setIsAddingQA(true)}
            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Q&A
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Add specific questions with your exact personal answers. The AI will always prioritize these when answering similar interview questions — your exact narrative, your exact words.
        </p>

        {customQAs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <MessageSquarePlus className="w-7 h-7 mx-auto mb-2 text-slate-700" />
            <p className="text-xs">No custom answers yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Add answers like "Tell me about yourself", "Why this company?", or anything specific to your background.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {customQAs.map((qa) => (
              <div
                key={qa.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40 transition"
                  onClick={() => setExpandedQAId(expandedQAId === qa.id ? null : qa.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                      {categoryLabel(qa.category)}
                    </span>
                    <span className="text-xs text-slate-200 truncate">{qa.question}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete this Q&A?`)) onDeleteCustomQA(qa.id);
                      }}
                      className="text-rose-400 hover:text-rose-300 transition p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {expandedQAId === qa.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>
                {expandedQAId === qa.id && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800">
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {qa.answer}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-2">
                      Added {new Date(qa.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === SECTION 3: Supplementary Knowledge Documents === */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span>Supplementary Knowledge Docs ({supplementaryDocs.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Attach File
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => handleFileUpload(e, true)}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setIsAddingCustomDoc(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-400" /> Write Note
            </button>
          </div>
        </div>

        {supplementaryDocs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs">No extra documents attached yet.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Attach project writeups, architecture notes, or cheat sheets. They stay stored locally until you delete them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {supplementaryDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                      {doc.type}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(doc.dateAdded).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate mt-1.5" title={doc.name}>
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{doc.content.slice(0, 100)}...</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-sky-400 hover:text-sky-300 text-[11px] flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${doc.name}" from your knowledge base?`)) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{previewDoc.name}</h3>
                <span className="text-[11px] text-slate-500 font-mono uppercase">{previewDoc.type}</span>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {previewDoc.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Notes Modal */}
      {isAddingCustomDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Add Knowledge Base Note</h3>
              <button onClick={() => setIsAddingCustomDoc(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCustomDoc} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={customDocTitle}
                  onChange={(e) => setCustomDocTitle(e.target.value)}
                  placeholder="e.g. System Design Cheat Sheet / Project X Architecture"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                >
                  <option value="project-notes">Project Notes</option>
                  <option value="cheat-sheet">Technical Cheat Sheet</option>
                  <option value="company-research">Company Research</option>
                  <option value="custom">Custom Notes</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Content (Markdown or Plain Text)
                </label>
                <textarea
                  rows={6}
                  required
                  value={customDocContent}
                  onChange={(e) => setCustomDocContent(e.target.value)}
                  placeholder="Paste or write your notes here..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomDoc(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Q&A Modal */}
      {isAddingQA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Add Custom Q&A to Knowledge Bank</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The AI will always use your exact answer when asked this or a similar question.
                </p>
              </div>
              <button onClick={() => setIsAddingQA(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveQA} className="p-6 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={qaCategory}
                  onChange={(e) => setQaCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-400"
                >
                  {QA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Interview Question
                </label>
                <input
                  type="text"
                  required
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  placeholder='e.g. "Tell me about yourself" or "Why do you want to join us?"'
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Your Answer (will be used as-is)
                </label>
                <textarea
                  rows={6}
                  required
                  value={qaAnswer}
                  onChange={(e) => setQaAnswer(e.target.value)}
                  placeholder="Write your prepared answer here. Include specific examples, metrics, and personal narrative..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-400 leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQA(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Save to Q&A Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
