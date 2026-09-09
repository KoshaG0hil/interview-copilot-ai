import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  ResponseMode,
  CueCard,
  AppSettings,
  KnowledgeDocument,
  CustomQAItem,
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
  customQAs?: CustomQAItem[];
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
    const { question, mode, profile, stories, jobContext, settings, documents = [], customQAs = [], screenImageBase64 } = params;

    const storiesContext = stories
      .map(
        (s, i) =>
          `[STORY ${i + 1}: ${s.title} (${s.category})]\n- Situation: ${s.situation}\n- Task: ${s.task}\n- Action: ${s.action}\n- Result: ${s.result}\n- Metrics: ${s.metrics || 'N/A'}\n- Tech: ${s.technologiesUsed?.join(', ') || 'N/A'}`
      )
      .join('\n\n');

    const customQAsContext = customQAs
      .map((qa, i) => `[CUSTOM Q&A ${i + 1}]\nQuestion: "${qa.question}"\nCandidate's Direct Answer: "${qa.answer}"`)
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
4. Strictly ground answers in the candidate's actual resume, their custom Q&A bank, and added knowledge documents.
5. If the interview question relates to a topic in the Candidate's Custom Q&A Bank, ALWAYS adopt their exact personal answer, narrative, and perspective.
6. If technical coding: provide the optimal clean solution, Big-O complexity, edge cases, and an explanation bullet.
7. If system design: specify components, data flows, scalability bottlenecks, and tradeoffs.
8. Include 1-2 intelligent questions the candidate can ask back to impress the interviewer.`;

    let prompt = `LIVE INTERVIEW QUESTION / SCENARIO:
"${question || 'Analyze the captured problem on screen and provide the optimal solution and explanation.'}"

RESPONSE MODE: ${mode.toUpperCase()}

CANDIDATE PRIMARY RESUME & TECHNICAL KNOWLEDGE BASE:
${profile.resumeText ? profile.resumeText.slice(0, 8000) : `Name: ${profile.fullName}\nSkills: ${profile.coreSkills.join(', ')}\nSummary: ${profile.summary}`}

CANDIDATE CUSTOM Q&A KNOWLEDGE BANK (HIGHEST PRIORITY PERSONAL ANSWERS):
${customQAsContext || 'No custom Q&A answers configured yet.'}

TARGET COMPANY & JOB DESCRIPTION:
- Company: ${jobContext.companyName || 'Target Company'}
- Target Role: ${jobContext.jobTitle || profile.targetRole || 'Target Role'}
- Key Required Skills: ${jobContext.requiredSkills.length > 0 ? jobContext.requiredSkills.join(', ') : 'Aligned to Job Description'}
- Interview Stage: ${jobContext.interviewStage || 'Technical/Behavioral'}
- Job Description Details: ${jobContext.jobDescription ? jobContext.jobDescription.slice(0, 3000) : 'Standard industry expectations'}
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

  async parseJobDescriptionFromHtml(
    rawText: string,
    apiKey: string
  ): Promise<{
    companyName?: string;
    jobTitle?: string;
    jobDescription: string;
    requiredSkills: string[];
  }> {
    const prompt = `Extract structured job information from the following raw webpage text scraped from a job listing page:
"""
${rawText.slice(0, 12000)}
"""

Return JSON:
{
  "companyName": "Company name hiring for this role",
  "jobTitle": "Exact job title / role being hired",
  "jobDescription": "Clean, complete job description including responsibilities, requirements, and nice-to-haves. Keep all important details.",
  "requiredSkills": ["Skill 1", "Skill 2", "Skill 3"]
}
Return ONLY raw JSON. No markdown or code fences.`;

    const res = await this.callGemini({
      apiKey,
      prompt,
      enableSearchGrounding: false,
    });

    try {
      const parsed = this.cleanJsonParse(res.text);
      if (parsed?.jobDescription) return parsed;
    } catch {}

    // Fallback: use raw text as job description
    return {
      companyName: '',
      jobTitle: '',
      jobDescription: rawText.slice(0, 6000),
      requiredSkills: [],
    };
  },

  async parseResumeText(rawResume: string, apiKey?: string): Promise<Partial<CandidateProfile>> {
    // 1. If API key is available, use Gemini for high-accuracy extraction
    if (apiKey) {
      const prompt = `Extract structured profile information from this resume:
"""
${rawResume.slice(0, 12000)}
"""

Return JSON:
{
  "fullName": "Extracted candidate full name",
  "targetRole": "Best suited role title based on experience (e.g. Cloud Security Engineer, Senior Backend Engineer)",
  "yearsOfExperience": 2,
  "summary": "3-sentence high-impact professional executive bio highlighting accomplishments, domain expertise, and engineering ownership",
  "coreSkills": ["AWS IAM", "Terraform", "Kubernetes", "DevSecOps", "Cloud Security", "CI/CD", "Docker", "Python"]
}
IMPORTANT: Provide at least 8-12 specific core technical skills extracted from the resume. Return ONLY raw JSON.`;

      try {
        const res = await this.callGemini({
          apiKey,
          prompt,
          enableSearchGrounding: false,
        });

        const parsed = this.cleanJsonParse(res.text);
        if (parsed && (parsed.summary || parsed.coreSkills?.length)) {
          return {
            fullName: parsed.fullName,
            targetRole: parsed.targetRole,
            yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : parseInt(parsed.yearsOfExperience) || 2,
            summary: parsed.summary,
            coreSkills: Array.isArray(parsed.coreSkills) ? parsed.coreSkills.filter(Boolean) : [],
          };
        }
      } catch (err) {
        console.warn('Gemini parseResumeText error, using heuristic fallback:', err);
      }
    }

    // 2. Instant Heuristic Fallback (parses Summary and Skills directly from text)
    return this.heuristicParseResume(rawResume);
  },

  cleanJsonParse(text: string): any {
    let cleaned = text.trim();
    const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) cleaned = fence[1].trim();

    try {
      return JSON.parse(cleaned);
    } catch {}

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {}
    }

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
      } catch {}
    }
    throw new Error('Failed to parse JSON from AI response');
  },

  heuristicParseResume(rawResume: string): Partial<CandidateProfile> {
    const lines = rawResume
      .split('\n')
      .map((l) => l.replace(/--- Page \d+ ---/g, '').trim())
      .filter(Boolean);

    let fullName = 'Candidate';
    let targetRole = 'Software Engineer';

    if (lines.length > 0) {
      const nameParts = lines[0].split(/[|•,\t]/);
      if (nameParts[0] && nameParts[0].trim().length < 40) {
        fullName = nameParts[0].trim();
      }
      if (nameParts.length > 1 && nameParts[1].trim().length < 50) {
        targetRole = nameParts[1].trim();
      }
    }

    // Extract Summary section
    let summary = '';
    const summaryMatch = rawResume.match(/SUMMARY\s*[:\n]?([\s\S]*?)(?=SKILLS|EXPERIENCE|EDUCATION|PROJECTS|$)/i);
    if (summaryMatch && summaryMatch[1].trim()) {
      summary = summaryMatch[1].replace(/\s+/g, ' ').trim().slice(0, 600);
    } else if (lines.length > 1) {
      summary = lines.slice(1, 4).join(' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    }

    // Extract Skills section
    const coreSkills: string[] = [];
    const skillsMatch = rawResume.match(/SKILLS\s*[:\n]?([\s\S]*?)(?=EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|$)/i);
    if (skillsMatch && skillsMatch[1].trim()) {
      const rawSkillText = skillsMatch[1].replace(/[a-zA-Z\s&]+:\s*/g, ' ');
      const tokens = rawSkillText.split(/[\n,;|•]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 35);
      for (const t of tokens) {
        if (!coreSkills.includes(t)) coreSkills.push(t);
      }
    }

    // Standard high-value keywords scanner
    const techKeywords = [
      'AWS IAM', 'AWS Security', 'Cloud Security', 'DevSecOps', 'Terraform',
      'Kubernetes', 'Docker', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux',
      'Python', 'Go', 'RBAC', 'Access Governance', 'SAML', 'OAuth 2.0',
      'CloudTrail', 'Kafka', 'PostgreSQL', 'Redis', 'Security-as-Code'
    ];
    for (const tech of techKeywords) {
      if (new RegExp(`\\b${tech.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'i').test(rawResume)) {
        if (!coreSkills.includes(tech)) coreSkills.push(tech);
      }
    }

    return {
      fullName: fullName !== 'Candidate' ? fullName : undefined,
      targetRole: targetRole !== 'Software Engineer' ? targetRole : undefined,
      yearsOfExperience: 2,
      summary: summary || undefined,
      coreSkills: coreSkills.slice(0, 15),
    };
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
