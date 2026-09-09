import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  AppSettings,
  CueCard,
  KnowledgeDocument,
  PersistentDataStore,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'interview_copilot_profile',
  DOCUMENTS: 'interview_copilot_documents',
  STORIES: 'interview_copilot_stories',
  JOB_CONTEXT: 'interview_copilot_job_context',
  SETTINGS: 'interview_copilot_settings',
  HISTORY: 'interview_copilot_cue_history',
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  selectedModel: 'gemini-2.5-flash',
  enableSearchGrounding: true,
  contentProtection: true,
  hudOpacity: 0.92,
  fontSize: 'medium',
  teleprompterSpeed: 'normal',
  autoAnswerOnQuestionDetected: false,
  hotkeyTrigger: 'Ctrl+\\',
  platformProfile: 'zoom',
  hasSeenGuide: false,
};

const DEFAULT_STORIES: StarStory[] = [
  {
    id: 'story-1',
    title: 'Migrated Monolith to Event-Driven Microservices',
    category: 'technical-challenge',
    tags: ['Architecture', 'Kubernetes', 'Scalability', 'Performance'],
    situation: 'Legacy monolithic e-commerce checkout was crashing during peak traffic (Black Friday), facing 450ms p99 latency and DB contention.',
    task: 'Led a team of 4 engineers to decouple the order processing pipeline into event-driven services within 3 months.',
    action: 'Designed Kafka-backed saga pattern for distributed transactions, implemented idempotent consumers, and introduced Redis caching layers.',
    result: 'Zero downtime during subsequent peak sale, reduced p99 latency by 68%, and saved $45,000/month in cloud database provisioning.',
    metrics: '68% p99 latency cut, $45k/mo savings, 99.99% uptime',
    technologiesUsed: ['Kafka', 'Go', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
  },
  {
    id: 'story-2',
    title: 'Resolving Critical Production Outage & Cross-Team Conflict',
    category: 'conflict',
    tags: ['Leadership', 'Incident Management', 'Communication'],
    situation: 'A breaking payment gateway API deprecation caused an unexpected production outage affecting 15% of checkout transactions; team members disputed whether backend or frontend should patch it.',
    task: 'Step up as incident lead to restore payment functionality immediately and align both teams on a unified post-mortem.',
    action: 'Implemented a feature-flagged hotfix in API gateway within 40 minutes, established an empathetic blameless post-mortem, and instituted automated contract testing with Pact.',
    result: 'Checkout restored within under an hour; created shared contract-testing guidelines that eliminated inter-team API regression bugs over the next 12 months.',
    metrics: '40 min MTTR, 0 regression API bugs for 1 year',
    technologiesUsed: ['Pact', 'LaunchDarkly', 'Node.js', 'Datadog'],
  },
];

export const storageService = {
  async init(): Promise<PersistentDataStore | null> {
    if (window.electronAPI?.loadPersistentData) {
      try {
        const diskData = await window.electronAPI.loadPersistentData();
        if (diskData) {
          // Sync disk to localStorage for redundancy
          if (diskData.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(diskData.profile));
          if (diskData.documents) localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(diskData.documents));
          if (diskData.stories) localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(diskData.stories));
          if (diskData.jobContext) localStorage.setItem(STORAGE_KEYS.JOB_CONTEXT, JSON.stringify(diskData.jobContext));
          if (diskData.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(diskData.settings));
          return diskData;
        }
      } catch (err) {
        console.warn('Could not read from Electron persistent storage:', err);
      }
    }
    return null;
  },

  syncToDisk(): void {
    if (window.electronAPI?.savePersistentData) {
      const fullStore: PersistentDataStore = {
        profile: this.getProfile(),
        documents: this.getDocuments(),
        stories: this.getStories(),
        jobContext: this.getJobContext(),
        settings: this.getSettings(),
        history: this.getHistory(),
      };
      window.electronAPI.savePersistentData(fullStore).catch((e) => {
        console.warn('Failed disk sync:', e);
      });
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.syncToDisk();
  },

  getProfile(): CandidateProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      fullName: '',
      targetRole: '',
      yearsOfExperience: 3,
      summary: '',
      coreSkills: [],
      resumeText: '',
      lastUpdated: new Date().toISOString(),
    };
  },

  saveProfile(profile: CandidateProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    this.syncToDisk();
  },

  getDocuments(): KnowledgeDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveDocuments(documents: KnowledgeDocument[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    this.syncToDisk();
  },

  addDocument(doc: KnowledgeDocument): void {
    const existing = this.getDocuments();
    const updated = [doc, ...existing.filter((d) => d.id !== doc.id)];
    this.saveDocuments(updated);
  },

  deleteDocument(id: string): void {
    const existing = this.getDocuments();
    this.saveDocuments(existing.filter((d) => d.id !== id));
  },

  getStories(): StarStory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (data) return JSON.parse(data);
    } catch {}
    return DEFAULT_STORIES;
  },

  saveStories(stories: StarStory[]): void {
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
    this.syncToDisk();
  },

  getJobContext(): CompanyJobContext {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOB_CONTEXT);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      companyName: '',
      companyIndustry: '',
      companyValues: [],
      recentCompanyNews: [],
      jobTitle: '',
      jobDescription: '',
      requiredSkills: [],
      interviewStage: 'technical',
    };
  },

  saveJobContext(context: CompanyJobContext): void {
    localStorage.setItem(STORAGE_KEYS.JOB_CONTEXT, JSON.stringify(context));
    this.syncToDisk();
  },

  getHistory(): CueCard[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveHistory(history: CueCard[]): void {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(-50)));
    this.syncToDisk();
  },
};
