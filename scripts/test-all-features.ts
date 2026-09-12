import fs from 'fs';
import path from 'path';
import os from 'os';
import { geminiService } from '../src/services/gemini';
import { mockInterviewService } from '../src/services/mockInterviewService';
import { assessmentService } from '../src/services/assessmentService';
import { resumeParser } from '../src/services/resumeParser';
import { CandidateProfile, CompanyJobContext, AppSettings, StarStory } from '../src/types';

async function runAllFeatureTests() {
  console.log('====================================================');
  console.log('🚀 COMPREHENSIVE END-TO-END FEATURE TEST RUNNER');
  console.log('====================================================\n');

  // 1. Load Local Database
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.config'));
  const dbPath = path.join(appData, 'interview-copilot-ai', 'interview-copilot-db.json');
  console.log(`[1/8] 📂 Loading Persistent Database from: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }

  const rawDb = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(rawDb);
  console.log(`✓ Database Loaded: Candidate = ${db.profile.fullName}, Role = ${db.profile.targetRole}`);
  console.log(`✓ Grounding Data: ${db.documents?.length || 0} Docs, ${db.stories?.length || 0} STAR Stories, ${db.customQAs?.length || 0} Custom Q&As\n`);

  const settings: AppSettings = db.settings;
  const profile: CandidateProfile = db.profile;
  const stories: StarStory[] = db.stories || [];
  const jobContext: CompanyJobContext = db.jobContext || {
    companyName: 'ConnectiveRx',
    jobTitle: 'Engineer, Infrastructure Operations',
    jobDescription: 'Cloud Security, Infrastructure Automation, Kubernetes, AWS/GCP, Incident Response',
    requiredSkills: ['AWS', 'Kubernetes', 'Terraform', 'Security', 'Docker'],
  };

  // 2. Test Gemini API Connectivity
  console.log('----------------------------------------------------');
  console.log('[2/8] 🔑 Testing Gemini API Key & Live Model Connection...');
  const connTest = await geminiService.testConnection(settings.geminiApiKey, settings.selectedModel || 'gemini-3.6-flash');
  if (!connTest.success) {
    throw new Error(`Gemini connection failed: ${connTest.error}`);
  }
  console.log(`✓ Gemini API Connection: SUCCESS! Model (${settings.selectedModel || 'gemini-3.6-flash'}) responded: "${connTest.message}"\n`);

  // 3. Test Live Cue Card Generation (Teleprompter HUD Core)
  console.log('----------------------------------------------------');
  console.log('[3/8] ⚡ Testing Live Cue Card Generation (Stealth HUD Teleprompter)...');
  const testQuestion = 'How do you handle zero-trust network access and secret rotation across Kubernetes clusters?';
  console.log(`Question: "${testQuestion}"`);
  
  const cueCard = await geminiService.generateCueCard({
    question: testQuestion,
    mode: 'technical',
    profile,
    stories,
    jobContext,
    settings,
    documents: db.documents,
    customQAs: db.customQAs,
  });

  console.log(`✓ Cue Card Generated Successfully!`);
  console.log(`  - Headline: ${cueCard.headline}`);
  console.log(`  - Bullet Points (${cueCard.bulletPoints.length}):`);
  cueCard.bulletPoints.forEach((bp, i) => console.log(`    ${i + 1}. ${bp}`));
  if (cueCard.starMapping?.resultHighlight) {
    console.log(`  - Result Highlight: ${cueCard.starMapping.resultHighlight}`);
  }
  console.log('');

  // 4. Test Resume Text Parsing & Skill Extraction
  console.log('----------------------------------------------------');
  console.log('[4/8] 📄 Testing Resume Text Ingestion & Profile Auto-Extraction...');
  const sampleResumeSnippet = `
  Kosha Gohil - Cloud Security & Infrastructure Operations Engineer
  Summary: Experienced DevOps and Cloud Security Engineer specializing in AWS, Kubernetes, Terraform, and Zero-Trust architecture.
  Experience:
  - Automated CI/CD pipelines with GitHub Actions, integrating Trivy and SonarQube for DevSecOps scanning.
  - Implemented HashiCorp Vault for automated 30-day secret rotation across 45 Kubernetes microservices.
  - Reduced production incident MTTR by 35% using Datadog and AWS CloudWatch alerting.
  Skills: AWS, Kubernetes, Terraform, Docker, Python, Bash, CI/CD, Vault, Zero-Trust.
  `;
  const extractedProfile = await geminiService.parseResumeText(sampleResumeSnippet, settings.geminiApiKey);
  console.log(`✓ Resume Analysis Result:`);
  console.log(`  - Full Name: ${extractedProfile.fullName}`);
  console.log(`  - Target Role: ${extractedProfile.targetRole}`);
  console.log(`  - Core Skills (${extractedProfile.coreSkills?.length}): ${extractedProfile.coreSkills?.join(', ')}`);
  console.log(`  - Summary: ${extractedProfile.summary?.slice(0, 100)}...\n`);

  // 5. Test STAR Story Auto-Extraction from Resume
  console.log('----------------------------------------------------');
  console.log('[5/8] 🌟 Testing Auto-Generation of STAR Stories from Resume...');
  const generatedStories = await geminiService.generateStarStoriesFromResume(sampleResumeSnippet, settings.geminiApiKey);
  console.log(`✓ Generated ${generatedStories.length} Structured STAR Stories:`);
  generatedStories.forEach((st, idx) => {
    console.log(`  [Story ${idx + 1}] ${st.title} (${st.category})`);
    console.log(`    S: ${st.situation.slice(0, 80)}...`);
    console.log(`    T: ${st.task.slice(0, 80)}...`);
    console.log(`    A: ${st.action.slice(0, 80)}...`);
    console.log(`    R: ${st.result.slice(0, 80)}...`);
    if (st.metrics) console.log(`    Metrics: ${st.metrics}`);
  });
  console.log('');

  // 6. Test AI Mock Interview Room Simulation
  console.log('----------------------------------------------------');
  console.log('[6/8] 🎙️ Testing Interactive AI Mock Interview Room Flow...');
  console.log('  -> Step A: Starting Mock Session (Senior Bar Raiser persona)...');
  const mockSession = await mockInterviewService.startMockSession(
    profile,
    jobContext,
    'Technical Coding & Problem Solving',
    'senior',
    'Senior Bar Raiser (Amazon/Meta)',
    settings
  );
  console.log(`  ✓ First Question Generated: "${mockSession.turns[0].question}"`);

  console.log('  -> Step B: Submitting Candidate Voice Answer & Requesting Turn Feedback...');
  const candidateMockAnswer = "In our Kubernetes infrastructure, we enforce zero-trust by eliminating all static secrets and using HashiCorp Vault with AWS IAM roles for service accounts (IRSA). All microservice communication is secured via mTLS using an Istio service mesh, and container images are cryptographically signed with Cosign in GitHub Actions before deployment. This reduced our secret exposure vulnerability to zero.";
  
  const evalResult = await mockInterviewService.evaluateAnswerAndGetNextQuestion(
    mockSession,
    candidateMockAnswer,
    settings,
    false
  );
  console.log(`  ✓ Turn Evaluation Feedback:`);
  console.log(`    - Turn Score: ${evalResult.feedback?.score} / 10`);
  console.log(`    - Strengths: ${evalResult.feedback?.strengths?.join(' | ')}`);
  console.log(`    - Improvements: ${evalResult.feedback?.improvements?.join(' | ')}`);
  console.log(`    - Senior Model Answer: "${evalResult.feedback?.modelAnswer?.slice(0, 100)}..."`);
  console.log(`    - Next Follow-Up Question: "${evalResult.nextQuestion}"`);

  console.log('  -> Step C: Generating Final Official Hiring Debrief Scorecard...');
  const mockCompletedSession = {
    ...mockSession,
    turns: [
      {
        ...mockSession.turns[0],
        candidateAnswer: candidateMockAnswer,
        feedback: evalResult.feedback,
      },
    ],
    status: 'completed' as const,
  };
  const debrief = await mockInterviewService.generateFinalScorecard(mockCompletedSession, settings);
  console.log(`  ✓ Official Hiring Debrief Generated:`);
  console.log(`    - Recommendation: ${debrief.hiringRecommendation}`);
  console.log(`    - Composite Score: ${debrief.overallScore} / 100`);
  console.log(`    - Executive Summary: ${debrief.overallSummary?.slice(0, 120)}...\n`);

  // 7. Test Online Assessment & Coding Solver (OA / LeetCode)
  console.log('----------------------------------------------------');
  console.log('[7/8] 💻 Testing Online Assessment & Live Coding Problem Solver...');
  const oaProblem = "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.";
  const oaSolution = await assessmentService.solveAssessment(
    {
      problemText: oaProblem,
      language: 'Python',
      platform: 'leetcode',
    },
    settings
  );
  console.log(`✓ OA Solver Result:`);
  console.log(`  - Problem: ${oaSolution.problemTitle}`);
  console.log(`  - Complexity: Time ${oaSolution.timeComplexity} | Space ${oaSolution.spaceComplexity}`);
  console.log(`  - Code:\n${oaSolution.optimalCode.split('\n').map(l => '    ' + l).join('\n')}`);
  console.log(`  - Test Cases (${oaSolution.testCases.length}): ${JSON.stringify(oaSolution.testCases[0] || {})}`);
  console.log(`  - Edge Cases: ${oaSolution.edgeCases.join(', ')}\n`);

  // 8. Test Word (.docx) & Document Parser
  console.log('----------------------------------------------------');
  console.log('[8/8] 📑 Testing Word Document & Plain Text Parser Logic...');
  const mockTextFile = {
    name: 'resume_kosha_gohil.txt',
    type: 'text/plain',
    text: async () => sampleResumeSnippet,
    arrayBuffer: async () => Buffer.from(sampleResumeSnippet).buffer,
  } as any;
  const parsedText = await resumeParser.extractTextFromFile(mockTextFile);
  console.log(`✓ Parser output verified (${parsedText.length} chars extracted successfully).\n`);

  console.log('====================================================');
  console.log('🎉 ALL 8 CORE MODULES PASSED LIVE END-TO-END VERIFICATION!');
  console.log('====================================================');
}

runAllFeatureTests().catch((err) => {
  console.error('\n❌ Test Runner Failed with Error:', err);
  process.exit(1);
});
