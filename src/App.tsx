import React, { useState, useEffect } from 'react';
import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  AppSettings,
  KnowledgeDocument,
} from './types';
import { storageService } from './services/storage';
import { HubLayout } from './components/hub/HubLayout';
import { StealthHud } from './components/hud/StealthHud';
import { SettingsModal } from './components/common/SettingsModal';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'hub' | 'hud'>('hub');
  const [profile, setProfile] = useState<CandidateProfile>(() => storageService.getProfile());
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => storageService.getDocuments());
  const [stories, setStories] = useState<StarStory[]>(() => storageService.getStories());
  const [jobContext, setJobContext] = useState<CompanyJobContext>(() => storageService.getJobContext());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize and hydrate from disk on startup
  useEffect(() => {
    storageService.init().then((diskData) => {
      if (diskData) {
        if (diskData.profile) setProfile(diskData.profile);
        if (diskData.documents) setDocuments(diskData.documents);
        if (diskData.stories) setStories(diskData.stories);
        if (diskData.jobContext) setJobContext(diskData.jobContext);
        if (diskData.settings) setSettings(diskData.settings);
      }
    });
  }, []);

  const handleUpdateProfile = (newProfile: CandidateProfile) => {
    setProfile(newProfile);
    storageService.saveProfile(newProfile);
  };

  const handleAddDocument = (doc: KnowledgeDocument) => {
    const updated = [doc, ...documents.filter((d) => d.id !== doc.id)];
    setDocuments(updated);
    storageService.saveDocuments(updated);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    storageService.saveDocuments(updated);
  };

  const handleUpdateStories = (newStories: StarStory[]) => {
    setStories(newStories);
    storageService.saveStories(newStories);
  };

  const handleUpdateJobContext = (newContext: CompanyJobContext) => {
    setJobContext(newContext);
    storageService.saveJobContext(newContext);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleLaunchHud = () => {
    setViewMode('hud');
    if (window.electronAPI) {
      window.electronAPI.toggleWindowMode('hud');
    }
  };

  const handleSwitchToHub = () => {
    setViewMode('hub');
    if (window.electronAPI) {
      window.electronAPI.toggleWindowMode('hub');
    }
  };

  // Listen for global mode toggle from Electron main process
  useEffect(() => {
    const cleanup = window.electronAPI?.onGlobalShortcut((action) => {
      if (action === 'toggle-mode-hud') {
        setViewMode('hud');
      } else if (action === 'toggle-mode-hub') {
        setViewMode('hub');
      }
    });
    return () => cleanup?.();
  }, []);

  return (
    <div className="w-full h-full">
      {viewMode === 'hub' ? (
        <HubLayout
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          documents={documents}
          onAddDocument={handleAddDocument}
          onDeleteDocument={handleDeleteDocument}
          stories={stories}
          onUpdateStories={handleUpdateStories}
          jobContext={jobContext}
          onUpdateJobContext={handleUpdateJobContext}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLaunchHud={handleLaunchHud}
        />
      ) : (
        <StealthHud
          profile={profile}
          stories={stories}
          jobContext={jobContext}
          settings={settings}
          documents={documents}
          onUpdateSettings={handleUpdateSettings}
          onSwitchToHub={handleSwitchToHub}
        />
      )}

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleUpdateSettings}
      />
    </div>
  );
};
