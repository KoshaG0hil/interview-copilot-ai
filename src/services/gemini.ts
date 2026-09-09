import { CandidateProfile, StarStory, CompanyJobContext, ResponseMode, CueCard, AppSettings } from '../types';

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
    // If running inside Electron, use the IPC bridge for zero-cors & native execution
    if (window.electronAPI?.generateGeminiContent) {
      const response = await window.electronAPI.generateGeminiContent(payload);
      return {
        success: response.success,
        text: response.text || '',
        groundingSources: response.groundingSources,
        error: response.error,
      };
    }

    // Direct Browser Fallback using fetch to Gemini API
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
    const { question, mode, profile, stories, jobContext, settings, screenImageBase64 } = params;

    const storiesContext = stories
      .map(
        (s, i) =>
          `[STORY ${i + 1}: ${s.title} (${s.category})]\n- Situation: ${s.situation}\n- Task: ${s.task}\n- Action: ${s.action}\n- Result: ${s.result}\n- Metrics: ${s.metrics || 'N/A'}\n- Tech: ${s.technologiesUsed?.join(', ') || 'N/A'}`
      )
      .join('\n\n');

    const systemInstruction = `You are a world-class real-time executive interview copilot (similar to Verve AI and Parakeet AI).
The candidate is currently in a LIVE high-stakes interview.
Your goal is to give them INSTANT, effortless-to-deliver guidance.

CRITICAL INSTRUCTIONS FOR LIVE TELEPROMPTER DELIVERY:
1. NEVER output long narrative essays or robotic script blocks that must be read verbatim.
2. Structure the answer into high-impact, bite-sized BULLET POINTS that the candidate can glance at for 1 second and speak naturally.
3. Mark key impact phrases or technical terms with asterisks or bold so they pop out.
4. Always ground the response in the candidate's real profile, past achievements, and their story bank.
5. If target company or job info is provided, weave in company alignment seamlessly.
6. If the interviewer asks an unknown or cutting-edge question, use Google Search grounding to give accurate, up-to-date facts.`;

    let prompt = `LIVE INTERVIEW QUESTION:
"${question || 'Analyze the captured screen and provide the best solution/answer.'}"

CANDIDATE INFORMATION:
- Name: ${profile.fullName || 'Candidate'}
- Target Role: ${profile.targetRole || jobContext.jobTitle || 'Software Engineer'}
- Years Exp: ${profile.yearsOfExperience}
- Core Skills: ${profile.coreSkills.join(', ')}
- Resume Highlights: ${profile.summary || 'Strong background in engineering, problem solving, and architecture.'}

TARGET COMPANY & JOB:
- Company: ${jobContext.companyName || 'Target Company'}
- Job Title: ${jobContext.jobTitle || 'Target Role'}
- Key Required Skills: ${jobContext.requiredSkills.join(', ')}
- Stage: ${jobContext.interviewStage || 'Technical/Behavioral'}

CANDIDATE STAR STORY BANK:
${storiesContext || 'Use candidate skills and experience.'}

REQUESTED RESPONSE MODE: ${mode.toUpperCase()}

Please return your response formatted strictly as a JSON object with this structure:
{
  "headline": "A single punchy 10-15 word opening line the candidate can say immediately while glancing at the rest",
  "bulletPoints": [
    "Short bullet 1 (Situation/Concept anchor with *key terms*)",
    "Short bullet 2 (Specific Action or Technical Mechanism with *metrics*)",
    "Short bullet 3 (Outcome, Result, or Architecture Tradeoff)",
    "Short bullet 4 (Tie-back to the target role or company)"
  ],
  "starMapping": {
    "storyTitle": "Name of best matching candidate story, if applicable",
    "situationHighlight": "1-sentence situation reminder",
    "actionHighlight": "1-sentence key action reminder",
    "resultHighlight": "1-sentence metrics/result reminder"
  },
  "codeSnippet": {
    "language": "python or javascript or sql etc (if applicable, else empty)",
    "code": "Clean, optimized code solution (if coding question, else empty)",
    "complexity": { "time": "O(N)", "space": "O(1)" }
  },
  "followUpTips": [
    "Potential curveball follow-up 1 and how to handle it",
    "Smart question the candidate can ask back to the interviewer"
  ]
}
IMPORTANT: Only output the raw JSON string without markdown code fences (\`\`\`json).`;

    const res = await this.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      systemInstruction,
      prompt,
      enableSearchGrounding: settings.enableSearchGrounding,
      imageBase64: screenImageBase64,
    });

    let rawText = res.text.trim();
    // Clean markdown fences if model returned them
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
        question: question || 'Screen Capture Analysis',
        mode,
        headline: parsed.headline || 'Here is the key approach to communicate:',
        bulletPoints: parsed.bulletPoints || [parsed.headline],
        starMapping: parsed.starMapping,
        codeSnippet: parsed.codeSnippet?.code ? parsed.codeSnippet : undefined,
        groundingSources: res.groundingSources,
        followUpTips: parsed.followUpTips || [],
      };
    } catch {
      // Fallback if model didn't output strict JSON
      return {
        id: 'card-' + Date.now(),
        timestamp: Date.now(),
        question: question || 'Live Query',
        mode,
        headline: 'Recommended Response Framework:',
        bulletPoints: rawText
          .split('\n')
          .filter((line) => line.trim().length > 0)
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
    const prompt = `Research the company "${companyName}" for an upcoming job interview.
Search for:
1. Core business mission and what sets them apart
2. Stated company values and culture
3. Recent major news, funding, product launches, or challenges in the last 12-24 months
4. Known engineering tech stack and tools
5. Typical interview style and what they look for in candidates

Return JSON:
{
  "summary": "2 sentence executive summary of company",
  "values": ["Value 1", "Value 2", "Value 3"],
  "recentNews": ["News item 1 with context", "News item 2 with context"],
  "techStack": ["Tech 1", "Tech 2", "Tech 3"],
  "interviewVibe": "Advice on tone and focus during their interviews"
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
        values: ['Innovation', 'Customer Focus', 'Speed'],
        recentNews: ['Continuously expanding core product line and market presence.'],
        techStack: ['Cloud', 'Modern Microservices', 'APIs'],
        interviewVibe: 'Focus on demonstrated problem solving and ownership.',
      };
    }
  },

  async parseResumeText(rawResume: string, apiKey: string): Promise<Partial<CandidateProfile>> {
    const prompt = `Extract structured profile information from this resume:
"""
${rawResume.slice(0, 10000)}
"""

Return JSON:
{
  "fullName": "Extracted candidate name",
  "targetRole": "Best suited role title",
  "yearsOfExperience": 5,
  "summary": "3-sentence professional bio highlighting highest accomplishments and engineering domains",
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
        summary: rawResume.slice(0, 200),
        coreSkills: [],
      };
    }
  },

  async generateStarStoriesFromResume(rawResume: string, apiKey: string): Promise<StarStory[]> {
    const prompt = `Given this resume, automatically extract 3-4 compelling STAR (Situation, Task, Action, Result) behavioral stories.
Resume:
"""
${rawResume.slice(0, 10000)}
"""

Categories to aim for: 'technical-challenge', 'leadership', 'impact-metric', 'failure-learning'.

Return JSON array of stories:
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
