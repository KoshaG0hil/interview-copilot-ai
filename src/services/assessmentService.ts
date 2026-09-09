import { AssessmentSolution, AppSettings } from '../types';
import { geminiService } from './gemini';

export const assessmentService = {
  async solveAssessment(
    input: {
      problemText?: string;
      platform?: AssessmentSolution['platform'];
      language: string;
      screenImageBase64?: string;
    },
    settings: AppSettings
  ): Promise<AssessmentSolution> {
    const prompt = `You are a competitive programming grandmaster and assessment solver for platforms like HackerRank, LeetCode, CodeSignal, Karat, and Codility.

TARGET PROGRAMMING LANGUAGE: ${input.language}
PLATFORM: ${input.platform || 'General Online Assessment'}

PROBLEM STATEMENT / DESCRIPTION:
${input.problemText || 'Analyze the provided screenshot of the coding problem.'}

TASK:
1. Extract the problem title and core task.
2. Provide the mathematically optimal algorithm intuition (avoiding any TLE - Time Limit Exceeded).
3. Write clean, complete, executable solution code in ${input.language}.
4. Provide exact Time and Space complexity.
5. Provide 2-3 test cases with inputs and expected outputs.
6. Detail failure-prone edge cases (e.g. empty input, extreme constraints, overflow, negative values).

Return JSON with this EXACT structure:
{
  "problemTitle": "Extracted problem name",
  "algorithmExplanation": "Intuitive step-by-step approach in 3 sentences...",
  "optimalCode": "Clean code here...",
  "timeComplexity": "O(N log N)",
  "spaceComplexity": "O(N)",
  "testCases": [
    { "input": "nums = [2,7,11,15], target = 9", "expectedOutput": "[0,1]", "explanation": "nums[0] + nums[1] == 9" },
    { "input": "nums = [3,2,4], target = 6", "expectedOutput": "[1,2]" }
  ],
  "edgeCases": [
    "Empty array or single element",
    "Negative integers in input",
    "Duplicate numbers handling"
  ]
}
IMPORTANT: Output only the raw JSON.`;

    const res = await geminiService.callGemini({
      apiKey: settings.geminiApiKey,
      model: settings.selectedModel,
      prompt,
      enableSearchGrounding: false,
      imageBase64: input.screenImageBase64,
    });

    try {
      const parsed = geminiService.cleanJsonParse(res.text);
      return {
        id: 'oa-' + Date.now(),
        platform: input.platform || 'other',
        problemTitle: parsed.problemTitle || 'Online Assessment Problem',
        problemStatement: input.problemText || 'Screen Captured Problem',
        language: input.language,
        optimalCode: parsed.optimalCode || '',
        timeComplexity: parsed.timeComplexity || 'O(N)',
        spaceComplexity: parsed.spaceComplexity || 'O(1)',
        algorithmExplanation: parsed.algorithmExplanation || 'Optimal approach to solve within time limits.',
        testCases: Array.isArray(parsed.testCases) ? parsed.testCases : [],
        edgeCases: Array.isArray(parsed.edgeCases) ? parsed.edgeCases : [],
      };
    } catch {
      return {
        id: 'oa-' + Date.now(),
        platform: input.platform || 'other',
        problemTitle: 'Assessment Problem',
        problemStatement: input.problemText || '',
        language: input.language,
        optimalCode: res.text || '',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        algorithmExplanation: 'Optimized algorithmic approach.',
        testCases: [],
        edgeCases: ['Check for null/empty constraints', 'Check maximum input limits'],
      };
    }
  },
};
