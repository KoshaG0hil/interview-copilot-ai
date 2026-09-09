import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  ResponseMode,
  CueCard,
  AppSettings,
  KnowledgeDocument,
} from '../types';

declare global {
  interface Window {
    electronAPI?: import('../../electron/preload').ElectronAPI;
  }
}

interface GenerateCueCardParams {
  question: string;
  mode: ResponseMode;
  profile: CandidateProfile;
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  documents?: KnowledgeDocument[];
  screenImageBase64?: string;
}

export const geminiService = {
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const res = await this.callGemini({
        apiKey,
        prompt: 'Ping: Reply with "OK"',
        enableSearchGrounding: false,
      });
      return res.success;
    } catch {
      return false;
    }
  },

  async callGemini(payload: {
    apiKey?: string;
    model?: string;
    systemInstruction?: string;
    prompt: string;
    enableSearchGrounding?: boolean;
    imageBase64?: string;
  }): Promise<{ success: boolean; text: string; groundingSources?: { title: string; url: string }[]; error?: string }> {
    // If running inside Electron, use the IPC bridge for native execution & zero CORS
    if (window.electronAPI?.generateGeminiContent) {
      const response = await window.electronAPI.generateGeminiContent(payload);
      return {
        success: response.success,
        text: response.text || '',
        groundingSources: response.groundingSources,
        error: response.error,
      };
    }

    // Direct Browser Fallback
    const key = payload.apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key) {
      return {
        success: false,
        text: '',
        error: 'Gemini API Key missing. Please set your key in Settings or .env',
      };
    }

    const model = payload.model || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const parts: any[] = [{ text: payload.prompt }];
    if (payload.imageBase64) {
      const match = payload.imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/png';
      const base64Data = match ? match[2] : payload.imageBase64;
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    const body: any = {
      contents: [{ parts }],
    };

    if (payload.systemInstruction) {
      body.system_instruction = {
        parts: [{ text: payload.systemInstruction }],
      };
    }

    if (payload.enableSearchGrounding) {
      body.tools = [{ google_search: {} }];
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, text: '', error: `API Error ${res.status}: ${errText}` };
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';

      const groundingSources: { title: string; url: string }[] = [];
      const chunks = candidate?.groundingMetadata?.groundingChunks;
      if (chunks) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      }

      return { success: true, text, groundingSources };
    } catch (err: any) {
      return { success: false, text: '', error: err?.message || 'Network error communicating with Gemini API' };
    }
  },

  async generateCueCard(params: GenerateCueCardParams): Promise<CueCard> {
    const { question, mode, profile, stories, jobContext, settings, documents = [], screenImageBase64 } = params;

    const storiesContext = stories
      .map(
        (s, i) =>
          `[STORY ${i + 1}: ${s.title} (${s.category})]\n- Situation: ${s.situation}\n- Task: ${s.task}\n- Action: ${s.action}\n- Result: ${s.result}\n- Metrics: ${s.metrics || 'N/A'}\n- Tech: ${s.technologiesUsed?.join(', ') || 'N/A'}`
      )
      .join('\n\n');

    const documentsContext = documents
      .map((d) => `[DOCUMENT: ${d.name} (${d.type})]\n${d.content.slice(0, 1500)}`)
      .join('\n\n');

    const systemInstruction = `You are an elite, world-class executive interview copilot for high-stakes tech interviews (FAANG, Fortune 500, Tier-1 Startups).
The candidate is sitting in a LIVE interview right now.
Your task is to generate instantaneous, concise, natural-to-speak cue cards.

CORE PRINCIPLES OF PAID COPILOT EXCELLENCE:
1. NEVER output a wall of robotic text that the candidate has to read aloud word-for-word.
2. Provide a 1-sentence "Anchor Hook" the candidate can begin saying IMMEDIATELY while glancing at the rest.
3. Provide 3-4 bullet points formatted with bold asterisks for key metrics and technical mechanisms (e.g. *decoupled via Kafka*, *reduced p99 by 68%*, *distributed lock with Redis*).
4. Strictly ground answers in the candidate's actual resume, STAR stories, and added knowledge documents.
5. If technical coding: provide the optimal clean solution, Big-O complexity, edge cases, and an explanation bullet.
6. If system design: specify components, data flows, scalability bottlenecks, and tradeoffs.
7. Include 1-2 intelligent questions the candidate can ask back to impress the interviewer.`;

    let prompt = `LIVE INTERVIEW QUESTION / SCENARIO:
"${question || 'Analyze the captured problem on screen and provide the optimal solution and explanation.'}"

RESPONSE MODE: ${mode.toUpperCase()}

CANDIDATE PROFILE:
- Name: ${profile.fullName || 'Candidate'}
- Target Role: ${jobContext.jobTitle || profile.targetRole || 'Senior Engineer'}
- Years Exp: ${profile.yearsOfExperience}
- Core Skills: ${profile.coreSkills.join(', ')}
- Executive Bio: ${profile.summary || 'Accomplished engineering background.'}

TARGET COMPANY & JOB DESCRIPTION:
- Company: ${jobContext.companyName || 'Target Company'}
- Role: ${jobContext.jobTitle || 'Target Role'}
- Key Required Skills: ${jobContext.requiredSkills.join(', ')}
- Interview Stage: ${jobContext.interviewStage || 'Technical/Behavioral'}
- Company Values: ${jobContext.companyValues?.join(', ') || 'N/A'}
- Recent News: ${jobContext.recentCompanyNews?.join('; ') || 'N/A'}

CANDIDATE'S STAR STORY BANK:
${storiesContext || 'Use candidate experience.'}

ADDITIONAL KNOWLEDGE BASE DOCUMENTS:
${documentsContext || 'None attached.'}

Return JSON with this EXACT structure:
{
  "headline": "A punchy, natural 1-sentence opening statement the candidate can say immediately.",
  "bulletPoints": [
    "Glance point 1: Problem context or core concept with *bold key terms*",
    "Glance point 2: Exact action, architecture mechanism, or algorithm with *metrics*",
    "Glance point 3: Business/technical result or tradeoff analysis",
    "Glance point 4: Strategic tie-back to the target role or company"
  ],
  "starMapping": {
    "storyTitle": "Name of best matching candidate story (if behavioral)",
    "situationHighlight": "1 sentence situation anchor",
    "actionHighlight": "1 sentence key action anchor",
    "resultHighlight": "1 sentence metrics and business result"
  },
  "codeSnippet": {
    "language": "python or javascript or sql (if coding question, else leave empty)",
    "code": "Optimized code implementation (if coding, else leave empty)",
    "complexity": { "time": "O(N)", "space": "O(1)" },
    "edgeCases": ["Edge case 1 (e.g. empty input)", "Edge case 2 (e.g. integer overflow)"]
  },
  "systemDesignDetails": {
    "architectureComponents": ["Load Balancer", "Service A", "Redis Cache", "PostgreSQL"],
    "bottlenecksAndTradeoffs": ["CAP theorem tradeoff", "Cache stampede prevention"]
  },
  "followUpTips": [
    "Probable follow-up question the interviewer will probe on next"
  ],
  "questionsToAskBack": [
    "High-level strategic question the candidate can ask the interviewer back"
  ]
}
IMPORTANT: Only output the raw JSON string. Do not enclose in markdown code fences (\`\`\`json).`;

    const res = await this.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      systemInstruction,
      prompt,
      enableSearchGrounding: settings.enableSearchGrounding,
      imageBase64: screenImageBase64,
    });

    let rawText = res.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        id: 'card-' + Date.now(),
        timestamp: Date.now(),
        question: question || 'Screen Analysis / Live Query',
        mode,
        headline: parsed.headline || 'Recommended opening talking point:',
        bulletPoints: parsed.bulletPoints || [parsed.headline],
        starMapping: parsed.starMapping,
        codeSnippet: parsed.codeSnippet?.code ? parsed.codeSnippet : undefined,
        systemDesignDetails: parsed.systemDesignDetails,
        groundingSources: res.groundingSources,
        followUpTips: parsed.followUpTips || [],
        questionsToAskBack: parsed.questionsToAskBack || [],
      };
    } catch {
      return {
        id: 'card-' + Date.now(),
        timestamp: Date.now(),
        question: question || 'Live Query',
        mode,
        headline: 'Core Talking Points:',
        bulletPoints: rawText
          .split('\n')
          .map((l) => l.trim())
          .filter((line) => line.length > 0)
          .slice(0, 5),
        groundingSources: res.groundingSources,
      };
    }
  },

  async researchCompany(companyName: string, apiKey: string): Promise<{
    summary: string;
    values: string[];
    recentNews: string[];
    techStack: string[];
    interviewVibe: string;
  }> {
    const prompt = `Perform comprehensive research on "${companyName}" for an upcoming candidate interview.
Search for:
1. Core business and mission
2. Stated company values and culture
3. Recent news, product announcements, funding, or press from the last 12-24 months
4. Known engineering tech stack and tools
5. Typical interview style and what they look for in candidates

Return JSON:
{
  "summary": "2 sentence executive summary of company",
  "values": ["Value 1", "Value 2", "Value 3"],
  "recentNews": ["News item 1 with context", "News item 2 with context"],
  "techStack": ["Tech 1", "Tech 2", "Tech 3"],
  "interviewVibe": "Specific tactical advice on tone, culture, and focus during interviews"
}`;

    const res = await this.callGemini({
      apiKey,
      prompt,
      enableSearchGrounding: true,
      systemInstruction: 'You are an executive career coach and tech researcher. Use Google Search grounding to pull verified, fresh information.',
    });

    let raw = res.text.trim();
    if (raw.startsWith('```json')) raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (raw.startsWith('```')) raw = raw.replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      return JSON.parse(raw);
    } catch {
      return {
        summary: `Research for ${companyName}`,
        values: ['Customer Obsession', 'High Ownership', 'Bias for Action'],
        recentNews: ['Continuously scaling engineering products and infrastructure.'],
        techStack: ['Cloud Native', 'Microservices', 'Distributed Systems'],
        interviewVibe: 'Focus on demonstrated problem solving, depth, and leadership.',
      };
    }
  },

  async parseResumeText(rawResume: string, apiKey: string): Promise<Partial<CandidateProfile>> {
    const prompt = `Extract structured profile information from this resume:
"""
${rawResume.slice(0, 12000)}
"""

Return JSON:
{
  "fullName": "Extracted candidate name",
  "targetRole": "Best suited role title based on experience",
  "yearsOfExperience": 5,
  "summary": "3-sentence high-impact professional bio highlighting accomplishments and engineering domains",
  "coreSkills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6", "Skill7", "Skill8"]
}`;

    const res = await this.callGemini({
      apiKey,
      prompt,
      enableSearchGrounding: false,
    });

    let raw = res.text.trim();
    if (raw.startsWith('```json')) raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (raw.startsWith('```')) raw = raw.replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      return JSON.parse(raw);
    } catch {
      return {
        fullName: 'Candidate',
        summary: rawResume.slice(0, 250),
        coreSkills: [],
      };
    }
  },

  async generateStarStoriesFromResume(rawResume: string, apiKey: string): Promise<StarStory[]> {
    const prompt = `Extract 3-4 compelling STAR (Situation, Task, Action, Result) stories from this resume for behavioral interviews.
Resume:
"""
${rawResume.slice(0, 12000)}
"""

Return JSON array:
[
  {
    "id": "story-auto-1",
    "title": "Short title of project/achievement",
    "category": "technical-challenge",
    "tags": ["Tag1", "Tag2"],
    "situation": "Specific problem context faced",
    "task": "What candidate was tasked with solving",
    "action": "Concrete steps candidate took",
    "result": "Measurable business or technical outcome",
    "metrics": "E.g. 40% latency reduction, $100k savings",
    "technologiesUsed": ["Tech1", "Tech2"]
  }
]`;

    const res = await this.callGemini({
      apiKey,
      prompt,
      enableSearchGrounding: false,
    });

    let raw = res.text.trim();
    if (raw.startsWith('```json')) raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (raw.startsWith('```')) raw = raw.replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  },
};
