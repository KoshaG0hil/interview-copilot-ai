import React, { useState } from 'react';
import { CandidateProfile, StarStory, AppSettings, KnowledgeDocument } from '../../types';
import { resumeParser } from '../../services/resumeParser';
import { geminiService } from '../../services/gemini';
import {
  Upload,
  FileText,
  Sparkles,
  User,
  HardDrive,
  Loader2,
  Trash2,
  Plus,
  Eye,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

interface ResumeManagerProps {
  profile: CandidateProfile;
  onUpdateProfile: (profile: CandidateProfile) => void;
  documents: KnowledgeDocument[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (id: string) => void;
  onAddStories: (stories: StarStory[]) => void;
  settings: AppSettings;
}

export const ResumeManager: React.FC<ResumeManagerProps> = ({
  profile,
  onUpdateProfile,
  documents,
  onAddDocument,
  onDeleteDocument,
  onAddStories,
  settings,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingStories, setIsExtractingStories] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Supplementary document modal state
  const [isAddingCustomDoc, setIsAddingCustomDoc] = useState(false);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customDocType, setCustomDocType] = useState<KnowledgeDocument['type']>('project-notes');
  const [customDocContent, setCustomDocContent] = useState('');
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isSupplementary = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      setStatusMessage(`Extracting text from ${file.name}...`);
      const text = await resumeParser.extractTextFromFile(file);

      if (!text.trim()) {
        setStatusMessage('Could not extract text. Try pasting it manually below.');
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

      // If it's the primary resume, also populate candidate profile
      if (!isSupplementary) {
        setStatusMessage('Analyzing resume with Gemini AI...');
        let updatedProfile: CandidateProfile = {
          ...profile,
          resumeText: text,
          lastUpdated: new Date().toISOString(),
        };

        if (settings.geminiApiKey) {
          const extracted = await geminiService.parseResumeText(text, settings.geminiApiKey);
          updatedProfile = {
            ...updatedProfile,
            fullName: extracted.fullName || profile.fullName,
            targetRole: extracted.targetRole || profile.targetRole,
            yearsOfExperience: extracted.yearsOfExperience || profile.yearsOfExperience,
            summary: extracted.summary || profile.summary,
            coreSkills: extracted.coreSkills?.length ? extracted.coreSkills : profile.coreSkills,
          };
        }
        onUpdateProfile(updatedProfile);
      }

      setStatusMessage(`Saved "${file.name}" to persistent local storage!`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatusMessage('Error parsing document: ' + err.message);
    } finally {
      setIsParsing(false);
      setTimeout(() => setStatusMessage(null), 5000);
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

  const handleGenerateStories = async () => {
    if (!profile.resumeText) return;
    if (!settings.geminiApiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      return;
    }

    try {
      setIsExtractingStories(true);
      const stories = await geminiService.generateStarStoriesFromResume(
        profile.resumeText,
        settings.geminiApiKey
      );
      if (stories.length > 0) {
        onAddStories(stories);
        alert(`Successfully extracted ${stories.length} STAR stories into your Story Bank!`);
      } else {
        alert('Could not auto-generate stories. You can manually add stories in the STAR Bank tab.');
      }
    } catch (err: any) {
      alert('Failed to generate stories: ' + err.message);
    } finally {
      setIsExtractingStories(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!profile.coreSkills.includes(newSkill.trim())) {
      onUpdateProfile({
        ...profile,
        coreSkills: [...profile.coreSkills, newSkill.trim()],
      });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    onUpdateProfile({
      ...profile,
      coreSkills: profile.coreSkills.filter((s) => s !== skill),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Persistent Storage Badge Bar */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>
            <strong>Persistent Local Knowledge Base:</strong> {documents.length} document(s) permanently saved to disk. Stays until you delete them.
          </span>
        </div>
        <button
          onClick={() => setIsAddingCustomDoc(true)}
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center gap-1 transition"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" /> Add Notes / Cheat Sheet
        </button>
      </div>

      {/* Top Section: Upload Primary Resume & Candidate Profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="md:col-span-1 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold mb-2">
              <Upload className="w-5 h-5" />
              <span>Primary Resume</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Upload your primary resume (.pdf, .txt, .md). The AI extracts your key achievements, skills, and background into the knowledge base.
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition group">
              <FileText className="w-8 h-8 text-slate-500 group-hover:text-sky-400 transition mb-2" />
              <span className="text-xs font-medium text-slate-300 group-hover:text-sky-300">
                {isParsing ? 'Processing...' : 'Upload Resume (PDF/TXT)'}
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
          </div>

          {statusMessage && (
            <div className="mt-4 p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-sky-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {statusMessage}
            </div>
          )}

          {profile.resumeText && (
            <button
              onClick={handleGenerateStories}
              disabled={isExtractingStories}
              className="mt-4 w-full py-2 px-3 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-500/30 rounded-xl text-xs font-semibold text-sky-300 flex items-center justify-center gap-2 transition"
            >
              {isExtractingStories ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating STAR Stories...
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

        {/* Profile Details Card */}
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <User className="w-5 h-5 text-sky-400" />
              <span>Extracted Candidate Profile</span>
            </div>
            {profile.lastUpdated && (
              <span className="text-[11px] text-slate-500">
                Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => onUpdateProfile({ ...profile, fullName: e.target.value })}
                placeholder="e.g. Alex Mercer"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={profile.targetRole}
                onChange={(e) => onUpdateProfile({ ...profile, targetRole: e.target.value })}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Years of Exp
              </label>
              <input
                type="number"
                value={profile.yearsOfExperience}
                onChange={(e) =>
                  onUpdateProfile({ ...profile, yearsOfExperience: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Elevator Bio / Executive Summary
            </label>
            <textarea
              rows={3}
              value={profile.summary}
              onChange={(e) => onUpdateProfile({ ...profile, summary: e.target.value })}
              placeholder="3-sentence summary of your technical background..."
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Core Skills Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Core Technical Skills
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profile.coreSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-sky-300 text-xs rounded-lg border border-slate-700"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-400 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Add skill (e.g. Distributed Systems, Go, Kafka)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Knowledge Base Documents List */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span>Saved Knowledge Base Documents ({documents.length})</span>
          </div>
          <label className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Attach Another Document
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => handleFileUpload(e, true)}
              className="hidden"
            />
          </label>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs">No extra documents attached yet.</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              You can attach project writeups, architecture notes, or system design cheat sheets. They will stay stored locally until you delete them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                      {doc.type}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(doc.dateAdded).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate mt-1.5" title={doc.name}>
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {doc.content.slice(0, 100)}...
                  </p>
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
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-200"
              >
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

      {/* Add Custom Notes / Cheat Sheet Modal */}
      {isAddingCustomDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Add Custom Knowledge Base Note</h3>
              <button
                onClick={() => setIsAddingCustomDoc(false)}
                className="text-slate-400 hover:text-slate-200"
              >
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
    </div>
  );
};
