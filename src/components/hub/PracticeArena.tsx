import React, { useState, useEffect } from 'react';
import {
  CandidateProfile,
  StarStory,
  CompanyJobContext,
  ResponseMode,
  CueCard,
  AppSettings,
  KnowledgeDocument,
  CustomQAItem,
} from '../../types';
import { geminiService } from '../../services/gemini';
import { CueCardView } from '../hud/CueCardView';
import {
  PlayCircle,
  Sparkles,
  Code,
  MessageSquare,
  Layers,
  Zap,
  Loader2,
  Volume2,
  VolumeX,
  BookOpen,
  Copy,
  Check,
  Shield,
  Server,
  Cloud,
  ChevronDown,
  ChevronUp,
  Gauge,
  Award,
} from 'lucide-react';

interface PracticeArenaProps {
  profile: CandidateProfile;
  stories: StarStory[];
  jobContext: CompanyJobContext;
  settings: AppSettings;
  documents?: KnowledgeDocument[];
  customQAs?: CustomQAItem[];
}

interface PracticeQuestionItem {
  id: string;
  category: 'behavioral' | 'cloud-security' | 'system-design' | 'technical' | 'executive';
  categoryLabel: string;
  mode: ResponseMode;
  question: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Staff/Principal';
  companyTags: string[];
  modelAnswer: {
    headline: string;
    bulletPoints: string[];
    keyMetricsOrCode: string;
    proTips: string;
  };
}

const HIGH_YIELD_PRACTICE_BANK: PracticeQuestionItem[] = [
  // 1. Cloud Infrastructure & Security (Target Role: Cloud Security / Infrastructure Ops)
  {
    id: 'cs-1',
    category: 'cloud-security',
    categoryLabel: '☁️ Cloud & Infrastructure',
    mode: 'technical',
    question: 'How do you design and enforce a Zero-Trust security architecture across multi-cloud Kubernetes clusters and CI/CD pipelines?',
    difficulty: 'Senior',
    companyTags: ['Amazon AWS', 'Google Cloud', 'ConnectiveRx', 'Microsoft'],
    modelAnswer: {
      headline: 'Implement Zero-Trust via Mutual TLS (mTLS), Ephemeral IAM Roles, OIDC federation, and GitOps policy-as-code.',
      bulletPoints: [
        'Identity & Access: Replace static credentials with OpenID Connect (OIDC) federation between CI/CD (GitHub Actions) and Cloud IAM (AWS IAM / GCP Workload Identity).',
        'Service Mesh & mTLS: Deploy Istio or Linkerd to enforce cryptographically verified service-to-service authentication and SPIFFE/SPIRE identities.',
        'Policy as Code: Integrate Open Policy Agent (OPA) / Gatekeeper and Kyverno to prevent privileged containers, enforce rootless execution, and enforce immutable image tags.',
        'Vulnerability Pipeline: Scan containers and IaC templates at commit time using Trivy/Snyk and enforce signed container images via Cosign/Sigstore before admission.',
      ],
      keyMetricsOrCode: 'Reduced attack surface by eliminating 100% of long-lived secrets; enforced 100% signed image validation across all production clusters.',
      proTips: 'Emphasize defense-in-depth: shift-left security in CI/CD + runtime admission control + continuous audit logging in CloudTrail/Stackdriver.',
    },
  },
  {
    id: 'cs-2',
    category: 'cloud-security',
    categoryLabel: '☁️ Cloud & Infrastructure',
    mode: 'technical',
    question: 'Walk me through how you investigate and remediate a critical infrastructure security incident (e.g., unauthorized AWS IAM role assumption or container breakout).',
    difficulty: 'Senior',
    companyTags: ['AWS', 'Meta', 'Cloudflare', 'Fintech'],
    modelAnswer: {
      headline: 'Execute structured 4-phase Incident Response: Triage & Identification -> Rapid Containment -> Root Cause Eradication -> Post-Mortem & Safeguards.',
      bulletPoints: [
        'Triage: Correlate GuardDuty/CloudTrail alerts, VPC flow logs, and Sysdig/Falco runtime kernel events to determine blast radius and active IP sessions.',
        'Containment: Immediately revoke active AWS IAM role sessions via inline deny policy (`aws:PrincipalARN`), isolate compromised EC2/Kubernetes pods via security group null-routing.',
        'Eradication: Rotate all secrets in AWS Secrets Manager / Vault, patch container base image vulnerability, and redeploy immutable infrastructure via Terraform.',
        'Post-Mortem: Publish blameless incident retrospective, add automated SIEM alerting rules, and introduce automated drift detection in Terraform Cloud.',
      ],
      keyMetricsOrCode: 'Target Mean Time to Containment (MTTC) < 15 minutes; 0 data exfiltration during simulated red-team exercises.',
      proTips: 'Always mention evidence preservation (snapshots, forensic memory dumps) prior to terminating compromised compute instances.',
    },
  },
  {
    id: 'cs-3',
    category: 'cloud-security',
    categoryLabel: '☁️ Cloud & Infrastructure',
    mode: 'system-design',
    question: 'How do you structure Terraform Infrastructure as Code (IaC) for high availability, zero drift, and multi-region failover?',
    difficulty: 'Senior',
    companyTags: ['Enterprise', 'Scale', 'Datadog'],
    modelAnswer: {
      headline: 'Modular multi-tier architecture with remote state locking (S3/DynamoDB), Terragrunt DRY patterns, and automated drift detection.',
      bulletPoints: [
        'Layered State Segmentation: Decouple Networking (VPC/Subnets), Compute (EKS/ECS), and Data stores into separate state files to minimize blast radius.',
        'State Security: Encrypt S3 state buckets with KMS customer-managed keys, enable versioning, MFA delete, and DynamoDB distributed state locking.',
        'Automated Drift & CI: Run automated `terraform plan` on every PR via Atlantis / Terraform Cloud with OPA policy checks (`conftest`).',
        'Active-Active Multi-Region: Route 53 latency-based routing with health checks, cross-region DynamoDB global tables, and automated DNS failover.',
      ],
      keyMetricsOrCode: 'Achieved 99.99% infrastructure uptime with zero manual cloud console interventions; 100% declarative GitOps compliance.',
      proTips: 'Avoid monolithic state files. Emphasize that separate state boundaries prevent accidental destruction of databases when updating compute.',
    },
  },

  // 2. Behavioral & Leadership (STAR)
  {
    id: 'beh-1',
    category: 'behavioral',
    categoryLabel: '🧠 Behavioral (STAR)',
    mode: 'behavioral',
    question: 'Tell me about a high-severity production outage or critical failure you were responsible for resolving under high pressure.',
    difficulty: 'Senior',
    companyTags: ['Amazon', 'Google', 'Meta', 'Netflix', 'Apple'],
    modelAnswer: {
      headline: 'Resolved a cascading database connection exhaustion outage during peak traffic, restoring 100% services in 18 minutes.',
      bulletPoints: [
        'Situation: During peak business hours, a microservice memory leak caused connection pool starvation to the primary PostgreSQL cluster, resulting in 504 errors for 35,000 active users.',
        'Task: As Infrastructure Lead, I needed to triage the root cause, restore service availability within our 30-minute SLA, and prevent data corruption.',
        'Action: Declared incident bridge, scaled read-replicas, deployed PgBouncer connection pooling with transaction-level pooling, and pushed an emergency rate-limit circuit breaker.',
        'Result: Fully restored API traffic in 18 minutes with 0 data loss. Subsequently authored post-mortem and implemented automated autoscaling with connection caps.',
      ],
      keyMetricsOrCode: 'Restored service in 18 min (vs 30m SLA); decreased database CPU utilization by 42% after connection pool optimization.',
      proTips: 'Structure strictly as STAR. Highlight calm communication, stakeholder updates on the bridge, and long-term preventative engineering.',
    },
  },
  {
    id: 'beh-2',
    category: 'behavioral',
    categoryLabel: '🧠 Behavioral (STAR)',
    mode: 'behavioral',
    question: 'Describe a situation where you strongly disagreed with a senior engineer or product manager on a technical decision. How did you resolve it?',
    difficulty: 'Senior',
    companyTags: ['Amazon (Have Backbone; Disagree & Commit)', 'Google', 'Microsoft'],
    modelAnswer: {
      headline: 'Addressed a proposal to bypass security reviews for a rush release by proposing a parallel automated scanning pipeline.',
      bulletPoints: [
        'Situation: Product team wanted to bypass security verification on a major release to hit a critical enterprise customer launch deadline.',
        'Task: Protect production integrity and customer compliance while still enabling the business to hit their target delivery timeline.',
        'Action: Rather than simply saying "no", I conducted a 3-hour spike to build an automated container scanner directly in their CI branch and agreed on a strict automated risk-score threshold.',
        'Result: Identified and auto-patched 2 high-severity CVEs before launch, passed all compliance gates, and shipped the release on time without delaying the customer.',
      ],
      keyMetricsOrCode: 'Delivered project on time with 0 security blockers; established automated pipeline adopted by 12 other engineering squads.',
      proTips: 'Demonstrate "disagree and commit" paired with data-driven compromise and business empathy.',
    },
  },
  {
    id: 'beh-3',
    category: 'behavioral',
    categoryLabel: '🧠 Behavioral (STAR)',
    mode: 'behavioral',
    question: 'Walk me through your background, your core technical focus, and why you are interested in this specific role.',
    difficulty: 'Senior',
    companyTags: ['All Tier-1 Tech Companies'],
    modelAnswer: {
      headline: 'Senior Cloud & Infrastructure Security Engineer with deep expertise in multi-cloud architecture, Kubernetes reliability, and automated DevSecOps.',
      bulletPoints: [
        'Past: Built robust distributed infrastructure, hardened cloud environments, and automated CI/CD security pipelines that scaled to millions of requests.',
        'Present: Leading cloud infrastructure reliability, implementing Zero-Trust controls, reducing incident MTTR, and engineering Terraform policy-as-code.',
        'Why This Role: Highly impressed by your team\'s engineering mission, scale challenges, and commitment to building resilient, automated cloud platforms.',
      ],
      keyMetricsOrCode: 'Managed 99.99% availability across 50+ microservices; reduced deployment lead time from 2 days to 14 minutes.',
      proTips: 'Keep elevator pitch under 90 seconds: Past -> Present Highlights & Core Strengths -> Why This Company specifically.',
    },
  },

  // 3. System Design & Distributed Systems
  {
    id: 'sd-1',
    category: 'system-design',
    categoryLabel: '🏗️ System Design',
    mode: 'system-design',
    question: 'Design a distributed, highly available Rate Limiter capable of handling 500,000 requests per second across global regions.',
    difficulty: 'Senior',
    companyTags: ['Stripe', 'Uber', 'Cloudflare', 'Google'],
    modelAnswer: {
      headline: 'Sliding Window Counter algorithm backed by distributed Redis clusters with local in-memory token buffering to avoid network bottlenecks.',
      bulletPoints: [
        'Algorithm: Sliding Window Log or Sliding Window Counter using Redis sorted sets (ZADD/ZREMRANGEBYSCORE) for precision, or Token Bucket for high throughput.',
        'Performance & Latency: Local Envoy / Nginx sidecar in-memory cache (5ms batch sync) to absorb 80% of read traffic before reaching Redis.',
        'Global Scale: Multi-region Redis with active-active replication; fallback to local node rate limiting if cross-region WAN partition occurs.',
        'Headers & Enforcement: Return HTTP 429 Too Many Requests with `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers.',
      ],
      keyMetricsOrCode: 'Sub-millisecond latency overhead (< 1.5ms p99); handles 500k QPS across 4 global availability zones.',
      proTips: 'Highlight graceful degradation: if the central Redis tier fails, the system must fail open or fall back to local approximate throttling.',
    },
  },
  {
    id: 'sd-2',
    category: 'system-design',
    categoryLabel: '🏗️ System Design',
    mode: 'system-design',
    question: 'Design a scalable real-time Notification Service (Push, SMS, Email) with idempotency, priority queues, and delivery guarantees.',
    difficulty: 'Staff/Principal',
    companyTags: ['Uber', 'DoorDash', 'Amazon', 'Airbnb'],
    modelAnswer: {
      headline: 'Decoupled Event-Driven Architecture with Kafka priority topics, Redis idempotency keys, and circuit-broken third-party provider dispatchers.',
      bulletPoints: [
        'Ingestion & Validation: Notification API validates payload, checks user preferences in Redis/PostgreSQL, and assigns Priority (Transactional vs Promotional).',
        'Message Broker: Kafka or AWS SQS partitioned by `user_id` with separate high-priority and batch queues.',
        'Idempotency: Deduplication check using `idempotency_key` stored with 24-hour TTL in Redis before calling downstream SMS (Twilio) or Push (FCM/APNS).',
        'Resilience & Retries: Exponential backoff with Dead Letter Queues (DLQ) and circuit breaker pattern to handle third-party provider downtime.',
      ],
      keyMetricsOrCode: 'P99 delivery latency < 2 seconds for high-priority 2FA tokens; handles 100M+ notifications daily.',
      proTips: 'Always address user opt-out preferences, rate-limiting per user (avoid spamming), and delivery status webhooks.',
    },
  },

  // 4. Technical Coding & Algorithms
  {
    id: 'tc-1',
    category: 'technical',
    categoryLabel: '⚡ Technical & Coding',
    mode: 'technical',
    question: 'Explain how to design an LRU (Least Recently Used) Cache with strict O(1) time complexity for both get() and put() operations.',
    difficulty: 'Senior',
    companyTags: ['LeetCode 146', 'Google', 'Amazon', 'Bloomberg'],
    modelAnswer: {
      headline: 'Combine a Doubly Linked List with a Hash Map (Dictionary) for O(1) lookups and O(1) node repositioning.',
      bulletPoints: [
        'Data Structures: HashMap stores `key -> Node` pointers for O(1) retrieval; Doubly Linked List maintains access order with dummy `head` and `tail` nodes.',
        'get(key): Check HashMap. If exists, move node to the front (head) of the doubly linked list and return `node.value`. O(1) time.',
        'put(key, value): If key exists, update value and move node to head. If new key and cache is at capacity, remove `tail.prev` node from both list and HashMap, then insert new node at head. O(1) time.',
        'Concurrency: For thread safety, use read-write locks or segment locks (similar to ConcurrentHashMap) to prevent race conditions during high concurrent writes.',
      ],
      keyMetricsOrCode: 'Time: O(1) get, O(1) put. Space: O(capacity) memory overhead for pointers and map entries.',
      proTips: 'Always mention using dummy head/tail sentinel nodes because they eliminate null-pointer edge cases when adding/removing nodes.',
    },
  },
  {
    id: 'tc-2',
    category: 'technical',
    categoryLabel: '⚡ Technical & Coding',
    mode: 'technical',
    question: 'How do you handle API idempotency in distributed microservices where duplicate network requests or retries may occur?',
    difficulty: 'Senior',
    companyTags: ['Stripe', 'PayPal', 'Adyen', 'AWS'],
    modelAnswer: {
      headline: 'Enforce idempotency via unique client-supplied idempotency keys, distributed atomic locks in Redis, and cached response payloads.',
      bulletPoints: [
        'Client Idempotency Key: Client sends a unique UUID in `Idempotency-Key` HTTP header with mutations (POST /payment, POST /orders).',
        'Atomic Lock & Execution State: Server attempts `SET key "PROCESSING" NX EX 120` in Redis. If key already exists with status "PROCESSING", return HTTP 409 Conflict / In-Progress.',
        'Cache Response: Once database transaction completes successfully, update key status to "COMPLETED" and cache the response body and status code.',
        'Replay: If a duplicate request arrives later, immediately return the cached response without re-executing any business logic or payment charges.',
      ],
      keyMetricsOrCode: 'Guarantees exactly-once transaction processing even with client-side retry storms and network timeouts.',
      proTips: 'Emphasize that idempotency keys must be tied to the authenticated user ID to prevent cross-tenant key collision attacks.',
    },
  },

  // 5. Executive & Culture Fit
  {
    id: 'ex-1',
    category: 'executive',
    categoryLabel: '🎯 Culture & Executive',
    mode: 'quick-bullet',
    question: 'Why are you looking to leave your current role and what makes this company the ideal next step in your career?',
    difficulty: 'Senior',
    companyTags: ['All Executive & Hiring Manager Rounds'],
    modelAnswer: {
      headline: 'Seeking to take full ownership of high-scale cloud infrastructure and security challenges at a company with high technical ambition.',
      bulletPoints: [
        'Proud of accomplishments in current role: Built resilient infrastructure, hardened security postures, and mentored junior engineers.',
        'Now seeking greater technical complexity: Looking for an organization where infrastructure and platform engineering directly impact core business velocity.',
        'Attracted to company culture: Inspired by your engineering standards, collaborative mindset, and focus on customer-centric innovation.',
      ],
      keyMetricsOrCode: 'Looking for a long-term role with high technical impact, platform ownership, and cross-functional leadership.',
      proTips: 'Always stay positive about past companies. Frame your career move as "running towards greater challenges and impact", not running away.',
    },
  },
];

export const PracticeArena: React.FC<PracticeArenaProps> = ({
  profile,
  stories,
  jobContext,
  settings,
  documents = [],
  customQAs = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestionItem>(HIGH_YIELD_PRACTICE_BANK[0]);
  const [activeMode, setActiveMode] = useState<ResponseMode>(HIGH_YIELD_PRACTICE_BANK[0].mode);
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.15); // 1.15x natural pace

  const filteredQuestions =
    selectedCategory === 'all'
      ? HIGH_YIELD_PRACTICE_BANK
      : HIGH_YIELD_PRACTICE_BANK.filter((q) => q.category === selectedCategory);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const bestVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Jenny') ||
          v.name.includes('Samantha') ||
          v.name.includes('Zira'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (bestVoice) utterance.voice = bestVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleRunSimulation = async (questionToAsk: string = selectedQuestion.question, modeToUse: ResponseMode = activeMode) => {
    if (!questionToAsk.trim()) return;
    if (!settings.geminiApiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      return;
    }

    try {
      setIsLoading(true);
      const card = await geminiService.generateCueCard({
        question: questionToAsk,
        mode: modeToUse,
        profile,
        stories,
        jobContext,
        settings,
        documents,
        customQAs,
      });
      setCueCard(card);
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-sky-400" />
            High-Yield Interview Questions & Senior Model Answers Bank
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Practice with verified senior-level model answers, listen to spoken audio questions at natural speed, and simulate custom AI teleprompter cue cards.
          </p>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <Gauge className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">Audio Speed:</span>
          {[
            { rate: 0.85, label: '0.85x' },
            { rate: 1.0, label: '1.0x' },
            { rate: 1.15, label: '1.15x ★' },
            { rate: 1.3, label: '1.3x' },
          ].map((p) => (
            <button
              key={p.rate}
              onClick={() => setSpeechRate(p.rate)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                speechRate === p.rate
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: '🌟 All High-Yield Questions' },
          { id: 'cloud-security', label: '☁️ Cloud & Security / Infra' },
          { id: 'behavioral', label: '🧠 Behavioral (STAR)' },
          { id: 'system-design', label: '🏗️ System Design' },
          { id: 'technical', label: '⚡ Technical & Coding' },
          { id: 'executive', label: '🎯 Culture & Executive' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
              selectedCategory === cat.id
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Questions List (5 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredQuestions.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedQuestion(item);
                setActiveMode(item.mode);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition space-y-2.5 ${
                selectedQuestion.id === item.id
                  ? 'bg-gradient-to-r from-slate-900 to-sky-950/40 border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  {item.categoryLabel}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.difficulty}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-100 leading-snug">
                {item.question}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {item.companyTags.map((tag) => (
                  <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Selected Question Details, Model Answer, Audio & Live Simulation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Question Action Header */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                  Active Practice Question
                </span>
                <h3 className="text-sm font-bold text-slate-100 leading-relaxed">
                  {selectedQuestion.question}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => speakText(selectedQuestion.question)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                  title="Listen to question spoken at selected speed"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Listen ({speechRate}x)</span>
                </button>
                <button
                  onClick={() => handleRunSimulation(selectedQuestion.question, selectedQuestion.mode)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-sky-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating Cue Card...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Personalized Cue Card
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Verified Senior Model Answer Card */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Verified Senior Model Answer & Talking Points
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const fullText = `${selectedQuestion.modelAnswer.headline}\n\nKey Points:\n${selectedQuestion.modelAnswer.bulletPoints.map((b) => '• ' + b).join('\n')}\n\nMetrics/Code: ${selectedQuestion.modelAnswer.keyMetricsOrCode}`;
                      copyToClipboard(fullText, selectedQuestion.id);
                    }}
                    className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 transition"
                  >
                    {copiedId === selectedQuestion.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Answer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const spokenScript = `${selectedQuestion.modelAnswer.headline}. ${selectedQuestion.modelAnswer.bulletPoints.join('. ')}`;
                      speakText(spokenScript);
                    }}
                    className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 transition"
                  >
                    <Volume2 className="w-3 h-3" /> Read Aloud
                  </button>
                </div>
              </div>

              {/* Headline */}
              <p className="text-xs font-semibold text-sky-300">
                {selectedQuestion.modelAnswer.headline}
              </p>

              {/* Bullet Points */}
              <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                {selectedQuestion.modelAnswer.bulletPoints.map((b, idx) => (
                  <li key={idx} className="leading-relaxed flex items-start gap-2">
                    <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Metrics / Key Takeaway */}
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                  Key Metric / Benchmark:
                </span>
                <span className="text-emerald-300 font-mono text-[11px]">
                  {selectedQuestion.modelAnswer.keyMetricsOrCode}
                </span>
              </div>

              {/* Pro Tip */}
              <p className="text-[11px] text-slate-400 italic">
                <strong>💡 Interview Pro-Tip:</strong> {selectedQuestion.modelAnswer.proTips}
              </p>
            </div>
          </div>

          {/* Generated Personalized Cue Card Result */}
          {cueCard && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Personalized AI Cue Card (Grounded in Your Background)
                </span>
                <span className="text-[10px] text-slate-500">Teleprompter Preview</span>
              </div>
              <CueCardView card={cueCard} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
