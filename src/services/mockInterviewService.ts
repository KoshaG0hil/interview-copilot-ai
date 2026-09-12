import {
  CandidateProfile,
  CompanyJobContext,
  MockInterviewSession,
  MockInterviewTurn,
  MockInterviewFocus,
  MockInterviewRoundType,
  AppSettings,
  StarStory,
  KnowledgeDocument,
  CustomQAItem,
} from '../types';
import { geminiService } from './gemini';

export const mockInterviewService = {
  async startMockSession(
    profile: CandidateProfile,
    jobContext: CompanyJobContext,
    stage: string,
    difficulty: MockInterviewSession['difficulty'],
    persona: string,
    settings: AppSettings,
    options?: {
      focusMode?: MockInterviewFocus;
      roundType?: MockInterviewRoundType;
      stories?: StarStory[];
      documents?: KnowledgeDocument[];
      customQAs?: CustomQAItem[];
    }
  ): Promise<MockInterviewSession> {
    const focusMode = options?.focusMode || 'hybrid';
    const roundType = options?.roundType || 'technical-deepdive';

    const focusInstructions = {
      'hybrid': 'GROUNDING INSTRUCTION: Ask a challenging question that tests how the candidate\'s actual past resume experience and skills match the target job description requirements and technical gaps.',
      'resume-only': 'GROUNDING INSTRUCTION: Focus deeply on the candidate\'s resume, past projects, specific achievements, metrics, and tools they listed. Probe for real technical depth on their stated experience.',
      'job-description-only': 'GROUNDING INSTRUCTION: Focus specifically on the target company and job description requirements, their architecture scale, core tech stack, and industry challenges.',
      'industry-standard': 'GROUNDING INSTRUCTION: Ask standard high-rigor industry interview questions testing fundamental domain principles, system design, and coding practices.',
    }[focusMode];

    const roundInstructions = {
      'phone-screen': 'ROUND TYPE: Initial Recruiter / Phone Screen. Keep questions focused on background walk-through, core technical qualifications, motivation for this role, and high-level fit.',
      'behavioral-star': 'ROUND TYPE: Behavioral & Leadership Competencies (STAR). Ask a situational behavioral question exploring high-severity conflict, production outages, cross-functional disagreement, or leadership ownership.',
      'technical-deepdive': 'ROUND TYPE: Technical Deep-Dive & Coding. Present a concrete technical engineering problem, algorithm challenge, or cloud/infrastructure automation scenario.',
      'system-design': 'ROUND TYPE: Large-Scale System Design & Architecture. Ask a large-scale distributed system design question (scale, throughput, bottlenecks, trade-offs).',
      'hiring-manager': 'ROUND TYPE: Hiring Manager / Director Final Round. Focus on business impact, technical leadership, cross-team collaboration, and handling ambiguous engineering requirements.',
      'general-full-loop': 'ROUND TYPE: General Comprehensive Interview. A balanced blend of behavioral, situational, and technical problem solving.',
    }[roundType];

    const prompt = `You are roleplaying as an expert interviewer for ${jobContext.companyName || 'a top tech company'}.
INTERVIEWER PERSONA: ${persona}
INTERVIEW STAGE: ${stage}
DIFFICULTY: ${difficulty.toUpperCase()}

${focusInstructions}
${roundInstructions}

CANDIDATE INFORMATION (FROM RESUME & KNOWLEDGE BASE):
- Name: ${profile.fullName || 'Candidate'}
- Target Role: ${jobContext.jobTitle || profile.targetRole || 'Senior Engineer'}
- Years of Experience: ${profile.yearsOfExperience}
- Core Skills: ${profile.coreSkills.join(', ')}
- Resume Summary / Text: ${profile.resumeText ? profile.resumeText.slice(0, 4000) : profile.summary || 'Strong background in engineering.'}

TARGET COMPANY & JOB DESCRIPTION:
- Company: ${jobContext.companyName || 'Target Company'}
- Job Title: ${jobContext.jobTitle || 'Target Role'}
- Key Required Skills: ${jobContext.requiredSkills.join(', ')}
- Job Description Details: ${jobContext.jobDescription ? jobContext.jobDescription.slice(0, 2000) : 'Standard industry expectations'}

TASK:
1. Greet the candidate warmly in character (1-2 concise sentences).
2. Ask the FIRST realistic interview question specifically tailored to the selected Round Type and Focus Mode.

Return JSON:
{
  "greeting": "Brief greeting introducing yourself and the round",
  "firstQuestion": "The first realistic, high-quality interview question"
}`;

    const res = await geminiService.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      prompt,
      enableSearchGrounding: false,
    });

    let greeting = `Hello ${profile.fullName || 'there'}, thanks for joining today's ${stage} round for ${jobContext.companyName || 'our team'}.`;
    let firstQuestion = `To kick things off, could you walk me through a significant technical challenge you tackled in your recent projects?`;

    try {
      const parsed = geminiService.cleanJsonParse(res.text);
      if (parsed?.greeting) greeting = parsed.greeting;
      if (parsed?.firstQuestion) firstQuestion = parsed.firstQuestion;
    } catch {}

    const firstTurn: MockInterviewTurn = {
      id: 'turn-1',
      question: `${greeting} ${firstQuestion}`,
      timestamp: Date.now(),
    };

    return {
      id: 'mock-' + Date.now(),
      timestamp: Date.now(),
      role: jobContext.jobTitle || profile.targetRole || 'Software Engineer',
      company: jobContext.companyName || 'Target Company',
      stage,
      roundType,
      focusMode,
      difficulty,
      interviewerPersona: persona,
      turns: [firstTurn],
      status: 'in-progress',
    };
  },

  async evaluateAnswerAndGetNextQuestion(
    session: MockInterviewSession,
    candidateAnswer: string,
    settings: AppSettings,
    isLastTurn: boolean = false
  ): Promise<{
    feedback: NonNullable<MockInterviewTurn['feedback']>;
    nextQuestion?: string;
  }> {
    const currentTurn = session.turns[session.turns.length - 1];

    const pastTurnsContext = session.turns
      .slice(0, -1)
      .map((t, idx) => `Turn ${idx + 1}: Q: ${t.question} | A: ${t.candidateAnswer || 'N/A'}`)
      .join('\n');

    const prompt = `You are evaluating a candidate's answer in an actual mock interview for ${session.company} (${session.role}).
INTERVIEW ROUND: ${session.stage} (${session.difficulty})
INTERVIEWER PERSONA: ${session.interviewerPersona}
FOCUS MODE: ${session.focusMode || 'hybrid'}

CURRENT QUESTION ASKED:
"${currentTurn.question}"

CANDIDATE'S ANSWER:
"${candidateAnswer}"

PREVIOUS TURNS:
${pastTurnsContext || 'None'}

TASK:
1. Critically evaluate the candidate's answer with constructive feedback.
   - Score: integer 1 to 10 (10 = exceptional FAANG Bar Raiser level)
   - Strengths: 2 specific things the candidate did well (e.g. good metrics, clear STAR flow, identified trade-off)
   - Areas for Improvement: 2 actionable things they could improve
   - Model Answer: A concise 3-4 sentence version of how a senior candidate would answer this
2. ${isLastTurn ? 'Do NOT generate a next question because the mock interview is concluding.' : 'Generate the NEXT realistic follow-up question drill-down based on what they just said.'}

Return JSON:
{
  "score": 8,
  "strengths": ["Clear problem framing", "Quantified business metric"],
  "improvements": ["Elaborate on alternative architectures considered", "Mention edge cases"],
  "starAdherence": "Good Situation and Action, but Result needed more business ROI emphasis",
  "modelAnswer": "An exemplary senior answer demonstrating technical depth and leadership...",
  "nextQuestion": "${isLastTurn ? '' : 'Realistic follow-up question'}"
}`;

    const res = await geminiService.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      prompt,
      enableSearchGrounding: false,
    });

    try {
      const parsed = geminiService.cleanJsonParse(res.text);
      return {
        feedback: {
          score: typeof parsed.score === 'number' ? parsed.score : 7,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Good technical clarity'],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Elaborate more on tradeoffs'],
          modelAnswer: parsed.modelAnswer || 'A structured answer highlighting concrete metrics and architectural decisions.',
          starAdherence: parsed.starAdherence,
        },
        nextQuestion: parsed.nextQuestion || undefined,
      };
    } catch {
      return {
        feedback: {
          score: 7,
          strengths: ['Addressed the core question directly'],
          improvements: ['Add more quantifiable metrics and discuss edge cases'],
          modelAnswer: 'Frame the situation clearly, describe your exact individual contribution, and conclude with measurable impact.',
        },
        nextQuestion: isLastTurn ? undefined : 'Could you walk me through how you would scale this solution if traffic increased 10x?',
      };
    }
  },

  async generateFinalScorecard(
    session: MockInterviewSession,
    settings: AppSettings
  ): Promise<{
    overallScore: number;
    overallSummary: string;
    hiringRecommendation: MockInterviewSession['hiringRecommendation'];
  }> {
    const transcript = session.turns
      .map(
        (t, i) =>
          `[Q${i + 1}]: ${t.question}\n[A${i + 1}]: ${t.candidateAnswer || 'N/A'}\nScore: ${t.feedback?.score || 'N/A'}/10`
      )
      .join('\n\n');

    const prompt = `Generate an official hiring debrief scorecard for this mock interview session at ${session.company} (${session.role}).
INTERVIEW STAGE: ${session.stage}
DIFFICULTY: ${session.difficulty}

INTERVIEW TRANSCRIPT & TURN SCORES:
${transcript}

TASK:
1. Calculate an overall candidate score (0 to 100).
2. Write an executive summary evaluating their competency, communication, and technical depth.
3. Choose an official Hiring Recommendation: "Strong Hire", "Hire", "Lean Hire", "Lean No Hire", or "No Hire".

Return JSON:
{
  "overallScore": 84,
  "overallSummary": "Comprehensive debrief paragraph...",
  "hiringRecommendation": "Hire"
}`;

    const res = await geminiService.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      prompt,
      enableSearchGrounding: false,
    });

    try {
      const parsed = geminiService.cleanJsonParse(res.text);
      return {
        overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 80,
        overallSummary: parsed.overallSummary || 'Solid performance across behavioral and technical competencies.',
        hiringRecommendation: parsed.hiringRecommendation || 'Hire',
      };
    } catch {
      return {
        overallScore: 80,
        overallSummary: 'Demonstrated solid understanding and clear communication throughout the interview session.',
        hiringRecommendation: 'Hire',
      };
    }
  },
};
