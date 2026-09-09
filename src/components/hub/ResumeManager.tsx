import React, { useState } from 'react';
import { CandidateProfile, StarStory, AppSettings } from '../../types';
import { resumeParser } from '../../services/resumeParser';
import { geminiService } from '../../services/gemini';
import { Upload, FileText, CheckCircle, Sparkles, User, Briefcase, Award, Loader2, Plus, Trash2 } from 'lucide-react';

interface ResumeManagerProps {
  profile: CandidateProfile;
  onUpdateProfile: (profile: CandidateProfile) => void;
  onAddStories: (stories: StarStory[]) => void;
  settings: AppSettings;
}

export const ResumeManager: React.FC<ResumeManagerProps> = ({
  profile,
  onUpdateProfile,
  onAddStories,
  settings,
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [isExtractingStories, setIsExtractingStories] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      setStatusMessage('Extracting text from resume file...');
      const text = await resumeParser.extractTextFromFile(file);

      if (!text.trim()) {
        setStatusMessage('Could not extract text. Try pasting it manually below.');
        setIsParsing(false);
        return;
      }

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
      setStatusMessage('Resume parsed and candidate profile populated!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatusMessage('Error parsing resume: ' + err.message);
    } finally {
      setIsParsing(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
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
      {/* Top Banner / Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="md:col-span-1 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold mb-2">
              <Upload className="w-5 h-5" />
              <span>Upload Resume</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Upload your PDF, Markdown, or plain text resume. Our AI extracts your core tech stack, achievements, and behavioral stories.
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition group">
              <FileText className="w-8 h-8 text-slate-500 group-hover:text-sky-400 transition mb-2" />
              <span className="text-xs font-medium text-slate-300 group-hover:text-sky-300">
                {isParsing ? 'Processing...' : 'Choose PDF or TXT'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">Up to 10MB</span>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
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

        {/* Profile Overview Card */}
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <User className="w-5 h-5 text-sky-400" />
              <span>Candidate Knowledge Profile</span>
            </div>
            {profile.lastUpdated && (
              <span className="text-[11px] text-slate-500">
                Last synced: {new Date(profile.lastUpdated).toLocaleDateString()}
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
              Candidate Elevator Pitch / Executive Bio
            </label>
            <textarea
              rows={3}
              value={profile.summary}
              onChange={(e) => onUpdateProfile({ ...profile, summary: e.target.value })}
              placeholder="A high-impact 3-sentence summary of your technical background and what makes you standout..."
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Core Skills Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Core Technical Skills & Domains
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

      {/* Raw Resume Text View / Edit */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            Raw Resume Content (Injected into Interview Prompts)
          </label>
          <span className="text-xs text-slate-500">{profile.resumeText.length} characters</span>
        </div>
        <textarea
          rows={7}
          value={profile.resumeText}
          onChange={(e) => onUpdateProfile({ ...profile, resumeText: e.target.value })}
          placeholder="Paste or inspect extracted resume text here..."
          className="w-full px-4 py-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-sky-400 leading-relaxed"
        />
      </div>
    </div>
  );
};
