export interface CandidateProfile {
  fullName: string;
  targetRole: string;
  yearsOfExperience: number;
  summary: string;
  coreSkills: string[];
  resumeText: string;
  lastUpdated: string;
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
}

export type ResponseMode = 'behavioral' | 'technical' | 'system-design' | 'quick-bullet';

export interface CueCard {
  id: string;
  timestamp: number;
  question: string;
  mode: ResponseMode;
  headline: string; // One sentence quick anchor
  bulletPoints: string[]; // 3-4 bullet points to speak naturally
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
  };
  groundingSources?: {
    title: string;
    url: string;
  }[];
  followUpTips?: string[];
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
  selectedModel: string; // 'gemini-2.5-flash' | 'gemini-3.7-flash'
  enableSearchGrounding: boolean;
  contentProtection: boolean; // Hide from Zoom/Meet/Teams
  hudOpacity: number; // 0.2 to 1.0
  fontSize: 'small' | 'medium' | 'large';
  teleprompterSpeed: 'normal' | 'fast';
  autoAnswerOnQuestionDetected: boolean;
  hotkeyTrigger: string;
}
