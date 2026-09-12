export interface CandidateProfile {
  fullName: string;
  targetRole: string;
  yearsOfExperience: number;
  summary: string;
  coreSkills: string[];
  resumeText: string;
  lastUpdated: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'resume' | 'project-notes' | 'cheat-sheet' | 'company-research' | 'custom';
  content: string;
  sizeBytes?: number;
  dateAdded: string;
}

export interface StarStory {
  id: string;
  title: string;
  category: 'leadership' | 'technical-challenge' | 'conflict' | 'failure-learning' | 'impact-metric' | 'cross-functional' | 'general';
  tags: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics?: string;
  technologiesUsed?: string[];
}

export interface CustomQAItem {
  id: string;
  question: string;
  answer: string;
  category?: 'background' | 'technical' | 'behavioral' | 'role-specific' | 'custom';
  dateAdded: string;
}

export interface CompanyJobContext {
  companyName: string;
  companyIndustry?: string;
  companyValues?: string[];
  recentCompanyNews?: string[];
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  interviewStage?: string; // 'screening' | 'technical' | 'system-design' | 'behavioral' | 'hiring-manager'
  notes?: string;
  jobUrl?: string;
}

export type ResponseMode = 'behavioral' | 'technical' | 'system-design' | 'quick-bullet' | 'assessment';

export type PlatformProfileType = 'zoom' | 'teams' | 'google-meet';

export interface PlatformProfileConfig {
  id: PlatformProfileType;
  name: string;
  iconName: string;
  screenShareAdvice: string;
  audioCaptureAdvice: string;
  recommendedPosition: string;
  protectionActive: boolean;
}

export interface MockInterviewTurn {
  id: string;
  question: string;
  candidateAnswer?: string;
  feedback?: {
    score: number; // 1 - 10
    strengths: string[];
    improvements: string[];
    modelAnswer: string;
    starAdherence?: string;
  };
  timestamp: number;
}

export type MockInterviewFocus = 'hybrid' | 'resume-only' | 'job-description-only' | 'industry-standard';
export type MockInterviewRoundType = 'phone-screen' | 'behavioral-star' | 'technical-deepdive' | 'system-design' | 'hiring-manager' | 'general-full-loop';

export interface MockInterviewSession {
  id: string;
  timestamp: number;
  role: string;
  company: string;
  stage: string;
  roundType?: MockInterviewRoundType;
  focusMode?: MockInterviewFocus;
  difficulty: 'entry' | 'mid' | 'senior' | 'staff-principal';
  interviewerPersona: string;
  turns: MockInterviewTurn[];
  status: 'in-progress' | 'completed';
  overallScore?: number;
  overallSummary?: string;
  hiringRecommendation?: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'Lean No Hire' | 'No Hire';
}

export interface AssessmentSolution {
  id: string;
  platform: 'hackerrank' | 'leetcode' | 'codesignal' | 'karat' | 'codility' | 'other';
  problemTitle: string;
  problemStatement: string;
  language: string;
  optimalCode: string;
  timeComplexity: string;
  spaceComplexity: string;
  algorithmExplanation: string;
  testCases: { input: string; expectedOutput: string; explanation?: string }[];
  edgeCases: string[];
}

export interface CueCard {
  id: string;
  timestamp: number;
  question: string;
  mode: ResponseMode;
  headline: string;
  bulletPoints: string[];
  starMapping?: {
    storyId?: string;
    storyTitle?: string;
    situationHighlight?: string;
    actionHighlight?: string;
    resultHighlight?: string;
  };
  codeSnippet?: {
    language: string;
    code: string;
    complexity?: { time: string; space: string };
    edgeCases?: string[];
    explanation?: string;
  };
  systemDesignDetails?: {
    architectureComponents?: string[];
    bottlenecksAndTradeoffs?: string[];
    dataStores?: string[];
  };
  groundingSources?: {
    title: string;
    url: string;
  }[];
  followUpTips?: string[];
  questionsToAskBack?: string[];
}

export interface TranscriptItem {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface AppSettings {
  geminiApiKey: string;
  selectedModel: string; // 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' | 'gemini-1.5-flash' | 'gemini-1.5-pro'
  enableSearchGrounding: boolean;
  contentProtection: boolean; // Hide from Zoom/Meet/Teams
  hudOpacity: number; // 0.2 to 1.0
  fontSize: 'small' | 'medium' | 'large';
  teleprompterSpeed: 'normal' | 'fast';
  autoAnswerOnQuestionDetected: boolean;
  hotkeyTrigger: string;
  platformProfile: PlatformProfileType;
  hasSeenGuide?: boolean;
}

export interface PersistentDataStore {
  profile: CandidateProfile;
  documents: KnowledgeDocument[];
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  history: CueCard[];
  customQAs?: CustomQAItem[];
  mockSessions?: MockInterviewSession[];
  assessments?: AssessmentSolution[];
}
