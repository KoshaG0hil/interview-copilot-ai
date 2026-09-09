import {
  CandidateProfile,
  CompanyJobContext,
  MockInterviewSession,
  MockInterviewTurn,
  AppSettings,
} from '../types';
import { geminiService } from './gemini';

export const mockInterviewService = {
  async startMockSession(
    profile: CandidateProfile,
    jobContext: CompanyJobContext,
    stage: string,
    difficulty: MockInterviewSession['difficulty'],
    persona: string,
    settings: AppSettings
  ): Promise<MockInterviewSession> {
    const prompt = `You are roleplaying as an expert interviewer for ${jobContext.companyName || 'a top tech company'}.
INTERVIEWER PERSONA: ${persona}
INTERVIEW STAGE: ${stage} (e.g. System Design, Technical Coding, Behavioral, Hiring Manager)
DIFFICULTY: ${difficulty.toUpperCase()}

CANDIDATE INFORMATION:
- Name: ${profile.fullName || 'Candidate'}
- Target Role: ${jobContext.jobTitle || profile.targetRole || 'Senior Engineer'}
- Years of Experience: ${profile.yearsOfExperience}
- Core Skills: ${profile.coreSkills.join(', ')}
- Resume Summary: ${profile.summary || 'Strong background in engineering.'}

TARGET COMPANY & JOB:
- Company: ${jobContext.companyName || 'Target Company'}
- Job Title: ${jobContext.jobTitle || 'Target Role'}
- Key Required Skills: ${jobContext.requiredSkills.join(', ')}

TASK:
1. Greet the candidate in character (concise, professional, warm).
2. Ask the FIRST realistic interview question for this stage and role.

Return JSON:
{
  "greeting": "Brief greeting introducing yourself and the round",
  "firstQuestion": "The first realistic interview question"
}`;

    const res = await geminiService.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      prompt,
      enableSearchGrounding: false,
    });

    let greeting = `Hello ${profile.fullName || 'there'}, thanks for joining today's ${stage} round for ${jobContext.companyName || 'our team'}.`;
    let firstQuestion = `To kick things off, could you walk me through a significant technical challenge you tackled in your recent projects?`;

    let raw = res.text.trim();
    if (raw.startsWith('```json')) raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (raw.startsWith('```')) raw = raw.replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      const parsed = JSON.parse(raw);
      if (parsed.greeting) greeting = parsed.greeting;
      if (parsed.firstQuestion) firstQuestion = parsed.firstQuestion;
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

    let raw = res.text.trim();
    if (raw.startsWith('```json')) raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (raw.startsWith('```')) raw = raw.replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      const parsed = JSON.parse(raw);
      return {
        feedback: {
          score: parsed.score || 7,
          strengths: parsed.strengths || ['Good technical clarity'],
          improvements: parsed.improvements || ['Elaborate more on tradeoffs'],
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

    let raw = res.text.trim();
    if (raw.startsWith('```json')) raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    else if (raw.startsWith('```')) raw = raw.replace(/^```\n?/, '').replace(/\n?```$/, '');

    try {
      const parsed = JSON.parse(raw);
      return {
        overallScore: parsed.overallScore || 80,
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
