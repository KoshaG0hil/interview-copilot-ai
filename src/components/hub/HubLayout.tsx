import React, { useState } from 'react';
import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  AppSettings,
  KnowledgeDocument,
} from '../../types';
import { ResumeManager } from './ResumeManager';
import { StoryBank } from './StoryBank';
import { JobCompanySetup } from './JobCompanySetup';
import { PracticeArena } from './PracticeArena';
import { UserGuideModal } from '../common/UserGuideModal';
import {
  FileText,
  BookOpen,
  Building2,
  PlayCircle,
  Shield,
  Settings,
  HelpCircle,
  ChevronRight,
  HardDrive,
} from 'lucide-react';

interface HubLayoutProps {
  profile: CandidateProfile;
  onUpdateProfile: (profile: CandidateProfile) => void;
  documents: KnowledgeDocument[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (id: string) => void;
  stories: StarStory[];
  onUpdateStories: (stories: StarStory[]) => void;
  jobContext: CompanyJobContext;
  onUpdateJobContext: (context: CompanyJobContext) => void;
  settings: AppSettings;
  onOpenSettings: () => void;
  onLaunchHud: () => void;
}

export const HubLayout: React.FC<HubLayoutProps> = ({
  profile,
  onUpdateProfile,
  documents,
  onAddDocument,
  onDeleteDocument,
  stories,
  onUpdateStories,
  jobContext,
  onUpdateJobContext,
  settings,
  onOpenSettings,
  onLaunchHud,
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'stories' | 'company' | 'practice'>('resume');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const tabs = [
    {
      id: 'resume',
      label: 'Knowledge Base',
      icon: FileText,
      badge: `${documents.length > 0 ? documents.length : (profile.resumeText ? '1' : '0')} Docs`,
    },
    { id: 'stories', label: 'STAR Story Bank', icon: BookOpen, badge: `${stories.length} Stories` },
    { id: 'company', label: 'Company & JD', icon: Building2, badge: jobContext.companyName || 'Setup' },
    { id: 'practice', label: 'Practice Arena', icon: PlayCircle, badge: 'Mock' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 text-slate-950 font-black text-base">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-100">
                Interview Copilot AI
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                STEALTH READY
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personal Knowledge Hub & Live Real-Time Teleprompter
            </p>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Guide + Settings + Launch HUD */}
        <div className="flex items-center gap-2.5">
          {/* User Guide Button */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700/80 transition text-xs font-semibold flex items-center gap-1.5"
            title="Read User Setup Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">User Guide</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/80 transition"
            title="Settings & API Key"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onLaunchHud}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/25 transition group"
          >
            <Shield className="w-4 h-4" />
            <span>Launch Stealth HUD</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      </header>

      {/* Sub-Header / Context & Storage Status Bar */}
      <div className="px-6 py-2 bg-slate-900/40 border-b border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Candidate:</span>
            <span className="text-slate-200 font-medium">
              {profile.fullName || 'Alex (Configure in Profile)'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Target Role:</span>
            <span className="text-sky-300 font-medium">
              {jobContext.jobTitle || profile.targetRole || 'Not Set'}
            </span>
          </div>
          {jobContext.companyName && (
            <>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Company:</span>
                <span className="text-emerald-300 font-medium font-mono">
                  {jobContext.companyName}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <HardDrive className="w-3.5 h-3.5" />
            Disk Storage: Persistent
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">
            Stealth Hotkey: <kbd className="font-mono text-sky-400">Ctrl + \</kbd>
          </span>
        </div>
      </div>

      {/* Main Hub Body */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'resume' && (
          <ResumeManager
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            documents={documents}
            onAddDocument={onAddDocument}
            onDeleteDocument={onDeleteDocument}
            onAddStories={(newStories) => onUpdateStories([...stories, ...newStories])}
            settings={settings}
          />
        )}

        {activeTab === 'stories' && (
          <StoryBank stories={stories} onUpdateStories={onUpdateStories} />
        )}

        {activeTab === 'company' && (
          <JobCompanySetup
            context={jobContext}
            onUpdateContext={onUpdateJobContext}
            settings={settings}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeArena
            profile={profile}
            stories={stories}
            jobContext={jobContext}
            settings={settings}
            documents={documents}
          />
        )}
      </main>

      {/* User Onboarding / Help Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};
